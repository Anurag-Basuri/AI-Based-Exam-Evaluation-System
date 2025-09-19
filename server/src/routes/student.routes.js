import { Router } from 'express';
import {
    createStudent,
    loginStudent,
    logoutStudent,
    updateStudent,
    changePassword
} from '../controllers/student.controller.js';
import { checkAuth, verifyStudent } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';

const router = Router();

// Register a new student
router.post(
    '/register',
    body('username').notEmpty().withMessage('Username is required'),
    body('fullname').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    createStudent
);

// Student login
router.post(
    '/login',
    body('username').optional(),
    body('email').optional().isEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    loginStudent
);

// Student logout
router.post(
    '/logout',
    checkAuth,
    verifyStudent,
    logoutStudent
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

export default router;