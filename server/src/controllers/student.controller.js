import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import Student from '../models/student.model.js';
import Teacher from '../models/teacher.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { generateCSV, sendCSVDowload } from '../services/export.service.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { verifyGoogleIdToken } from '../utils/googleAuth.js';
import {
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendPasswordChangedEmail,
} from '../services/email.service.js';

// ── Helper: strip sensitive fields ────────────────────────────────
function sanitize(doc) {
	const obj = doc.toObject ? doc.toObject() : { ...doc };
	delete obj.password;
	delete obj.refreshToken;
	delete obj.resetPasswordToken;
	delete obj.resetPasswordExpires;
	delete obj.emailVerificationToken;
	delete obj.emailVerificationExpires;
	return obj;
}

// ── Register ─────────────────────────────────────────────────────
const createStudent = asyncHandler(async (req, res) => {
	const { username, fullname, email, password } = req.body;

	if (!username || !fullname || !email || !password) {
		throw ApiError.BadRequest('All fields are required');
	}

	const existingStudent = await Student.findOne({ $or: [{ username }, { email }] });
	if (existingStudent) {
		throw ApiError.Conflict('Username or email already exists');
	}

	const newStudent = new Student({ username, fullname, email, password });

	// Generate email verification token
	const verifyToken = newStudent.createEmailVerificationToken();

	const authToken = newStudent.generateAuthToken();
	const refreshToken = newStudent.generateRefreshToken();
	await newStudent.save();

	// Send verification email (fire & forget — don't block registration)
	sendVerificationEmail(email, fullname, verifyToken, 'student').catch(err =>
		console.error('[REGISTER] Failed to send verification email:', err.message),
	);

	return ApiResponse.success(
		res,
		{
			student: sanitize(newStudent),
			authToken,
			refreshToken,
			emailVerificationSent: true,
		},
		'Student registered successfully. Please check your email to verify your account.',
		201,
	);
});

// ── Login ────────────────────────────────────────────────────────
const loginStudent = asyncHandler(async (req, res) => {
	const { username, email, password } = req.body;
	if ((!username && !email) || !password) {
		throw ApiError.BadRequest('Username or email and password are required');
	}

	let query = {};
	if (username && username.trim() !== '') {
		query.username = username;
	} else if (email && email.trim() !== '') {
		query.email = email;
	} else {
		throw ApiError.BadRequest('Provide a valid username or email');
	}

	const student = await Student.findOne(query).select('+password');
	if (!student) {
		throw ApiError.Unauthorized('Invalid credentials');
	}

	// Google-only accounts have no password set
	if (!student.password) {
		throw ApiError.Unauthorized(
			'This account uses Google Sign-In. Please use the Google button to log in.',
		);
	}

	const isMatch = await student.comparePassword(password);
	if (!isMatch) {
		throw ApiError.Unauthorized('Invalid credentials');
	}

	const authToken = student.generateAuthToken();
	const refreshToken = student.generateRefreshToken();

	student.refreshToken = refreshToken;
	await student.save();

	return ApiResponse.success(
		res,
		{
			student: sanitize(student),
			authToken,
			refreshToken,
		},
		'Login successful',
	);
});

// ── Google Login ─────────────────────────────────────────────────
const googleLoginStudent = asyncHandler(async (req, res) => {
	const { idToken } = req.body;
	if (!idToken) throw ApiError.BadRequest('Google ID token is required');

	const payload = await verifyGoogleIdToken(idToken);
	const { email, name, picture, sub: googleId } = payload;

	let student = await Student.findOne({ email });

	if (student) {
		// Existing user — link Google account if not already linked
		if (!student.googleId) {
			student.googleId = googleId;
			if (picture && !student.profilePicture) student.profilePicture = picture;
			student.isEmailVerified = true;
			await student.save();
		}
	} else {
		// Prevent cross-role duplicate: check if email already exists as a Teacher
		const existingTeacher = await Teacher.findOne({ email });
		if (existingTeacher) {
			throw ApiError.Conflict(
				'This email is already registered as a Teacher account. Please log in as a Teacher instead.',
			);
		}

		// New user created via Google
		student = await Student.create({
			username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
			fullname: name,
			email,
			googleId,
			profilePicture: picture || '',
			isEmailVerified: true,
		});
	}

	const authToken = student.generateAuthToken();
	const refreshToken = student.generateRefreshToken();

	student.refreshToken = refreshToken;
	await student.save();

	return ApiResponse.success(
		res,
		{ student: sanitize(student), authToken, refreshToken },
		'Logged in with Google successfully',
	);
});

// ── Logout ───────────────────────────────────────────────────────
const logoutStudent = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	await Student.findByIdAndUpdate(studentId, { refreshToken: null });
	return ApiResponse.success(res, { message: 'Logged out successfully' });
});

// ── Profile ──────────────────────────────────────────────────────
const getStudentProfile = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const student = await Student.findById(studentId).select(
		'-password -refreshToken -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires',
	);
	if (!student) {
		throw ApiError.NotFound('Student not found');
	}
	return ApiResponse.success(res, student, 'Student profile fetched successfully');
});

// ── Update Profile ───────────────────────────────────────────────
const updateStudent = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const { username, fullname, email, phonenumber, gender, address } = req.body;

	const updateData = {};
	if (username !== undefined) updateData.username = username;
	if (fullname !== undefined) updateData.fullname = fullname;
	if (email !== undefined) updateData.email = email;
	if (phonenumber !== undefined) updateData.phonenumber = phonenumber;
	if (gender !== undefined) updateData.gender = gender;
	if (address !== undefined) updateData.address = address;

	const updatedStudent = await Student.findByIdAndUpdate(studentId, updateData, {
		new: true,
		runValidators: true,
	}).select(
		'-password -refreshToken -resetPasswordToken -resetPasswordExpires -emailVerificationToken -emailVerificationExpires',
	);

	if (!updatedStudent) {
		throw ApiError.NotFound('Student not found');
	}

	return ApiResponse.success(res, updatedStudent, 'Student updated successfully');
});

// ── Change Password ──────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const { currentPassword, newPassword } = req.body;

	if (!currentPassword || !newPassword) {
		throw ApiError.BadRequest('Current and new passwords are required');
	}

	const student = await Student.findById(studentId).select('+password');
	if (!student) {
		throw ApiError.NotFound('Student not found');
	}

	const isMatch = await student.comparePassword(currentPassword);
	if (!isMatch) {
		throw ApiError.Unauthorized('Invalid current password');
	}

	student.password = newPassword;
	await student.save();

	return ApiResponse.success(res, { message: 'Password changed successfully' });
});

// ══════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ══════════════════════════════════════════════════════════════════

// ── Verify email with token ──────────────────────────────────────
const verifyStudentEmail = asyncHandler(async (req, res) => {
	const { token } = req.body;
	if (!token) throw ApiError.BadRequest('Verification token is required');

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const student = await Student.findOne({
		emailVerificationToken: hashedToken,
		emailVerificationExpires: { $gt: Date.now() },
	}).select('+emailVerificationToken +emailVerificationExpires');

	if (!student) {
		throw ApiError.BadRequest(
			'Invalid or expired verification link. Please request a new one.',
		);
	}

	student.isEmailVerified = true;
	student.emailVerificationToken = undefined;
	student.emailVerificationExpires = undefined;
	await student.save({ validateBeforeSave: false });

	// Issue a fresh token with updated isEmailVerified claim
	const authToken = student.generateAuthToken();

	return ApiResponse.success(
		res,
		{ isEmailVerified: true, authToken },
		'Email verified successfully! You now have full access.',
	);
});

// ── Resend verification email ────────────────────────────────────
const resendStudentVerification = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;

	const student = await Student.findById(studentId).select(
		'+emailVerificationToken +emailVerificationExpires',
	);
	if (!student) throw ApiError.NotFound('Student not found');

	if (student.isEmailVerified) {
		return ApiResponse.success(res, { isEmailVerified: true }, 'Email is already verified');
	}

	const verifyToken = student.createEmailVerificationToken();
	await student.save({ validateBeforeSave: false });

	await sendVerificationEmail(student.email, student.fullname, verifyToken, 'student');

	return ApiResponse.success(
		res,
		{ emailVerificationSent: true },
		'Verification email sent. Please check your inbox.',
	);
});

// ══════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ══════════════════════════════════════════════════════════════════

// ── Forgot password (public) ─────────────────────────────────────
const forgotStudentPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) throw ApiError.BadRequest('Email address is required');

	// Always return generic message to prevent email enumeration
	const genericMsg = 'If an account with that email exists, a password reset link has been sent.';

	const student = await Student.findOne({ email: email.toLowerCase().trim() });
	if (!student) {
		return ApiResponse.success(res, null, genericMsg);
	}

	const resetToken = student.createPasswordResetToken();
	await student.save({ validateBeforeSave: false });

	const result = await sendPasswordResetEmail(
		student.email,
		student.fullname,
		resetToken,
		'student',
	);

	if (!result.success) {
		// Don't leak the error to the user
		student.resetPasswordToken = undefined;
		student.resetPasswordExpires = undefined;
		await student.save({ validateBeforeSave: false });
		throw ApiError.InternalServerError(
			'There was an error sending the email. Please try again.',
		);
	}

	return ApiResponse.success(res, null, genericMsg);
});

// ── Reset password with token (public) ───────────────────────────
const resetStudentPassword = asyncHandler(async (req, res) => {
	const { token, newPassword } = req.body;
	if (!token || !newPassword) {
		throw ApiError.BadRequest('Token and new password are required');
	}
	if (newPassword.length < 8) {
		throw ApiError.BadRequest('Password must be at least 8 characters');
	}

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const student = await Student.findOne({
		resetPasswordToken: hashedToken,
		resetPasswordExpires: { $gt: Date.now() },
	}).select('+password');

	if (!student) {
		throw ApiError.BadRequest(
			'Invalid or expired reset link. Please request a new password reset.',
		);
	}

	student.password = newPassword;
	student.resetPasswordToken = undefined;
	student.resetPasswordExpires = undefined;
	student.refreshToken = undefined; // invalidate existing sessions
	await student.save();

	// Notify user of password change
	sendPasswordChangedEmail(student.email, student.fullname).catch(() => {});

	return ApiResponse.success(
		res,
		null,
		'Password reset successfully. You can now log in with your new password.',
	);
});

// ══════════════════════════════════════════════════════════════════
// DATA EXPORT
// ══════════════════════════════════════════════════════════════════

// ── Export Profile (CSV) ─────────────────────────────────────────
const exportStudentProfile = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const student = await Student.findById(studentId).lean();

	if (!student) {
		throw ApiError.NotFound('Student not found');
	}

	const data = [
		{
			ID: student._id.toString(),
			Username: student.username,
			'Full Name': student.fullname,
			Email: student.email,
			'Phone Number': student.phonenumber || '',
			Gender: student.gender || '',
			Street: student.address?.street || '',
			City: student.address?.city || '',
			State: student.address?.state || '',
			'Postal Code': student.address?.postalCode || '',
			Country: student.address?.country || '',
			'Verified Email': student.isEmailVerified ? 'Yes' : 'No',
			'Registered On': new Date(student.createdAt).toLocaleString(),
		},
	];

	const csv = generateCSV(data);
	return sendCSVDowload(res, `student_profile_${student.username}.csv`, csv);
});

// ── Export Submissions (CSV) ─────────────────────────────────────
const exportStudentSubmissions = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;

	const submissions = await Submission.find({ student: studentId })
		.populate('exam', 'title searchId max_marks')
		.lean();

	const data = submissions.map(sub => ({
		'Submission ID': sub._id.toString(),
		'Exam Title': sub.exam?.title || 'Unknown Exam',
		'Exam Code': sub.exam?.searchId || 'Unknown',
		Status: sub.status,
		Score: sub.totalMarks || 0,
		'Max Score': sub.exam?.max_marks || 0,
		'Submitted At': sub.submittedAt
			? new Date(sub.submittedAt).toLocaleString()
			: 'Not Submitted',
		'Evaluated At': sub.evaluationDate ? new Date(sub.evaluationDate).toLocaleString() : 'N/A',
		Type: sub.submissionType || 'manual',
	}));

	const csv = generateCSV(data);
	return sendCSVDowload(res, `student_submissions_${studentId}.csv`, csv);
});

// ══════════════════════════════════════════════════════════════════
// TOKEN REFRESH
// ══════════════════════════════════════════════════════════════════

const refreshStudentToken = asyncHandler(async (req, res) => {
	const { refreshToken } = req.body;
	if (!refreshToken) throw ApiError.BadRequest('Refresh token is required');

	let decoded;
	try {
		decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
	} catch {
		throw ApiError.Unauthorized('Invalid or expired refresh token');
	}

	const student = await Student.findById(decoded.id).select('+refreshToken');
	if (!student || student.refreshToken !== refreshToken) {
		throw ApiError.Unauthorized('Refresh token has been revoked');
	}

	// Rotate: issue new token pair
	const newAuthToken = student.generateAuthToken();
	const newRefreshToken = student.generateRefreshToken();
	await student.save({ validateBeforeSave: false });

	return ApiResponse.success(
		res,
		{ authToken: newAuthToken, refreshToken: newRefreshToken },
		'Token refreshed successfully',
	);
});

export {
	createStudent,
	loginStudent,
	googleLoginStudent,
	logoutStudent,
	getStudentProfile,
	updateStudent,
	changePassword,
	verifyStudentEmail,
	resendStudentVerification,
	forgotStudentPassword,
	resetStudentPassword,
	exportStudentProfile,
	exportStudentSubmissions,
	refreshStudentToken,
};
