import { Router } from 'express';
import {
	updateTeacher,
	changePassword,
	getDashboardStats,
	exportTeacherProfile,
	exportTeacherExams,
} from '../controllers/teacher.controller.js';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import { sensitiveWriteLimiter, exportLimiter } from '../middlewares/rateLimit.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { body } from 'express-validator';

const router = Router();

// All teacher routes are authenticated + role-verified

// Update teacher profile
router.put(
	'/update',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	body('username').optional(),
	body('fullname').optional(),
	body('email').optional().isEmail(),
	body('phonenumber').optional(),
	body('gender').optional(),
	body('address').optional(),
	validate,
	updateTeacher,
);

// Change password
router.put(
	'/change-password',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	body('currentPassword').notEmpty().withMessage('Current password is required'),
	body('newPassword')
		.isLength({ min: 8 })
		.withMessage('New password must be at least 8 characters'),
	validate,
	changePassword,
);

// Get dashboard statistics for teacher
router.get('/dashboard-stats', checkAuth, verifyTeacher, getDashboardStats);

// Export profile to CSV
router.get('/export/profile', checkAuth, verifyTeacher, exportLimiter, exportTeacherProfile);

// Export created exams to CSV
router.get('/export/exams', checkAuth, verifyTeacher, exportLimiter, exportTeacherExams);

export default router;
