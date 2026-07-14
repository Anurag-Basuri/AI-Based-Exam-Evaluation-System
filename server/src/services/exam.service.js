import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { ApiError } from '../utils/ApiError.js';
import { getCachedOrFetch, invalidate, invalidateByPrefix } from './cache.service.js';

// Cache key builders
const KEYS = {
	examById: (id) => `exam:${id}`,
	examStats: (teacherId) => `exam-stats:${teacherId}`,
};

const checkQuestionLimits = (questions) => {
	const LIMITS = { total: 30, mcq: 30, subjective: 10 };
	if (questions.length > LIMITS.total) return `Max ${LIMITS.total} questions allowed (got ${questions.length})`;
	const mcqCount = questions.filter(q => q.type === 'multiple-choice').length;
	const subCount = questions.filter(q => q.type === 'subjective').length;
	if (mcqCount > LIMITS.mcq) return `Max ${LIMITS.mcq} MCQs allowed (got ${mcqCount})`;
	if (subCount > LIMITS.subjective) return `Max ${LIMITS.subjective} subjective questions allowed (got ${subCount})`;
	return null;
};

// Helpers

// Checks if an exam is scheduled (start time is in the future and status is not completed/cancelled).
export const isScheduled = exam => {
	if (!exam || !exam.startTime) return false;
	const now = new Date();
	const start = new Date(exam.startTime);
	return (
		now < start &&
		String(exam.status).toLowerCase() !== 'completed' &&
		String(exam.status).toLowerCase() !== 'cancelled'
	);
};

// Checks if an exam is currently live (current time is between start and end times, and status is not completed/cancelled).
export const isLive = exam => {
	if (!exam || !exam.startTime || !exam.endTime) return false;
	const now = new Date();
	const start = new Date(exam.startTime);
	const end = new Date(exam.endTime);
	return (
		now >= start &&
		now <= end &&
		String(exam.status).toLowerCase() !== 'completed' &&
		String(exam.status).toLowerCase() !== 'cancelled'
	);
};

// Asserts that the requested teacher is the creator/owner of the exam.
export const assertOwner = (doc, teacherId) => {
	if (!doc?.createdBy || String(doc.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('Not authorized for this exam');
	}
};

// Operations

// Creates a new exam in 'draft' status. Validates start/end times and verifies question ownership.
export const create = async (data, teacherId) => {
	const {
		title,
		description,
		duration,
		questionIds,
		startTime,
		endTime,
		aiPolicy,
		instructions,
		autoPublishResults,
	} = data;

	if (!title || !duration || !startTime || !endTime) {
		throw ApiError.BadRequest('Title, duration, startTime, and endTime are required');
	}

	if (new Date(startTime) <= new Date()) {
		throw ApiError.BadRequest('Start time must be in the future');
	}
	if (new Date(endTime) <= new Date(startTime)) {
		throw ApiError.BadRequest('End time must be after start time');
	}

	let questions = [];
	if (Array.isArray(questionIds) && questionIds.length > 0) {
		questions = await Question.find({ _id: { $in: questionIds }, createdBy: teacherId });
		if (questions.length !== questionIds.length) {
			throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
		}
		
		const limitError = checkQuestionLimits(questions);
		if (limitError) throw ApiError.BadRequest(limitError);
	}

	const exam = new Exam({
		title,
		description,
		duration,
		questions: questions.map(q => q._id),
		startTime,
		endTime,
		createdBy: teacherId,
		status: 'draft',
		aiPolicy,
		instructions,
		autoPublishResults,
		totalMarks: questions.reduce((sum, q) => sum + (q.max_marks || 0), 0),
	});

	await exam.save();

	if (questions.length > 0) {
		await Question.updateMany(
			{ _id: { $in: questionIds } },
			{ $set: { sourceExam: exam._id } },
		);
	}

	// Invalidate teacher's stats cache after creating an exam
	invalidate(KEYS.examStats(teacherId));

	return exam;
};

// Publishes a draft exam to 'active' status. Validates questions and times.
export const publish = async (examId, teacherId) => {
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

	// Invalidate caches: the exam detail and teacher's aggregate stats
	invalidate(KEYS.examById(examId));
	invalidate(KEYS.examStats(teacherId));

	return exam;
};

// Retrieves aggregate statistics for all exams created by a specific teacher (utilizes caching).
export const getStats = async teacherId => {
	return getCachedOrFetch(KEYS.examStats(teacherId), 120, async () => {
	const now = new Date();

	const stats = await Exam.aggregate([
		{ $match: { createdBy: new mongoose.Types.ObjectId(teacherId) } },
		{
			$group: {
				_id: null,
				total: { $sum: 1 },
				draft: { $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] } },
				active: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ['$status', 'active'] },
									{ $lte: ['$startTime', now] },
									{ $gte: ['$endTime', now] },
								],
							},
							1,
							0,
						],
					},
				},
				scheduled: {
					$sum: {
						$cond: [
							{
								$and: [
									{ $eq: ['$status', 'active'] },
									{ $gt: ['$startTime', now] },
								],
							},
							1,
							0,
						],
					},
				},
				completed: {
					$sum: {
						$cond: [
							{
								$or: [
									{ $eq: ['$status', 'completed'] },
									{
										$and: [
											{ $eq: ['$status', 'active'] },
											{ $lt: ['$endTime', now] },
										],
									},
								],
							},
							1,
							0,
						],
					},
				},
			},
		},
	]);

	const result = stats[0] || { total: 0, draft: 0, active: 0, scheduled: 0, completed: 0 };
	delete result._id;
	return result;
	}); // end getCachedOrFetch
};

// Appends question IDs to an existing draft/scheduled exam, updating total marks and sourceExam fields.
export const addQuestions = async (examId, teacherId, questionIds) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	if (!Array.isArray(questionIds) || questionIds.length === 0) throw ApiError.BadRequest('At least one question ID is required');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden('Can only add questions to a draft or scheduled exam (not started).');
	}

	const questions = await Question.find({ _id: { $in: questionIds }, createdBy: teacherId });
	if (questions.length !== questionIds.length) {
		throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
	}

	const existingQuestions = await Question.find({ _id: { $in: exam.questions } });
	const allQuestions = [...existingQuestions, ...questions];
	
	const limitError = checkQuestionLimits(allQuestions);
	if (limitError) throw ApiError.BadRequest(limitError);

	exam.questions = Array.from(new Set([...exam.questions, ...questionIds]));
	const fullQuestions = await Question.find({ _id: { $in: exam.questions } }).select('max_marks');
	exam.totalMarks = fullQuestions.reduce((sum, q) => sum + (q.max_marks || 0), 0);
	await exam.save();
	await Question.updateMany({ _id: { $in: questionIds } }, { $set: { sourceExam: exam._id } });

	invalidate(KEYS.examById(examId));
	return exam;
};

// Removes question IDs from a draft/scheduled exam, recalculating total marks and unlinking questions.
export const removeQuestions = async (examId, teacherId, questionIds) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	if (!Array.isArray(questionIds) || questionIds.length === 0) throw ApiError.BadRequest('At least one question ID is required');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden('Can only remove questions from a draft or scheduled exam (not started).');
	}

	exam.questions = exam.questions.filter(qId => !questionIds.includes(qId.toString()));
	const fullQuestions = await Question.find({ _id: { $in: exam.questions } }).select('max_marks');
	exam.totalMarks = fullQuestions.reduce((sum, q) => sum + (q.max_marks || 0), 0);
	await exam.save();
	await Question.updateMany({ _id: { $in: questionIds } }, { $unset: { sourceExam: '' } });

	invalidate(KEYS.examById(examId));
	return exam;
};

// Updates primary details of a draft exam.
export const update = async (examId, teacherId, updates) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (exam.status !== 'draft') {
		throw ApiError.Forbidden('Only draft exams can be fully edited. For scheduled exams, you can only reschedule.');
	}

	const { title, description, duration, startTime, endTime, aiPolicy, instructions, autoPublishResults } = updates;
	if (title !== undefined) exam.title = title;
	if (description !== undefined) exam.description = description;
	if (duration !== undefined) exam.duration = duration;
	if (startTime !== undefined) exam.startTime = startTime;
	if (endTime !== undefined) exam.endTime = endTime;
	if (aiPolicy !== undefined) exam.aiPolicy = aiPolicy;
	if (instructions !== undefined) exam.instructions = instructions;
	if (autoPublishResults !== undefined) exam.autoPublishResults = autoPublishResults;

	await exam.save({ validateBeforeSave: true });
	invalidate(KEYS.examById(examId));
	return exam;
};

// Deletes an exam and unlinks all questions associated with it.
export const remove = async (examId, teacherId) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (isScheduled(exam) || isLive(exam)) {
		throw ApiError.Forbidden('Cannot delete a live or scheduled exam. End/cancel it first.');
	}

	await Exam.findByIdAndDelete(examId);
	await Question.updateMany({ sourceExam: examId }, { $unset: { sourceExam: '' } });

	invalidate(KEYS.examById(examId));
	invalidate(KEYS.examStats(teacherId));
};

// Reorders questions inside a draft or scheduled exam.
export const reorderQuestions = async (examId, teacherId, order) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	if (!Array.isArray(order) || order.length === 0) throw ApiError.BadRequest('Order must be a non-empty array of question IDs');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden('Can only reorder questions on a draft or scheduled exam (not started)');
	}

	const current = exam.questions.map(id => String(id));
	const next = order.map(String);

	if (current.length !== next.length) throw ApiError.BadRequest('Order must include exactly the existing questions');
	const sameSet = current.every(id => next.includes(id)) && next.every(id => current.includes(id));
	if (!sameSet) throw ApiError.BadRequest('Order must match existing question set');

	exam.questions = next;
	await exam.save();
	invalidate(KEYS.examById(examId));
	return exam;
};

// Replaces the entire set of questions on a draft/scheduled exam with a new set.
export const setQuestions = async (examId, teacherId, questionIds) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	if (!Array.isArray(questionIds)) throw ApiError.BadRequest('questionIds must be an array');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);
	if (exam.status !== 'draft' && !isScheduled(exam)) {
		throw ApiError.Forbidden('Can only change questions on a draft or scheduled exam (not started)');
	}

	const owned = await Question.find({ _id: { $in: questionIds }, createdBy: teacherId }).select('_id max_marks type');
	if (owned.length !== questionIds.length) {
		throw ApiError.BadRequest('Some questions do not belong to you or do not exist');
	}

	const limitError = checkQuestionLimits(owned);
	if (limitError) throw ApiError.BadRequest(limitError);

	const prev = new Set(exam.questions.map(id => String(id)));
	const next = new Set(questionIds.map(String));
	const added = [...next].filter(id => !prev.has(id));
	const removed = [...prev].filter(id => !next.has(id));

	exam.questions = questionIds;
	exam.totalMarks = owned.reduce((sum, q) => sum + (q.max_marks || 0), 0);
	await exam.save();

	if (added.length) await Question.updateMany({ _id: { $in: added } }, { $set: { sourceExam: exam._id } });
	if (removed.length) await Question.updateMany({ _id: { $in: removed } }, { $unset: { sourceExam: '' } });

	invalidate(KEYS.examById(examId));
	return exam;
};

// Creates a new question and automatically attaches it to a draft exam.
export const createAndAttachQuestion = async (examId, teacherId, qData) => {
	const { type, text, remarks, max_marks, options, answer } = qData;
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);
	if (exam.status !== 'draft') throw ApiError.Forbidden('Can only add questions to a draft exam');

	if (!type || !text || !max_marks) throw ApiError.BadRequest('Type, text, and max_marks are required');
	if (type === 'multiple-choice') {
		if (!Array.isArray(options) || options.length < 2) throw ApiError.BadRequest('MCQ must have at least 2 options');
		if (!options.some(o => o.isCorrect)) throw ApiError.BadRequest('Mark at least one option as correct');
	}

	const q = new Question({
		type, text, remarks, max_marks, options,
		answer: type === 'subjective' ? answer || null : undefined,
		createdBy: teacherId, sourceExam: exam._id,
	});
	await q.save();

	exam.questions.push(q._id);
	await exam.save();
	invalidate(KEYS.examById(examId));
	return q;
};

// Duplicates an existing exam into a new draft copy, shifting start/end times by 7 days.
export const duplicate = async (examId, teacherId) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const src = await Exam.findById(examId);
	if (!src) throw ApiError.NotFound('Exam not found');
	assertOwner(src, teacherId);

	const now = new Date();
	const shiftDays = 7;
	const shift = ms => new Date(ms + shiftDays * 24 * 60 * 60 * 1000);
	const start = src.startTime ? shift(new Date(src.startTime).getTime()) : new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
	const end = src.endTime && src.startTime ? shift(new Date(src.endTime).getTime()) : new Date(start.getTime() + 2 * 60 * 60 * 1000);

	const copy = new Exam({
		title: `${src.title} (Copy)`,
		description: src.description,
		instructions: src.instructions,
		duration: src.duration,
		questions: src.questions,
		startTime: start,
		endTime: end,
		createdBy: teacherId,
		status: 'draft',
		aiPolicy: src.aiPolicy,
		autoPublishResults: src.autoPublishResults,
	});
	await copy.save();
	invalidate(KEYS.examStats(teacherId));
	return copy;
};

// Force-ends a live exam (set status to 'completed') or cancels a scheduled exam.
export const endNow = async (examId, teacherId, io) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	const scheduledFlag = isScheduled(exam);
	const liveFlag = isLive(exam);

	if (!liveFlag && !scheduledFlag) throw ApiError.Forbidden('Only live or scheduled exams can be ended/cancelled now');

	if (liveFlag) {
		exam.status = 'completed';
		exam.endTime = new Date();
		await exam.save();
		if (io) io.to(String(teacherId)).emit('exam-updated', { examId });
		invalidate(KEYS.examById(examId));
		invalidate(KEYS.examStats(teacherId));
		return exam;
	}

	exam.status = 'cancelled';
	await exam.save();
	if (io) io.to(String(teacherId)).emit('exam-updated', { examId });
	invalidate(KEYS.examById(examId));
	invalidate(KEYS.examStats(teacherId));
	return exam;
};

// Cancels a scheduled exam (not yet started) by changing its status to 'cancelled'.
export const cancel = async (examId, teacherId) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!isScheduled(exam)) throw ApiError.Forbidden('Only scheduled (not started) exams can be cancelled');

	exam.status = 'cancelled';
	await exam.save();
	invalidate(KEYS.examById(examId));
	invalidate(KEYS.examStats(teacherId));
	return exam;
};

// Extends the end time of a scheduled or live exam by a set number of minutes or to an explicit new time.
export const extend = async (examId, teacherId, minutes, endTime) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!(isScheduled(exam) || isLive(exam))) throw ApiError.Forbidden('Only scheduled or live exams can be extended');

	let newEnd;
	if (typeof minutes === 'number' && minutes > 0) {
		const base = exam.endTime ? new Date(exam.endTime).getTime() : Date.now();
		newEnd = new Date(base + minutes * 60 * 1000);
	} else if (endTime) {
		newEnd = new Date(endTime);
	} else {
		throw ApiError.BadRequest('Provide minutes or endTime');
	}

	if (!exam.startTime || newEnd <= new Date(exam.startTime)) throw ApiError.BadRequest('New end time must be after start time');
	if (newEnd <= new Date()) throw ApiError.BadRequest('New end time must be in the future');

	exam.endTime = newEnd;
	await exam.save();
	invalidate(KEYS.examById(examId));
	return exam;
};

// Regenerates a unique searchId/join code for a draft or scheduled exam.
export const regenerateCode = async (examId, teacherId) => {
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');
	const exam = await Exam.findById(examId);
	if (!exam) throw ApiError.NotFound('Exam not found');
	assertOwner(exam, teacherId);

	if (!isScheduled(exam) && exam.status !== 'draft') throw ApiError.Forbidden('Can only regenerate code for draft or scheduled exams');

	const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz23456789';
	const genCode = (len = 8) => Array.from({ length: len }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');

	let newCode = genCode();
	let attempts = 0;
	while (await Exam.findOne({ searchId: newCode }).select('_id').lean()) {
		if (attempts++ > 10) throw new ApiError(500, 'Failed to generate a unique share code. Please try again.');
		newCode = genCode();
	}

	exam.searchId = newCode;
	await exam.save();
	invalidate(KEYS.examById(examId));
	return newCode;
};
