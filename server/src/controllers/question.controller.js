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

// Get all questions uploaded by the teacher with filters/pagination
const getTeacherQuestions = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	const { q, type, limit = 20, page = 1 } = req.query;

	const filter = { createdBy: teacherId };
	if (type && ['multiple-choice', 'subjective'].includes(String(type))) {
		filter.type = type;
	}
	if (q) {
		filter.$or = [
			{ text: { $regex: String(q), $options: 'i' } },
			{ remarks: { $regex: String(q), $options: 'i' } },
		];
	}

	const lim = Math.max(1, Math.min(100, Number(limit)));
	const skip = (Math.max(1, Number(page)) - 1) * lim;

	const questions = await Question.find(filter)
		.sort({ createdAt: -1 })
		.skip(skip)
		.limit(lim)
		.select('_id type text remarks max_marks options createdBy sourceExam createdAt')
		.lean();

	return ApiResponse.success(
		res,
		{ items: questions, page: Number(page), limit: lim },
		'Your questions fetched',
	);
});

// bulk create (basic shape validation)
const createQuestionsBulk = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	const { items } = req.body;

	if (!Array.isArray(items) || items.length === 0) {
		throw ApiError.BadRequest('Provide "items" as non-empty array');
	}
	if (items.length > 200) throw ApiError.BadRequest('Max 200 questions per bulk request');

	const docs = [];
	for (const [idx, it] of items.entries()) {
		const { type, text, remarks, max_marks, options, answer } = it || {};
		if (!type || !text || !max_marks) {
			throw ApiError.BadRequest(`Row ${idx + 1}: type, text, max_marks are required`);
		}
		if (type === 'multiple-choice') {
			if (!Array.isArray(options) || options.length < 2) {
				throw ApiError.BadRequest(`Row ${idx + 1}: MCQ requires at least 2 options`);
			}
			if (!options.some(o => o.isCorrect)) {
				throw ApiError.BadRequest(`Row ${idx + 1}: Mark at least one correct option`);
			}
		}
		docs.push({
			type,
			text,
			remarks: remarks || undefined,
			max_marks,
			options,
			answer: type === 'subjective' ? answer || null : undefined,
			createdBy: teacherId,
		});
	}

	const created = await Question.insertMany(docs, { ordered: true });
	return ApiResponse.success(res, { count: created.length }, 'Questions created', 201);
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
    const teacherId = req.teacher?._id || req.user?.id;

    if (!questionId || !questionId.match(/^[a-f\d]{24}$/i)) {
        throw ApiError.BadRequest('Invalid question ID');
    }

    const questionDoc = await Question.findById(questionId);
    if (!questionDoc) throw ApiError.NotFound('Question not found');

    // Ownership
    if (String(questionDoc.createdBy) !== String(teacherId)) {
        throw ApiError.Forbidden('Not authorized to update this question');
    }

    // If question is part of a linked exam, check lock
    if (questionDoc.sourceExam) {
        const exam = await Exam.findById(questionDoc.sourceExam).select('status startTime endTime');
        if (exam) {
            const now = new Date();
            const scheduled = exam.status === 'active' && exam.startTime && now < new Date(exam.startTime);
            const live =
                exam.status === 'active' &&
                exam.startTime &&
                exam.endTime &&
                now >= new Date(exam.startTime) &&
                now <= new Date(exam.endTime);
            if (live || ['completed', 'cancelled'].includes(exam.status)) {
                throw ApiError.Forbidden('Cannot update a question tied to a live/completed/cancelled exam');
            }
            // Allowed when draft or scheduled (not started)
        }
    }

    // Destructure after auth/locks
    const { type, text, remarks, max_marks, options, answer } = req.body || {};

    // Validate MCQ only if MCQ is intended or options are provided
    if ((type === 'multiple-choice') || (Array.isArray(options) && options.length > 0)) {
        if (!Array.isArray(options) || options.length < 2) {
            throw ApiError.BadRequest('Multiple-choice questions must have at least 2 options');
        }
        if (!options.some(opt => opt.isCorrect)) {
            throw ApiError.BadRequest('At least one option must be marked as correct');
        }
    }

    const updateFields = {};
    if (type) updateFields.type = type;
    if (typeof text === 'string') updateFields.text = text;
    if (typeof remarks === 'string') updateFields.remarks = remarks;
    if (max_marks !== undefined) updateFields.max_marks = max_marks;
    if (Array.isArray(options)) updateFields.options = options;
    if (type === 'subjective') updateFields.answer = answer || null;
    if (!type && answer !== undefined && (questionDoc.type === 'subjective')) {
        // allow updating answer for existing subjective without changing type
        updateFields.answer = answer || null;
    }

    const updated = await Question.findByIdAndUpdate(questionId, updateFields, {
        new: true,
        runValidators: true,
    });

    return ApiResponse.success(res, updated, 'Question updated successfully');
});

// Delete a question (prevent delete if part of a locked exam)
const deleteQuestion = asyncHandler(async (req, res) => {
    const questionId = req.params.id;
    const teacherId = req.teacher?._id || req.user?.id;

    if (!questionId || !questionId.match(/^[a-f\d]{24}$/i)) {
        throw ApiError.BadRequest('Invalid question ID');
    }
    const questionDoc = await Question.findById(questionId);
    if (!questionDoc) throw ApiError.NotFound('Question not found');

    // Ownership
    if (String(questionDoc.createdBy) !== String(teacherId)) {
        throw ApiError.Forbidden('Not authorized to delete this question');
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
	createQuestionsBulk,
	getQuestionById,
	updateQuestion,
	deleteQuestion,
};
