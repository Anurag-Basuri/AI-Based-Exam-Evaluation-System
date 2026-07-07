import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import { sensitiveWriteLimiter } from '../middlewares/rateLimit.middleware.js';
import {
	createQuestion,
	getTeacherQuestions,
	getQuestionById,
	updateQuestion,
	deleteQuestion,
	createQuestionsBulk,
} from '../controllers/question.controller.js';

const router = Router();

// Create a question (teacher only)
router.post(
	'/create',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	body('type').notEmpty().withMessage('Type is required'),
	body('text').notEmpty().withMessage('Text is required'),
	body('max_marks').notEmpty().withMessage('Max marks is required'),
	validate,
	createQuestion,
);

// Get all questions for the logged-in teacher (now supports q,type,page,limit)
router.get('/my', checkAuth, verifyTeacher, getTeacherQuestions);

// Bulk create questions
router.post(
	'/bulk',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	body('items').isArray({ min: 1 }).withMessage('items must be an array'),
	validate,
	createQuestionsBulk,
);

// Get a single question by ID
router.get(
	'/:id',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Question ID is required'),
	validate,
	getQuestionById,
);

// Update a question (teacher only)
router.put(
	'/:id/update',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	param('id').notEmpty().withMessage('Question ID is required'),
	validate,
	updateQuestion,
);

// Delete a question (teacher only)
router.delete(
	'/:id',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	param('id').notEmpty().withMessage('Question ID is required'),
	validate,
	deleteQuestion,
);

export default router;

