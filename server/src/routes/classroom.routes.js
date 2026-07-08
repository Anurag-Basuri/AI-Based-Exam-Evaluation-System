import { Router } from 'express';
import { body, param } from 'express-validator';
import { validate } from '../middlewares/validate.middleware.js';
import {
	checkAuth,
	verifyTeacher,
	verifyStudent,
	requireVerifiedEmail,
} from '../middlewares/auth.middleware.js';
import { sensitiveWriteLimiter } from '../middlewares/rateLimit.middleware.js';
import { uploadMaterial, handleMulterError } from '../middlewares/upload.middleware.js';
import {
	createClassroom,
	getMyClassrooms,
	getClassroomById,
	getClassroomPreview,
	joinClassroom,
	approveStudent,
	rejectStudent,
	uploadMaterial as uploadMaterialController,
	deleteMaterial,
	deleteClassroom,
	resetJoinCode,
	leaveClassroom,
} from '../controllers/classroom.controller.js';

const router = Router();

const validateObjectId = (paramName = 'id') =>
	param(paramName).isMongoId().withMessage(`Invalid ${paramName} format`);

// GET /my — list classrooms for current user
router.get('/my', checkAuth, getMyClassrooms);

// GET /preview/:joinCode — lightweight preview for invite link landing page
router.get(
	'/preview/:joinCode',
	checkAuth,
	param('joinCode')
		.notEmpty()
		.withMessage('Join code is required')
		.isLength({ min: 6, max: 12 })
		.withMessage('Invalid join code format'),
	validate,
	getClassroomPreview,
);

// POST / — create a classroom
router.post(
	'/',
	checkAuth,
	verifyTeacher,
	requireVerifiedEmail,
	sensitiveWriteLimiter,
	body('name')
		.notEmpty()
		.withMessage('Classroom name is required')
		.isLength({ min: 3, max: 100 })
		.withMessage('Name must be between 3 and 100 characters')
		.trim(),
	body('description')
		.optional()
		.isLength({ max: 500 })
		.withMessage('Description cannot exceed 500 characters')
		.trim(),
	validate,
	createClassroom,
);

// POST /join — student requests to join (goes to pending queue)
router.post(
	'/join',
	checkAuth,
	verifyStudent,
	requireVerifiedEmail,
	sensitiveWriteLimiter,
	body('joinCode')
		.notEmpty()
		.withMessage('Join code is required')
		.isLength({ min: 6, max: 12 })
		.withMessage('Join code must be between 6 and 12 characters')
		.trim(),
	validate,
	joinClassroom,
);

// GET /:id — classroom details
router.get('/:id', checkAuth, validateObjectId('id'), validate, getClassroomById);

// POST /:id/approve/:studentId — teacher approves a pending student
router.post(
	'/:id/approve/:studentId',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validateObjectId('studentId'),
	validate,
	approveStudent,
);

// POST /:id/reject/:studentId — teacher rejects a pending student
router.post(
	'/:id/reject/:studentId',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validateObjectId('studentId'),
	validate,
	rejectStudent,
);

// POST /:id/materials — upload study material
router.post(
	'/:id/materials',
	checkAuth,
	verifyTeacher,
	requireVerifiedEmail,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validate,
	uploadMaterial.single('file'),
	handleMulterError,
	uploadMaterialController,
);

// DELETE /:id/materials/:materialId — delete study material
router.delete(
	'/:id/materials/:materialId',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validateObjectId('materialId'),
	validate,
	deleteMaterial,
);

// DELETE /:id — delete classroom entirely
router.delete(
	'/:id',
	checkAuth,
	verifyTeacher,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validate,
	deleteClassroom,
);

// PUT /:id/join-code — regenerate classroom join code
router.put(
	'/:id/join-code',
	checkAuth,
	verifyTeacher,
	requireVerifiedEmail,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validate,
	resetJoinCode,
);

// POST /:id/leave — student leaves a classroom
router.post(
	'/:id/leave',
	checkAuth,
	verifyStudent,
	sensitiveWriteLimiter,
	validateObjectId('id'),
	validate,
	leaveClassroom,
);

export default router;
