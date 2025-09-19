import { Router } from 'express';
import {
    createIssue,
    getStudentIssues,
    getAllIssues,
    resolveIssue,
    getIssueById
} from '../controllers/issue.controller.js';
import { checkAuth, verifyStudent, verifyTeacher } from '../middlewares/auth.middleware.js';
import { body, param, query } from 'express-validator';

const router = Router();

// Student creates an issue
router.post(
    '/create',
    checkAuth,
    verifyStudent,
    body('exam').notEmpty().withMessage('Exam ID is required'),
    body('issueType').notEmpty().withMessage('Issue type is required'),
    body('description').notEmpty().withMessage('Description is required'),
    createIssue
);

// Get all issues for the logged-in student
router.get(
    '/student',
    checkAuth,
    verifyStudent,
    getStudentIssues
);

// Get all issues (for teachers, optionally filter by status or exam)
router.get(
    '/all',
    checkAuth,
    verifyTeacher,
    query('status').optional().isString(),
    query('exam').optional().isString(),
    getAllIssues
);

// Resolve an issue (teacher only)
router.patch(
    '/:id/resolve',
    checkAuth,
    verifyTeacher,
    param('id').notEmpty().withMessage('Issue ID is required'),
    body('reply').notEmpty().withMessage('Reply is required'),
    resolveIssue
);

// Get a single issue by ID
router.get(
    '/:id',
    checkAuth,
    param('id').notEmpty().withMessage('Issue ID is required'),
    getIssueById
);

export default router;
