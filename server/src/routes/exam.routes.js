import { Router } from 'express';
import { body } from 'express-validator';
import { checkAuth, verifyStudent, verifyTeacher } from '../middlewares/auth.middleware.js';
import {
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
} from '../controllers/exam.controller.js';

const router = Router();

// Create exam
router.post(
	'/create',
	checkAuth,
	verifyTeacher,
	body('title').notEmpty().withMessage('Title is required'),
	body('description').notEmpty().withMessage('Description is required'),
	createExam,
);

// Add questions to exam (PATCH)
router.patch(
	'/:id/questions',
	checkAuth,
	verifyTeacher,
	body('questionIds').isArray().withMessage('questionIds must be an array'),
	addQuestionsToExam,
);

// Remove questions from exam (PATCH)
router.patch(
	'/:id/questions/remove',
	checkAuth,
	verifyTeacher,
	body('questionIds').isArray().withMessage('questionIds must be an array'),
	removeQuestionsFromExam,
);

// Get all exams (optionally filter by teacher)
router.get('/all', checkAuth, getAllExams);

// Student: search exam by search ID (keep before '/:id')
router.get('/search/:code', checkAuth, verifyStudent, searchExamByCode);

// Fast list for the logged-in teacher  <-- move this BEFORE '/:id'
router.get('/mine', checkAuth, verifyTeacher, getMyExams);

// Optional: ops/testing — trigger a sync now
router.post('/sync-status', checkAuth, verifyTeacher, syncStatusesNow);

// Get single exam by ID
router.get('/:id', checkAuth, getExamById);

// Update exam
router.put('/:id/update', checkAuth, verifyTeacher, updateExam);

// Delete exam
router.delete('/:id', checkAuth, verifyTeacher, deleteExam);

// Publish (draft -> active)
router.post('/:id/publish', checkAuth, verifyTeacher, publishExam);

// End live exam immediately
router.post('/:id/end-now', checkAuth, verifyTeacher, endExamNow);

// Cancel a scheduled (not started) exam
router.post('/:id/cancel', checkAuth, verifyTeacher, cancelExam);

// Extend end time (body: { minutes?: number, endTime?: ISOString })
router.patch('/:id/extend', checkAuth, verifyTeacher, extendExam);

// Regenerate share/search code
router.post('/:id/regenerate-code', checkAuth, verifyTeacher, regenerateExamCode);

// Reorder questions (order only)
router.patch(
	'/:id/reorder',
	checkAuth,
	verifyTeacher,
	body('order').isArray({ min: 1 }).withMessage('order array required'),
	reorderExamQuestions,
);

// Replace full question set
router.patch(
	'/:id/questions/set',
	checkAuth,
	verifyTeacher,
	body('questionIds').isArray().withMessage('questionIds array required'),
	setExamQuestions,
);

// Quick create-and-attach a question
router.post(
	'/:id/questions/create',
	checkAuth,
	verifyTeacher,
	body('type').notEmpty().withMessage('Type is required'),
	body('text').notEmpty().withMessage('Text is required'),
	body('max_marks').notEmpty().withMessage('Max marks is required'),
	createAndAttachQuestion,
);

// Duplicate exam
router.post('/:id/duplicate', checkAuth, verifyTeacher, duplicateExam);

export default router;
