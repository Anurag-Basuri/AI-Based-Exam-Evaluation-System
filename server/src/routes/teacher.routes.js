import { Router } from 'express';
import {
    createTeacher,
    loginTeacher,
    logoutTeacher,
    updateTeacher,
    changePassword
} from '../controllers/teacherController.js';
import { checkAuth, verifyTeacher } from '../middlewares/auth.middleware.js';
import { body } from 'express-validator';

const router = Router();

// Register a new teacher
router.post(
    '/register',
    body('username').notEmpty().withMessage('Username is required'),
    body('fullname').notEmpty().withMessage('Full name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    createTeacher
);

// Teacher login
router.post(
    '/login',
    body('username').optional(),
    body('email').optional().isEmail(),
    body('password').notEmpty().withMessage('Password is required'),
    loginTeacher
);

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

export default router;