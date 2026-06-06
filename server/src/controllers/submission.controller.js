import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateCSV, sendCSVDowload } from '../services/export.service.js';
import * as SubmissionService from '../services/submission.service.js';

const startSubmission = asyncHandler(async (req, res) => {
	const result = await SubmissionService.start(req.body.examId, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, result.submission, result.statusMessage, result.isNew ? 201 : 200);
});

const submitSubmission = asyncHandler(async (req, res) => {
	const submission = await SubmissionService.submit(req.body.examId, req.userDoc?._id || req.user?.id, req.body.submissionType || 'manual');
	return ApiResponse.success(res, submission, 'Submission accepted. Evaluation in progress.');
});

const updateEvaluation = asyncHandler(async (req, res) => {
	const submission = await SubmissionService.updateEvaluation(req.params.id, req.userDoc?._id || req.user?.id, req.body.evaluations);
	return ApiResponse.success(res, submission, 'Evaluation updated successfully');
});

const evaluateSubmission = asyncHandler(async (req, res) => {
	const submission = await SubmissionService.triggerAutoEvaluation(req.params.id);
	return ApiResponse.success(res, submission, 'Submission evaluated');
});

const getSubmission = asyncHandler(async (req, res) => {
	if (!req.query.examId || !req.query.studentId) throw ApiError.BadRequest('Exam ID and student ID are required');
	const submission = await SubmissionService.getStudentSubmission(req.query.examId, req.query.studentId);
	return ApiResponse.success(res, submission, 'Submission fetched');
});

const getExamSubmissions = asyncHandler(async (req, res) => {
	if (!req.params.id) throw ApiError.BadRequest('Exam ID required');
	const results = await SubmissionService.getExamSubmissionsList(req.params.id);
	return ApiResponse.success(res, results, 'Exam submissions fetched');
});

const getSubmissionForResults = asyncHandler(async (req, res) => {
	const submission = await SubmissionService.getSubmissionForResults(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, submission, 'Submission fetched for results.');
});

const getSubmissionForGrading = asyncHandler(async (req, res) => {
	const submission = await SubmissionService.getSubmissionForGrading(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, submission, 'Submission fetched for grading.');
});

const getMySubmissions = asyncHandler(async (req, res) => {
	const normalized = await SubmissionService.getMySubmissions(req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, normalized, 'Your submissions');
});

const getSubmissionByIdParam = asyncHandler(async (req, res) => {
	if (!req.params.id.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid submission ID');
	const normalized = await SubmissionService.getSubmissionByIdForTaking(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, normalized, 'Submission details fetched');
});

const startSubmissionByParam = asyncHandler(async (req, res) => {
	req.body.examId = req.params.id;
	return startSubmission(req, res);
});

const syncAnswersBySubmissionId = asyncHandler(async (req, res) => {
	if (!Array.isArray(req.body.answers) && !Array.isArray(req.body.markedForReview)) {
		throw ApiError.BadRequest('No data provided to sync.');
	}
	const result = await SubmissionService.syncAnswers(req.params.id, req.userDoc?._id || req.user?.id, req.body.answers, req.body.markedForReview);
	return ApiResponse.success(res, result.submission, result.message);
});

const submitSubmissionById = asyncHandler(async (req, res) => {
	if (!req.params.id) throw ApiError.BadRequest('Submission ID is required');
	const submissionDb = await import('../models/submission.model.js').then(m => m.default.findOne({ _id: req.params.id, student: req.userDoc?._id || req.user?.id }));
	if (!submissionDb) throw ApiError.NotFound('Submission not found');
	const submission = await SubmissionService.submit(submissionDb.exam, req.userDoc?._id || req.user?.id, req.body.submissionType || 'manual');
	return ApiResponse.success(res, submission, 'Submission accepted. Evaluation in progress.');
});

const getSubmissionStatus = asyncHandler(async (req, res) => {
	const submissionDb = await import('../models/submission.model.js').then(m => m.default.findById(req.params.id).select('status evaluatedAt totalMarks').lean());
	if (!submissionDb) throw ApiError.NotFound('Submission not found');
	return ApiResponse.success(res, submissionDb, 'Submission status fetched');
});

const overrideEvaluation = asyncHandler(async (req, res) => {
	if (!req.body.questionId || req.body.marks === undefined) throw ApiError.BadRequest('questionId and marks are required');
	const submission = await SubmissionService.overrideEvaluation(req.params.id, req.userDoc?._id || req.user?.id, req.body.questionId, req.body.marks, req.body.remarks);
	return ApiResponse.success(res, submission, 'Evaluation overridden successfully.');
});

const logViolation = asyncHandler(async (req, res) => {
	const count = await SubmissionService.logViolation(req.params.id, req.userDoc?._id || req.user?.id, req.body.type);
	return ApiResponse.success(res, { violationCount: count }, count > 0 ? 'Violation logged.' : 'Could not log violation.');
});

const testEvaluationService = asyncHandler(async (req, res) => {
	if (!req.body.question || !req.body.answer) throw ApiError.BadRequest('Request body must contain "question" and "answer".');
	const result = await SubmissionService.testEvaluationService(req.body.question, req.body.answer, req.body.referenceAnswer || null, req.body.policy || null);
	return ApiResponse.success(res, result, 'AI Evaluation Service responded successfully.');
});

const publishSingleSubmissionResult = asyncHandler(async (req, res) => {
	const submission = await SubmissionService.publishSingle(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, submission, 'Submission results published successfully.');
});

const publishAllExamResults = asyncHandler(async (req, res) => {
	const count = await SubmissionService.publishAll(req.params.examId, req.userDoc?._id || req.user?.id);
	if (count === 0) return ApiResponse.success(res, { modifiedCount: 0 }, 'No submissions were ready for publishing.');
	return ApiResponse.success(res, { modifiedCount: count }, `${count} submission results published successfully.`);
});

const exportExamSubmissionsList = asyncHandler(async (req, res) => {
	if (!req.params.id) throw ApiError.BadRequest('Exam ID is required');
	const { exam, submissions } = await SubmissionService.getExportData(req.params.id, req.userDoc?._id || req.user?.id);

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
			'Evaluated At': sub.evaluationDate ? new Date(sub.evaluationDate).toLocaleString() : 'N/A',
			Violations: sub.violations?.length || 0,
			'Needs Review': sub.markedForReview?.length > 0 ? 'Yes' : 'No',
		};
	});

	const csv = generateCSV(data);
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
