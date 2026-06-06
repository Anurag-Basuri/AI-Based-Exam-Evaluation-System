import { Router } from 'express';
import {
	createStudent,
	loginStudent,
	googleLoginStudent,
	logoutStudent,
	getStudentProfile,
	updateStudent,
	changePassword,
	verifyStudentEmail,
	resendStudentVerification,
	forgotStudentPassword,
	resetStudentPassword,
	exportStudentProfile,
	exportStudentSubmissions,
	refreshStudentToken,
} from '../controllers/student.controller.js';
import { checkAuth, verifyStudent } from '../middlewares/auth.middleware.js';
import { authLimiter, emailLimiter, verifyLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { body } from 'express-validator';

const router = Router();

// ── Public: Auth ──────────────────────────────────────────────────

// Register a new student
router.post(
	'/register',
	authLimiter,
	body('username').notEmpty().withMessage('Username is required'),
	body('fullname').notEmpty().withMessage('Full name is required'),
	body('email').isEmail().withMessage('Valid email is required'),
	body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
	validate,
	createStudent,
);

// Student login
router.post(
	'/login',
	authLimiter,
	body('username').optional(),
	body('email').optional().isEmail(),
	body('password').notEmpty().withMessage('Password is required'),
	validate,
	loginStudent,
);

// Student Google login
router.post(
	'/google-login',
	authLimiter,
	body('idToken').notEmpty().withMessage('Google ID token is required'),
	validate,
	googleLoginStudent,
);

// ── Public: Email verification & Password reset ──────────────────

// Verify email with token (from email link)
router.post(
	'/verify-email',
	verifyLimiter,
	body('token').notEmpty().withMessage('Verification token is required'),
	validate,
	verifyStudentEmail,
);

// Forgot password — sends reset email
router.post(
	'/forgot-password',
	emailLimiter,
	body('email').isEmail().withMessage('Valid email is required'),
	validate,
	forgotStudentPassword,
);

// Reset password with token
router.post(
	'/reset-password',
	verifyLimiter,
	body('token').notEmpty().withMessage('Reset token is required'),
	body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
	validate,
	resetStudentPassword,
);

// ── Authenticated routes ─────────────────────────────────────────

// Student logout
router.post('/logout', checkAuth, verifyStudent, logoutStudent);

// Get student profile
router.get('/profile', checkAuth, verifyStudent, getStudentProfile);

// Update student profile
router.put(
	'/update',
	checkAuth,
	verifyStudent,
	body('username').optional(),
	body('fullname').optional(),
	body('email').optional().isEmail(),
	body('phonenumber').optional(),
	body('gender').optional(),
	body('address').optional(),
	validate,
	updateStudent,
);

// Change password
router.put(
	'/change-password',
	checkAuth,
	verifyStudent,
	body('currentPassword').notEmpty().withMessage('Current password is required'),
	body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
	validate,
	changePassword,
);

// Refresh auth token using refresh token
router.post(
	'/refresh-token',
	authLimiter,
	body('refreshToken').notEmpty().withMessage('Refresh token is required'),
	validate,
	refreshStudentToken,
);

// Resend verification email
router.post(
	'/resend-verification',
	emailLimiter,
	checkAuth,
	verifyStudent,
	resendStudentVerification,
);

// ── Export Routes ────────────────────────────────────────────────

// Export profile to CSV
router.get('/export/profile', checkAuth, verifyStudent, exportStudentProfile);

// Export submissions to CSV
router.get('/export/submissions', checkAuth, verifyStudent, exportStudentSubmissions);

export default router;
