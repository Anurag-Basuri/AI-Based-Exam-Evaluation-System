import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { checkAuth, verifyStudent, verifyTeacher } from '../middlewares/auth.middleware.js';
import {
	startSubmission,
	syncAnswers,
	submitSubmission,
	updateEvaluation,
	evaluateSubmission,
	getSubmission,
	getExamSubmissions,
	getMySubmissions,
	startSubmissionByParam,
	getSubmissionByIdParam,
	syncAnswersBySubmissionId,
	submitSubmissionById,
	logViolation,
	testEvaluationService,
	publishSingleSubmissionResult,
	publishAllExamResults,
	getSubmissionForGrading,
} from '../controllers/submission.controller.js';

const router = Router();

// Directly test the AI evaluation service with a sample question/answer
router.post(
	'/test-evaluation',
	testEvaluationService
);
router.get(
	'/my-submissions',
	checkAuth,
	verifyStudent,
	getMySubmissions
);

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

// Compat: sync by submissionId
router.post(
	'/:id/answers',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	syncAnswersBySubmissionId,
);

// Log a violation during an exam
router.post(
	'/:id/violation',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	body('type').notEmpty().withMessage('Violation type is required'),
	logViolation,
);

// Student submits the exam (manual submit)
router.post(
	'/submit',
	checkAuth,
	verifyStudent,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	submitSubmission,
);

// Compat: submit by submissionId
router.post(
	'/:id/submit',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	submitSubmissionById,
);

// --- Teacher-facing routes ---
router.get(
	'/exam/:id',
	checkAuth,
	verifyTeacher,
	getExamSubmissions
);
router.put(
	'/:id/evaluate',
	checkAuth,
	verifyTeacher,
	updateEvaluation
);
router.post(
	'/:id/evaluate-auto',
	checkAuth,
	verifyTeacher,
	evaluateSubmission
);

// --- Get a single submission for grading (Teacher Only) ---
router.get(
	'/teacher/:id',
	checkAuth,
	verifyTeacher,
	getSubmissionForGrading
);

// --- Result Publishing Routes (Teacher Only) ---
router.post(
	'/:id/publish',
	checkAuth,
	verifyTeacher,
	publishSingleSubmissionResult
);
router.post(
	'/exam/:examId/publish-all',
	checkAuth,
	verifyTeacher,
	publishAllExamResults
);

// --- Testing ---
router.post(
	'/test-eval',
	checkAuth,
	verifyTeacher,
	testEvaluationService
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

// Get submission by ID (for resume) — keep this last
router.get(
	'/:id',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	getSubmissionByIdParam,
);

export default router;
