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

	// Auto-assign to the exam creator by default (Industry standard: ownership)
	if (submission.exam?.createdBy) {
		issueData.assignedTo = submission.exam.createdBy;
		// If it's a technical issue, maybe keep it open? For now, let's assign all to the teacher.
		// We can keep status as 'open' so the teacher sees it as new, but it is assigned to them.
		issueData.activityLog.push({
			action: 'assigned',
			details: `Automatically assigned to the exam creator.`,
		});
	} else {
		throw new ApiError(500, 'Exam has no creator. Cannot assign issue.');
	}

	const issue = await Issue.create(issueData);

	const populatedIssue = await Issue.findById(issue._id)
		.populate('student', 'fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.lean();

	if (!populatedIssue) {
		throw new ApiError(500, 'Failed to retrieve complete issue details after creation.');
	}

	// Real-time: Emit ONLY to the assigned teacher
	const io = req.io || req.app?.get('io');
	if (io && populatedIssue.assignedTo) {
		// Emit to the specific teacher's room
		io.to(String(populatedIssue.assignedTo._id)).emit('new-issue', populatedIssue);
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

// Get issues assigned to the current teacher
const getAllIssues = asyncHandler(async (req, res) => {
	const { status, exam, search } = req.query;
	const teacherId = req.teacher?._id;

	// STRICT ACCESS CONTROL: Only show issues assigned to this teacher
	const filter = { assignedTo: teacherId };

	if (status) filter.status = String(status).toLowerCase();
	if (exam) filter.exam = exam;

	if (search) {
		const searchRegex = { $regex: search, $options: 'i' };
		const [studentIds, examIds] = await Promise.all([
			mongoose.model('Student').find({ fullname: searchRegex }).select('_id').lean(),
			mongoose.model('Exam').find({ title: searchRegex }).select('_id').lean(),
		]);
		filter.$and = [
			{
				$or: [
					{ description: searchRegex },
					{ student: { $in: studentIds.map(s => s._id) } },
					{ exam: { $in: examIds.map(e => e._id) } },
				],
			},
		];
	}

	const issues = await Issue.find(filter)
		.populate('student', 'username fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.sort({ createdAt: -1 })
		.lean();

	return ApiResponse.success(res, issues, 'Assigned issues fetched');
});

// Teacher updates an issue's status
const updateIssueStatus = asyncHandler(async (req, res) => {
	const { id } = req.params;
	const { status } = req.body;
	const teacherId = req.teacher?._id;

	const issue = await Issue.findById(id);
	if (!issue) throw ApiError.NotFound('Issue not found');

	// Authorization Check: Ensure the teacher owns this issue
	if (String(issue.assignedTo) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to update this issue.');
	}

	if (issue.status === 'resolved') {
		throw ApiError.Conflict('Cannot change status of a resolved issue.');
	}

	issue.status = String(status).toLowerCase();

	issue.activityLog.push({
		action: 'status-changed',
		user: teacherId,
		userModel: 'Teacher',
		details: `Status updated to ${status}.`,
	});

	await issue.save();

	const populatedIssue = await Issue.findById(issue._id)
		.populate('student', 'fullname email')
		.populate('exam', 'title')
		.populate('assignedTo', 'fullname')
		.lean();

	const io = req.io || req.app?.get('io');
	if (io) {
		// Emit to the teacher (confirmation) and the student
		io.to(String(teacherId)).emit('issue-update', populatedIssue);
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

	// Authorization Check
	if (String(issue.assignedTo) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to resolve this issue.');
	}

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
		io.to(String(teacherId)).emit('issue-update', populatedIssue);
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

	const issue = await Issue.findById(id);
	if (!issue) throw ApiError.NotFound('Issue not found');

	// Authorization Check
	if (String(issue.assignedTo) !== String(teacherId)) {
		throw ApiError.Forbidden('You are not authorized to add notes to this issue.');
	}

	const updatedIssue = await Issue.findByIdAndUpdate(
		id,
		{ $push: { internalNotes: { user: teacherId, note: note.trim() } } },
		{ new: true },
	)
		.populate('internalNotes.user', 'fullname')
		.populate('student', 'fullname email') // Need student ID for socket if we wanted to emit to them (we don't for internal notes)
		.populate('assignedTo', 'fullname')
		.lean();

	// Emit update ONLY to the assigned teacher (it's an internal note)
	const io = req.io || req.app?.get('io');
	if (io) {
		io.to(String(teacherId)).emit('issue-update', updatedIssue);
	}

	return ApiResponse.success(res, updatedIssue.internalNotes, 'Note added successfully.');
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

	// Verify ownership of ALL issues before updating
	const count = await Issue.countDocuments({
		_id: { $in: issueIds },
		assignedTo: teacherId,
	});

	if (count !== issueIds.length) {
		throw ApiError.Forbidden('You can only resolve issues assigned to you.');
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
		// Emit to the teacher
		io.to(String(teacherId)).emit('issues-updated', updatedIssues);
		// Emit to each student individually
		updatedIssues.forEach(issue => {
			io.to(String(issue.student._id)).emit('issue-update', issue);
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

	// Access Control: Teacher can only view their assigned issues
	// (Optional: Allow viewing if they are an admin, but for now strict)
	if (req.teacher && String(issue.assignedTo?._id || issue.assignedTo) !== String(req.teacher._id)) {
		throw ApiError.Forbidden('You are not authorized to view this issue.');
	}

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

	if (String(issue.student) !== String(studentId)) {
		throw new ApiError(403, 'You are not authorized to delete this issue.');
	}

	if (issue.status === 'resolved') {
		throw new ApiError(409, 'Cannot delete an issue that has already been resolved.');
	}

	await Issue.findByIdAndDelete(id);

	const io = req.io || req.app?.get('io');
	if (io && issue.assignedTo) {
		// Notify the assigned teacher
		io.to(String(issue.assignedTo)).emit('issue-deleted', { id });
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
