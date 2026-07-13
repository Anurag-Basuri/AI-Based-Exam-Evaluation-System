import dotenv from 'dotenv';
dotenv.config();

import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';

const AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://127.0.0.1:8001';

const EVAL_TIMEOUT_MS = Number(process.env.EVAL_TIMEOUT_MS || 30000);
const EVAL_MAX_RETRIES = Number(process.env.EVAL_MAX_RETRIES || 1);
const EVAL_RETRY_DELAY_MS = Number(process.env.EVAL_RETRY_DELAY_MS || 1000);

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
	const MAX_CHARS = 1500;
	if (trimmed.length > MAX_CHARS) {
		return { text: trimmed.substring(0, MAX_CHARS), truncated: true };
	}
	return { text: trimmed, truncated: false };
}

function limitSentences(text, maxSentences) {
	if (!text) return '';
	const match = text.match(/[^.!?]+[.!?]*/g);
	if (!match) return text;
	return match.slice(0, maxSentences).join(' ').trim();
}

/**
 * Heuristic fallback when no reliable AI signal is available.
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
	if (sentences >= 2) base += 3;

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
	examDoc = null
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

	// Make request to new Python Agent Service
	let attempt = 0;
	let lastError = null;

	while (attempt <= EVAL_MAX_RETRIES) {
		try {
			if (attempt > 0) console.warn(`[EVAL_SERVICE ${evalId}] Retry attempt ${attempt}`);
			console.log(`[EVAL_SERVICE ${evalId}] Sending request to Agent Service (attempt ${attempt})`);
			
			// Try to find the sessionId and classroom_id
			const sessionId = examDoc?.agentSessionId || null;
			let classroomId = null;
            // The classroomId is essentially the teacher's ID here to fetch the right chroma collection,
            // or we might pass allowed_doc_ids instead. 
            // In the agent-service we have `classroom_id` and `allowed_doc_ids` as optional.
			
			// We can pass the sessionId in the request, and the python backend will resolve used chunks
			const payload = {
				question: cleanQ,
				student_answer: cleanAns,
				max_marks: Math.round(100 * weight),
				reference_answer: referenceAnswer || '',
				exam_type: examDoc?.generatedBy || 'manual',
				session_id: sessionId,
				policy: {
					strictness: policy?.strictness || 'moderate',
					reviewTone: policy?.reviewTone || 'concise',
					expectedLength: policy?.expectedLength || 20,
					customInstructions: policy?.customInstructions || '',
					questionRemarks: qRemarks
				}
			};

			const response = await axios.post(
				`${AGENT_SERVICE_URL}/api/v1/ai/evaluate`,
				payload,
				{
					headers: { 'Content-Type': 'application/json' },
					timeout: EVAL_TIMEOUT_MS,
				}
			);

			console.log(`[EVAL_SERVICE ${evalId}] Agent Service responded status=${response.status}`);
			
			const data = response.data;
			
			// Agent Service returns { score, review, meta }
			const finalMarks = data.score != null ? Number(data.score) : 0;
			const limitedReview = limitSentences(
				typeof data.review === 'string' ? data.review : 'No review provided',
				5,
			);

			const meta = {
				evalId,
				path: 'ai_agent',
				strict_mode: data.meta?.exam_type === 'ai',
				used_docs: data.meta?.sources_used || [],
				truncatedInput: truncated || undefined,
			};

			console.log(`[EVAL_SERVICE ${evalId}] Success score=${finalMarks}`);
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

	const fbHeuristic = heuristicFallback(cleanAns, policy, weight);
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
