import { Router } from 'express';
import {
	createIssue,
	getStudentIssues,
	getAllIssues,
	resolveIssue,
	getIssueById,
	updateIssueStatus,
	deleteIssue,
	addInternalNote,
	bulkResolveIssues,
} from '../controllers/issue.controller.js';
import { checkAuth, verifyStudent, verifyTeacher } from '../middlewares/auth.middleware.js';
import { body, param, query } from 'express-validator';

const router = Router();

// Student creates an issue
router.post(
	'/create',
	checkAuth,
	verifyStudent,
	body('submissionId').isMongoId().withMessage('A valid submission ID is required'),
	body('issueType')
		.isIn(['evaluation', 'technical', 'question', 'other'])
		.withMessage('Invalid issue type'),
	body('description').isString().isLength({ min: 5 }).withMessage('Description is required'),
	createIssue,
);

// Student issues (and alias)
router.get('/student', checkAuth, verifyStudent, getStudentIssues);
router.get('/me', checkAuth, verifyStudent, getStudentIssues);

// Teacher list/filter
router.get(
	'/all',
	checkAuth,
	verifyTeacher,
	query('status').optional().isString(),
	query('exam').optional().isMongoId(),
	getAllIssues,
);

// Teacher updates status (restrict to open/in-progress)
router.patch(
	'/:id/status',
	checkAuth,
	verifyTeacher,
	param('id').isMongoId().withMessage('Issue ID is required'),
	body('status').isIn(['open', 'in-progress']).withMessage('Only open or in-progress allowed'),
	updateIssueStatus,
);

// Add an internal note
router.post(
	'/:id/notes',
	checkAuth,
	verifyTeacher,
	param('id').isMongoId(),
	body('note').isString().notEmpty(),
	addInternalNote,
);

// Bulk resolve issues
router.post(
	'/bulk-resolve',
	checkAuth,
	verifyTeacher,
	body('issueIds')
		.isArray({ min: 1 })
		.withMessage('Issue IDs must be a non-empty array of MongoIDs'),
	body('reply').isString().isLength({ min: 2 }).withMessage('Reply is required'),
	bulkResolveIssues,
);

// Resolve with reply
router.patch(
	'/:id/resolve',
	checkAuth,
	verifyTeacher,
	param('id').isMongoId().withMessage('Issue ID is required'),
	body('reply').isString().isLength({ min: 2 }).withMessage('Reply is required'),
	resolveIssue,
);

// Details
router.get(
	'/:id',
	checkAuth,
	param('id').isMongoId().withMessage('Issue ID is required'),
	getIssueById,
);

// Student deletes their own issue
router.delete(
	'/:id',
	checkAuth,
	verifyStudent,
	param('id').isMongoId().withMessage('A valid Issue ID is required'),
	deleteIssue,
);

export default router;
