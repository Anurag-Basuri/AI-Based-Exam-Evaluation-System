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
	const evaluations = [];
	// Use Promise.all for concurrent evaluations
	await Promise.all(
		submission.answers.map(async ans => {
			const questionDoc = await Question.findById(ans.question);
			if (!questionDoc) {
				console.warn(
					`[SUBMISSION_CTRL] Question ${ans.question} not found for submission ${submission._id}. Skipping.`,
				);
				return;
			}

			console.log(`[SUBMISSION_CTRL] Evaluating answer for question ID: ${questionDoc._id}`);
			let marks = 0;
			let remarks = 'Answer not provided.';

			if (questionDoc.type === 'multiple-choice') {
				if (ans.responseOption && questionDoc.options) {
					const correctOption = questionDoc.options.find(opt => opt.isCorrect);
					marks =
						ans.responseOption.toString() === correctOption?._id.toString()
							? questionDoc.max_marks
							: 0;
					remarks = marks > 0 ? 'Correct answer.' : 'Incorrect answer.';
				}
			} else if (ans.responseText && ans.responseText.trim()) {
				// Only evaluate subjective if there is text
				try {
					const refAnswer = questionDoc.answer || null;
					const weight = questionDoc.max_marks / 100;
					const evalResult = await evaluateAnswer(
						questionDoc.text,
						ans.responseText,
						refAnswer,
						weight,
					);
					marks = evalResult.score;
					remarks = evalResult.review;
					console.log(
						`[SUBMISSION_CTRL] Subjective evaluation SUCCEEDED for question ${questionDoc._id}. Marks: ${marks}`,
					);
				} catch (e) {
					console.error(
						`[SUBMISSION_CTRL] Subjective evaluation FAILED for question ${questionDoc._id}. Error: ${e.message}. Awarding 0 marks.`,
					);
					marks = 0;
					remarks =
						'Evaluation failed due to a system error. A teacher will review this answer.';
				}
			}

			evaluations.push({
				question: questionDoc._id,
				evaluation: { evaluator: 'ai', marks, remarks, evaluatedAt: new Date() },
			});
		}),
	);
	console.log(
		`[SUBMISSION_CTRL] Finished evaluation for submission ID: ${submission._id}. Total evaluations: ${evaluations.length}`,
	);
	return evaluations;
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

	// Fetch exam and its question IDs
	const exam = await Exam.findById(examId).select('status startTime endTime duration questions');
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.status !== 'active') throw ApiError.Forbidden('Exam is not active');

	const now = new Date();
	if (exam.startTime && now < new Date(exam.startTime))
		throw ApiError.Forbidden('Exam has not started yet');
	if (exam.endTime && now > new Date(exam.endTime)) throw ApiError.Forbidden('Exam has ended');

	// Prevent duplicate
	const existing = await Submission.findOne({ exam: examId, student: studentId });
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
	return ApiResponse.success(res, submission, 'Submission started', 201);
});

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

	submission.answers = answers;
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

		return {
			id: String(sub._id),
			examTitle: sub.exam?.title || 'Exam',
			examId: String(sub.exam?._id || ''),
			duration: sub.exam?.duration ?? null,
			score,
			maxScore,
			status,
			startedAt: sub.startedAt ? new Date(sub.startedAt).toLocaleString() : null,
			submittedAt: sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : null,
			evaluatedAt: sub.evaluatedAt ? new Date(sub.evaluatedAt).toLocaleString() : null,
			remarks:
				Array.isArray(sub.evaluations) && sub.evaluations[0]?.evaluation?.remarks
					? sub.evaluations[0].evaluation.remarks
					: status === 'evaluated'
						? 'Evaluated'
						: 'Awaiting evaluation',
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
			select: 'title duration startTime endTime questions', // <-- Ensure questions are selected
			populate: {
				path: 'questions', // <-- Populate the questions array
				model: 'Question',
			},
		})
		.populate({ path: 'answers.question', model: 'Question' }); // Keep for safety

	if (!submission) throw ApiError.NotFound('Submission not found');
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

	// Update fields if they were provided in the request
	if (Array.isArray(answers)) {
		submission.answers = answers;
	}
	if (Array.isArray(markedForReview)) {
		submission.markedForReview = markedForReview;
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
};
