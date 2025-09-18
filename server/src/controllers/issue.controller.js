import Issue from '../models/issue.model.js';
import Teacher from '../models/teacher.model.js';
import Student from '../models/student.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Student raises an issue
const createIssue = asyncHandler(async (req, res) => {
    const { exam, question, submission, issueType, description } = req.body;
    const studentId = req.student?._id || req.user?.id;

    if (!exam || !issueType || !description) {
        throw ApiError.BadRequest('Exam, issueType, and description are required');
    }
    if (!['question', 'evaluation'].includes(issueType)) {
        throw ApiError.BadRequest('Invalid issueType');
    }
    if (issueType === 'question' && !question) {
        throw ApiError.BadRequest('Question ID is required for question issues');
    }
    if (issueType === 'evaluation' && !submission) {
        throw ApiError.BadRequest('Submission ID is required for evaluation issues');
    }

    const issue = new Issue({
        student: studentId,
        exam,
        question: issueType === 'question' ? question : undefined,
        submission: issueType === 'evaluation' ? submission : undefined,
        issueType,
        description,
    });

    await issue.save();

    return ApiResponse.success(res, issue, 'Issue raised successfully', 201);
});

// Get all issues for a student
const getStudentIssues = asyncHandler(async (req, res) => {
    const studentId = req.student?._id || req.user?.id;
    const issues = await Issue.find({ student: studentId }).sort({ createdAt: -1 });
    return ApiResponse.success(res, issues, 'Student issues fetched');
});

// Get all issues for a teacher (assigned or all)
const getAllIssues = asyncHandler(async (req, res) => {
    // Optionally filter by status or exam
    const { status, exam } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (exam) filter.exam = exam;

    const issues = await Issue.find(filter)
        .populate('student', 'username fullname email')
        .populate('exam', 'title')
        .populate('question', 'text')
        .populate('submission')
        .sort({ createdAt: -1 });

    return ApiResponse.success(res, issues, 'All issues fetched');
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
    if (issue.status === 'Resolved') {
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
        .populate('question', 'text')
        .populate('submission');

    if (!issue) {
        throw ApiError.NotFound('Issue not found');
    }

    return ApiResponse.success(res, issue, 'Issue details fetched');
});

export {
    createIssue,
    getStudentIssues,
    getAllIssues,
    resolveIssue,
    getIssueById
};

