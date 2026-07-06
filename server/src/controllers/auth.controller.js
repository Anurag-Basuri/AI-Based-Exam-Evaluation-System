import User from '../models/user.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import * as AuthService from '../services/auth.service.js';

// Register
export const register = asyncHandler(async (req, res) => {
	const result = await AuthService.registerUser(User, req.body);
	return ApiResponse.success(
		res,
		{
			user: result.user,
			authToken: result.authToken,
			refreshToken: result.refreshToken,
			emailVerificationSent: result.emailVerificationSent,
		},
		'Account registered successfully. Please check your email to verify your account.',
		201,
	);
});

// Login (role-agnostic)
export const login = asyncHandler(async (req, res) => {
	const result = await AuthService.loginWithCredentials(User, req.body);
	return ApiResponse.success(
		res,
		{ user: result.user, authToken: result.authToken, refreshToken: result.refreshToken },
		'Login successful',
	);
});

// Google Login
export const googleLogin = asyncHandler(async (req, res) => {
	const { idToken, role } = req.body;
	const result = await AuthService.loginWithGoogle(User, idToken, role);
	return ApiResponse.success(
		res,
		{ user: result.user, authToken: result.authToken, refreshToken: result.refreshToken },
		'Logged in with Google successfully',
	);
});

// Logout (authenticated)
export const logout = asyncHandler(async (req, res) => {
	const userId = req.userDoc?._id || req.user?.id;
	const result = await AuthService.logoutUser(User, userId);
	return ApiResponse.success(res, result);
});

// Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
	const result = await AuthService.refreshTokens(User, req.body.refreshToken);
	return ApiResponse.success(res, result, 'Token refreshed successfully');
});

// Verify email
export const verifyEmail = asyncHandler(async (req, res) => {
	const result = await AuthService.verifyEmail(User, req.body.token);
	return ApiResponse.success(
		res,
		result,
		'Email verified successfully! You now have full access.',
	);
});

// Resend verification (authenticated)
export const resendVerification = asyncHandler(async (req, res) => {
	const userId = req.userDoc?._id || req.user?.id;
	const result = await AuthService.resendVerification(User, userId);
	if (result.alreadyVerified) {
		return ApiResponse.success(res, { isEmailVerified: true }, 'Email is already verified');
	}
	return ApiResponse.success(
		res,
		{ emailVerificationSent: true },
		'Verification email sent. Please check your inbox.',
	);
});

// Forgot password
export const forgotPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.forgotPassword(User, req.body.email);
	return ApiResponse.success(res, null, result.message);
});

// Reset password
export const resetPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.resetPassword(User, req.body.token, req.body.newPassword);
	return ApiResponse.success(res, null, result.message);
});
