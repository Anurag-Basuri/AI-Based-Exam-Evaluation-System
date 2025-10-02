import { Router } from 'express';
import {
	startSubmission,
	syncAnswers,
	submitSubmission,
	updateEvaluation,
	evaluateSubmission,
	getSubmission,
	getExamSubmissions,
	getMySubmissions, // added
} from '../controllers/submission.controller.js';
import { checkAuth, verifyStudent, verifyTeacher } from '../middlewares/auth.middleware.js';
import { body, param, query } from 'express-validator';

const router = Router();

// Student starts a submission (enters the exam)
router.post(
	'/start',
	checkAuth,
	verifyStudent,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	startSubmission,
);

// Student syncs answers during exam
router.patch(
	'/sync',
	checkAuth,
	verifyStudent,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	body('answers').isArray().withMessage('Answers must be an array'),
	syncAnswers,
);

// Student submits the exam (manual submit)
router.post(
	'/submit',
	checkAuth,
	verifyStudent,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	submitSubmission,
);

// Teacher updates evaluation/marks for a submission
router.patch(
	'/:id/evaluate',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Submission ID is required'),
	body('evaluations').isArray().withMessage('Evaluations must be an array'),
	updateEvaluation,
);

// Teacher manually triggers evaluation (if needed)
router.post(
	'/:id/auto-evaluate',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Submission ID is required'),
	evaluateSubmission,
);

// Get a student's submission for an exam
router.get(
	'/student',
	checkAuth,
	verifyStudent,
	query('examId').notEmpty().withMessage('Exam ID is required'),
	query('studentId').notEmpty().withMessage('Student ID is required'),
	getSubmission,
);

// Get all submissions for an exam (teacher)
router.get(
	'/exam/:id',
	checkAuth,
	verifyTeacher,
	param('id').notEmpty().withMessage('Exam ID is required'),
	getExamSubmissions,
);

// List submissions for the logged-in student
router.get('/my', checkAuth, verifyStudent, getMySubmissions);

export default router;
