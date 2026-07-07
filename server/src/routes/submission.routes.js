import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import {
	checkAuth,
	verifyStudent,
	verifyTeacher,
	requireVerifiedEmail,
} from '../middlewares/auth.middleware.js';
import { submissionLimiter, aiEvalLimiter, exportLimiter, sensitiveWriteLimiter, authLimiter } from '../middlewares/rateLimit.middleware.js';
import {
	startSubmission,
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
	getSubmissionForResults,
	exportExamSubmissionsList,
	getSubmissionStatus,
	overrideEvaluation,
} from '../controllers/submission.controller.js';

const router = Router();

// Directly test the AI evaluation service with a sample question/answer
router.post('/test-evaluation', authLimiter, testEvaluationService);
router.get('/my-submissions', checkAuth, verifyStudent, getMySubmissions);

// --- Student gets their own submission details for the results page ---
router.get(
	'/results/:id',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	validate,
	getSubmissionForResults,
);

// Student gets their own submission by ID (for taking the exam)
router.get(
	'/:id',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	validate,
	getSubmissionByIdParam,
);

// Student starts a submission (enters the exam)
router.post(
	'/start',
	checkAuth,
	verifyStudent,
	requireVerifiedEmail,
	submissionLimiter,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	validate,
	startSubmission,
);

// Alternate start using URL param (compat)
router.post(
	'/start/:id',
	checkAuth,
	verifyStudent,
	requireVerifiedEmail,
	submissionLimiter,
	param('id').notEmpty().withMessage('Exam ID is required'),
	validate,
	startSubmissionByParam,
);

// Compat: sync by submissionId
router.patch(
	'/:id/answers',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	validate,
	syncAnswersBySubmissionId,
);

// Log a violation during an exam
router.post(
	'/:id/violation',
	checkAuth,
	verifyStudent,
	param('id').notEmpty().withMessage('Submission ID is required'),
	body('type').notEmpty().withMessage('Violation type is required'),
	validate,
	logViolation,
);

// Student submits the exam (manual submit)
router.post(
	'/submit',
	checkAuth,
	verifyStudent,
	submissionLimiter,
	body('examId').notEmpty().withMessage('Exam ID is required'),
	validate,
	submitSubmission,
);

// Compat: submit by submissionId
router.post(
	'/:id/submit',
	checkAuth,
	verifyStudent,
	submissionLimiter,
	param('id').notEmpty().withMessage('Submission ID is required'),
	validate,
	submitSubmissionById,
);

// --- Teacher-facing routes ---
router.get('/exam/:id', checkAuth, verifyTeacher, getExamSubmissions);
router.put('/:id/evaluate', checkAuth, verifyTeacher, sensitiveWriteLimiter, updateEvaluation);
router.post('/:id/evaluate-auto', checkAuth, verifyTeacher, aiEvalLimiter, evaluateSubmission);
router.patch('/:id/override', checkAuth, verifyTeacher, sensitiveWriteLimiter, overrideEvaluation);

// --- Get a single submission for grading (Teacher Only) ---
router.get('/teacher/:id', checkAuth, verifyTeacher, getSubmissionForGrading);

// --- Result Publishing Routes (Teacher Only) ---
router.post('/:id/publish', checkAuth, verifyTeacher, sensitiveWriteLimiter, publishSingleSubmissionResult);
router.post('/exam/:examId/publish-all', checkAuth, verifyTeacher, sensitiveWriteLimiter, publishAllExamResults);

// --- Export Routes (Teacher Only) ---
router.get('/exam/:id/export', checkAuth, verifyTeacher, exportLimiter, exportExamSubmissionsList);

// --- Testing ---
router.post('/test-eval', checkAuth, verifyTeacher, aiEvalLimiter, testEvaluationService);

// Get a student's submission for an exam (query)
router.get(
	'/student',
	checkAuth,
	verifyStudent,
	query('examId').notEmpty().withMessage('Exam ID is required'),
	query('studentId').notEmpty().withMessage('Student ID is required'),
	validate,
	getSubmission,
);

// Polling: get submission status (lightweight)
router.get(
	'/:id/status',
	checkAuth,
	param('id').notEmpty().withMessage('Submission ID is required'),
	validate,
	getSubmissionStatus,
);

export default router;
