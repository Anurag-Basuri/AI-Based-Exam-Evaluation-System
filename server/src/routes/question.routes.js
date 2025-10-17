import { Router } from 'express';
import { body } from 'express-validator';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import {
	createQuestion,
	getTeacherQuestions,
	getQuestionById,
	updateQuestion,
	deleteQuestion,
	createQuestionsBulk,
} from '../controllers\question.controller.js';

const router = Router();

// Create a question (teacher only)
router.post(
	'/create',
	checkAuth,
	verifyTeacher,
	body('type').notEmpty().withMessage('Type is required'),
	body('text').notEmpty().withMessage('Text is required'),
	body('max_marks').notEmpty().withMessage('Max marks is required'),
	createQuestion,
);

// Get all questions for the logged-in teacher (now supports q,type,page,limit)
router.get('/mine', checkAuth, verifyTeacher, getTeacherQuestions);

// Bulk create questions
router.post(
	'/bulk',
	checkAuth,
	verifyTeacher,
	body('items').isArray({ min: 1 }).withMessage('items must be an array'),
	createQuestionsBulk,
);

// Get a single question by ID
router.get(
	'/:id',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Question ID is required'),
	getQuestionById,
);

// Update a question (teacher only)
router.put(
	'/:id/update',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Question ID is required'),
	updateQuestion,
);

// Delete a question (teacher only)
router.delete(
	'/:id',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Question ID is required'),
	deleteQuestion,
);

export default router;
