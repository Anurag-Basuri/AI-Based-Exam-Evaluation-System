import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const api = process.env.HF_API_URL;
const apiKey = process.env.HF_API_KEY;
console.log(
	`[EVAL_SERVICE] HF_API_URL=${api ? '[SET]' : '[MISSING]'} HF_API_KEY=${
		apiKey ? '[SET]' : '[MISSING]'
	}`,
);

const model = 'mistralai/Mistral-7B-Instruct-v0.2:featherless-ai';

const EVAL_TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 15000);
const EVAL_MAX_RETRIES = Number(process.env.EVAL_MAX_RETRIES || 1);
const EVAL_RETRY_DELAY_MS = Number(process.env.EVAL_RETRY_DELAY_MS || 500);
const EVAL_TEMPERATURE = Number(process.env.EVAL_TEMPERATURE ?? 0.2);
const EVAL_TOP_P = Number(process.env.EVAL_TOP_P ?? 0.9);
const EVAL_DO_SAMPLE = String(process.env.EVAL_DO_SAMPLE ?? 'false') === 'true';
const EVAL_MAX_NEW_TOKENS = Number(process.env.EVAL_MAX_NEW_TOKENS || 150);
const MAX_ANSWER_CHARS = Number(process.env.EVAL_MAX_ANSWER_CHARS || 1500);

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

// Enrich policy: Set defaults for fields that exist in the model.
function enrichPolicy(basePolicy = {}) {
	const policy = { ...(basePolicy || {}) };
	policy.strictness = policy.strictness || 'moderate';
	policy.reviewTone = policy.reviewTone || 'concise';
	policy.expectedLength = Number(policy.expectedLength || 20);
	policy.customInstructions = policy.customInstructions || '';
	return policy;
}

// Summarize the policy based on fields that actually exist in the exam model.
function summarizePolicy(policy = {}, questionRemarks = '') {
	const {
		strictness = 'moderate',
		reviewTone = 'concise',
		expectedLength = 20,
		customInstructions = '',
	} = policy;

	const lines = [
		`Evaluation Strictness: ${strictness}.`,
		`Review Tone: ${reviewTone}.`,
		`Expected Answer Length: Around ${expectedLength} words.`,
	];

	if (customInstructions) {
		lines.push(`General Instructions: ${customInstructions}`);
	}
	if (questionRemarks) {
		lines.push(`Note for this specific question: ${questionRemarks}`);
	}

	return lines.join('\n');
}

// Build a simpler, more direct, and more effective prompt.
function buildPrompt(question, studentAnswer, referenceAnswer, policySummary) {
	const guidanceWhenNoRef = referenceAnswer
		? ''
		: 'No reference answer is provided. Use your expert knowledge to assess correctness.';

	return [
		'You are an expert, impartial exam evaluator.',
		"Your task is to score a student's answer based on a given question and a teacher's policy.",
		'You must return ONLY a single, raw JSON object with no markdown, comments, or extra text.',
		'The JSON schema is: {"score": number, "review": "string"}',
		'The "score" must be an integer between 0 and 100.',
		'The "review" must be a brief explanation for the score, adhering to the teacher\'s requested tone.',
		'---',
		'**CONTEXT**',
		`Question: "${question}"`,
		referenceAnswer ? `Reference Answer (for ideal context): "${referenceAnswer}"` : '',
		`Student's Answer: "${studentAnswer}"`,
		'',
		"**TEACHER'S POLICY**",
		policySummary,
		guidanceWhenNoRef,
		'---',
		'Now, provide your evaluation as a single JSON object.',
	]
		.filter(Boolean)
		.join('\n');
}

// ---------- Uniformity helpers ----------
function createEvalId() {
	const rnd = Math.random().toString(16).slice(2, 8);
	return `EVAL-${Date.now()}-${rnd}`;
}
function delay(ms) {
	return new Promise(res => setTimeout(res, ms));
}
function sanitizeAnswer(text) {
	const src = String(text ?? '');
	const trimmed = src.trim().replace(/\s+/g, ' ');
	if (trimmed.length <= MAX_ANSWER_CHARS) return { text: trimmed, truncated: false };
	return { text: trimmed.slice(0, MAX_ANSWER_CHARS), truncated: true };
}
function toNumber0_100(any) {
	// Accept "85", "85.2", "85/100"
	if (typeof any === 'number') return Math.max(0, Math.min(100, Math.round(any)));
	const m = String(any ?? '').match(/([0-9]{1,3})(?:\s*\/\s*100)?/);
	const n = m ? Number(m[1]) : 0;
	return Math.max(0, Math.min(100, Math.round(isNaN(n) ? 0 : n)));
}
function limitSentences(text, maxSentences) {
	const s = String(text || '')
		.replace(/\s+/g, ' ')
		.trim();
	if (!s) return s;
	const parts = s.split(/(?<=[.!?])\s+/);
	return parts.slice(0, Math.max(1, maxSentences)).join(' ');
}

// This is no longer needed as the AI response is simpler.
function ensureRubricBreakdown(parsed, rubric) {
	if (!Array.isArray(rubric) || rubric.length === 0) return parsed.rubric_breakdown || [];
	if (!Array.isArray(parsed.rubric_breakdown) || parsed.rubric_breakdown.length === 0) {
		// Synthesize neutral breakdown for uniform meta structure
		return rubric.map(r => ({
			criterion: r.criterion,
			weight: Number(r.weight || 0),
			score: null,
			notes: '',
		}));
	}
	return parsed.rubric_breakdown;
}

/**
 * Extract a JSON object from model output.
 */
function extractJson(rawOutput) {
	// Keep only essential logs: length and detailed errors
	if (!rawOutput || !rawOutput.length) {
		console.error('[EVAL_SERVICE_EXTRACT] Empty rawOutput provided to extractJson.');
		throw new ApiError(500, 'Empty model response', { rawOutput });
	}
	const firstBrace = rawOutput.indexOf('{');
	const lastBrace = rawOutput.lastIndexOf('}');
	if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
		console.error(
			'[EVAL_SERVICE_EXTRACT] No JSON boundaries found. firstBrace=',
			firstBrace,
			' lastBrace=',
			lastBrace,
		);
		throw new ApiError(500, 'No valid JSON object found in model response', { rawOutput });
	}
	const jsonString = rawOutput.substring(firstBrace, lastBrace + 1);
	try {
		const cleaned = jsonString.replace(/,\s*\]/g, ']').replace(/,\s*\}/g, '}');
		return JSON.parse(cleaned);
	} catch (e) {
		console.error('[EVAL_SERVICE_EXTRACT] JSON parsing failed:', e.message);
		console.error('[EVAL_SERVICE_EXTRACT] jsonString (truncated):', jsonString.slice(0, 1000));
		throw new ApiError(500, 'Model returned invalid JSON', {
			originalError: e.message,
			jsonString,
		});
	}
}

/**
 * Heuristic fallback when no reliable AI signal is available.
 * Gives minimal but fair points for non-empty answers and flags for review.
 */
function heuristicFallback(studentAnswer, policy, weight) {
	console.warn('[EVAL_SERVICE_FALLBACK] Applying heuristic fallback scoring.');
	const text = String(studentAnswer || '').trim();
	if (!text) {
		return { score: 0, review: 'No answer was provided.' };
	}
	const tokens = text.split(/\s+/g).filter(Boolean).length;
	const sentences = text.split(/[.!?]+/g).filter(s => s.trim().length > 0).length;

	let base = 5;
	if (tokens > 30) base += 3;
	if (tokens > 60) base += 4;
	if (sentences >= 2) base += 3; // Check for at least 2 sentences

	const score100 = Math.min(20, base);
	return {
		score: Math.round(score100 * (weight || 1)),
		review: 'Automatic heuristic scoring applied due to an evaluation issue. The answer was non-empty and has been flagged for teacher review.',
	};
}

export async function evaluateAnswer(
	questionObj,
	studentAnswer,
	referenceAnswer = null,
	weight = 1,
	policy = null,
) {
	const evalId = createEvalId();
	const cleanQ = questionObj ? String(questionObj.text).trim() : '';
	const qRemarks = String(questionObj?.remarks ?? '').trim();
	const { text: cleanAns, truncated } = sanitizeAnswer(studentAnswer);

	console.log(
		`[EVAL_SERVICE ${evalId}] START questionLength=${cleanQ.length} answerLength=${
			String(cleanAns).length
		}`,
	);

	if (!cleanQ) {
		console.error(`[EVAL_SERVICE ${evalId}] Missing question text.`);
		return {
			score: 0,
			review: 'System error: missing question text.',
			meta: { fallback: true, type: 'system', evalId },
		};
	}

	const effectivePolicy = enrichPolicy(policy || {});

	const policySummary = summarizePolicy(effectivePolicy, qRemarks);
	const prompt = buildPrompt(cleanQ, cleanAns, referenceAnswer, policySummary);

	// If no AI config is provided, immediately use the heuristic fallback.
	if (!api || !apiKey) {
		console.warn(`[EVAL_SERVICE ${evalId}] Missing HF API config. Using fallback scoring.`);
		const fbHeuristic = heuristicFallback(cleanAns, effectivePolicy, weight);
		return {
			score: fbHeuristic.score,
			review: limitSentences(fbHeuristic.review, 3),
			meta: {
				fallback: true,
				type: 'config-heuristic',
				evalId,
			},
		};
	}

	let attempt = 0;
	let lastError = null;

	while (attempt <= EVAL_MAX_RETRIES) {
		try {
			if (attempt > 0) console.warn(`[EVAL_SERVICE ${evalId}] Retry attempt ${attempt}`);
			console.log(`[EVAL_SERVICE ${evalId}] Sending request to HF (attempt ${attempt})`);
			const response = await axios.post(
				api,
				{
					model,
					messages: [{ role: 'user', content: prompt }],
					temperature: EVAL_TEMPERATURE,
					top_p: EVAL_TOP_P,
					max_new_tokens: EVAL_MAX_NEW_TOKENS,
					stream: false,
					do_sample: EVAL_DO_SAMPLE,
				},
				{
					headers: {
						Authorization: `Bearer ${apiKey}`,
						'Content-Type': 'application/json',
					},
					timeout: EVAL_TIMEOUT_MS,
				},
			);

			console.log(`[EVAL_SERVICE ${evalId}] Model responded status=${response.status}`);

			let rawOutput = '';
			const data = response.data;

			// Handle new chat completions response structure
			if (data?.choices?.[0]?.message?.content) {
				rawOutput = data.choices[0].message.content;
			} else if (typeof data === 'string') {
				rawOutput = data;
			} else if (Array.isArray(data) && data.length > 0) {
				rawOutput = data[0]?.generated_text || JSON.stringify(data[0]);
			} else if (typeof data === 'object' && data) {
				rawOutput = data.generated_text || JSON.stringify(data);
			} else {
				console.error(`[EVAL_SERVICE ${evalId}] Unexpected response format.`);
				throw new ApiError(500, 'Unexpected evaluation service response', {
					responseDataType: typeof data,
				});
			}

			const parsed = extractJson(rawOutput);

			const score100 = toNumber0_100(parsed.score);
			const finalMarks = Math.round(score100 * (weight || 1));
			const limitedReview = limitSentences(
				typeof parsed.review === 'string' ? parsed.review : 'No review provided',
				3,
			);

			const meta = {
				evalId,
				path: 'ai',
				truncatedInput: truncated || undefined,
			};

			console.log(`[EVAL_SERVICE ${evalId}] Success finalMarks=${finalMarks}`);
			return { score: finalMarks, review: limitedReview, meta };
		} catch (err) {
			lastError = err;
			console.error(
				`[EVAL_SERVICE ${evalId}] Attempt ${attempt} failed: ${err?.message || err}`,
			);
			if (err?.response) {
				try {
					console.error(
						`[EVAL_SERVICE ${evalId}] Error response status=${err.response.status} dataPreview=`,
						String(JSON.stringify(err.response.data)).slice(0, 500),
					);
				} catch (e) {
					console.error(
						`[EVAL_SERVICE ${evalId}] Could not stringify err.response.data:`,
						e?.message,
					);
				}
			}
			attempt += 1;
			if (attempt > EVAL_MAX_RETRIES) break;
			await delay(EVAL_RETRY_DELAY_MS);
		}
	}

	console.error(`[EVAL_SERVICE ${evalId}] All attempts failed. Applying heuristic fallback.`);

	const fbHeuristic = heuristicFallback(cleanAns, effectivePolicy, weight);
	return {
		score: fbHeuristic.score,
		review: limitSentences(fbHeuristic.review, 3),
		meta: {
			fallback: true,
			type: 'heuristic',
			reason: lastError?.message || 'Unknown error',
			evalId,
		},
	};
}
