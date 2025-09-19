import { Router } from 'express';
import {
    createExam,
    addQuestionsToExam,
    removeQuestionsFromExam,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
} from '../controllers/exam.controller.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';

const router = Router();

// Create exam
router.post(
    '/create',
    authMiddleware.checkAuth,
    authMiddleware.verifyTeacher,
    body('title').notEmpty().withMessage('Title is required'),
    body('description').notEmpty().withMessage('Description is required'),
    createExam
);

// Add questions to exam (PATCH)
router.patch(
    '/:id/questions',
    authMiddleware.checkAuth,
    authMiddleware.verifyTeacher,
    body('questionIds').isArray().withMessage('questionIds must be an array'),
    addQuestionsToExam
);

// Remove questions from exam (PATCH)
router.patch(
    '/:id/questions/remove',
    authMiddleware.checkAuth,
    authMiddleware.verifyTeacher,
    body('questionIds').isArray().withMessage('questionIds must be an array'),
    removeQuestionsFromExam
);

// Get all exams (optionally filter by teacher)
router.get('/all', authMiddleware.checkAuth, getAllExams);

// Get single exam by ID
router.get('/:id', authMiddleware.checkAuth, getExamById);

// Update exam
router.put(
    '/:id/update',
    authMiddleware.checkAuth,
    authMiddleware.verifyTeacher,
    updateExam
);

// Delete exam
router.delete(
    '/:id',
    authMiddleware.checkAuth,
    authMiddleware.verifyTeacher,
    deleteExam
);

export default router;