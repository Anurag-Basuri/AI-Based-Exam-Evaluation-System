import Submission from '../models/submission.model.js';
import Exam from '../models/exam.model.js';
import { enqueueEvaluation } from './jobQueue.service.js';
import { ApiError } from '../utils/ApiError.js';

// ── Helpers ──────────────────────────────────────────────────────

export const isExpired = (submission, exam) => {
	if (!submission?.startedAt || !submission?.duration) return false;
	const started = new Date(submission.startedAt).getTime();
	const byDuration = started + Number(submission.duration) * 60 * 1000;
	const examEnd = exam?.endTime ? new Date(exam.endTime).getTime() : Number.POSITIVE_INFINITY;
	const deadline = Math.min(byDuration, examEnd);
	return Date.now() >= deadline;
};

export const mergeAnswers = (existingAnswers, incomingAnswers) => {
	const incomingMap = new Map(incomingAnswers.map(a => [String(a.question), a]));

	existingAnswers.forEach(existingAns => {
		const qid = String(existingAns.question);
		if (incomingMap.has(qid)) {
			const incoming = incomingMap.get(qid);
			// Update properties on the existing Mongoose sub-document
			existingAns.responseText = incoming.responseText ?? existingAns.responseText;
			existingAns.responseOption = incoming.responseOption ?? existingAns.responseOption;
		}
	});

	// Return the mutated array. Mongoose will detect the changes.
	return existingAnswers;
};

// ── Operations ───────────────────────────────────────────────────

export const finalize = async (submission, exam) => {
	// Avoid double-finalization
	if (submission.status !== 'in-progress') return submission;
	submission.status = 'evaluating';
	submission.submittedAt = new Date();
	submission.submissionType = 'auto';
	await submission.save();

	// Fire evaluation via job queue (concurrency-limited, recoverable)
	enqueueEvaluation(submission._id);
	return submission;
};

export const start = async (examId, studentId) => {
	if (!examId) throw ApiError.BadRequest('Exam ID is required');

	const exam = await Exam.findById(examId).select('status startTime endTime duration questions');
	if (!exam) throw ApiError.NotFound('Exam not found');
	
	if (exam.status !== 'active') throw ApiError.Forbidden('Exam is not active');

	const now = new Date();
	if (exam.startTime && now < new Date(exam.startTime))
		throw ApiError.Forbidden('Exam has not started yet');
	if (exam.endTime && now > new Date(exam.endTime)) throw ApiError.Forbidden('Exam has ended');

	const existing = await Submission.findOne({ exam: examId, student: studentId });

	if (existing) {
		// If expired while away, auto-submit and return final
		if (isExpired(existing, exam) && existing.status === 'in-progress') {
			const finalized = await finalize(existing, exam);
			return { submission: finalized, statusMessage: 'Time over. Submission finalized' };
		}
		// Resuming, re-populate the submission
		const populatedExisting = await Submission.findById(existing._id)
			.populate({ path: 'exam', select: 'title duration instructions aiPolicy' })
			.populate({ path: 'questions', select: 'text type options max_marks' })
			.lean();

		const normalizedExisting = {
			_id: populatedExisting._id,
			status: populatedExisting.status,
			startedAt: populatedExisting.startedAt,
			submittedAt: populatedExisting.submittedAt,
			duration: populatedExisting.exam?.duration,
			examTitle: populatedExisting.exam?.title,
			examPolicy: populatedExisting.exam?.aiPolicy,
			instructions: populatedExisting.exam?.instructions,
			questions: (populatedExisting.questions || []).map(q => ({
				...q,
				options: (q.options || []).map(opt => ({ ...opt })),
			})),
			answers: populatedExisting.answers || [],
			markedForReview: populatedExisting.markedForReview || [],
		};

		return { submission: normalizedExisting, statusMessage: 'Submission already started' };
	}

	// --- Pre-populate answer slots ---
	const initialAnswers = (exam.questions || []).map(questionId => ({
		question: questionId,
		responseText: '',
		responseOption: null,
	}));

	const submission = new Submission({
		exam: examId,
		student: studentId,
		startedAt: new Date(),
		duration: exam.duration,
		status: 'in-progress',
		answers: initialAnswers,
		questions: exam.questions, 
	});

	await submission.save();

	const populatedSubmission = await Submission.findById(submission._id)
		.populate({ path: 'exam', select: 'title duration instructions aiPolicy' })
		.populate({ path: 'questions', select: 'text type options max_marks' })
		.lean();

	const normalized = {
		_id: populatedSubmission._id,
		status: populatedSubmission.status,
		startedAt: populatedSubmission.startedAt,
		submittedAt: populatedSubmission.submittedAt,
		duration: populatedSubmission.exam?.duration,
		examTitle: populatedSubmission.exam?.title,
		examPolicy: populatedSubmission.exam?.aiPolicy,
		instructions: populatedSubmission.exam?.instructions,
		questions: (populatedSubmission.questions || []).map(q => ({
			...q,
			options: (q.options || []).map(opt => ({ ...opt })),
		})),
		answers: populatedSubmission.answers || [],
		markedForReview: populatedSubmission.markedForReview || [],
	};

	return { submission: normalized, statusMessage: 'Submission started', isNew: true };
};

export const submit = async (examId, studentId, submissionType = 'manual') => {
	const submission = await Submission.findOne({ exam: examId, student: studentId });
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (submission.status !== 'in-progress') throw ApiError.Forbidden('Already submitted');

	submission.status = 'evaluating';
	submission.submittedAt = new Date();
	submission.submissionType = submissionType;
	await submission.save();

	enqueueEvaluation(submission._id);
	
	return submission;
};
