import { Router } from 'express';
import {
    createStudent,
    loginStudent,
    logoutStudent,
    getStudentProfile,
    updateStudent,
    changePassword,
    verifyStudentEmail,
    resendStudentVerification,
    forgotStudentPassword,
    resetStudentPassword,
    exportStudentProfile,
    exportStudentSubmissions
} from '../controllers/student.controller.js';
import { checkAuth, verifyStudent } from '../middlewares/auth.middleware.js';
import { authLimiter, emailLimiter, verifyLimiter } from '../middlewares/rateLimit.middleware.js';
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
    body('password').notEmpty().withMessage('Password is required'),
    createStudent
);

// Student login
router.post(
    '/login',
    authLimiter,
    body('username').optional(),
    body('email').optional().isEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    loginStudent
);

// ── Public: Email verification & Password reset ──────────────────

// Verify email with token (from email link)
router.post(
    '/verify-email',
    verifyLimiter,
    body('token').notEmpty().withMessage('Verification token is required'),
    verifyStudentEmail
);

// Forgot password — sends reset email
router.post(
    '/forgot-password',
    emailLimiter,
    body('email').isEmail().withMessage('Valid email is required'),
    forgotStudentPassword
);

// Reset password with token
router.post(
    '/reset-password',
    verifyLimiter,
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    resetStudentPassword
);

// ── Authenticated routes ─────────────────────────────────────────

// Student logout
router.post(
    '/logout',
    checkAuth,
    verifyStudent,
    logoutStudent
);

// Get student profile
router.get(
    '/profile',
    checkAuth,
    verifyStudent,
    getStudentProfile
);

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
    updateStudent
);

// Change password
router.put(
    '/change-password',
    checkAuth,
    verifyStudent,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required'),
    changePassword
);

// Resend verification email
router.post(
    '/resend-verification',
    emailLimiter,
    checkAuth,
    verifyStudent,
    resendStudentVerification
);

// ── Export Routes ────────────────────────────────────────────────

// Export profile to CSV
router.get(
    '/export/profile',
    checkAuth,
    verifyStudent,
    exportStudentProfile
);

// Export submissions to CSV
router.get(
    '/export/submissions',
    checkAuth,
    verifyStudent,
    exportStudentSubmissions
);

export default router;