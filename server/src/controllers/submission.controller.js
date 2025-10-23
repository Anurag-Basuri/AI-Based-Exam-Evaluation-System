import Submission from '../models/submission.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { evaluateAnswer } from '../services/evaluation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Helper: Evaluate all answers in a submission
async function evaluateSubmissionAnswers(submission) {
	console.log(`[SUBMISSION_CTRL] Starting evaluation for submission ID: ${submission._id}`);
	const examDoc = await Exam.findById(submission.exam).select('title aiPolicy');
	if (examDoc?.aiPolicy) {
		console.log('[SUBMISSION_CTRL] Exam AI policy detected.');
	}

	const evaluations = await Promise.all(
		submission.answers.map(async ans => {
			const questionDoc = await Question.findById(ans.question).lean();
			if (!questionDoc) {
				console.warn(`[SUBMISSION_CTRL] Question ${ans.question} not found. Skipping.`);
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
				const mergedPolicy = {
					...(examDoc?.aiPolicy || {}),
					...(questionDoc?.aiPolicy || {}),
				};
				if (Object.keys(mergedPolicy).length) {
					console.log(
						'[SUBMISSION_CTRL] Using merged AI policy for question:',
						questionDoc._id,
					);
				}

				try {
					const evalResult = await evaluateAnswer(
						questionDoc.text,
						ans.responseText,
						refAnswer,
						weight,
						mergedPolicy,
					);
					marks = evalResult.score;
					remarks = evalResult.review;
					meta = evalResult.meta;
					console.log(
						`[SUBMISSION_CTRL] Evaluation OK for question ${questionDoc._id}. Marks: ${marks}`,
					);
				} catch (e) {
					console.error(
						`[SUBMISSION_CTRL] Evaluation error for question ${questionDoc._id}.`,
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
		`[SUBMISSION_CTRL] Finished evaluation for submission ${submission._id}. Count: ${filtered.length}`,
	);
	return filtered;
}

function isExpired(submission, exam) {
	if (!submission?.startedAt || !submission?.duration) return false;
	const started = new Date(submission.startedAt).getTime();
	const byDuration = started + Number(submission.duration) * 60 * 1000;
	const examEnd = exam?.endTime ? new Date(exam.endTime).getTime() : Number.POSITIVE_INFINITY;
	const deadline = Math.min(byDuration, examEnd);
	return Date.now() >= deadline;
}

async function finalizeAsSubmitted(submission, exam) {
	// Avoid double-finalization
	if (submission.status !== 'in-progress') return submission;
	submission.status = 'submitted';
	submission.submittedAt = new Date();
	submission.submissionType = 'auto';

	// Automated Evaluation -> evaluated
	submission.evaluations = await evaluateSubmissionAnswers(submission);
	submission.evaluatedAt = new Date();
	submission.status = 'evaluated';
	await submission.save();
	return submission;
}

// Start a new submission for an exam
const startSubmission = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const { examId } = req.body;

	if (!examId) throw ApiError.BadRequest('Exam ID is required');

	const exam = await Exam.findById(examId)
		.select('status startTime endTime duration questions')
		.populate('questions');
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.status !== 'active') throw ApiError.Forbidden('Exam is not active');

	const now = new Date();
	if (exam.startTime && now < new Date(exam.startTime))
		throw ApiError.Forbidden('Exam has not started yet');
	if (exam.endTime && now > new Date(exam.endTime)) throw ApiError.Forbidden('Exam has ended');

	const existing = await Submission.findOne({ exam: examId, student: studentId })
		.populate({
			path: 'exam',
			select: 'title duration startTime endTime questions aiPolicy',
			populate: {
				path: 'questions',
				model: 'Question',
				select: 'text type options max_marks aiPolicy',
			},
		})
		.populate({ path: 'answers.question', model: 'Question' });

	if (existing) {
		// If expired while away, auto-submit and return final
		if (isExpired(existing, exam) && existing.status === 'in-progress') {
			const finalized = await finalizeAsSubmitted(existing, exam);
			return ApiResponse.success(res, finalized, 'Time over. Submission finalized');
		}
		return ApiResponse.success(res, existing, 'Submission already started');
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
	});

	await submission.save();

	// Populate before returning
	await submission.populate({
		path: 'exam',
		select: 'title duration startTime endTime questions aiPolicy',
		populate: {
			path: 'questions',
			model: 'Question',
			select: 'text type options max_marks aiPolicy',
		},
	});
	await submission.populate({ path: 'answers.question', model: 'Question' });

	return ApiResponse.success(res, submission, 'Submission started', 201);
});

// Helper to safely merge incoming answers into existing slots
function mergeAnswers(existingAnswers, incomingAnswers) {
	const byQ = new Map(existingAnswers.map(a => [String(a.question), { ...a }]));
	for (const inc of incomingAnswers) {
		const qid = String(inc?.question || '');
		if (!qid || !byQ.has(qid)) continue; // ignore unknown questions
		const prev = byQ.get(qid);
		byQ.set(qid, {
			question: prev.question,
			responseText: inc.responseText ?? prev.responseText ?? '',
			responseOption: inc.responseOption ?? prev.responseOption ?? null,
		});
	}
	return Array.from(byQ.values());
}

// Sync answers for a submission (while in-progress)
const syncAnswers = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const { examId, answers } = req.body;

	if (!examId || !Array.isArray(answers)) {
		throw ApiError.BadRequest('Exam ID and answers are required');
	}

	const [submission, exam] = await Promise.all([
		Submission.findOne({ exam: examId, student: studentId }),
		Exam.findById(examId),
	]);

	if (!submission) throw ApiError.NotFound('Submission not found');
	if (!exam) throw ApiError.NotFound('Exam not found');

	// Auto-submit if time is up
	if (isExpired(submission, exam) && submission.status === 'in-progress') {
		const finalized = await finalizeAsSubmitted(submission, exam);
		return ApiResponse.success(res, finalized, 'Time over. Auto-submitted');
	}

	if (submission.status !== 'in-progress') {
		return ApiResponse.success(res, submission, 'Submission no longer editable');
	}

	// Safe merge (only update answers for known questions)
	submission.answers = mergeAnswers(submission.answers, answers);
	await submission.save();
	return ApiResponse.success(res, submission, 'Answers synced');
});

// Submit a submission (mark as submitted and evaluate)
const submitSubmission = asyncHandler(async (req, res) => {
	console.log('[SUBMISSION_CTRL] Received request to submit and evaluate submission.');
	const studentId = req.student?._id || req.user?.id;
	const { examId, submissionType = 'manual' } = req.body;

	const submission = await Submission.findOne({ exam: examId, student: studentId });
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (submission.status !== 'in-progress') throw ApiError.Forbidden('Already submitted');

	submission.status = 'submitted';
	submission.submittedAt = new Date();
	submission.submissionType = submissionType; // <-- Correctly assign type

	// Automated Evaluation
	console.log(
		`[SUBMISSION_CTRL] Calling evaluateSubmissionAnswers for submission on exam ${examId}`,
	);
	submission.evaluations = await evaluateSubmissionAnswers(submission);
	submission.evaluatedAt = new Date();
	submission.status = 'evaluated';
	await submission.save();

	console.log(`[SUBMISSION_CTRL] Submission ${submission._id} successfully evaluated and saved.`);
	return ApiResponse.success(res, submission, 'Submission submitted and evaluated');
});

// Teacher can update evaluation and review for a submission answer
const updateEvaluation = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const { evaluations } = req.body; // [{ question, marks, remarks }]

	if (!Array.isArray(evaluations) || evaluations.length === 0) {
		throw ApiError.BadRequest('Evaluations array required');
	}

	const submission = await Submission.findById(submissionId);
	if (!submission) throw ApiError.NotFound('Submission not found');

	// Only allow teacher to update
	const teacherId = req.teacher?._id || req.user?.id;
	if (!teacherId) throw ApiError.Forbidden('Only teachers can update evaluations');

	// Update evaluations for provided questions
	for (const update of evaluations) {
		const idx = submission.evaluations.findIndex(
			ev => ev.question.toString() === update.question,
		);
		if (idx !== -1) {
			submission.evaluations[idx].evaluation.marks = update.marks;
			submission.evaluations[idx].evaluation.remarks = update.remarks;
			submission.evaluations[idx].evaluation.evaluator = 'teacher';
			submission.evaluations[idx].evaluation.evaluatedAt = new Date();
		}
	}
	submission.evaluatedBy = teacherId;
	submission.evaluatedAt = new Date();
	await submission.save();

	return ApiResponse.success(res, submission, 'Evaluation updated by teacher');
});

// Evaluate a submission (manual trigger, if needed)
const evaluateSubmission = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;

	const submission = await Submission.findById(submissionId).populate('exam').populate({
		path: 'answers.question',
		model: 'Question',
	});

	if (!submission) throw ApiError.NotFound('Submission not found');
	if (submission.evaluations && submission.evaluations.length > 0) {
		throw ApiError.Conflict('Submission already evaluated');
	}

	// Automated Evaluation
	submission.evaluations = await evaluateSubmissionAnswers(submission);
	submission.evaluatedAt = new Date();
	await submission.save();

	return ApiResponse.success(res, submission, 'Submission evaluated');
});

// Get a student's submission for an exam
const getSubmission = asyncHandler(async (req, res) => {
	const { examId, studentId } = req.query;
	if (!examId || !studentId) {
		throw ApiError.BadRequest('Exam ID and student ID are required');
	}
	const submission = await Submission.findOne({ exam: examId, student: studentId })
		.populate('exam')
		.populate({
			path: 'answers.question',
			model: 'Question',
		})
		.lean();

	if (!submission) throw ApiError.NotFound('Submission not found');
	return ApiResponse.success(res, submission, 'Submission fetched');
});

// Get all submissions for an exam (for teacher)
const getExamSubmissions = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	if (!examId) throw ApiError.BadRequest('Exam ID required');
	const submissions = await Submission.find({ exam: examId })
		.populate('student', 'username fullname email')
		.populate({
			path: 'answers.question',
			model: 'Question',
		})
		.lean();

	return ApiResponse.success(res, submissions, 'Exam submissions fetched');
});

// --- Get a single submission with full details for a teacher to grade ---
const getSubmissionForGrading = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	const submission = await Submission.findById(submissionId)
		.populate({
			path: 'exam',
			select: 'title createdBy',
		})
		.populate('student', 'fullname email')
		.populate({
			path: 'answers.question',
			model: 'Question',
			select: 'text type options max_marks',
		})
		.lean();

	if (!submission) {
		throw ApiError.NotFound('Submission not found.');
	}

	// Security: Ensure the teacher requesting the submission is the one who created the exam
	if (String(submission.exam?.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to view this submission.');
	}

	return ApiResponse.success(res, submission, 'Submission fetched for grading.');
});

// Get all submissions for the logged-in student (normalized for UI)
const getMySubmissions = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;

	const submissions = await Submission.find({ student: studentId })
		.populate('exam', 'title duration startTime endTime')
		.populate({ path: 'answers.question', select: 'max_marks' })
		.lean();

	const normalized = submissions.map(sub => {
		const score = Array.isArray(sub.evaluations)
			? sub.evaluations.reduce((acc, ev) => acc + (ev?.evaluation?.marks || 0), 0)
			: 0;
		const maxScore = Array.isArray(sub.answers)
			? sub.answers.reduce((acc, ans) => acc + (ans?.question?.max_marks || 0), 0)
			: 0;

		// Preserve real status so UI can show Continue button for in-progress
		const status = sub.status || 'pending';

		// --- NEW: Gate results visibility based on status ---
		const resultsPublished = status === 'published';
		let displayScore = null;
		let displayRemarks = 'Awaiting evaluation.';

		if (status === 'in-progress') {
			displayRemarks = 'Exam in progress.';
		} else if (status === 'submitted') {
			displayRemarks = 'Submitted. Awaiting evaluation.';
		} else if (status === 'evaluated') {
			displayRemarks = 'Evaluated. Results will be available soon.';
		} else if (resultsPublished) {
			displayScore = score;
			displayRemarks =
				Array.isArray(sub.evaluations) && sub.evaluations[0]?.evaluation?.remarks
					? sub.evaluations[0].evaluation.remarks
					: 'Results published.';
		}

		return {
			id: String(sub._id),
			examTitle: sub.exam?.title || 'Exam',
			examId: String(sub.exam?._id || ''),
			duration: sub.exam?.duration ?? null,
			score: displayScore, // Use gated score
			maxScore,
			status,
			startedAt: sub.startedAt ? new Date(sub.startedAt).toLocaleString() : null,
			submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : null,
			evaluatedAt: sub.evaluatedAt ? new Date(sub.evaluatedAt).toLocaleString() : null,
			remarks: displayRemarks, // Use gated remarks
		};
	});

	return ApiResponse.success(res, normalized, 'My submissions fetched');
});

// Start via URL param
const startSubmissionByParam = asyncHandler(async (req, res) => {
	req.body.examId = req.params.id;
	return startSubmission(req, res);
});

// Get submission by ID (student's own)
const getSubmissionByIdParam = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const id = req.params.id;
	if (!id) throw ApiError.BadRequest('Submission ID is required');

	const submission = await Submission.findOne({ _id: id, student: studentId })
		.populate({
			path: 'exam',
			select: 'title duration startTime endTime questions aiPolicy',
			populate: {
				path: 'questions',
				model: 'Question',
				select: 'text type options max_marks aiPolicy',
			},
		})
		.populate({ path: 'answers.question', model: 'Question' });

	if (!submission) throw ApiError.NotFound('Submission not found');

	// --- NEW: Gate results visibility ---
	// If results are not published, do not send evaluation details to the student.
	if (submission.status !== 'published') {
		submission.evaluations = []; // Clear evaluations
	}

	// Backfill duration if missing
	if (!submission.duration && submission.exam?.duration) {
		submission.duration = submission.exam.duration;
	}
	return ApiResponse.success(res, submission, 'Submission fetched');
});

// Sync answers by submission ID
const syncAnswersBySubmissionId = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const id = req.params.id;
	const { answers, markedForReview } = req.body; // <-- Get markedForReview from body

	// Validate that at least one field is present to update
	if (!Array.isArray(answers) && !Array.isArray(markedForReview)) {
		throw ApiError.BadRequest('No data provided to sync.');
	}

	const submission = await Submission.findOne({ _id: id, student: studentId });
	if (!submission) throw ApiError.NotFound('Submission not found');

	const exam = await Exam.findById(submission.exam);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (isExpired(submission, exam) && submission.status === 'in-progress') {
		const finalized = await finalizeAsSubmitted(submission, exam);
		return ApiResponse.success(res, finalized, 'Time over. Auto-submitted');
	}
	if (submission.status !== 'in-progress') {
		return ApiResponse.success(res, submission, 'Submission no longer editable');
	}

	if (Array.isArray(answers)) {
		submission.answers = mergeAnswers(submission.answers, answers);
	}
	if (Array.isArray(markedForReview)) {
		const allowed = new Set(submission.answers.map(a => String(a.question)));
		const unique = Array.from(
			new Set(markedForReview.map(q => String(q)).filter(q => allowed.has(q))),
		);
		submission.markedForReview = unique;
	}

	await submission.save();
	return ApiResponse.success(res, submission, 'State synced');
});

// Submit by submission ID
const submitSubmissionById = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const id = req.params.id;
	const { submissionType = 'manual' } = req.body;

	if (!id) throw ApiError.BadRequest('Submission ID is required');
	const submission = await Submission.findOne({ _id: id, student: studentId });
	if (!submission) throw ApiError.NotFound('Submission not found');
	if (submission.status !== 'in-progress') throw ApiError.Forbidden('Already submitted');
	submission.status = 'submitted';
	submission.submittedAt = new Date();
	submission.submissionType = submissionType; // <-- Correctly assign type

	submission.evaluations = await evaluateSubmissionAnswers(submission);
	submission.evaluatedAt = new Date();
	submission.status = 'evaluated';
	await submission.save();
	return ApiResponse.success(res, submission, 'Submission submitted and evaluated');
});

// Log a student violation during an exam
const logViolation = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const submissionId = req.params.id;
	const { type } = req.body;

	const submission = await Submission.findOneAndUpdate(
		{ _id: submissionId, student: studentId, status: 'in-progress' },
		{ $push: { violations: { type } } },
		{ new: true },
	);

	if (!submission) {
		// Don't throw an error, just fail silently. It's not a critical path.
		return ApiResponse.success(res, null, 'Could not log violation.');
	}

	return ApiResponse.success(
		res,
		{ violationCount: submission.violations.length },
		'Violation logged.',
	);
});

// A dedicated controller to test the evaluation service in isolation.
const testEvaluationService = asyncHandler(async (req, res) => {
	console.log('[TEST_EVAL] Received request to test evaluation service.');
	const { question, answer, referenceAnswer = null, policy = null } = req.body;
	if (!question || !answer) {
		throw new ApiError(400, 'Request body must contain "question" and "answer".');
	}
	console.log('[TEST_EVAL] Policy:', policy);
	const result = await evaluateAnswer(question, answer, referenceAnswer, 1, policy);
	return ApiResponse.success(res, result, 'AI Evaluation Service responded successfully.');
});

// Publish results for a single submission
const publishSingleSubmissionResult = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	const submission = await Submission.findById(submissionId).populate('exam');
	if (!submission) throw ApiError.NotFound('Submission not found');

	// Verify teacher owns the exam
	if (String(submission.exam?.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to publish results for this exam.');
	}

	if (submission.status === 'in-progress' || submission.status === 'submitted') {
		throw ApiError.BadRequest('Cannot publish results for an unevaluated submission.');
	}
	if (submission.status === 'published') {
		return ApiResponse.success(res, submission, 'Results already published.');
	}

	submission.status = 'published';
	submission.publishedAt = new Date();
	await submission.save();

	return ApiResponse.success(res, submission, 'Submission results published successfully.');
});

// Publish results for all evaluated submissions of an exam
const publishAllExamResults = asyncHandler(async (req, res) => {
	const examId = req.params.examId;
	const teacherId = req.teacher?._id || req.user?.id;

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');

	// Verify teacher owns the exam
	if (String(exam.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to publish results for this exam.');
	}

	const result = await Submission.updateMany(
		{ exam: examId, status: 'evaluated' },
		{ $set: { status: 'published', publishedAt: new Date() } },
	);

	if (result.modifiedCount === 0) {
		return ApiResponse.success(
			res,
			{ modifiedCount: 0 },
			'No submissions were ready for publishing.',
		);
	}

	return ApiResponse.success(
		res,
		{ modifiedCount: result.modifiedCount },
		`${result.modifiedCount} submission results published successfully.`,
	);
});

export {
	startSubmission,
	syncAnswers,
	submitSubmission,
	updateEvaluation,
	evaluateSubmission,
	getSubmission,
	getExamSubmissions,
	getMySubmissions,
	startSubmissionByParam,
	getSubmissionByIdParam,
	syncAnswersBySubmissionId,
	submitSubmissionById,
	logViolation,
	testEvaluationService,
	publishSingleSubmissionResult,
	publishAllExamResults,
	getSubmissionForGrading,
};
