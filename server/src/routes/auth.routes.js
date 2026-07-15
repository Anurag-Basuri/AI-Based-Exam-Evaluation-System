import { Router } from 'express';
import { body } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import { checkAuth } from '../middlewares/auth.middleware.js';
import { authLimiter, emailLimiter, verifyLimiter } from '../middlewares/rateLimit.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Register
router.post(
	'/register',
	authLimiter,
	emailLimiter,
	body('username').notEmpty().withMessage('Username is required'),
	body('fullname').notEmpty().withMessage('Full name is required'),
	body('email').isEmail().withMessage('Valid email is required'),
	body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
	body('role').isIn(['student', 'teacher']).withMessage('Role must be student or teacher'),
	validate,
	authController.register,
);

// Login
router.post(
	'/login',
	authLimiter,
	body('username').optional(),
	body('email').optional().isEmail(),
	body('password').notEmpty().withMessage('Password is required'),
	validate,
	authController.login,
);

// Google Login
router.post(
	'/google-login',
	authLimiter,
	body('idToken').notEmpty().withMessage('Google ID token is required'),
	body('role').isIn(['student', 'teacher', 'auto']).withMessage('Role must be student, teacher, or auto'),
	validate,
	authController.googleLogin,
);

// Logout (authenticated)
router.post('/logout', authLimiter, checkAuth, authController.logout);

// Refresh token
router.post(
	'/refresh-token',
	authLimiter,
	body('refreshToken').notEmpty().withMessage('Refresh token is required'),
	validate,
	authController.refreshToken,
);

// Verify email
router.post(
	'/verify-email',
	verifyLimiter,
	body('token').notEmpty().withMessage('Verification token is required'),
	validate,
	authController.verifyEmail,
);

// Resend verification (authenticated)
router.post('/resend-verification', emailLimiter, checkAuth, authController.resendVerification);

// Forgot password
router.post(
	'/forgot-password',
	emailLimiter,
	body('email').isEmail().withMessage('Valid email is required'),
	validate,
	authController.forgotPassword,
);

// Reset password
router.post(
	'/reset-password',
	verifyLimiter,
	body('token').notEmpty().withMessage('Reset token is required'),
	body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
	validate,
	authController.resetPassword,
);

export default router;
