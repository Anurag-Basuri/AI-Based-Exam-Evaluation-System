import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Create an exam (can be created with zero questions, status is 'draft')
const createExam = asyncHandler(async (req, res) => {
	const { title, description, duration, questionIds, startTime, endTime } = req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!title || !duration || !startTime || !endTime) {
		throw ApiError.BadRequest('Title, duration, startTime, and endTime are required');
	}

	// Validate start and end time
	if (new Date(startTime) <= new Date()) {
		throw ApiError.BadRequest('Start time must be in the future');
	}
	if (new Date(endTime) <= new Date(startTime)) {
		throw ApiError.BadRequest('End time must be after start time');
	}

	// If questions are provided, check ownership, else allow empty
	let questions = [];
	if (Array.isArray(questionIds) && questionIds.length > 0) {
		questions = await Question.find({ _id: { $in: questionIds }, createdBy: teacherId });
		if (questions.length !== questionIds.length) {
			throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
		}
	}

	const exam = new Exam({
		title,
		description,
		duration,
		questions: questions.length > 0 ? questions.map(q => q._id) : [],
		startTime,
		endTime,
		createdBy: teacherId,
		status: 'draft',
	});

	await exam.save();

	// Update questions with sourceExam reference if any
	if (questions.length > 0) {
		await Question.updateMany(
			{ _id: { $in: questionIds } },
			{ $set: { sourceExam: exam._id } },
		);
	}

	return ApiResponse.success(res, exam, 'Exam created successfully', 201);
});

// Add questions to an existing exam (patch)
const addQuestionsToExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { questionIds } = req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}
	if (!Array.isArray(questionIds) || questionIds.length === 0) {
		throw ApiError.BadRequest('At least one question ID is required');
	}

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.status !== 'draft') {
		throw ApiError.Forbidden('Can only add questions to a draft exam.');
	}

	// Check ownership
	const questions = await Question.find({ _id: { $in: questionIds }, createdBy: teacherId });
	if (questions.length !== questionIds.length) {
		throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
	}

	exam.questions = Array.from(new Set([...exam.questions, ...questionIds]));
	await exam.save();
	await Question.updateMany({ _id: { $in: questionIds } }, { $set: { sourceExam: exam._id } });

	return ApiResponse.success(res, exam, 'Questions added to exam');
});

// Remove questions from an existing exam (only in draft)
const removeQuestionsFromExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { questionIds } = req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}
	if (!Array.isArray(questionIds) || questionIds.length === 0) {
		throw ApiError.BadRequest('At least one question ID is required');
	}

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.status !== 'draft') {
		throw ApiError.Forbidden('Can only remove questions from a draft exam.');
	}

	exam.questions = exam.questions.filter(qId => !questionIds.includes(qId.toString()));
	await exam.save();
	await Question.updateMany({ _id: { $in: questionIds } }, { $unset: { sourceExam: '' } });

	return ApiResponse.success(res, exam, 'Questions removed from exam');
});

// Get all exams (optionally filter by teacher)
const getAllExams = asyncHandler(async (req, res) => {
	const { teacher, status, q } = req.query;
	const filter = {};
	if (teacher) filter.createdBy = teacher;
	if (status) filter.status = String(status).toLowerCase();
	if (q) filter.title = { $regex: String(q), $options: 'i' };

	const exams = await Exam.find(filter)
		.sort({ createdAt: -1 })
		.select(
			'_id title description status searchId startTime endTime duration questions createdBy',
		)
		.lean();

	return ApiResponse.success(res, exams, 'Exams fetched');
});

// Get a single exam by ID
const getExamById = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}
	const exam = await Exam.findById(examId)
		.populate('createdBy', 'fullname email')
		.populate({
			path: 'questions',
			populate: { path: 'createdBy', select: 'fullname email' },
		});

	if (!exam) {
		throw ApiError.NotFound('Exam not found');
	}
	return ApiResponse.success(res, exam, 'Exam details fetched');
});

// Update an exam (safe status transitions)
const updateExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { title, description, duration, questions, startTime, endTime, status } = req.body;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');

	// Restrict status transitions
	if (status && status !== exam.status) {
		if (['completed', 'cancelled'].includes(exam.status)) {
			throw ApiError.Forbidden('Cannot change status of a completed or cancelled exam.');
		}
		if (exam.status === 'draft' && status === 'active') {
			const qArr = Array.isArray(questions) ? questions : exam.questions;
			if (!qArr || qArr.length === 0) {
				throw ApiError.BadRequest(
					'Exam must have at least one question before activation.',
				);
			}
		}
		if (exam.status === 'active' && status === 'draft') {
			throw ApiError.Forbidden('Cannot revert an active exam to draft.');
		}
		if (status === 'completed' && exam.status !== 'active') {
			throw ApiError.Forbidden('Can only complete an active exam.');
		}
	}

	// Validate times
	if (startTime && new Date(startTime) <= new Date()) {
		throw ApiError.BadRequest('Start time must be in the future');
	}
	if (endTime && startTime && new Date(endTime) <= new Date(startTime)) {
		throw ApiError.BadRequest('End time must be after start time');
	}

	// Only update fields provided
	const updateFields = {};
	if (title) updateFields.title = title;
	if (description) updateFields.description = description;
	if (duration) updateFields.duration = duration;
	if (startTime) updateFields.startTime = startTime;
	if (endTime) updateFields.endTime = endTime;
	if (status) updateFields.status = status;
	if (Array.isArray(questions)) updateFields.questions = questions;

	const updatedExam = await Exam.findByIdAndUpdate(examId, updateFields, {
		new: true,
		runValidators: true,
	});

	return ApiResponse.success(res, updatedExam, 'Exam updated successfully');
});

// Delete an exam
const deleteExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}
	const exam = await Exam.findByIdAndDelete(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	await Question.updateMany({ sourceExam: examId }, { $unset: { sourceExam: '' } });
	return ApiResponse.success(res, { message: 'Exam deleted successfully' });
});

// Search exam by searchId/code (student flow)
const searchExamByCode = asyncHandler(async (req, res) => {
	const raw = String(req.params.code || req.query.code || '').trim();
	if (!raw) throw ApiError.BadRequest('Exam search ID is required');

	const code = raw.toUpperCase();
	const exam = await Exam.findOne({ searchId: code })
		.select('_id title description duration status startTime endTime questions')
		.lean();

	if (!exam) throw ApiError.NotFound('No exam found for the provided search ID');

	// Gate by status/time window
	const now = new Date();
	if (String(exam.status).toLowerCase() !== 'active') {
		throw ApiError.Forbidden('This exam is not active');
	}
	if (exam.startTime && now < new Date(exam.startTime)) {
		throw ApiError.Forbidden('This exam has not started yet');
	}
	if (exam.endTime && now > new Date(exam.endTime)) {
		throw ApiError.Forbidden('This exam has ended');
	}

	return ApiResponse.success(res, exam, 'Exam found');
});

export {
	createExam,
	addQuestionsToExam,
	removeQuestionsFromExam,
	getAllExams,
	getExamById,
	updateExam,
	deleteExam,
	searchExamByCode,
};
