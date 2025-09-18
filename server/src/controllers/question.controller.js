import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Create a question (called one by one before exam creation)
const createQuestion = asyncHandler(async (req, res) => {
    const { type, text, remarks, max_marks, options, answer } = req.body;
    const teacherId = req.teacher?._id || req.user?.id;

    if (!type || !text || !max_marks) {
        throw ApiError.BadRequest('Type, text, and max_marks are required');
    }

    // Validate options for MCQ
    if (type === 'multiple-choice') {
        if (!Array.isArray(options) || options.length < 2) {
            throw ApiError.BadRequest('Multiple-choice questions must have at least 2 options');
        }
        if (!options.some(opt => opt.isCorrect)) {
            throw ApiError.BadRequest('At least one option must be marked as correct');
        }
    }

    // Subjective answer is now optional
    const question = new Question({
        type,
        text,
        remarks,
        max_marks,
        options,
        answer: type === 'subjective' ? answer || null : undefined,
        createdBy: teacherId,
    });

    await question.save();

    return ApiResponse.success(res, question, 'Question created successfully', 201);
});

// Get all questions uploaded by the teacher (for exam creation selection)
const getTeacherQuestions = asyncHandler(async (req, res) => {
    const teacherId = req.teacher?._id || req.user?.id;
    const questions = await Question.find({ createdBy: teacherId })
        .populate('createdBy', 'fullname email')
        .sort({ createdAt: -1 })
        .lean();

    return ApiResponse.success(res, questions, 'Your questions fetched');
});

// Get a single question by ID
const getQuestionById = asyncHandler(async (req, res) => {
    const questionId = req.params.id;
    if (!questionId || !questionId.match(/^[a-f\d]{24}$/i)) {
        throw ApiError.BadRequest('Invalid question ID');
    }
    const question = await Question.findById(questionId)
        .populate('createdBy', 'fullname email')
        .populate('sourceExam', 'title')
        .lean();

    if (!question) {
        throw ApiError.NotFound('Question not found');
    }
    return ApiResponse.success(res, question, 'Question details fetched');
});

// Update a question
const updateQuestion = asyncHandler(async (req, res) => {
    const questionId = req.params.id;
    const { type, text, remarks, max_marks, options, answer } = req.body;

    if (!questionId || !questionId.match(/^[a-f\d]{24}$/i)) {
        throw ApiError.BadRequest('Invalid question ID');
    }

    const questionDoc = await Question.findById(questionId);
    if (!questionDoc) {
        throw ApiError.NotFound('Question not found');
    }

    // If question is part of an exam that is active/completed/cancelled, prevent update
    if (questionDoc.sourceExam) {
        const exam = await Exam.findById(questionDoc.sourceExam);
        if (exam && ['active', 'completed', 'cancelled'].includes(exam.status)) {
            throw ApiError.Forbidden('Cannot update a question that is part of a locked exam.');
        }
    }

    if (type === 'multiple-choice') {
        if (!Array.isArray(options) || options.length < 2) {
            throw ApiError.BadRequest('Multiple-choice questions must have at least 2 options');
        }
        if (!options.some(opt => opt.isCorrect)) {
            throw ApiError.BadRequest('At least one option must be marked as correct');
        }
    }

    const updateFields = {};
    if (type) updateFields.type = type;
    if (text) updateFields.text = text;
    if (remarks) updateFields.remarks = remarks;
    if (max_marks) updateFields.max_marks = max_marks;
    if (options) updateFields.options = options;
    if (type === 'subjective') updateFields.answer = answer || null;

    const question = await Question.findByIdAndUpdate(
        questionId,
        updateFields,
        { new: true, runValidators: true },
    );

    return ApiResponse.success(res, question, 'Question updated successfully');
});

// Delete a question (prevent delete if part of a locked exam)
const deleteQuestion = asyncHandler(async (req, res) => {
    const questionId = req.params.id;
    if (!questionId || !questionId.match(/^[a-f\d]{24}$/i)) {
        throw ApiError.BadRequest('Invalid question ID');
    }
    const questionDoc = await Question.findById(questionId);
    if (!questionDoc) {
        throw ApiError.NotFound('Question not found');
    }

    // If question is part of an exam that is active/completed/cancelled, prevent delete
    if (questionDoc.sourceExam) {
        const exam = await Exam.findById(questionDoc.sourceExam);
        if (exam && ['active', 'completed', 'cancelled'].includes(exam.status)) {
            throw ApiError.Forbidden('Cannot delete a question that is part of a locked exam.');
        }
    }

    await Question.findByIdAndDelete(questionId);
    await Exam.updateMany({ questions: questionId }, { $pull: { questions: questionId } });
    return ApiResponse.success(res, { message: 'Question deleted successfully' });
});

export {
    createQuestion,
    getTeacherQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
};