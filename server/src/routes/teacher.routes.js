import { Router } from 'express';
import {
    createTeacher,
    loginTeacher,
    logoutTeacher,
    updateTeacher,
    changePassword,
    getDashboardStats,
    verifyTeacherEmail,
    resendTeacherVerification,
    forgotTeacherPassword,
    resetTeacherPassword,
    exportTeacherProfile,
    exportTeacherExams
} from '../controllers/teacher.controller.js';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import { authLimiter, emailLimiter, verifyLimiter } from '../middlewares/rateLimit.middleware.js';
import { body } from 'express-validator';

const router = Router();

// ── Public: Auth ──────────────────────────────────────────────────

// Register a new teacher
router.post(
    '/register',
    authLimiter,
    body('username').notEmpty().withMessage('Username is required'),
    body('fullname').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    createTeacher
);

// Teacher login
router.post(
    '/login',
    authLimiter,
    body('username').optional(),
    body('email').optional().isEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    loginTeacher
);

// ── Public: Email verification & Password reset ──────────────────

// Verify email with token (from email link)
router.post(
    '/verify-email',
    verifyLimiter,
    body('token').notEmpty().withMessage('Verification token is required'),
    verifyTeacherEmail
);

// Forgot password — sends reset email
router.post(
    '/forgot-password',
    emailLimiter,
    body('email').isEmail().withMessage('Valid email is required'),
    forgotTeacherPassword
);

// Reset password with token
router.post(
    '/reset-password',
    verifyLimiter,
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters'),
    resetTeacherPassword
);

// ── Authenticated routes ─────────────────────────────────────────

// Teacher logout
router.post(
    '/logout',
    checkAuth,
    verifyTeacher,
    logoutTeacher
);

// Update teacher profile
router.put(
    '/update',
    checkAuth,
    verifyTeacher,
    body('username').optional(),
    body('fullname').optional(),
    body('email').optional().isEmail(),
    body('phonenumber').optional(),
    body('gender').optional(),
    body('address').optional(),
    updateTeacher
);

// Change password
router.put(
    '/change-password',
    checkAuth,
    verifyTeacher,
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').notEmpty().withMessage('New password is required'),
    changePassword
);

// Get dashboard statistics for teacher
router.get(
    '/dashboard-stats',
    checkAuth,
    verifyTeacher,
    getDashboardStats
);

// Resend verification email
router.post(
    '/resend-verification',
    emailLimiter,
    checkAuth,
    verifyTeacher,
    resendTeacherVerification
);

// ── Export Routes ────────────────────────────────────────────────

// Export profile to CSV
router.get(
    '/export/profile',
    checkAuth,
    verifyTeacher,
    exportTeacherProfile
);

// Export created exams to CSV
router.get(
    '/export/exams',
    checkAuth,
    verifyTeacher,
    exportTeacherExams
);

export default router;