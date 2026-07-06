import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as AuthService from '../services/auth.service.js';
import User from '../models/user.model.js';

export const forgotPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.forgotPassword(User, req.body.email);
	return ApiResponse.success(res, null, result.message);
});
