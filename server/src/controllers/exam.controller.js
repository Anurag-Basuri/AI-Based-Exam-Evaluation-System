import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { syncExamStatuses } from '../services/examStatus.service.js';

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

// Helper: ensure ownership
const assertOwner = (doc, teacherId) => {
	if (!doc?.createdBy || String(doc.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('Not authorized for this exam');
	}
};

// Publish exam (draft -> active)
const publishExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');

	assertOwner(exam, teacherId);

	if (exam.status !== 'draft') {
		throw ApiError.BadRequest('Only draft exams can be published');
	}
	if (!Array.isArray(exam.questions) || exam.questions.length === 0) {
		throw ApiError.BadRequest('Add at least one question before publishing');
	}
	if (exam.startTime && new Date(exam.startTime) <= new Date()) {
		throw ApiError.BadRequest('Start time must be in the future');
	}
	if (exam.endTime && exam.startTime && new Date(exam.endTime) <= new Date(exam.startTime)) {
		throw ApiError.BadRequest('End time must be after start time');
	}

	exam.status = 'active';
	await exam.save();

	return ApiResponse.success(res, exam, 'Exam published');
});

// Reorder questions (no add/remove, only order)
const reorderExamQuestions = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { order } = req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	if (!Array.isArray(order) || order.length === 0) {
		throw ApiError.BadRequest('Order must be a non-empty array of question IDs');
	}

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);
	if (exam.status !== 'draft') {
		throw ApiError.Forbidden('Can only reorder questions on a draft exam');
	}

	const current = exam.questions.map(id => String(id));
	const next = order.map(String);

	// Ensure same set (reorder only)
	if (current.length !== next.length) {
		throw ApiError.BadRequest('Order must include exactly the existing questions');
	}
	const sameSet =
		current.every(id => next.includes(id)) && next.every(id => current.includes(id));
	if (!sameSet) throw ApiError.BadRequest('Order must match existing question set');

	exam.questions = next;
	await exam.save();

	return ApiResponse.success(res, exam, 'Question order updated');
});

// Replace full question set (bulk set)
const setExamQuestions = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { questionIds } = req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	if (!Array.isArray(questionIds)) throw ApiError.BadRequest('questionIds must be an array');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);
	if (exam.status !== 'draft') {
		throw ApiError.Forbidden('Can only change questions on a draft exam');
	}

	// Verify ownership of all questions
	const owned = await Question.find({ _id: { $in: questionIds }, createdBy: teacherId }).select(
		'_id',
	);
	if (owned.length !== questionIds.length) {
		throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
	}

	// Compute diffs for sourceExam linking
	const prev = new Set(exam.questions.map(id => String(id)));
	const next = new Set(questionIds.map(String));
	const added = [...next].filter(id => !prev.has(id));
	const removed = [...prev].filter(id => !next.has(id));

	exam.questions = questionIds;
	await exam.save();

	if (added.length) {
		await Question.updateMany({ _id: { $in: added } }, { $set: { sourceExam: exam._id } });
	}
	if (removed.length) {
		await Question.updateMany({ _id: { $in: removed } }, { $unset: { sourceExam: '' } });
	}

	return ApiResponse.success(res, exam, 'Exam questions updated');
});

// Quick create a question and attach to exam
const createAndAttachQuestion = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;
	const { type, text, remarks, max_marks, options, answer } = req.body;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);
	if (exam.status !== 'draft') {
		throw ApiError.Forbidden('Can only add questions to a draft exam');
	}

	if (!type || !text || !max_marks) {
		throw ApiError.BadRequest('Type, text, and max_marks are required');
	}
	if (type === 'multiple-choice') {
		if (!Array.isArray(options) || options.length < 2) {
			throw ApiError.BadRequest('MCQ must have at least 2 options');
		}
		if (!options.some(o => o.isCorrect)) {
			throw ApiError.BadRequest('Mark at least one option as correct');
		}
	}

	const q = new Question({
		type,
		text,
		remarks,
		max_marks,
		options,
		answer: type === 'subjective' ? answer || null : undefined,
		createdBy: teacherId,
		sourceExam: exam._id,
	});
	await q.save();

	exam.questions.push(q._id);
	await exam.save();

	return ApiResponse.success(res, q, 'Question created and attached', 201);
});

// Duplicate an exam for reuse
const duplicateExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const src = await Exam.findById(examId);
	if (!src) throw ApiError.NotFound('Exam not found');
	assertOwner(src, teacherId);

	// Shift time window by +7 days, fallback if invalid
	const now = new Date();
	const shiftDays = 7;
	const shift = ms => new Date(ms + shiftDays * 24 * 60 * 60 * 1000);
	const start = src.startTime
		? shift(new Date(src.startTime).getTime())
		: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
	const end =
		src.endTime && src.startTime
			? shift(new Date(src.endTime).getTime())
			: new Date(start.getTime() + 2 * 60 * 60 * 1000); // +2h default

	const copy = new Exam({
		title: `${src.title} (Copy)`,
		description: src.description,
		duration: src.duration,
		questions: src.questions, // reuse banked questions; linking handled on publish/explicit set
		startTime: start,
		endTime: end,
		createdBy: teacherId,
		status: 'draft',
	});
	await copy.save();

	return ApiResponse.success(res, copy, 'Exam duplicated', 201);
});

// Get teacher's own exams (fast list)
const getMyExams = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	const { status, q, limit = 20, page = 1 } = req.query;

	const filter = { createdBy: teacherId };
	if (status) filter.status = String(status).toLowerCase();
	if (q) filter.title = { $regex: String(q), $options: 'i' };

	const lim = Math.max(1, Math.min(100, Number(limit)));
	const skip = (Math.max(1, Number(page)) - 1) * lim;

	const exams = await Exam.find(filter)
		.sort({ updatedAt: -1 })
		.skip(skip)
		.limit(lim)
		.select('_id title status searchId startTime endTime duration questions')
		.lean();

	return ApiResponse.success(res, { items: exams, page: Number(page), limit: lim }, 'Your exams');
});

// Manually trigger a status sync
const syncStatusesNow = asyncHandler(async (req, res) => {
	const result = await syncExamStatuses();
	return ApiResponse.success(res, result, 'Exam statuses synchronized');
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
	publishExam,
	reorderExamQuestions,
	setExamQuestions,
	createAndAttachQuestion,
	duplicateExam,
	getMyExams,
	syncStatusesNow,
};
