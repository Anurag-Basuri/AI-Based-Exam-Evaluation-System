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

	// Check if the exam associated with the submission actually exists.
	if (!submission.exam) {
		throw ApiError.NotFound(
			'The exam associated with this submission could not be found. It may have been deleted.',
		);
	}

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

	// If for any reason population fails, throw an error before responding.
	if (!populatedIssue || !populatedIssue.exam || !populatedIssue.student) {
		throw new ApiError(500, 'Failed to retrieve complete issue details after creation.');
	}

	// Emit to teachers room
	const io = req.io || req.app?.get('io');
	if (io) {
		// This single event is sufficient. All teachers, including the one
		io.to('teachers').emit('new-issue', populatedIssue);
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

	const issue = await Issue.findById(id);
	if (!issue) throw ApiError.NotFound('Issue not found');

	const oldStatus = issue.status; // Capture the status before the update

	if (issue.status === 'resolved') {
		throw ApiError.Conflict('Cannot change status of a resolved issue.');
	}
	if (issue.status === 'in-progress' && status === 'open') {
		throw new ApiError(409, 'Cannot unassign an issue that is already in progress.');
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
		// The frontend `issue-update` listener expects the normalized issue object directly.
		io.to('teachers').emit('issue-update', populatedIssue);
		if (populatedIssue.student) {
			io.to(String(populatedIssue.student._id)).emit('issue-update', populatedIssue);
		}
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

// Teacher adds an internal note to an issue
const addInternalNote = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { note } = req.body;
	const teacherId = req.teacher?._id;

	if (!note?.trim()) {
		throw new ApiError(400, 'Note cannot be empty.');
	}

	const issue = await Issue.findByIdAndUpdate(
		id,
		{ $push: { internalNotes: { user: teacherId, note: note.trim() } } },
		{ new: true },
	)
		.populate('internalNotes.user', 'fullname')
		.lean();

	if (!issue) {
		throw new ApiError(404, 'Issue not found.');
	}

	// Emit an update so all teachers see the new note in real-time
	const io = req.io || req.app?.get('io');
	if (io) {
		io.to('teachers').emit('issue-update', issue);
	}

	return ApiResponse.success(res, issue.internalNotes, 'Note added successfully.');
});

// Teacher resolves multiple issues at once
const bulkResolveIssues = asyncHandler(async (req, res) => {
	const { issueIds, reply } = req.body;
	const teacherId = req.teacher?._id;

	if (!Array.isArray(issueIds) || issueIds.length === 0) {
		throw new ApiError(400, 'An array of issueIds is required.');
	}
	if (!reply?.trim()) {
		throw new ApiError(400, 'A reply is required for bulk resolution.');
	}

	const updateResult = await Issue.updateMany(
		{ _id: { $in: issueIds }, status: { $ne: 'resolved' } },
		{
			$set: {
				status: 'resolved',
				resolvedBy: teacherId,
				resolvedAt: new Date(),
				reply: reply.trim(),
			},
			$push: {
				activityLog: {
					action: 'resolved',
					user: teacherId,
					userModel: 'Teacher',
					details: 'Issue marked as resolved via bulk action.',
				},
			},
		},
	);

	if (updateResult.matchedCount === 0) {
		throw new ApiError(404, 'No matching unresolved issues found.');
	}

	// Fetch and emit all updated issues
	const updatedIssues = await Issue.find({ _id: { $in: issueIds } })
		.populate('student', 'fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.lean();

	const io = req.io || req.app?.get('io');
	if (io) {
		// Send a single event with all updated issues for efficiency
		io.to('teachers').emit('issues-updated', updatedIssues);
		updatedIssues.forEach(issue => {
			io.to(String(issue.student)).emit('issue-update', issue);
		});
	}

	return ApiResponse.success(
		res,
		{ updatedCount: updateResult.modifiedCount },
		`${updateResult.modifiedCount} issues resolved.`,
	);
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
		.populate('internalNotes.user', 'fullname')
		.lean();

	if (!issue) throw ApiError.NotFound('Issue not found');

	return ApiResponse.success(res, issue, 'Issue details fetched');
});

// Student deletes their own issue
const deleteIssue = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const studentId = req.student?._id;

	const issue = await Issue.findById(id);

	if (!issue) {
		throw new ApiError(404, 'Issue not found.');
	}

	// Security check: Ensure the student owns this issue
	if (String(issue.student) !== String(studentId)) {
		throw new ApiError(403, 'You are not authorized to delete this issue.');
	}

	// Business logic: Prevent deletion of resolved issues
	if (issue.status === 'resolved') {
		throw new ApiError(409, 'Cannot delete an issue that has already been resolved.');
	}

	await Issue.findByIdAndDelete(id);

	// Notify teachers in real-time to remove it from their UI
	const io = req.io || req.app?.get('io');
	if (io) {
		io.to('teachers').emit('issue-deleted', { id });
	}

	return ApiResponse.success(res, null, 'Issue withdrawn successfully.');
});

export {
	createIssue,
	getStudentIssues,
	getAllIssues,
	updateIssueStatus,
	resolveIssue,
	getIssueById,
	deleteIssue,
	addInternalNote,
	bulkResolveIssues,
};
