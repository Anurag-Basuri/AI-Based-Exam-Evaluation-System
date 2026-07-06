import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middlewares/validate.middleware.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

// Forgot Password
router.post(
	'/forgot-password',
	[
		body('email').isEmail().withMessage('Valid email is required'),
	],
	validateRequest,
	authController.forgotPassword,
);

export default router;
