import { Router } from 'express';
import {
    createQuestion,
    getTeacherQuestions,
    getQuestionById,
    updateQuestion,
    deleteQuestion,
} from '../controllers/question.controller.js';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import { body, param } from 'express-validator';

const router = Router();

// Create a question (teacher only)
router.post(
    '/create',
    checkAuth,
    verifyTeacher,
    body('type').notEmpty().withMessage('Type is required'),
    body('text').notEmpty().withMessage('Text is required'),
    body('max_marks').notEmpty().withMessage('Max marks is required'),
    createQuestion
);

// Get all questions for the logged-in teacher
router.get(
    '/all/teacher',
    checkAuth,
    verifyTeacher,
    getTeacherQuestions
);

// Get a single question by ID
router.get(
    '/:id',
    checkAuth,
    verifyTeacher,
    param('id').notEmpty().withMessage('Question ID is required'),
    getQuestionById
);

// Update a question (teacher only)
router.put(
    '/:id/update',
    checkAuth,
    verifyTeacher,
    param('id').notEmpty().withMessage('Question ID is required'),
    updateQuestion
);

// Delete a question (teacher only)
router.delete(
    '/:id',
    checkAuth,
    verifyTeacher,
    param('id').notEmpty().withMessage('Question ID is required'),
    deleteQuestion
);

export default router;