import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const api = process.env.HF_API_URL;
const apiKey = process.env.HF_API_KEY;
const EVAL_TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 15000);
const EVAL_MAX_RETRIES = Number(process.env.EVAL_MAX_RETRIES || 1);

// --- Lightweight keyword extraction helpers (no external deps) ---
const STOP_WORDS = new Set([
	'a',
	'an',
	'the',
	'and',
	'or',
	'but',
	'if',
	'then',
	'else',
	'when',
	'while',
	'for',
	'to',
	'of',
	'in',
	'on',
	'at',
	'by',
	'from',
	'with',
	'as',
	'is',
	'are',
	'was',
	'were',
	'be',
	'been',
	'being',
	'it',
	'its',
	'this',
	'that',
	'these',
	'those',
	'which',
	'who',
	'whom',
	'what',
	'why',
	'how',
	'about',
	'into',
	'over',
	'after',
	'before',
	'between',
	'among',
	'also',
	'can',
	'could',
	'should',
	'would',
	'may',
	'might',
	'must',
	'do',
	'does',
	'did',
	'done',
	'have',
	'has',
	'had',
	'than',
	'such',
	'their',
	'there',
	'they',
	'them',
	'you',
	'your',
	'we',
	'us',
	'our',
	'i',
	'me',
	'my',
	'he',
	'him',
	'his',
	'she',
	'her',
	'hers',
	'itself',
	'themselves',
]);

function normalizeText(t = '') {
	return String(t)
		.toLowerCase()
		.replace(/[^a-z0-9\s-]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function extractKeywordsFromText(text, { maxTerms = 10 } = {}) {
	const norm = normalizeText(text);
	if (!norm) return [];
	const freq = new Map();
	for (const token of norm.split(' ')) {
		if (!token || token.length < 3) continue;
		if (STOP_WORDS.has(token)) continue;
		const count = freq.get(token) || 0;
		freq.set(token, count + 1);
	}
	const ranked = [...freq.entries()]
		.sort((a, b) => b[1] - a[1])
		.slice(0, maxTerms)
		.map(([term]) => ({ term, weight: 1 }));
	return ranked;
}

function deriveImplicitRubric(questionText = '') {
	const q = String(questionText).toLowerCase();
	// Simple heuristics to build a sensible rubric if none provided
	if (q.includes('explain') || q.includes('describe') || q.includes('discuss')) {
		return [
			{ criterion: 'Correctness', weight: 0.4 },
			{ criterion: 'Coverage of key points', weight: 0.35 },
			{ criterion: 'Depth/Clarity of explanation', weight: 0.25 },
		];
	}
	if (q.includes('compare') || q.includes('contrast') || q.includes('difference')) {
		return [
			{ criterion: 'Identification of items and attributes', weight: 0.3 },
			{ criterion: 'Accuracy of comparison', weight: 0.4 },
			{ criterion: 'Clarity and structure', weight: 0.3 },
		];
	}
	if (q.includes('define') || q.includes('what is')) {
		return [
			{ criterion: 'Accurate definition', weight: 0.6 },
			{ criterion: 'Key properties/examples', weight: 0.25 },
			{ criterion: 'Clarity', weight: 0.15 },
		];
	}
	// Generic fallback rubric
	return [
		{ criterion: 'Relevance', weight: 0.35 },
		{ criterion: 'Correctness', weight: 0.4 },
		{ criterion: 'Completeness/Clarity', weight: 0.25 },
	];
}

// ---- Teacher Policy Types (all optional) ----
// policy = {
//   strictness: 'lenient' | 'moderate' | 'strict',
//   rubric: [{ criterion: 'Coverage', weight: 0.4 }, ...],
//   keywords: [{ term: 'neuron', weight: 1 }, ...], // supports simple fallback scoring
//   penalties: { offTopic: 0.2, factualError: 0.3 },
//   language: 'en' | 'hi' | ...,
//   reviewTone: 'concise' | 'detailed',
//   targetLength: 2 | 3 | 4, // sentences
//   customInstructions: 'Use these exact rules...',
//   requireCitations: false
// }

// Enrich policy: auto-generate rubric/keywords when missing
function enrichPolicy(basePolicy = {}, question, referenceAnswer) {
	const policy = { ...(basePolicy || {}) };

	// If no rubric, derive an implicit rubric from the question
	if (!Array.isArray(policy.rubric) || policy.rubric.length === 0) {
		const implicit = deriveImplicitRubric(question);
		policy.rubric = implicit;
		console.log('[EVAL_POLICY] No rubric provided. Using implicit rubric:', implicit);
	}

	// If no keywords, extract from question + referenceAnswer (if any)
	if (!Array.isArray(policy.keywords) || policy.keywords.length === 0) {
		const seedText = `${question || ''} ${referenceAnswer || ''}`.trim();
		const derivedKeywords = extractKeywordsFromText(seedText, { maxTerms: 8 });
		policy.keywords = derivedKeywords;
		console.log('[EVAL_POLICY] No keywords provided. Derived keywords:', derivedKeywords);
	}

	// Defaults for other fields
	policy.strictness = policy.strictness || 'moderate';
	policy.language = policy.language || 'en';
	policy.reviewTone = policy.reviewTone || 'concise';
	policy.targetLength = Number(policy.targetLength || 3);
	policy.requireCitations = Boolean(policy.requireCitations);

	return policy;
}

function summarizePolicy(policy = {}) {
	const {
		strictness = 'moderate',
		rubric = [],
		keywords = [],
		penalties = {},
		language = 'en',
		reviewTone = 'concise',
		targetLength = 3,
		customInstructions = '',
		requireCitations = false,
	} = policy;

	const rubricText =
		Array.isArray(rubric) && rubric.length
			? rubric.map(r => `- ${r.criterion} (${Math.round((r.weight || 0) * 100)}%)`).join('\n')
			: '- Overall relevance and correctness (100%)';

	const keywordsText =
		Array.isArray(keywords) && keywords.length
			? keywords.map(k => `${k.term}(${k.weight ?? 1})`).join(', ')
			: 'none';

	const penaltiesText = Object.keys(penalties || {}).length
		? Object.entries(penalties)
				.map(([k, v]) => `${k}(-${Math.round((v || 0) * 100)}%)`)
				.join(', ')
		: 'none';

	return {
		lines: {
			overview: `Strictness: ${strictness}. Tone: ${reviewTone}. Language: ${language}. Target sentences: ${targetLength}.`,
			rubricBlock: rubricText,
			keywordsLine: `Keywords to consider: ${keywordsText}.`,
			penaltiesLine: `Penalties: ${penaltiesText}.`,
			citationsLine: `Citations required: ${requireCitations ? 'yes' : 'no'}.`,
			custom: customInstructions ? `Additional instructions: ${customInstructions}` : '',
		},
		parsed: {
			strictness,
			rubric,
			keywords,
			penalties,
			language,
			reviewTone,
			targetLength,
			requireCitations,
		},
	};
}

function buildPrompt(question, studentAnswer, referenceAnswer, policySummary, policy) {
	const { lines } = policySummary;

	// If there is no reference answer, instruct the model to infer expected points
	const guidanceWhenNoRef = referenceAnswer
		? ''
		: [
				'No explicit reference answer is provided.',
				'As a subject-matter expert, infer the expected key points from the question itself.',
				'Use the rubric and keywords to judge relevance, correctness, completeness, and clarity.',
			].join('\n');

	return [
		'You are an expert exam evaluator.',
		'Evaluate the student answer according to the policy and rubric below.',
		'Return ONLY a single JSON object, with no markdown.',
		'Output JSON schema:',
		'{"score": 0-100, "review": "string", "rubric_breakdown":[{"criterion":"string","weight":0-1,"score":0-100,"notes":"string"}], "keywords_matched":[{"term":"string","matched":true,"weight":number}], "penalties_applied":[{"type":"string","percent":0-1,"reason":"string"}]}',
		'Do not include extra keys. Do not include markdown.',
		'',
		'Context:',
		`Question: "${question}"`,
		referenceAnswer ? `Reference Answer: "${referenceAnswer}"` : 'Reference Answer: (none)',
		`Student Answer: "${studentAnswer}"`,
		'',
		'Teacher Policy:',
		lines.overview,
		'Rubric:',
		lines.rubricBlock,
		lines.keywordsLine,
		lines.penaltiesLine,
		lines.citationsLine,
		lines.custom,
		'',
		guidanceWhenNoRef,
		'Scoring Rules:',
		'- Start from 100 and apply rubric weights and any penalties.',
		'- Align with the strictness level.',
		'- If no explicit rubric was provided originally, the above rubric is implicit/derived.',
		`- Keep review length aligned with target sentence count (${policy?.targetLength ?? 3}) and tone.`,
		'',
		'Return ONLY the JSON object. No additional text.',
	]
		.filter(Boolean)
		.join('\n');
}

/**
 * Extract a JSON object from model output.
 */
function extractJson(rawOutput) {
	console.log('[EVAL_SERVICE_EXTRACT] Attempting to find JSON in raw output.');
	const firstBrace = rawOutput.indexOf('{');
	const lastBrace = rawOutput.lastIndexOf('}');
	if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
		console.error('[EVAL_SERVICE_EXTRACT] No valid JSON object boundaries found.');
		throw new ApiError(500, 'No valid JSON object found in model response', { rawOutput });
	}
	const jsonString = rawOutput.substring(firstBrace, lastBrace + 1);
	console.log(`[EVAL_SERVICE_EXTRACT] Extracted potential JSON string: ${jsonString}`);
	try {
		const cleaned = jsonString.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
		return JSON.parse(cleaned);
	} catch (e) {
		console.error(`[EVAL_SERVICE_EXTRACT] JSON parsing failed: ${e.message}`);
		throw new ApiError(500, 'Model returned invalid JSON', {
			originalError: e.message,
			jsonString,
		});
	}
}

/**
 * Deterministic fallback: score by keyword coverage if policy provides keywords.
 */
function keywordFallback(studentAnswer, policy, weight) {
	const kw = (policy?.keywords || []).filter(k => k?.term);
	if (!kw.length) return null;

	const text = String(studentAnswer || '').toLowerCase();
	let matchedWeight = 0;
	let totalWeight = 0;
	const matched = [];

	for (const k of kw) {
		const w = Number(k.weight ?? 1);
		totalWeight += w;
		const present = text.includes(String(k.term).toLowerCase());
		if (present) matchedWeight += w;
		matched.push({ term: k.term, matched: present, weight: w });
	}

	const coverage = totalWeight > 0 ? matchedWeight / totalWeight : 0;
	const score100 = Math.round(coverage * 100);
	const review = `Automatic fallback scoring applied based on keyword coverage (${matchedWeight}/${totalWeight}). This will be reviewed if needed.`;

	console.warn('[EVAL_SERVICE_FALLBACK] Applied keyword-based scoring.', { score100, matched });
	return {
		score: Math.round(score100 * (weight || 1)),
		review,
		meta: { keywords_matched: matched },
	};
}

/**
 * Heuristic fallback when no reliable AI/keyword signal is available.
 * Gives minimal but fair points for non-empty answers and flags for review.
 */
function heuristicFallback(studentAnswer, policy, weight) {
	console.warn('[EVAL_SERVICE_FALLBACK] Applying heuristic fallback scoring.');
	const text = String(studentAnswer || '').trim();
	if (!text) {
		return { score: 0, review: 'No answer was provided.' };
	}

	// Very simple heuristic based on length (tokens) and sentence count
	const tokens = text.split(/\s+/g).filter(Boolean).length;
	const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0).length;

	let base = 5; // minimal credit for non-empty
	if (tokens > 30) base += 3;
	if (tokens > 60) base += 4;
	if (sentences >= (policy?.targetLength || 3)) base += 3;

	const score100 = Math.min(20, base); // cap minimal heuristic at 20/100
	return {
		score: Math.round(score100 * (weight || 1)),
		review: 'Automatic heuristic scoring applied due to evaluation issues. The answer appears non-empty and reasonably structured, but requires teacher review.',
	};
}

/**
 * Evaluate an answer with optional teacher policy.
 * Works with or without rubric/reference answer.
 */
export async function evaluateAnswer(
	question,
	studentAnswer,
	referenceAnswer = null,
	weight = 1,
	policy = null,
) {
	console.log(`[EVAL_SERVICE] Start. q="${String(question).slice(0, 60)}...", weight=${weight}`);

	// Enrich policy to handle missing rubric/keywords
	const effectivePolicy = enrichPolicy(policy || {}, question, referenceAnswer);
	console.log('[EVAL_SERVICE] Effective policy prepared:', {
		strictness: effectivePolicy.strictness,
		rubricLen: effectivePolicy.rubric?.length,
		keywordsLen: effectivePolicy.keywords?.length,
	});

	const policySummary = summarizePolicy(effectivePolicy);
	const prompt = buildPrompt(
		question,
		studentAnswer,
		referenceAnswer,
		policySummary,
		effectivePolicy,
	);
	console.log(`[EVAL_SERVICE] Prompt built. Length=${prompt.length}`);

	let attempt = 0;
	let lastError = null;

	while (attempt <= EVAL_MAX_RETRIES) {
		try {
			if (attempt > 0) console.warn(`[EVAL_SERVICE] Retry attempt ${attempt}...`);

			const response = await axios.post(
				api,
				{ inputs: prompt, parameters: { max_new_tokens: 220 } },
				{
					headers: { Authorization: `Bearer ${apiKey}` },
					timeout: EVAL_TIMEOUT_MS,
				},
			);

			console.log('[EVAL_SERVICE] Model responded.');
			let rawOutput = '';
			const data = response.data;

			if (typeof data === 'string') rawOutput = data;
			else if (Array.isArray(data) && data.length > 0)
				rawOutput = data[0]?.generated_text || JSON.stringify(data[0]);
			else if (typeof data === 'object' && data)
				rawOutput = data.generated_text || JSON.stringify(data);
			else {
				console.error('[EVAL_SERVICE] Unexpected response format:', data);
				throw new ApiError(500, 'Unexpected evaluation service response');
			}

			console.log('[EVAL_SERVICE] Raw output normalized:', rawOutput);
			const parsed = extractJson(rawOutput);
			console.log('[EVAL_SERVICE] Parsed JSON:', parsed);

			let score = Number(parsed.score);
			if (isNaN(score)) {
				console.warn(
					`[EVAL_SERVICE] Parsed score is NaN ("${parsed.score}"). Defaulting to 0.`,
				);
				score = 0;
			}
			score = Math.max(0, Math.min(100, Math.round(score)));
			const finalMarks = Math.round(score * (weight || 1));
			const review =
				typeof parsed.review === 'string' && parsed.review.trim()
					? parsed.review.trim()
					: 'No review provided';

			console.log(`[EVAL_SERVICE] Success. finalMarks=${finalMarks}`);
			return {
				score: finalMarks,
				review,
				meta: {
					rubric_breakdown: parsed.rubric_breakdown || [],
					keywords_matched: parsed.keywords_matched || [],
					penalties_applied: parsed.penalties_applied || [],
				},
			};
		} catch (err) {
			lastError = err;
			console.error(`[EVAL_SERVICE] Attempt ${attempt} failed: ${err?.message || err}`);
			attempt += 1;
			if (attempt > EVAL_MAX_RETRIES) break;
		}
	}

	// Fallback path
	console.error('[EVAL_SERVICE] All attempts failed. Considering fallback scoring.');
	const fbKeyword = keywordFallback(studentAnswer, effectivePolicy, weight);
	if (fbKeyword) {
		console.log('[EVAL_SERVICE] Keyword fallback succeeded.');
		return {
			score: fbKeyword.score,
			review: fbKeyword.review,
			meta: {
				keywords_matched: fbKeyword.meta.keywords_matched,
				fallback: true,
				type: 'keyword',
			},
		};
	}

	const fbHeuristic = heuristicFallback(studentAnswer, effectivePolicy, weight);
	console.log('[EVAL_SERVICE] Heuristic fallback applied.');
	return {
		score: fbHeuristic.score,
		review: fbHeuristic.review,
		meta: { fallback: true, type: 'heuristic', reason: lastError?.message || 'Unknown error' },
	};
}
