import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import Question from '../models/question.model.js';
import { ApiError } from '../utils/ApiError.js';

// ── Helpers ──────────────────────────────────────────────────────

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

export const assertOwner = (doc, teacherId) => {
	if (!doc?.createdBy || String(doc.createdBy) !== String(teacherId)) {
		throw ApiError.Forbidden('Not authorized for this exam');
	}
};

// ── Operations ───────────────────────────────────────────────────

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

	return exam;
};

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

	return exam;
};

export const getStats = async teacherId => {
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
};
