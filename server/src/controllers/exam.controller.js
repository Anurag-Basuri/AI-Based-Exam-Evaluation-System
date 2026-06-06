import mongoose from 'mongoose';
import Exam from '../models/exam.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { syncExamStatuses } from '../services/examStatus.service.js';
import * as ExamService from '../services/exam.service.js';
import { getCachedOrFetch } from '../services/cache.service.js';

const createExam = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	const exam = await ExamService.create(req.body, teacherId);
	return ApiResponse.success(res, exam, 'Exam created successfully', 201);
});

const addQuestionsToExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.addQuestions(req.params.id, req.userDoc?._id || req.user?.id, req.body.questionIds);
	return ApiResponse.success(res, exam, 'Questions added to exam');
});

const removeQuestionsFromExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.removeQuestions(req.params.id, req.userDoc?._id || req.user?.id, req.body.questionIds);
	return ApiResponse.success(res, exam, 'Questions removed from exam');
});

const getAllExams = asyncHandler(async (req, res) => {
	const { teacher, status, q } = req.query;
	const filter = {};
	if (teacher) filter.createdBy = teacher;
	if (status) filter.status = String(status).toLowerCase();
	if (q) filter.title = { $regex: String(q), $options: 'i' };

	const exams = await Exam.find(filter)
		.sort({ createdAt: -1 })
		.select('_id title description status searchId startTime endTime duration questions createdBy')
		.lean();
	return ApiResponse.success(res, exams, 'Exams fetched');
});

const getMyExams = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	const { status, q, sortBy = 'updatedAt', limit = 20, page = 1, hasSubmissions } = req.query;
	const lim = Math.max(1, Math.min(100, Number(limit)));
	const skip = (Math.max(1, Number(page)) - 1) * lim;

	const pipeline = [];
	const matchStage = { createdBy: new mongoose.Types.ObjectId(teacherId) };
	if (status) matchStage.status = String(status).toLowerCase();
	if (q) matchStage.title = { $regex: String(q), $options: 'i' };
	pipeline.push({ $match: matchStage });

	pipeline.push({
		$lookup: {
			from: 'submissions',
			localField: '_id',
			foreignField: 'exam',
			as: 'submissionDocs',
		},
	});

	if (hasSubmissions === 'true') {
		pipeline.push({ $match: { 'submissionDocs.0': { $exists: true } } });
	}

	pipeline.push({
		$addFields: {
			submissionCount: { $size: '$submissionDocs' },
			enrolledCount: { $size: '$submissionDocs' },
			questionCount: { $size: '$questions' },
			evaluatedCount: {
				$size: {
					$filter: { input: '$submissionDocs', as: 'sub', cond: { $eq: ['$$sub.status', 'evaluated'] } },
				},
			},
			publishedCount: {
				$size: {
					$filter: { input: '$submissionDocs', as: 'sub', cond: { $eq: ['$$sub.status', 'published'] } },
				},
			},
		},
	});

	pipeline.push({
		$project: {
			_id: 1, title: 1, status: 1, searchId: 1, startTime: 1, endTime: 1, duration: 1, updatedAt: 1,
			submissionCount: 1, enrolledCount: 1, questionCount: 1, evaluatedCount: 1, publishedCount: 1,
			totalMarks: 1, instructions: 1, autoPublishResults: 1,
		},
	});

	const sortStage = {};
	if (sortBy === 'start') sortStage.startTime = -1;
	else if (sortBy === 'title') sortStage.title = 1;
	else sortStage.updatedAt = -1;
	pipeline.push({ $sort: sortStage });

	const paginatedPipeline = [...pipeline, { $skip: skip }, { $limit: lim }];
	const examsPromise = Exam.aggregate(paginatedPipeline);
	const totalPromise = Exam.aggregate([...pipeline, { $count: 'total' }]);

	const [exams, totalResult] = await Promise.all([examsPromise, totalPromise]);
	const total = totalResult[0]?.total || 0;

	return ApiResponse.success(res, { items: exams, page: Number(page), limit: lim, total }, 'Your exams');
});

const getExamById = asyncHandler(async (req, res) => {
	const examId = req.params.id;
	if (!examId || !examId.match(/^[a-f\d]{24}$/i)) throw ApiError.BadRequest('Invalid exam ID');

	const exam = await getCachedOrFetch(`exam:${examId}`, 300, async () => {
		return Exam.findById(examId)
			.populate('createdBy', 'fullname email')
			.populate({ path: 'questions', select: '-__v', populate: { path: 'createdBy', select: 'fullname email' } })
			.lean();
	});

	if (!exam) throw ApiError.NotFound('Exam not found');
	return ApiResponse.success(res, exam, 'Exam details fetched');
});

const updateExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.update(req.params.id, req.userDoc?._id || req.user?.id, req.body);
	return ApiResponse.success(res, exam, 'Exam updated successfully');
});

const deleteExam = asyncHandler(async (req, res) => {
	await ExamService.remove(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, { success: true }, 'Exam deleted successfully');
});

const searchExamByCode = asyncHandler(async (req, res) => {
	const raw = String(req.params.code || req.query.code || '').trim();
	if (!raw) throw ApiError.BadRequest('Exam search ID is required');

	const code = raw.toUpperCase();
	const exam = await Exam.findOne({ searchId: code })
		.select('_id title description duration status startTime endTime questions')
		.lean();

	if (!exam) throw ApiError.NotFound('No exam found for the provided search ID');

	const now = new Date();
	if (String(exam.status).toLowerCase() !== 'active') throw ApiError.Forbidden('This exam is not active');
	if (exam.startTime && now < new Date(exam.startTime)) throw ApiError.Forbidden('This exam has not started yet');
	if (exam.endTime && now > new Date(exam.endTime)) throw ApiError.Forbidden('This exam has ended');

	return ApiResponse.success(res, exam, 'Exam found');
});

const publishExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.publish(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, exam, 'Exam published');
});

const reorderExamQuestions = asyncHandler(async (req, res) => {
	const exam = await ExamService.reorderQuestions(req.params.id, req.userDoc?._id || req.user?.id, req.body.order);
	return ApiResponse.success(res, exam, 'Question order updated');
});

const setExamQuestions = asyncHandler(async (req, res) => {
	const exam = await ExamService.setQuestions(req.params.id, req.userDoc?._id || req.user?.id, req.body.questionIds);
	return ApiResponse.success(res, exam, 'Exam questions updated');
});

const createAndAttachQuestion = asyncHandler(async (req, res) => {
	const q = await ExamService.createAndAttachQuestion(req.params.id, req.userDoc?._id || req.user?.id, req.body);
	return ApiResponse.success(res, q, 'Question created and attached', 201);
});

const duplicateExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.duplicate(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, exam, 'Exam duplicated', 201);
});

const syncStatusesNow = asyncHandler(async (req, res) => {
	const result = await syncExamStatuses();
	return ApiResponse.success(res, result, 'Exam statuses synchronized');
});

const endExamNow = asyncHandler(async (req, res) => {
	const exam = await ExamService.endNow(req.params.id, req.userDoc?._id || req.user?.id, req.app.get('io'));
	return ApiResponse.success(res, exam, exam.status === 'cancelled' ? 'Scheduled exam cancelled (ended)' : 'Exam ended');
});

const cancelExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.cancel(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, exam, 'Exam cancelled');
});

const extendExam = asyncHandler(async (req, res) => {
	const exam = await ExamService.extend(req.params.id, req.userDoc?._id || req.user?.id, req.body.minutes, req.body.endTime);
	return ApiResponse.success(res, exam, 'Exam end time extended');
});

const regenerateExamCode = asyncHandler(async (req, res) => {
	const newCode = await ExamService.regenerateCode(req.params.id, req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, { searchId: newCode }, 'Share code regenerated');
});

const getExamStats = asyncHandler(async (req, res) => {
	const result = await ExamService.getStats(req.userDoc?._id || req.user?.id);
	return ApiResponse.success(res, result, 'Exam stats fetched');
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
	getExamStats,
};
