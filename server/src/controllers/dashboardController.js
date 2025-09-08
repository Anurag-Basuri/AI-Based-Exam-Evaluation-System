import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import Exam from '../models/exam.model.js';
import Submission from '../models/submission.model.js';
import Issue from '../models/issue.model.js';
import Todo from '../models/todo.model.js';

// --- Dashboard Stats ---

export const getDashboardStats = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    const activeExamsCount = await Exam.countDocuments({
        createdBy: teacherId,
        status: 'active'
    });

    const pendingEvaluationCount = await Submission.countDocuments({
        exam: { $in: await Exam.find({ createdBy: teacherId }).distinct('_id') },
        status: 'submitted'
    });

    const stats = {
        activeExams: activeExamsCount,
        pendingEvaluation: pendingEvaluationCount,
    };

    return new ApiResponse(res).success(200, stats, 'Dashboard stats fetched successfully.');
});


// --- To-Do List ---

export const getTodos = asyncHandler(async (req, res) => {
    const todos = await Todo.find({ teacher: req.user._id }).sort({ createdAt: -1 });
    return new ApiResponse(res).success(200, todos, 'Todos fetched successfully.');
});

export const addTodo = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const todo = await Todo.create({ teacher: req.user._id, text });
    return new ApiResponse(res).success(201, todo, 'Todo added successfully.');
});

export const toggleTodo = asyncHandler(async (req, res) => {
    const { todoId } = req.params;
    const todo = await Todo.findById(todoId);
    if (!todo) {
        throw new ApiError(404, 'Todo not found.');
    }
    todo.isCompleted = !todo.isCompleted;
    await todo.save();
    return new ApiResponse(res).success(200, todo, 'Todo updated successfully.');
});

export const deleteTodo = asyncHandler(async (req, res) => {
    const { todoId } = req.params;
    await Todo.findByIdAndDelete(todoId);
    return new ApiResponse(res).success(200, null, 'Todo deleted successfully.');
});


// --- Recent Activity ---

export const getRecentActivity = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    const upcomingExams = await Exam.find({
        createdBy: teacherId,
        startTime: { $gt: new Date() }
    }).sort({ startTime: 1 }).limit(3);

    const recentSubmissions = await Submission.find({
        exam: { $in: await Exam.find({ createdBy: teacherId }).distinct('_id') }
    }).populate('student', 'firstName lastName').sort({ submittedAt: -1 }).limit(3);

    const newIssues = await Issue.find({
        teacher: teacherId,
        status: 'Pending'
    }).populate('student', 'firstName lastName').sort({ createdAt: -1 }).limit(3);

    const activity = {
        upcomingExams,
        recentSubmissions,
        newIssues
    };

    return new ApiResponse(res).success(200, activity, 'Recent activity fetched successfully.');
});