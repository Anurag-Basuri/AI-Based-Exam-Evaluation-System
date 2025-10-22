import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { syncExamStatuses } from '../services/examStatus.service.js';

// Create an exam (can be created with zero questions, status is 'draft')
const createExam = asyncHandler(async (req, res) => {
	const { title, description, duration, questionIds, startTime, endTime, aiPolicy } = req.body;
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
		aiPolicy,
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
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden(
			'Can only add questions to a draft or scheduled exam (not started).',
		);
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
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden(
			'Can only remove questions from a draft or scheduled exam (not started).',
		);
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

// Helper: ensure ownership
const assertOwner = (doc, teacherId) => {
	if (!doc?.createdBy || String(doc.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('Not authorized for this exam');
	}
};

// Update an exam (safe status transitions)
const updateExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { title, description, duration, questions, startTime, endTime, status, aiPolicy } =
		req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');

	// Ownership
	assertOwner(exam, teacherId);

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

	// Validate times and allow edits:
	// - Draft: full edits
	// - Scheduled (active but not started): allow title/description/duration/start/end changes
	// - Live/completed/cancelled: disallow time/title changes
	const scheduled = isScheduled(exam);
	const live = isLive(exam);

	if (live || ['completed', 'cancelled'].includes(exam.status)) {
		if (
			title !== undefined ||
			description !== undefined ||
			startTime !== undefined ||
			endTime !== undefined ||
			Array.isArray(questions) ||
			aiPolicy !== undefined // Prevent AI policy changes on locked exams
		) {
			throw ApiError.Forbidden(
				'Cannot modify details/questions/AI policy of a live/completed/cancelled exam',
			);
		}
	}

	if (startTime && new Date(startTime) <= new Date()) {
		throw ApiError.BadRequest('Start time must be in the future');
	}
	if (endTime && (startTime ? new Date(endTime) <= new Date(startTime) : false)) {
		throw ApiError.BadRequest('End time must be after start time');
	}
	if (
		!scheduled &&
		exam.status !== 'draft' &&
		(startTime !== undefined || endTime !== undefined)
	) {
		throw ApiError.Forbidden('Only draft or scheduled (not started) exams can change schedule');
	}

	// If questions provided on a draft exam, validate ownership
	if (Array.isArray(questions)) {
		if (exam.status !== 'draft') {
			throw ApiError.Forbidden('Can only change questions on a draft exam');
		}
		const owned = await Question.find({ _id: { $in: questions }, createdBy: teacherId }).select(
			'_id',
		);
		if (owned.length !== questions.length) {
			throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
		}
	}

	// Only update fields provided
	const updateFields = {};
	if (title !== undefined) updateFields.title = title;
	if (description !== undefined) updateFields.description = description;
	if (duration !== undefined) updateFields.duration = duration;
	if (startTime !== undefined) updateFields.startTime = startTime;
	if (endTime !== undefined) updateFields.endTime = endTime;
	if (status !== undefined) updateFields.status = status;
	if (Array.isArray(questions)) updateFields.questions = questions;
	if (aiPolicy !== undefined) updateFields.aiPolicy = aiPolicy; // Add AI policy to update fields

	const updatedExam = await Exam.findByIdAndUpdate(examId, updateFields, {
		new: true,
		runValidators: true,
	});

	return ApiResponse.success(res, updatedExam, 'Exam updated successfully');
});

// Delete an exam (owner-only, not when live or scheduled)
const deleteExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) {
		throw ApiError.BadRequest('Invalid exam ID');
	}

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');

	// Ownership
	assertOwner(exam, teacherId);

	// Disallow deletion for live or scheduled exams
	const now = new Date();
	const scheduled =
		String(exam.status).toLowerCase() === 'active' &&
		exam.startTime &&
		now < new Date(exam.startTime);
	const live =
		String(exam.status).toLowerCase() === 'active' &&
		exam.startTime &&
		exam.endTime &&
		now >= new Date(exam.startTime) &&
		now <= new Date(exam.endTime);

	if (scheduled || live) {
		throw ApiError.Forbidden('Cannot delete a live or scheduled exam. End/cancel it first.');
	}

	// Safe to delete (draft, completed, or cancelled)
	await Exam.findByIdAndDelete(examId);
	await Question.updateMany({ sourceExam: examId }, { $unset: { sourceExam: '' } });

	return ApiResponse.success(res, { success: true }, 'Exam deleted successfully');
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
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden(
			'Can only reorder questions on a draft or scheduled exam (not started)',
		);
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
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden(
			'Can only change questions on a draft or scheduled exam (not started)',
		);
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
		questions: src.questions,
		startTime: start,
		endTime: end,
		createdBy: teacherId,
		status: 'draft',
		aiPolicy: src.aiPolicy,
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

	const total = await Exam.countDocuments(filter);

	return ApiResponse.success(
		res,
		{ items: exams, page: Number(page), limit: lim, total },
		'Your exams',
	);
});

// Manually trigger a status sync
const syncStatusesNow = asyncHandler(async (req, res) => {
	const result = await syncExamStatuses();
	return ApiResponse.success(res, result, 'Exam statuses synchronized');
});

// Helpers for time-based gates
const isScheduled = exam =>
	exam?.status === 'active' && exam?.startTime && new Date() < new Date(exam.startTime);
const isLive = exam =>
	exam?.status === 'active' &&
	exam?.startTime &&
	exam?.endTime &&
	new Date() >= new Date(exam.startTime) &&
	new Date() <= new Date(exam.endTime);

// End exam now (only if live)
const endExamNow = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!isLive(exam)) {
		throw ApiError.Forbidden('Only live exams can be ended now');
	}

	exam.status = 'completed';
	exam.endTime = new Date();
	await exam.save();

	return ApiResponse.success(res, exam, 'Exam ended');
});

// Cancel exam (only if scheduled; keeps as record but unusable)
const cancelExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!isScheduled(exam)) {
		throw ApiError.Forbidden('Only scheduled (not started) exams can be cancelled');
	}

	exam.status = 'cancelled';
	await exam.save();

	return ApiResponse.success(res, exam, 'Exam cancelled');
});

// Extend end time (allow on scheduled or live)
const extendExam = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const { minutes, endTime } = req.body;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!(isScheduled(exam) || isLive(exam))) {
		throw ApiError.Forbidden('Only scheduled or live exams can be extended');
	}

	let newEnd;
	if (typeof minutes === 'number' && minutes > 0) {
		const base = exam.endTime ? new Date(exam.endTime).getTime() : Date.now();
		newEnd = new Date(base + minutes * 60 * 1000);
	} else if (endTime) {
		newEnd = new Date(endTime);
	} else {
		throw ApiError.BadRequest('Provide minutes or endTime');
	}

	if (!exam.startTime || newEnd <= new Date(exam.startTime)) {
		throw ApiError.BadRequest('New end time must be after start time');
	}
	if (newEnd <= new Date()) {
		throw ApiError.BadRequest('New end time must be in the future');
	}

	exam.endTime = newEnd;
	await exam.save();

	return ApiResponse.success(res, exam, 'Exam end time extended');
});

// Regenerate share/search code (pre-start only)
const regenerateExamCode = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	const teacherId = req.teacher?._id || req.user?.id;

	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!isScheduled(exam) && exam.status !== 'draft') {
		throw ApiError.Forbidden('Can only regenerate code for draft or scheduled exams');
	}

	// Generate a unique 8-char code
	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz23456789';
	const genCode = (len = 8) =>
		Array.from(
			{ length: len },
			() => alphabet[Math.floor(Math.random() * alphabet.length)],
		).join('');

	let newCode = genCode();
	let attempts = 0;
	// Loop to ensure the generated code is unique
	while (await Exam.findOne({ searchId: newCode }).select('_id').lean()) {
		if (attempts++ > 10) {
			throw new ApiError(500, 'Failed to generate a unique share code. Please try again.');
		}
		newCode = genCode();
	}

	exam.searchId = newCode;
	await exam.save();

	return ApiResponse.success(res, { searchId: newCode }, 'Share code regenerated');
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
	endExamNow,
	cancelExam,
	extendExam,
	regenerateExamCode,
};
