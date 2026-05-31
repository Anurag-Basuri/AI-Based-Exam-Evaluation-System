import Submission from '../models/submission.model.js';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { enqueueEvaluation, evaluateSubmissionAnswers } from '../services/jobQueue.service.js';
import * as SubmissionService from '../services/submission.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateCSV, sendCSVDowload } from '../services/export.service.js';

// Start a new submission for an exam
const startSubmission = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const { examId } = req.body;
	
	const result = await SubmissionService.start(examId, studentId);
	return ApiResponse.success(res, result.submission, result.statusMessage, result.isNew ? 201 : 200);
});

// Submit a submission (mark as submitted and evaluate)
const submitSubmission = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const { examId, submissionType = 'manual' } = req.body;

	const submission = await SubmissionService.submit(examId, studentId, submissionType);
	return ApiResponse.success(res, submission, 'Submission accepted. Evaluation in progress.');
});

// Teacher can update evaluation and review for a submission answer
const updateEvaluation = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;
	const { evaluations } = req.body; // This is an array of updates

	if (!Array.isArray(evaluations) || evaluations.length === 0) {
		throw ApiError.BadRequest('Evaluations must be a non-empty array.');
	}

	const submission = await Submission.findById(submissionId).populate('exam');
	if (!submission) throw ApiError.NotFound('Submission not found');

	// Security: Verify teacher owns the exam
	if (String(submission.exam?.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to update this submission.');
	}

	// Create a map of the updates for efficient lookup
	const updatesMap = new Map(evaluations.map(e => [String(e.question), e]));

	// Iterate through existing evaluations and apply updates
	submission.evaluations.forEach(existingEval => {
		const questionId = String(existingEval.question);
		if (updatesMap.has(questionId)) {
			const update = updatesMap.get(questionId);
			existingEval.evaluation = {
				evaluator: 'teacher', // Mark as manually edited
				marks: Number(update.marks),
				remarks: String(update.remarks),
				evaluatedAt: new Date(),
				meta: { ...(existingEval.evaluation.meta || {}), path: 'teacher-override' },
			};
		}
	});

	// Mark the submission as evaluated if it was just submitted
	if (submission.status === 'submitted') {
		submission.status = 'evaluated';
		submission.evaluatedAt = new Date();
	}

	await submission.save();

	return ApiResponse.success(res, submission, 'Evaluation updated successfully');
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

	// Fetch exam to calculate total max marks
	const exam = await Exam.findById(examId).populate('questions', 'max_marks');
	const maxScore = (exam?.questions || []).reduce((sum, q) => sum + (q.max_marks || 0), 0);

	const submissions = await Submission.find({ exam: examId })
		.sort({ submittedAt: -1 }) // Sort by latest submission first
		.populate('student', 'username fullname email')
		.select('student status evaluations startedAt submittedAt violations') // Select violations
		.lean();

	// Manually calculate totalMarks for the lean object
	const results = submissions.map(sub => {
		const totalMarks = (sub.evaluations || []).reduce(
			(sum, ev) => sum + (ev?.evaluation?.marks || 0),
			0,
		);
		return {
			...sub,
			totalMarks, // Add totalMarks field
			maxScore, // Add maxScore field
		};
	});

	return ApiResponse.success(res, results, 'Exam submissions fetched');
});

// --- NEW: Get a single submission with full details for a student to view results ---
const getSubmissionForResults = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const studentId = req.student?._id || req.user?.id;

	const submission = await Submission.findById(submissionId)
		.populate({
			path: 'exam',
			select: 'title', // We only need the title for the modal header
		})
		.populate({
			path: 'answers.question', // Populate the question within each answer
			model: 'Question',
			select: 'text type options max_marks',
		})
		.lean(); // Use .lean() for performance

	if (!submission) {
		throw ApiError.NotFound('Submission not found.');
	}

	// Security: Ensure the student requesting the submission is the one who owns it
	if (String(submission.student) !== String(studentId)) {
		throw ApiError.Forbidden('You are not authorized to view this submission.');
	}

	// The data is already in a good format for the frontend, so we can send it directly.
	return ApiResponse.success(res, submission, 'Submission fetched for results.');
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
		.populate('exam', 'title')
		.populate({ path: 'questions', select: 'max_marks' }) // Populate top-level questions for maxScore calculation
		.lean();

	const normalized = submissions.map(sub => {
		const score = Array.isArray(sub.evaluations)
			? sub.evaluations.reduce((acc, ev) => acc + (ev?.evaluation?.marks || 0), 0)
			: null;

		// FIX: Calculate maxScore from the populated top-level `questions` array
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

	return ApiResponse.success(res, normalized, 'Your submissions');
});

// Get a student's own submission by ID (for taking an exam)
const getSubmissionByIdParam = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const studentId = req.student?._id || req.user?.id;

	if (!submissionId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid submission ID');
	}

	const submission = await Submission.findById(submissionId)
		.populate({
			path: 'exam',
			select: 'title duration instructions aiPolicy',
		})
		.populate({
			path: 'questions',
			select: 'text type options max_marks',
		})
		.lean();

	if (!submission) {
		throw ApiError.NotFound('Submission not found');
	}

	// Security: Ensure the submission belongs to the logged-in student
	if (String(submission.student) !== String(studentId)) {
		throw ApiError.Forbidden('You are not authorized to view this submission');
	}

	// --- FIX: Normalize the data for the TakeExam page consistently ---
	const normalized = {
		_id: submission._id, // Use _id
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

	return ApiResponse.success(res, normalized, 'Submission details fetched');
});

// Start via URL param
const startSubmissionByParam = asyncHandler(async (req, res) => {
	req.body.examId = req.params.id;
	return startSubmission(req, res);
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
	if (SubmissionService.isExpired(submission, exam) && submission.status === 'in-progress') {
		const finalized = await SubmissionService.finalize(submission, exam);
		return ApiResponse.success(res, finalized, 'Time over. Auto-submitted');
	}
	if (submission.status !== 'in-progress') {
		return ApiResponse.success(res, submission, 'Submission no longer editable');
	}

	if (Array.isArray(answers)) {
		submission.answers = SubmissionService.mergeAnswers(submission.answers, answers);
	}
	if (Array.isArray(markedForReview)) {
		const allowed = new Set(submission.answers.map(a => String(a.question)));
		const unique = Array.from(
			new Set(markedForReview.map(q => String(q)).filter(q => allowed.has(q))),
		);
		submission.markedForReview = unique;
	}

	await submission.save();

	// --- CRITICAL FIX: Re-populate and return the full, consistent submission object ---
	const populatedSubmission = await Submission.findById(submission._id)
		.populate({
			path: 'exam',
			select: 'title duration instructions aiPolicy',
		})
		.populate({
			path: 'questions',
			select: 'text type options max_marks',
		})
		.lean();

	return ApiResponse.success(res, populatedSubmission, 'State synced');
});

// Submit by submission ID
const submitSubmissionById = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const id = req.params.id;
	const { submissionType = 'manual' } = req.body;

	if (!id) throw ApiError.BadRequest('Submission ID is required');
	const submissionDb = await Submission.findOne({ _id: id, student: studentId });
	if (!submissionDb) throw ApiError.NotFound('Submission not found');
	
	const submission = await SubmissionService.submit(submissionDb.exam, studentId, submissionType);
	return ApiResponse.success(res, submission, 'Submission accepted. Evaluation in progress.');
});

// ── Get Submission Status (polling endpoint) ─────────────────────
const getSubmissionStatus = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const submission = await Submission.findById(submissionId)
		.select('status evaluatedAt totalMarks')
		.lean();
	if (!submission) throw ApiError.NotFound('Submission not found');
	return ApiResponse.success(res, submission, 'Submission status fetched');
});

// ── Teacher Override: patch marks/remarks for individual questions ─
const overrideEvaluation = asyncHandler(async (req, res) => {
	const submissionId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;
	const { questionId, marks, remarks } = req.body;

	if (!questionId || marks === undefined) {
		throw ApiError.BadRequest('questionId and marks are required');
	}

	const submission = await Submission.findById(submissionId).populate('exam');
	if (!submission) throw ApiError.NotFound('Submission not found');

	// Security: Verify teacher owns the exam
	if (String(submission.exam?.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('Not authorized to override this evaluation.');
	}

	// Find the evaluation for this question
	const evalEntry = submission.evaluations.find(e => String(e.question) === String(questionId));
	if (!evalEntry) {
		throw ApiError.NotFound('No evaluation found for this question.');
	}

	evalEntry.evaluation = {
		evaluator: 'teacher',
		marks: Number(marks),
		remarks: String(remarks || evalEntry.evaluation?.remarks || ''),
		evaluatedAt: new Date(),
		meta: { ...(evalEntry.evaluation?.meta || {}), path: 'teacher-override' },
	};

	await submission.save();
	return ApiResponse.success(res, submission, 'Evaluation overridden successfully.');
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

// ══════════════════════════════════════════════════════════════════
// DATA EXPORT
// ══════════════════════════════════════════════════════════════════

const exportExamSubmissionsList = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	const { id: examId } = req.params;

	if (!examId) throw ApiError.BadRequest('Exam ID is required');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.createdBy.toString() !== teacherId.toString()) {
		throw ApiError.Forbidden('Access denied');
	}

	const submissions = await Submission.find({ exam: examId })
		.populate('student', 'fullname email username')
		.lean();

	const data = submissions.map(sub => {
		const student = sub.student || {};
		return {
			'Student Name': student.fullname || student.username || 'Unknown',
			'Student Email': student.email || 'N/A',
			Status: sub.status,
			Score: sub.totalMarks || 0,
			'Max Score': exam.max_marks || 0,
			'Started At': sub.startedAt ? new Date(sub.startedAt).toLocaleString() : 'N/A',
			'Submitted At': sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A',
			'Evaluated At': sub.evaluationDate
				? new Date(sub.evaluationDate).toLocaleString()
				: 'N/A',
			Violations: sub.violations?.length || 0,
			'Needs Review': sub.markedForReview?.length > 0 ? 'Yes' : 'No',
		};
	});

	const csv = generateCSV(data);
	// Format filename replacing non alpha-numeric characters
	const safeExamTitle = exam.title.replace(/[^a-z0-9]/gi, '_').substring(0, 30);
	return sendCSVDowload(res, `submissions_exam_${safeExamTitle}.csv`, csv);
});

export {
	startSubmission,
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
	getSubmissionForResults,
	exportExamSubmissionsList,
	getSubmissionStatus,
	overrideEvaluation,
};
