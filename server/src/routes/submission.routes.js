import { Router } from 'express';
import {
	startSubmission,
	syncAnswers,
	submitSubmission,
	updateEvaluation,
	evaluateSubmission,
	getSubmission, // query-based
	getExamSubmissions,
	getMySubmissions,
	getSubmissionByIdParam,
	syncAnswersBySubmissionId,
	submitSubmissionById,
	startSubmissionByParam,
	logViolation, // <-- Add new import
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

// Alternate start using URL param (compat)
router.post(
	'/start/:id',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Exam ID is required'),
	startSubmissionByParam,
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

// Compat: sync by submissionId
router.patch(
	'/:id/answers',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	body('answers').isArray().withMessage('Answers must be an array'),
	syncAnswersBySubmissionId,
);

// --- NEW ROUTE ---
// Log a violation during an exam
router.post(
	'/:id/violation',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	body('type').notEmpty().withMessage('Violation type is required'),
	logViolation,
);
// --- END NEW ROUTE ---

// Student submits the exam (manual submit)
router.post(
	'/submit',
	checkAuth,
	verifyStudent,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	submitSubmission,
);

// Compat: submit by submissionId
router.patch(
	'/:id/submit',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	submitSubmissionById,
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

// Get a student's submission for an exam (query)
router.get(
	'/student',
	checkAuth,
	verifyStudent,
	query('examId').notEmpty().withMessage('Exam ID is required'),
	query('studentId').notEmpty().withMessage('Student ID is required'),
	getSubmission,
);

// Order matters: specific routes BEFORE the catch-all '/:id'

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

// Get submission by ID (for resume) — keep this last
router.get(
	'/:id',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	getSubmissionByIdParam,
);

export default router;
