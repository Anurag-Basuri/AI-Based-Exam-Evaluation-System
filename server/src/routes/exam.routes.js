import { Router } from 'express';
import {
	createExam,
	addQuestionsToExam,
	removeQuestionsFromExam,
	getAllExams,
	getExamById,
	updateExam,
	deleteExam,
	searchExamByCode,
} from '../controllers/exam.controller.js';
import { checkAuth, verifyStudent, verifyTeacher } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';

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

// Get single exam by ID
router.get('/:id', checkAuth, getExamById);

// Update exam
router.put('/:id/update', checkAuth, verifyTeacher, updateExam);

// Delete exam
router.delete('/:id', checkAuth, verifyTeacher, deleteExam);

// Student: search exam by search ID
router.get('/search/:code', checkAuth, verifyStudent, searchExamByCode);

export default router;
