import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import Issue from '../models/issue.model.js';
import Teacher from '../models/teacher.model.js';

export const createIssue = asyncHandler(async (req, res) => {
    const { subject, description, teacherEmail } = req.body;
    if (!subject || !description || !teacherEmail) {
        throw new ApiError(400, 'Subject, description, and teacher email are required.');
    }
    const teacher = await Teacher.findOne({ email: teacherEmail.toLowerCase() });
    if (!teacher) {
        throw new ApiError(404, 'Teacher with that email not found.');
    }
    const issue = await Issue.create({ subject, description, student: req.user._id, teacher: teacher._id });
    
    // ✅ FIXED: Correct usage of ApiResponse
    return new ApiResponse(res).success(201, issue, 'Issue submitted successfully.');
});

export const getStudentIssues = asyncHandler(async (req, res) => {
    const issues = await Issue.find({ student: req.user._id }).populate('teacher', 'firstName lastName email').sort({ createdAt: -1 });
    
    // ✅ FIXED: Correct usage of ApiResponse
    return new ApiResponse(res).success(200, issues, 'Issues fetched successfully.');
});

export const getTeacherIssues = asyncHandler(async (req, res) => {
    const issues = await Issue.find({ teacher: req.user._id }).populate('student', 'firstName lastName email rollNumber').sort({ createdAt: -1 });
    
    // ✅ FIXED: Correct usage of ApiResponse
    return new ApiResponse(res).success(200, issues, 'Issues fetched successfully.');
});

export const replyToIssue = asyncHandler(async (req, res) => {
    const { reply } = req.body;
    if (!reply) throw new ApiError(400, 'Reply text is required.');
    
    const issue = await Issue.findById(req.params.id);
    if (!issue) throw new ApiError(404, 'Issue not found.');
    if (issue.teacher.toString() !== req.user._id.toString()) {
        throw new ApiError(403, 'You are not authorized to reply to this issue.');
    }
    
    issue.reply = reply;
    issue.status = 'Resolved';
    await issue.save();
    
    // ✅ FIXED: Correct usage of ApiResponse
    return new ApiResponse(res).success(200, issue, 'Reply sent successfully.');
});
