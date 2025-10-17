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

// Student: search exam by search ID
// NOTE: Place this BEFORE '/:id' to avoid route shadowing.
router.get('/search/:code', checkAuth, verifyStudent, searchExamByCode);

// Get single exam by ID
router.get('/:id', checkAuth, getExamById);

// Update exam
router.put('/:id/update', checkAuth, verifyTeacher, updateExam);

// Delete exam
router.delete('/:id', checkAuth, verifyTeacher, deleteExam);

// Fast list for the logged-in teacher
router.get('/mine', checkAuth, verifyTeacher, getMyExams);

// Publish (draft -> active)
router.post('/:id/publish', checkAuth, verifyTeacher, publishExam);

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
