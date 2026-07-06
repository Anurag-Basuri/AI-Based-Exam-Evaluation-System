import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { verifyGoogleIdToken } from '../utils/googleAuth.js';
import {
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendPasswordChangedEmail,
} from './email.service.js';

// Helper: Strip sensitive fields from a user doc
export function sanitize(doc) {
	const obj = doc.toObject ? doc.toObject() : { ...doc };
	delete obj.password;
	delete obj.refreshToken;
	delete obj.resetPasswordToken;
	delete obj.resetPasswordExpires;
	delete obj.emailVerificationToken;
	delete obj.emailVerificationExpires;
	return obj;
}

// Register a new user
export async function registerUser(Model, { username, fullname, email, password }, roleName) {
	if (!username || !fullname || !email || !password) {
		throw ApiError.BadRequest('All fields are required');
	}

	const existing = await Model.findOne({ $or: [{ username }, { email }] });
	if (existing) {
		throw ApiError.Conflict('Username or email already exists');
	}

	const newUser = new Model({ username, fullname, email, password, role: roleName });

	// Generate email verification token
	const verifyToken = newUser.createEmailVerificationToken();

	const authToken = newUser.generateAuthToken();
	const refreshToken = newUser.generateRefreshToken();
	await newUser.save();

	// Send verification email (fire & forget — don't block registration)
	sendVerificationEmail(email, fullname, verifyToken, roleName).catch(err =>
		console.error('[REGISTER] Failed to send verification email:', err.message),
	);

	return {
		user: sanitize(newUser),
		authToken,
		refreshToken,
		emailVerificationSent: true,
	};
}

// Login with credentials
export async function loginWithCredentials(Model, { username, email, password }) {
	if ((!username && !email) || !password) {
		throw ApiError.BadRequest('Username or email and password are required');
	}

	const filter = {};
	if (username && username.trim() !== '') {
		filter.username = username;
	} else if (email && email.trim() !== '') {
		filter.email = email;
	} else {
		throw ApiError.BadRequest('Provide a valid username or email');
	}

	const user = await Model.findOne(filter).select('+password');
	if (!user) {
		throw ApiError.Unauthorized('Invalid credentials');
	}

	// Google-only accounts have no password set
	if (!user.password) {
		throw ApiError.Unauthorized(
			'This account uses Google Sign-In. Please use the Google button to log in.',
		);
	}

	const isMatch = await user.comparePassword(password);
	if (!isMatch) {
		throw ApiError.Unauthorized('Invalid credentials');
	}

	const authToken = user.generateAuthToken();
	const refreshToken = user.generateRefreshToken();

	user.refreshToken = refreshToken;
	await user.save();

	return { user: sanitize(user), authToken, refreshToken };
}

// Google OAuth login
export async function loginWithGoogle(Model, OtherModel, idToken, roleName) {
	if (!idToken) throw ApiError.BadRequest('Google ID token is required');

	const payload = await verifyGoogleIdToken(idToken);
	const { email, name, picture, sub: googleId } = payload;

	let user = await Model.findOne({ email });

	if (user) {
		// Existing user — link Google account if not already linked
		if (!user.googleId) {
			user.googleId = googleId;
			if (picture && !user.profilePicture) user.profilePicture = picture;
			user.isEmailVerified = true;
			await user.save();
		}
	} else {
		// Prevent cross-role duplicate: check if email already exists as the other role
		const existing = await OtherModel.findOne({ email });
		if (existing) {
			const otherRole = roleName === 'student' ? 'Teacher' : 'Student';
			throw ApiError.Conflict(
				`This email is already registered as a ${otherRole} account. Please log in as a ${otherRole} instead.`,
			);
		}

		// New user created via Google
		user = await Model.create({
			username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
			fullname: name,
			email,
			googleId,
			profilePicture: picture || '',
			isEmailVerified: true,
			role: roleName,
		});
	}

	const authToken = user.generateAuthToken();
	const refreshToken = user.generateRefreshToken();

	user.refreshToken = refreshToken;
	await user.save();

	return { user: sanitize(user), authToken, refreshToken };
}

// Token refresh (rotation)
export async function refreshTokens(Model, refreshToken) {
	if (!refreshToken) throw ApiError.BadRequest('Refresh token is required');

	let decoded;
	try {
		decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
	} catch {
		throw ApiError.Unauthorized('Invalid or expired refresh token');
	}

	const user = await Model.findById(decoded.id).select('+refreshToken');
	if (!user || user.refreshToken !== refreshToken) {
		throw ApiError.Unauthorized('Refresh token has been revoked');
	}

	// Rotate: issue new token pair
	const newAuthToken = user.generateAuthToken();
	const newRefreshToken = user.generateRefreshToken();
	await user.save({ validateBeforeSave: false });

	return { authToken: newAuthToken, refreshToken: newRefreshToken };
}

// Verify email with token
export async function verifyEmail(Model, token) {
	if (!token) throw ApiError.BadRequest('Verification token is required');

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const user = await Model.findOne({
		emailVerificationToken: hashedToken,
		emailVerificationExpires: { $gt: Date.now() },
	}).select('+emailVerificationToken +emailVerificationExpires');

	if (!user) {
		throw ApiError.BadRequest(
			'Invalid or expired verification link. Please request a new one.',
		);
	}

	user.isEmailVerified = true;
	user.emailVerificationToken = undefined;
	user.emailVerificationExpires = undefined;
	await user.save({ validateBeforeSave: false });

	// Issue a fresh token with updated isEmailVerified claim
	const authToken = user.generateAuthToken();

	return { isEmailVerified: true, authToken };
}

// Resend verification email
export async function resendVerification(Model, userId, roleName) {
	const user = await Model.findById(userId).select(
		'+emailVerificationToken +emailVerificationExpires',
	);
	if (!user) throw ApiError.NotFound(`${roleName} not found`);

	if (user.isEmailVerified) {
		return { isEmailVerified: true, alreadyVerified: true };
	}

	const verifyToken = user.createEmailVerificationToken();
	await user.save({ validateBeforeSave: false });

	await sendVerificationEmail(user.email, user.fullname, verifyToken, roleName);

	return { emailVerificationSent: true };
}

// Forgot password
export async function forgotPassword(Model, email) {
	if (!email) throw ApiError.BadRequest('Email address is required');

	const user = await Model.findOne({ email: email.toLowerCase().trim() }).select('+password +googleId');
	if (!user) {
		throw ApiError.NotFound('No account found with this email address.');
	}

	if (user.googleId && !user.password) {
		throw ApiError.Conflict(
			'This account is linked to Google. Please log in with Google instead of resetting your password.'
		);
	}

	const resetToken = user.createPasswordResetToken();
	await user.save({ validateBeforeSave: false });

	const result = await sendPasswordResetEmail(
		user.email,
		user.fullname,
		resetToken,
		user.role,
	);

	if (!result.success) {
		// Don't leak the error to the user
		user.resetPasswordToken = undefined;
		user.resetPasswordExpires = undefined;
		await user.save({ validateBeforeSave: false });
		throw ApiError.InternalServerError(
			'There was an error sending the email. Please try again.',
		);
	}

	return { message: 'Password reset link sent to your email.' };
}

// Reset password with token
export async function resetPassword(Model, token, newPassword) {
	if (!token || !newPassword) {
		throw ApiError.BadRequest('Token and new password are required');
	}
	if (newPassword.length < 8) {
		throw ApiError.BadRequest('Password must be at least 8 characters');
	}

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const user = await Model.findOne({
		resetPasswordToken: hashedToken,
		resetPasswordExpires: { $gt: Date.now() },
	}).select('+password');

	if (!user) {
		throw ApiError.BadRequest(
			'Invalid or expired reset link. Please request a new password reset.',
		);
	}

	user.password = newPassword;
	user.resetPasswordToken = undefined;
	user.resetPasswordExpires = undefined;
	user.refreshToken = undefined; // invalidate existing sessions
	await user.save();

	// Notify user of password change
	sendPasswordChangedEmail(user.email, user.fullname).catch(() => {});

	return { message: 'Password reset successfully. You can now log in with your new password.' };
}

// Change password (authenticated)
export async function changePassword(Model, userId, currentPassword, newPassword) {
	if (!currentPassword || !newPassword) {
		throw ApiError.BadRequest('Current and new passwords are required');
	}

	const user = await Model.findById(userId).select('+password');
	if (!user) {
		throw ApiError.NotFound('User not found');
	}

	const isMatch = await user.comparePassword(currentPassword);
	if (!isMatch) {
		throw ApiError.Unauthorized('Invalid current password');
	}

	user.password = newPassword;
	await user.save();

	return { message: 'Password changed successfully' };
}

// Logout
export async function logoutUser(Model, userId) {
	await Model.findByIdAndUpdate(userId, { refreshToken: null });
	return { message: 'Logged out successfully' };
}
