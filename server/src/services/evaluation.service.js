import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const api = process.env.HF_API_URL;
const apiKey = process.env.HF_API_KEY;
const EVAL_TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 15000);
const EVAL_MAX_RETRIES = Number(process.env.EVAL_MAX_RETRIES || 1);

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

function buildPrompt(question, studentAnswer, referenceAnswer, policySummary) {
	const { lines } = policySummary;

	return [
		'You are an expert exam evaluator.',
		'Evaluate the student answer strictly according to the teacher policy and rubric below.',
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
		'Scoring Rules:',
		'- Start from 100 and subtract penalties or apply rubric weights as needed.',
		'- Align with the strictness level.',
		'- If no rubric provided, use relevance, correctness, completeness.',
		'- Keep review length aligned with target sentence count and tone.',
		'',
		'Return ONLY the JSON object. No additional text.',
	].join('\n');
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
 * Evaluate an answer with optional teacher policy.
 * Backward compatible signature:
 *   evaluateAnswer(q, a, ref, weight) OR evaluateAnswer(q, a, ref, weight, policy)
 */
export async function evaluateAnswer(
	question,
	studentAnswer,
	referenceAnswer = null,
	weight = 1,
	policy = null,
) {
	const policySummary = summarizePolicy(policy || {});
	console.log(`[EVAL_SERVICE] Start. q="${String(question).slice(0, 60)}...", weight=${weight}`);
	console.log('[EVAL_SERVICE] Policy summary:', policySummary.lines);

	const prompt = buildPrompt(question, studentAnswer, referenceAnswer, policySummary);
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
	const fb = keywordFallback(studentAnswer, policy, weight);
	if (fb) {
		return {
			score: fb.score,
			review: fb.review,
			meta: { keywords_matched: fb.meta.keywords_matched, fallback: true },
		};
	}

	// As last resort, return 0 with trace so flow continues.
	console.error('[EVAL_SERVICE] No fallback available. Returning 0 with system review.');
	return {
		score: 0,
		review: 'Evaluation failed due to a system error. A teacher will review this answer.',
		meta: { fallback: true, reason: lastError?.message || 'Unknown error' },
	};
}
