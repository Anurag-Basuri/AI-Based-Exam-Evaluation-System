import Issue from '../models/issue.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import mongoose from 'mongoose';

// Student raises an issue against a specific submission
const createIssue = asyncHandler(async (req, res) => {
	const { submissionId, issueType, description } = req.body;
	const studentId = req.student?._id || req.user?.id;

	if (!submissionId || !issueType || !description) {
		throw ApiError.BadRequest('submissionId, issueType and description are required.');
	}

	// Populate the exam's creator to enable auto-assignment
	const submission = await Submission.findById(submissionId)
		.populate({ path: 'exam', select: 'createdBy' })
		.lean();

	if (!submission) throw ApiError.NotFound('The specified submission does not exist.');
	if (String(submission.student) !== String(studentId)) {
		throw ApiError.Forbidden('You can only raise issues for your own submissions.');
	}

	const issueData = {
		student: studentId,
		submission: submissionId,
		exam: submission.exam._id,
		issueType,
		description: String(description).trim(),
		status: 'open', // Default status
		activityLog: [], // Initialize activity log
	};

	// Auto-assign 'evaluation' or 'question' issues to the exam creator
	if (['evaluation', 'question'].includes(issueType) && submission.exam?.createdBy) {
		issueData.assignedTo = submission.exam.createdBy;
		issueData.status = 'in-progress'; // Set status to in-progress as it's assigned
		issueData.activityLog.push({
			action: 'assigned',
			details: `Automatically assigned to the exam creator.`,
		});
	}

	const issue = await Issue.create(issueData);

	const populatedIssue = await Issue.findById(issue._id)
		.populate('student', 'fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.lean();

	// Emit to teachers room
	const io = req.io || req.app?.get('io');
	if (io) {
		io.to('teachers').emit('new-issue', populatedIssue);
		// Also notify the specific teacher if they were auto-assigned and are online
		if (issueData.assignedTo) {
			io.to(String(issueData.assignedTo)).emit('new-issue', populatedIssue);
		}
	}

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

// Get all issues for a teacher (assigned or all) with optional filters
const getAllIssues = asyncHandler(async (req, res) => {
	const { status, exam, search } = req.query;
	const filter = {};
	if (status) filter.status = String(status).toLowerCase();
	if (exam) filter.exam = exam;

	if (search) {
		const searchRegex = { $regex: search, $options: 'i' };
		const [studentIds, examIds] = await Promise.all([
			mongoose.model('Student').find({ fullname: searchRegex }).select('_id').lean(),
			mongoose.model('Exam').find({ title: searchRegex }).select('_id').lean(),
		]);
		filter.$or = [
			{ description: searchRegex },
			{ student: { $in: studentIds.map(s => s._id) } },
			{ exam: { $in: examIds.map(e => e._id) } },
		];
	}

	const issues = await Issue.find(filter)
		.populate('student', 'username fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.sort({ createdAt: -1 })
		.lean();

	return ApiResponse.success(res, issues, 'All issues fetched');
});

// Teacher updates an issue's status (no resolve here; use resolve endpoint)
const updateIssueStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;
	const teacherId = req.teacher?._id;

	if (!['open', 'in-progress'].includes(String(status))) {
		throw ApiError.BadRequest('Only open or in-progress are allowed here.');
	}

	const issue = await Issue.findById(id);
	if (!issue) throw ApiError.NotFound('Issue not found');
	if (issue.status === 'resolved') {
		throw ApiError.Conflict('Cannot change status of a resolved issue.');
	}

	issue.status = String(status).toLowerCase();

	// Assign/unassign based on status
	if (issue.status === 'in-progress') {
		issue.assignedTo = teacherId;
		issue.activityLog.push({
			action: 'assigned',
			user: teacherId,
			userModel: 'Teacher',
			details: 'Issue assigned and moved to In Progress.',
		});
	} else if (issue.status === 'open') {
		issue.assignedTo = null;
		issue.activityLog.push({
			action: 'status-changed',
			user: teacherId,
			userModel: 'Teacher',
			details: 'Issue moved back to Open.',
		});
	}

	await issue.save();

	const populatedIssue = await Issue.findById(issue._id)
		.populate('student', 'fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.lean();

	const io = req.io || req.app?.get('io');
	if (io) {
		io.to(String(issue.student)).emit('issue-update', populatedIssue);
		io.to('teachers').emit('issue-update', populatedIssue);
	}

	return ApiResponse.success(res, populatedIssue, 'Issue status updated');
});

// Teacher resolves an issue (with reply)
const resolveIssue = asyncHandler(async (req, res) => {
	const issueId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;
	const { reply } = req.body;

	if (!reply?.trim()) throw ApiError.BadRequest('Reply is required');

	const issue = await Issue.findById(issueId);
	if (!issue) throw ApiError.NotFound('Issue not found');
	if (issue.status === 'resolved') {
		return ApiResponse.success(res, issue, 'Issue already resolved');
	}

	issue.markResolved(teacherId, String(reply).trim());
	await issue.save();

	const populatedIssue = await Issue.findById(issue._id)
		.populate('student', 'fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.lean();

	const io = req.io || req.app?.get('io');
	if (io) {
		io.to(String(issue.student)).emit('issue-update', populatedIssue);
		io.to('teachers').emit('issue-update', populatedIssue);
	}

	return ApiResponse.success(res, populatedIssue, 'Issue resolved');
});

// Get a single issue (for details)
const getIssueById = asyncHandler(async (req, res) => {
	const issueId = req.params.id;
	const issue = await Issue.findById(issueId)
		.populate('student', 'username fullname email')
		.populate('exam', 'title')
		.populate('submission')
		.populate('assignedTo', 'fullname')
		.populate('activityLog.user', 'fullname')
		.lean();

	if (!issue) throw ApiError.NotFound('Issue not found');

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
