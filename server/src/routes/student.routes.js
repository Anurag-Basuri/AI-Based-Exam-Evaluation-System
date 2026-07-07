import { Router } from 'express';
import {
	getStudentProfile,
	updateStudent,
	changePassword,
	exportStudentProfile,
	exportStudentSubmissions,
} from '../controllers/student.controller.js';
import { checkAuth, verifyStudent } from '../middlewares/auth.middleware.js';
import { sensitiveWriteLimiter, exportLimiter, authLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { body } from 'express-validator';

const router = Router();

// All student routes are authenticated + role-verified

// Get student profile
router.get('/profile', checkAuth, verifyStudent, getStudentProfile);

// Update student profile
router.put(
	'/update',
	checkAuth,
	verifyStudent,
	sensitiveWriteLimiter,
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
	authLimiter,
	sensitiveWriteLimiter,
	body('currentPassword').notEmpty().withMessage('Current password is required'),
	body('newPassword')
		.isLength({ min: 8 })
		.withMessage('New password must be at least 8 characters'),
	validate,
	changePassword,
);

// Export profile to CSV
router.get('/export/profile', checkAuth, verifyStudent, exportLimiter, exportStudentProfile);

// Export submissions to CSV
router.get('/export/submissions', checkAuth, verifyStudent, exportLimiter, exportStudentSubmissions);

export default router;
