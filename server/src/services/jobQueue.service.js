import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import Submission from '../models/submission.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { evaluateAnswer } from './evaluation.service.js';

// ── Configuration ───────────────────────────────────────────────
const MAX_CONCURRENT = Number(process.env.EVAL_MAX_CONCURRENT || 3);
let ioRef = null;

// ── Redis Connection (for BullMQ) ───────────────────────────────
let connection = null;
let evalQueue = null;
let worker = null;
let useBullMQ = false;

// Fallback: in-memory queue (identical to the original implementation)
const memQueue = [];
let activeCount = 0;

if (process.env.UPSTASH_REDIS_URL) {
	try {
		connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
			maxRetriesPerRequest: null, // Required by BullMQ
			tls: {},                    // Upstash requires TLS
		});

		evalQueue = new Queue('exam-evaluation', { connection });
		useBullMQ = true;
		console.log('[JOB_QUEUE] ✅ BullMQ connected to Upstash Redis');
	} catch (err) {
		console.warn('[JOB_QUEUE] ⚠️ BullMQ init failed, falling back to in-memory queue:', err.message);
		useBullMQ = false;
	}
} else {
	console.log('[JOB_QUEUE] 📦 Using in-memory queue (no UPSTASH_REDIS_URL)');
}

// ── Set Socket.IO instance (called once from server.js) ─────────
export function setSocketRef(io) {
	ioRef = io;
}

// ── Core evaluation logic ───────────────────────────────────────
// Extracted from submission.controller.js for reuse and testability.
// This function is UNCHANGED — it is the pure business logic.
export async function evaluateSubmissionAnswers(submission) {
	console.log(`[JOB_QUEUE] Starting answer evaluation for submission ID: ${submission._id}`);
	const examDoc = await Exam.findById(submission.exam).select('title aiPolicy');

	const evaluations = await Promise.all(
		submission.answers.map(async ans => {
			const questionDoc = await Question.findById(ans.question).lean();
			if (!questionDoc) {
				console.warn(`[JOB_QUEUE] Question ${ans.question} not found. Skipping.`);
				return null;
			}

			let marks = 0;
			let remarks = 'Answer not provided.';
			let meta = undefined;
			let evaluator = 'ai';

			if (questionDoc.type === 'multiple-choice') {
				if (ans.responseOption && questionDoc.options) {
					const isCorrect = (questionDoc.options || []).some(
						opt => opt.isCorrect && String(opt?._id) === String(ans.responseOption),
					);
					marks = isCorrect ? questionDoc.max_marks : 0;
					remarks = isCorrect ? 'Correct answer.' : 'Incorrect answer.';
					meta = { type: 'mcq-auto' };
				} else {
					remarks = 'No option selected.';
					meta = { type: 'mcq-unanswered' };
				}
			} else if (ans.responseText && String(ans.responseText).trim()) {
				const refAnswer = questionDoc.answer || null;
				const weight = (questionDoc.max_marks || 0) / 100;
				const policy = examDoc?.aiPolicy || {};

				try {
					const evalResult = await evaluateAnswer(
						questionDoc,
						ans.responseText,
						refAnswer,
						weight,
						policy,
					);
					marks = evalResult.score;
					remarks = evalResult.review;
					meta = evalResult.meta;
				} catch (e) {
					console.error(
						`[JOB_QUEUE] Evaluation error for question ${questionDoc._id}.`,
						e.message,
					);
					marks = 0;
					remarks =
						'Evaluation failed due to a system error. A teacher will review this answer.';
					meta = { fallback: true, type: 'controller-error', message: e.message };
					evaluator = 'system';
				}
			} else {
				meta = { fallback: true, type: 'empty-answer' };
			}

			return {
				question: questionDoc._id,
				evaluation: {
					evaluator,
					marks,
					remarks,
					evaluatedAt: new Date(),
					meta,
				},
			};
		}),
	);

	const filtered = evaluations.filter(Boolean);
	console.log(
		`[JOB_QUEUE] Finished evaluation for submission ${submission._id}. Evaluated: ${filtered.length} answers`,
	);
	return filtered;
}

// ── Process a single evaluation job ─────────────────────────────
async function processJob(submissionId) {
	const startTime = Date.now();
	console.log(`[JOB_QUEUE] Processing submission ${submissionId}`);

	try {
		const submission = await Submission.findById(submissionId);
		if (!submission || submission.status !== 'evaluating') {
			console.warn(`[JOB_QUEUE] Submission ${submissionId} not in 'evaluating' state (status: ${submission?.status}). Skipping.`);
			return;
		}

		submission.evaluations = await evaluateSubmissionAnswers(submission);
		submission.evaluatedAt = new Date();
		submission.status = 'evaluated';
		await submission.save();

		const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
		console.log(`[JOB_QUEUE] ✅ Submission ${submissionId} evaluated in ${elapsed}s`);

		// Notify frontend via Socket.IO
		if (ioRef) {
			ioRef.to(String(submission.student)).emit('submission-updated', {
				submissionId: String(submission._id),
				status: 'evaluated',
			});
		}
	} catch (err) {
		console.error(`[JOB_QUEUE] ❌ Failed for submission ${submissionId}:`, err.message);
		// Mark as evaluated even on failure so it doesn't hang forever
		try {
			await Submission.findByIdAndUpdate(submissionId, {
				status: 'evaluated',
				evaluatedAt: new Date(),
			});
		} catch { /* last resort — nothing more we can do */ }
	}
}

// ── BullMQ Worker (initialized only when Redis is available) ────
if (useBullMQ && connection) {
	worker = new Worker(
		'exam-evaluation',
		async (job) => {
			await processJob(job.data.submissionId);
		},
		{
			connection: new IORedis(process.env.UPSTASH_REDIS_URL, {
				maxRetriesPerRequest: null,
				tls: {},
			}),
			concurrency: MAX_CONCURRENT,
		},
	);

	worker.on('completed', (job) => {
		console.log(`[JOB_QUEUE] BullMQ job ${job.id} completed`);
	});

	worker.on('failed', (job, err) => {
		console.error(`[JOB_QUEUE] BullMQ job ${job?.id} failed:`, err.message);
	});

	worker.on('error', (err) => {
		console.error('[JOB_QUEUE] BullMQ worker error:', err.message);
	});
}

// ── In-Memory Fallback: Drain Loop ──────────────────────────────
function drain() {
	while (activeCount < MAX_CONCURRENT && memQueue.length > 0) {
		const submissionId = memQueue.shift();
		activeCount++;
		processJob(submissionId).finally(() => {
			activeCount--;
			drain();
		});
	}
}

// ── Public API: Enqueue a submission for background evaluation ──
export function enqueueEvaluation(submissionId) {
	if (useBullMQ && evalQueue) {
		evalQueue.add(
			'evaluate',
			{ submissionId: String(submissionId) },
			{
				attempts: 3,
				backoff: { type: 'exponential', delay: 2000 },
				removeOnComplete: 100,
				removeOnFail: 200,
			},
		);
		console.log(`[JOB_QUEUE] Enqueued via BullMQ: ${submissionId}`);
	} else {
		// Fallback: in-memory queue
		console.log(`[JOB_QUEUE] Enqueued in-memory: ${submissionId} (queue: ${memQueue.length}, active: ${activeCount}/${MAX_CONCURRENT})`);
		memQueue.push(submissionId);
		drain();
	}
}

// ── Startup recovery ────────────────────────────────────────────
// Re-queue submissions stuck in 'evaluating' state (e.g., after server crash).
// BullMQ handles stalled jobs automatically, but we still scan MongoDB
// for submissions that got stuck before BullMQ was introduced.
export async function recoverStuckEvaluations() {
	try {
		const stuck = await Submission.find({ status: 'evaluating' }).select('_id').lean();
		if (stuck.length === 0) {
			console.log('[JOB_QUEUE] No stuck evaluations found on startup.');
			return;
		}
		console.log(`[JOB_QUEUE] ⚠️ Recovering ${stuck.length} stuck evaluation(s)...`);
		for (const sub of stuck) {
			enqueueEvaluation(sub._id);
		}
	} catch (err) {
		console.error('[JOB_QUEUE] Recovery scan failed:', err.message);
	}
}

// ── Graceful Shutdown ───────────────────────────────────────────
export async function gracefulShutdown() {
	console.log('[JOB_QUEUE] Shutting down...');
	try {
		if (worker) {
			await worker.close();
			console.log('[JOB_QUEUE] BullMQ worker closed');
		}
		if (evalQueue) {
			await evalQueue.close();
			console.log('[JOB_QUEUE] BullMQ queue closed');
		}
		if (connection) {
			connection.disconnect();
			console.log('[JOB_QUEUE] Redis connection closed');
		}
	} catch (err) {
		console.error('[JOB_QUEUE] Shutdown error:', err.message);
	}
}
