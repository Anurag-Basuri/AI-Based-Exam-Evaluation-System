import Issue from '../models/issue.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Student raises an issue against a specific submission
const createIssue = asyncHandler(async (req, res) => {
	const { submissionId, issueType, description } = req.body;
	const studentId = req.student?._id || req.user?.id;

	const submission = await Submission.findById(submissionId);
	if (!submission) {
		throw ApiError.NotFound('The specified submission does not exist.');
	}
	if (submission.student.toString() !== studentId.toString()) {
		throw ApiError.Forbidden('You can only raise issues for your own submissions.');
	}

	const issue = new Issue({
		student: studentId,
		submission: submissionId,
		exam: submission.exam, // Get exam from submission
		issueType,
		description,
		status: 'open',
	});

	await issue.save();
	const populatedIssue = await issue.populate([
		{ path: 'student', select: 'fullname email' },
		{ path: 'exam', select: 'title' },
	]);

	return ApiResponse.success(res, populatedIssue, 'Issue raised successfully', 201);
});

// Get all issues for a student
const getStudentIssues = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const issues = await Issue.find({ student: studentId })
		.populate('exam', 'title')
		.sort({ createdAt: -1 })
		.lean();
	return ApiResponse.success(res, issues, 'Student issues fetched');
});

// Get all issues for a teacher (assigned or all)
const getAllIssues = asyncHandler(async (req, res) => {
	const { status, exam } = req.query;
	const filter = {};
	if (status) filter.status = String(status).toLowerCase();
	if (exam) filter.exam = exam;

	const issues = await Issue.find(filter)
		.populate('student', 'username fullname email')
		.populate('exam', 'title')
		.sort({ createdAt: -1 })
		.lean();

	return ApiResponse.success(res, issues, 'All issues fetched');
});

// Teacher updates an issue's status
const updateIssueStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;

	const issue = await Issue.findById(id);
	if (!issue) {
		throw ApiError.NotFound('Issue not found');
	}
	if (issue.status === 'resolved') {
		throw ApiError.Conflict('Cannot change status of a resolved issue.');
	}
	issue.status = String(status).toLowerCase();
	await issue.save();

	return ApiResponse.success(res, issue, 'Issue status updated');
});

// Teacher resolves an issue
const resolveIssue = asyncHandler(async (req, res) => {
	const issueId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;
	const { reply } = req.body;

	const issue = await Issue.findById(issueId);
	if (!issue) {
		throw ApiError.NotFound('Issue not found');
	}
	if (issue.status === 'resolved') {
		throw ApiError.Conflict('Issue already resolved');
	}

	issue.markResolved(teacherId, reply);
	await issue.save();

	return ApiResponse.success(res, issue, 'Issue resolved');
});

// Get a single issue (for details)
const getIssueById = asyncHandler(async (req, res) => {
	const issueId = req.params.id;
	const issue = await Issue.findById(issueId)
		.populate('student', 'username fullname email')
		.populate('exam', 'title')
		.populate('submission')
		.lean();

	if (!issue) {
		throw ApiError.NotFound('Issue not found');
	}

	return ApiResponse.success(res, issue, 'Issue details fetched');
});

export {
	createIssue,
	getStudentIssues,
	getAllIssues,
	updateIssueStatus,
	resolveIssue,
	getIssueById,
};
