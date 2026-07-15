import Submission from '../models/submission.model.js';
import Exam from '../models/exam.model.js';
import { enqueueEvaluation } from './jobQueue.service.js';
import { ApiError } from '../utils/ApiError.js';

// Helpers

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

// Operations

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

	// Pre-populate answer slots
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

import { evaluateSubmissionAnswers } from './jobQueue.service.js';
import { evaluateAnswer } from './evaluation.service.js';

export const updateEvaluation = async (submissionId, teacherId, evaluations) => {
	if (!Array.isArray(evaluations) || evaluations.length === 0)
		throw ApiError.BadRequest('Evaluations must be a non-empty array.');

	const submission = await Submission.findById(submissionId).populate('exam');
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (String(submission.exam?.createdBy) !== String(teacherId))
		throw ApiError.Forbidden('Not authorized');

	const updatesMap = new Map(evaluations.map(e => [String(e.question), e]));
	submission.evaluations.forEach(existingEval => {
		const qId = String(existingEval.question);
		if (updatesMap.has(qId)) {
			const update = updatesMap.get(qId);
			existingEval.evaluation = {
				evaluator: 'teacher',
				marks: Number(update.marks),
				remarks: String(update.remarks),
				evaluatedAt: new Date(),
				meta: { ...(existingEval.evaluation.meta || {}), path: 'teacher-override' },
			};
		}
	});

	if (submission.status === 'submitted') {
		submission.status = 'evaluated';
		submission.evaluatedAt = new Date();
	}
	await submission.save();
	return submission;
};

export const triggerAutoEvaluation = async submissionId => {
	const submission = await Submission.findById(submissionId)
		.populate('exam')
		.populate({ path: 'answers.question', model: 'Question' });
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (submission.evaluations && submission.evaluations.length > 0)
		throw ApiError.Conflict('Submission already evaluated');

	submission.evaluations = await evaluateSubmissionAnswers(submission);
	submission.evaluatedAt = new Date();
	await submission.save();
	return submission;
};

export const getStudentSubmission = async (examId, studentId) => {
	const submission = await Submission.findOne({ exam: examId, student: studentId })
		.populate('exam')
		.populate({ path: 'answers.question', model: 'Question' })
		.lean();
	if (!submission) throw ApiError.NotFound('Submission not found');
	return submission;
};

export const getExamSubmissionsList = async examId => {
	const exam = await Exam.findById(examId).populate('questions', 'max_marks');
	const maxScore = (exam?.questions || []).reduce((sum, q) => sum + (q.max_marks || 0), 0);
	
	// Auto-finalize abandoned exams
	const inProgressSubmissions = await Submission.find({ exam: examId, status: 'in-progress' });
	for (const sub of inProgressSubmissions) {
		if (isExpired(sub, exam)) {
			await finalize(sub, exam);
		}
	}

	const submissions = await Submission.find({ exam: examId })
		.sort({ submittedAt: -1 })
		.populate('student', 'username fullname email')
		.select('student status evaluations startedAt submittedAt violations')
		.lean();
	return submissions.map(sub => ({
		...sub,
		totalMarks: (sub.evaluations || []).reduce(
			(sum, ev) => sum + (ev?.evaluation?.marks || 0),
			0,
		),
		maxScore,
	}));
};

export const getSubmissionForResults = async (submissionId, studentId) => {
	const submission = await Submission.findById(submissionId)
		.populate({ path: 'exam', select: 'title' })
		.populate({
			path: 'answers.question',
			model: 'Question',
			select: 'text type options max_marks',
		})
		.lean();
	if (!submission) throw ApiError.NotFound('Submission not found.');
	if (String(submission.student) !== String(studentId))
		throw ApiError.Forbidden('Not authorized');
	return submission;
};

export const getSubmissionForGrading = async (submissionId, teacherId) => {
	const submission = await Submission.findById(submissionId)
		.populate({ path: 'exam', select: 'title createdBy' })
		.populate('student', 'fullname email')
		.populate({
			path: 'answers.question',
			model: 'Question',
			select: 'text type options max_marks',
		})
		.lean();
	if (!submission) throw ApiError.NotFound('Submission not found.');
	if (String(submission.exam?.createdBy) !== String(teacherId))
		throw ApiError.Forbidden('Not authorized');
	return submission;
};

export const getMySubmissions = async studentId => {
	const submissions = await Submission.find({ student: studentId })
		.populate('exam', 'title')
		.populate({ path: 'questions', select: 'max_marks' })
		.lean();
	return submissions.map(sub => {
		const score = Array.isArray(sub.evaluations)
			? sub.evaluations.reduce((acc, ev) => acc + (ev?.evaluation?.marks || 0), 0)
			: null;
		const maxScore = Array.isArray(sub.questions)
			? sub.questions.reduce((acc, q) => acc + (q?.max_marks || 0), 0)
			: 0;
		return {
			id: String(sub._id),
			examTitle: sub.exam?.title || 'Exam',
			examId: String(sub.exam?._id || ''),
			score: sub.status === 'published' ? score : null,
			maxScore: sub.status === 'published' ? maxScore : null,
			status: sub.status || 'pending',
			submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : null,
		};
	});
};

export const getSubmissionByIdForTaking = async (submissionId, studentId) => {
	const submission = await Submission.findById(submissionId)
		.populate({ path: 'exam', select: 'title duration instructions aiPolicy' })
		.populate({ path: 'questions', select: 'text type options max_marks' })
		.lean();
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (String(submission.student) !== String(studentId))
		throw ApiError.Forbidden('Not authorized');
	return {
		_id: submission._id,
		status: submission.status,
		startedAt: submission.startedAt,
		submittedAt: submission.submittedAt,
		duration: submission.exam?.duration,
		examTitle: submission.exam?.title,
		examPolicy: submission.exam?.aiPolicy,
		instructions: submission.exam?.instructions,
		questions: (submission.questions || []).map(q => ({
			...q,
			options: (q.options || []).map(opt => ({ ...opt })),
		})),
		answers: submission.answers || [],
		markedForReview: submission.markedForReview || [],
	};
};

export const syncAnswers = async (submissionId, studentId, answers, markedForReview) => {
	const submission = await Submission.findOne({ _id: submissionId, student: studentId });
	if (!submission) throw ApiError.NotFound('Submission not found');

	const exam = await Exam.findById(submission.exam);
	if (!exam) throw ApiError.NotFound('Exam not found');

	if (isExpired(submission, exam) && submission.status === 'in-progress') {
		const finalized = await finalize(submission, exam);
		return { submission: finalized, message: 'Time over. Auto-submitted' };
	}
	if (submission.status !== 'in-progress') {
		return { submission, message: 'Submission no longer editable' };
	}

	if (Array.isArray(answers)) submission.answers = mergeAnswers(submission.answers, answers);
	if (Array.isArray(markedForReview)) {
		const allowed = new Set(submission.answers.map(a => String(a.question)));
		submission.markedForReview = Array.from(
			new Set(markedForReview.map(q => String(q)).filter(q => allowed.has(q))),
		);
	}
	await submission.save();

	const populatedSubmission = await Submission.findById(submission._id)
		.populate({ path: 'exam', select: 'title duration instructions aiPolicy' })
		.populate({ path: 'questions', select: 'text type options max_marks' })
		.lean();
	return { submission: populatedSubmission, message: 'State synced' };
};

export const overrideEvaluation = async (submissionId, teacherId, questionId, marks, remarks) => {
	const submission = await Submission.findById(submissionId).populate('exam');
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (String(submission.exam?.createdBy) !== String(teacherId))
		throw ApiError.Forbidden('Not authorized');

	const evalEntry = submission.evaluations.find(e => String(e.question) === String(questionId));
	if (!evalEntry) throw ApiError.NotFound('No evaluation found for this question.');

	evalEntry.evaluation = {
		evaluator: 'teacher',
		marks: Number(marks),
		remarks: String(remarks || evalEntry.evaluation?.remarks || ''),
		evaluatedAt: new Date(),
		meta: { ...(evalEntry.evaluation?.meta || {}), path: 'teacher-override' },
	};
	await submission.save();
	return submission;
};

export const logViolation = async (submissionId, studentId, type) => {
	const submission = await Submission.findOneAndUpdate(
		{ _id: submissionId, student: studentId, status: 'in-progress' },
		{ $push: { violations: { type } } },
		{ new: true },
	);
	return submission ? submission.violations.length : 0;
};

export const testEvaluationService = async (question, answer, referenceAnswer, policy) => {
	return await evaluateAnswer(question, answer, referenceAnswer, 1, policy);
};

export const publishSingle = async (submissionId, teacherId) => {
	const submission = await Submission.findById(submissionId).populate('exam');
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (String(submission.exam?.createdBy) !== String(teacherId))
		throw ApiError.Forbidden('Not authorized');
	if (submission.status === 'in-progress' || submission.status === 'submitted')
		throw ApiError.BadRequest('Cannot publish unevaluated submission.');
	if (submission.status === 'published') return submission;

	submission.status = 'published';
	submission.publishedAt = new Date();
	await submission.save();
	return submission;
};

export const publishAll = async (examId, teacherId) => {
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (String(exam.createdBy) !== String(teacherId)) throw ApiError.Forbidden('Not authorized');

	const result = await Submission.updateMany(
		{ exam: examId, status: 'evaluated' },
		{ $set: { status: 'published', publishedAt: new Date() } },
	);
	return result.modifiedCount;
};

export const getExportData = async (examId, teacherId) => {
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.createdBy.toString() !== teacherId.toString())
		throw ApiError.Forbidden('Access denied');

	const submissions = await Submission.find({ exam: examId })
		.populate('student', 'fullname email username')
		.lean();
	return { exam, submissions };
};
