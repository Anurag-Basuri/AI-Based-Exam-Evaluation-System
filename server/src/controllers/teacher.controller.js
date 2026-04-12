import crypto from 'crypto';
import mongoose from 'mongoose';
import Teacher from '../models/teacher.model.js';
import Exam from '../models/exam.model.js';
import Issue from '../models/issue.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { verifyGoogleIdToken } from '../utils/googleAuth.js';
import {
	sendVerificationEmail,
	sendPasswordResetEmail,
	sendPasswordChangedEmail,
} from '../services/email.service.js';
import { generateCSV, sendCSVDowload } from '../services/export.service.js';

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

// Create a new teacher
const createTeacher = asyncHandler(async (req, res) => {
	const { username, fullname, email, password } = req.body;

	if (!username || !fullname || !email || !password) {
		throw ApiError.BadRequest('All fields are required');
	}

	const existingTeacher = await Teacher.findOne({ $or: [{ username }, { email }] });
	if (existingTeacher) {
		throw ApiError.Conflict('Username or email already exists');
	}

	const newTeacher = new Teacher({ username, fullname, email, password });

	// Generate email verification token
	const verifyToken = newTeacher.createEmailVerificationToken();

	const authToken = newTeacher.generateAuthToken();
	const refreshToken = newTeacher.generateRefreshToken();
	await newTeacher.save();

	// Send verification email (fire & forget)
	sendVerificationEmail(email, fullname, verifyToken, 'teacher').catch(err =>
		console.error('[REGISTER] Failed to send verification email:', err.message),
	);

	return ApiResponse.success(
		res,
		{
			teacher: sanitize(newTeacher),
			authToken,
			refreshToken,
			emailVerificationSent: true,
		},
		'Teacher registered successfully. Please check your email to verify your account.',
		201,
	);
});

// Teacher login
const loginTeacher = asyncHandler(async (req, res) => {
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

	// select password explicitly
	const teacher = await Teacher.findOne(query).select('+password');
	if (!teacher) {
		throw ApiError.NotFound('Teacher not found');
	}

	const isMatch = await teacher.comparePassword(password);
	if (!isMatch) {
		throw ApiError.Unauthorized('Invalid password');
	}

	const authToken = teacher.generateAuthToken();
	const refreshToken = teacher.generateRefreshToken();

	teacher.refreshToken = refreshToken;
	await teacher.save();

	return ApiResponse.success(
		res,
		{
			teacher: sanitize(teacher),
			authToken,
			refreshToken,
		},
		'Login successful',
	);
});

// ── Google Login ─────────────────────────────────────────────────
const googleLoginTeacher = asyncHandler(async (req, res) => {
	const { idToken } = req.body;
	if (!idToken) throw ApiError.BadRequest('Google ID token is required');

	const payload = await verifyGoogleIdToken(idToken);
	const { email, name, picture, sub: googleId } = payload;

	let teacher = await Teacher.findOne({ email });

	if (teacher) {
		// Existing user.
		if (!teacher.googleId) {
			teacher.googleId = googleId;
			if (picture && !teacher.profilePicture) teacher.profilePicture = picture;
			teacher.isEmailVerified = true;
			await teacher.save();
		}
	} else {
		// New user created via Google
		teacher = await Teacher.create({
			username: email.split('@')[0] + '_' + Math.floor(Math.random() * 10000),
			fullname: name,
			email,
			googleId,
			profilePicture: picture || '',
			isEmailVerified: true,
		});
	}

	const authToken = teacher.generateAuthToken();
	const refreshToken = teacher.generateRefreshToken();

	teacher.refreshToken = refreshToken;
	await teacher.save();

	return ApiResponse.success(
		res,
		{ teacher: sanitize(teacher), authToken, refreshToken },
		'Logged in with Google successfully',
	);
});

// Teacher logout
const logoutTeacher = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;

	await Teacher.findByIdAndUpdate(teacherId, { refreshToken: null });

	return ApiResponse.success(res, { message: 'Logged out successfully' });
});

// Update teacher details
const updateTeacher = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;

	// Explicitly build update object to support partial updates
	const updateData = {};
	const allowedFields = ['username', 'fullname', 'email', 'phonenumber', 'gender', 'address'];

	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			updateData[field] = req.body[field];
		}
	});

	const updatedTeacher = await Teacher.findByIdAndUpdate(teacherId, updateData, {
		new: true,
		runValidators: true,
	}).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');

	if (!updatedTeacher) {
		throw ApiError.NotFound('Teacher not found');
	}

	return ApiResponse.success(res, updatedTeacher, 'Profile updated successfully');
});

// Change password
const changePassword = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	const { currentPassword, newPassword, confirmNewPassword } = req.body;

	if (!currentPassword || !newPassword) {
		throw ApiError.BadRequest('Current password and new password are required');
	}

	if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
		throw ApiError.BadRequest('New password and confirmation do not match');
	}

	if (newPassword === currentPassword) {
		throw ApiError.BadRequest('New password must be different from current password');
	}

	const teacher = await Teacher.findById(teacherId).select('+password');
	if (!teacher) {
		throw ApiError.NotFound('Teacher not found');
	}

	const isMatch = await teacher.comparePassword(currentPassword);
	if (!isMatch) {
		throw ApiError.Unauthorized('Current password is incorrect');
	}

	teacher.password = newPassword;
	// Invalidate refresh token(s) to force re-login
	teacher.refreshToken = null;
	await teacher.save();

	return ApiResponse.success(res, {
		message: 'Password changed successfully. Please log in again.',
	});
});

// Get dashboard statistics for teacher (refactored, efficient, defensive)
const getDashboardStats = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	if (!teacherId) throw ApiError.Unauthorized('Teacher identification missing');

	const TID = new mongoose.Types.ObjectId(teacherId);

	// Aggregate exam-level summary and pending calculations server-side to avoid loading all docs
	const summaryAgg = await Exam.aggregate([
		{ $match: { teacher: TID } },
		{
			$project: {
				title: 1,
				derivedStatus: { $ifNull: ['$derivedStatus', ''] },
				submissionsCount: { $ifNull: ['$submissionsCount', 0] },
				evaluatedCount: { $ifNull: ['$evaluatedCount', 0] },
				enrolledCount: { $ifNull: ['$enrolledCount', 0] },
				enrolled: 1,
			},
		},
		{
			$addFields: {
				pendingCount: {
					$max: [{ $subtract: ['$submissionsCount', '$evaluatedCount'] }, 0],
				},
				derivedLower: { $toLower: '$derivedStatus' },
				enrolledResolved: {
					$cond: [
						{ $isArray: '$enrolled' },
						{ $size: '$enrolled' },
						{ $ifNull: ['$enrolledCount', 0] },
					],
				},
			},
		},
		{
			$group: {
				_id: null,
				totalExams: { $sum: 1 },
				live: {
					$sum: {
						$cond: [{ $in: ['$derivedLower', ['live', 'active']] }, 1, 0],
					},
				},
				scheduled: { $sum: { $cond: [{ $eq: ['$derivedLower', 'scheduled'] }, 1, 0] } },
				draft: { $sum: { $cond: [{ $eq: ['$derivedLower', 'draft'] }, 1, 0] } },
				totalEnrolled: { $sum: '$enrolledResolved' },
				pendingSubmissionsTotal: { $sum: '$pendingCount' },
			},
		},
	]);

	const summary = (Array.isArray(summaryAgg) && summaryAgg[0]) || {
		totalExams: 0,
		live: 0,
		scheduled: 0,
		draft: 0,
		totalEnrolled: 0,
		pendingSubmissionsTotal: 0,
	};

	// Top exams that need review (pending > 0)
	const examsToReview = await Exam.aggregate([
		{ $match: { teacher: TID } },
		{
			$project: {
				title: 1,
				submissionsCount: { $ifNull: ['$submissionsCount', 0] },
				evaluatedCount: { $ifNull: ['$evaluatedCount', 0] },
			},
		},
		{
			$addFields: {
				pendingCount: {
					$max: [{ $subtract: ['$submissionsCount', '$evaluatedCount'] }, 0],
				},
			},
		},
		{ $match: { pendingCount: { $gt: 0 } } },
		{ $sort: { pendingCount: -1 } },
		{ $limit: 5 },
		{ $project: { _id: 1, title: 1, submissionsCount: 1, evaluatedCount: 1, pendingCount: 1 } },
	]);

	// Recent submissions for teacher's exams (use lookup to avoid retrieving large exam lists)
	const recentSubmissions = await Submission.aggregate([
		{ $sort: { createdAt: -1 } },
		{
			$lookup: {
				from: 'exams',
				localField: 'exam',
				foreignField: '_id',
				as: 'exam',
			},
		},
		{ $unwind: '$exam' },
		{ $match: { 'exam.teacher': TID } },
		{
			$lookup: {
				from: 'students',
				localField: 'student',
				foreignField: '_id',
				as: 'student',
			},
		},
		{ $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
		{
			$project: {
				_id: 1,
				createdAt: 1,
				status: 1,
				grade: 1,
				'student._id': 1,
				'student.fullname': 1,
				'student.username': 1,
				'exam._id': 1,
				'exam.title': 1,
			},
		},
		{ $limit: 5 },
	]);

	// Open issues count (simple, fast)
	const openIssuesCount = await Issue.countDocuments({ teacher: TID, status: 'open' });

	// ── Analytics: Score distribution for all teacher's exams ──
	const scoreDistribution = await Submission.aggregate([
		{
			$lookup: {
				from: 'exams',
				localField: 'exam',
				foreignField: '_id',
				as: 'examDoc',
			},
		},
		{ $unwind: '$examDoc' },
		{ $match: { 'examDoc.createdBy': TID, status: { $in: ['evaluated', 'published'] } } },
		{
			$bucket: {
				groupBy: '$totalMarks',
				boundaries: [0, 20, 40, 60, 80, 101],
				default: 'other',
				output: { count: { $sum: 1 } },
			},
		},
	]);

	// Map buckets to labels
	const bucketLabels = { 0: '0-19', 20: '20-39', 40: '40-59', 60: '60-79', 80: '80-100' };
	const scoreDistChart = (scoreDistribution || [])
		.filter(b => b._id !== 'other')
		.map(b => ({ range: bucketLabels[b._id] || `${b._id}+`, count: b.count }));

	// ── Analytics: Average score per exam (latest 10 exams) ──
	const examPerformance = await Submission.aggregate([
		{
			$lookup: {
				from: 'exams',
				localField: 'exam',
				foreignField: '_id',
				as: 'examDoc',
			},
		},
		{ $unwind: '$examDoc' },
		{ $match: { 'examDoc.createdBy': TID, status: { $in: ['evaluated', 'published'] } } },
		{
			$group: {
				_id: '$exam',
				examTitle: { $first: '$examDoc.title' },
				avgScore: { $avg: '$totalMarks' },
				submissions: { $sum: 1 },
				createdAt: { $first: '$examDoc.createdAt' },
			},
		},
		{ $sort: { createdAt: -1 } },
		{ $limit: 10 },
		{
			$project: {
				examTitle: 1,
				avgScore: { $round: ['$avgScore', 1] },
				submissions: 1,
			},
		},
	]);

	// Build normalized response
	const stats = {
		exams: {
			total: Number(summary.totalExams || 0),
			live: Number(summary.live || 0),
			scheduled: Number(summary.scheduled || 0),
			draft: Number(summary.draft || 0),
			totalEnrolled: Number(summary.totalEnrolled || 0),
		},
		issues: {
			open: Number(openIssuesCount || 0),
		},
		submissions: {
			pending: Number(summary.pendingSubmissionsTotal || 0),
		},
		examsToReview: Array.isArray(examsToReview) ? examsToReview : [],
		recentSubmissions: Array.isArray(recentSubmissions) ? recentSubmissions : [],
		analytics: {
			scoreDistribution: scoreDistChart,
			examPerformance: Array.isArray(examPerformance) ? examPerformance : [],
		},
	};

	// teacher info
	const details = await Teacher.findById(teacherId)
		.select('username fullname email phonenumber gender address createdAt')
		.lean();
	// ensure plain object and strip anything unexpected (defensive)
	if (details) {
		stats.teacher = {
			id: String(details._id ?? teacherId),
			username: details.username ?? '',
			fullname: details.fullname ?? '',
			email: details.email ?? '',
			phonenumber: details.phonenumber ?? '',
			gender: details.gender ?? '',
			address: details.address ?? null,
			createdAt: details.createdAt ?? null,
		};
	} else {
		stats.teacher = null;
	}

	return ApiResponse.success(res, stats, 'Dashboard stats fetched successfully');
});

// ══════════════════════════════════════════════════════════════════
// DATA EXPORT
// ══════════════════════════════════════════════════════════════════

const exportTeacherProfile = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	const teacher = await Teacher.findById(teacherId).lean();

	if (!teacher) {
		throw ApiError.NotFound('Teacher not found');
	}

	const data = [
		{
			ID: teacher._id.toString(),
			Username: teacher.username,
			'Full Name': teacher.fullname,
			Email: teacher.email,
			'Phone Number': teacher.phonenumber || '',
			Department: teacher.department || '',
			Gender: teacher.gender || '',
			Street: teacher.address?.street || '',
			City: teacher.address?.city || '',
			State: teacher.address?.state || '',
			'Postal Code': teacher.address?.postalCode || '',
			Country: teacher.address?.country || '',
			'Verified Email': teacher.isEmailVerified ? 'Yes' : 'No',
			'Registered On': new Date(teacher.createdAt).toLocaleString(),
		},
	];

	const csv = generateCSV(data);
	return sendCSVDowload(res, `teacher_profile_${teacher.username}.csv`, csv);
});

const exportTeacherExams = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;

	const exams = await Exam.find({ createdBy: teacherId }).lean();

	const data = exams.map(exam => ({
		'Exam ID': exam._id.toString(),
		'Search Code': exam.searchId,
		Title: exam.title,
		Description: exam.description,
		'Duration (mins)': exam.duration,
		'Max Marks': exam.max_marks || 0,
		Status: exam.status,
		'Created At': new Date(exam.createdAt).toLocaleString(),
		'Start Time': exam.startTime ? new Date(exam.startTime).toLocaleString() : 'Not Set',
		'End Time': exam.endTime ? new Date(exam.endTime).toLocaleString() : 'Not Set',
	}));

	const csv = generateCSV(data);
	return sendCSVDowload(res, `teacher_exams_${teacherId}.csv`, csv);
});

export {
	createTeacher,
	loginTeacher,
	googleLoginTeacher,
	logoutTeacher,
	updateTeacher,
	changePassword,
	getDashboardStats,
	verifyTeacherEmail,
	resendTeacherVerification,
	forgotTeacherPassword,
	resetTeacherPassword,
	exportTeacherProfile,
	exportTeacherExams,
};

// ══════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ══════════════════════════════════════════════════════════════════

const verifyTeacherEmail = asyncHandler(async (req, res) => {
	const { token } = req.body;
	if (!token) throw ApiError.BadRequest('Verification token is required');

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const teacher = await Teacher.findOne({
		emailVerificationToken: hashedToken,
		emailVerificationExpires: { $gt: Date.now() },
	}).select('+emailVerificationToken +emailVerificationExpires');

	if (!teacher) {
		throw ApiError.BadRequest(
			'Invalid or expired verification link. Please request a new one.',
		);
	}

	teacher.isEmailVerified = true;
	teacher.emailVerificationToken = undefined;
	teacher.emailVerificationExpires = undefined;
	await teacher.save({ validateBeforeSave: false });

	return ApiResponse.success(
		res,
		{ isEmailVerified: true },
		'Email verified successfully! You now have full access.',
	);
});

const resendTeacherVerification = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;

	const teacher = await Teacher.findById(teacherId).select(
		'+emailVerificationToken +emailVerificationExpires',
	);
	if (!teacher) throw ApiError.NotFound('Teacher not found');

	if (teacher.isEmailVerified) {
		return ApiResponse.success(res, { isEmailVerified: true }, 'Email is already verified');
	}

	const verifyToken = teacher.createEmailVerificationToken();
	await teacher.save({ validateBeforeSave: false });

	await sendVerificationEmail(teacher.email, teacher.fullname, verifyToken, 'teacher');

	return ApiResponse.success(
		res,
		{ emailVerificationSent: true },
		'Verification email sent. Please check your inbox.',
	);
});

// ══════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ══════════════════════════════════════════════════════════════════

const forgotTeacherPassword = asyncHandler(async (req, res) => {
	const { email } = req.body;
	if (!email) throw ApiError.BadRequest('Email address is required');

	const genericMsg = 'If an account with that email exists, a password reset link has been sent.';

	const teacher = await Teacher.findOne({ email: email.toLowerCase().trim() });
	if (!teacher) {
		return ApiResponse.success(res, null, genericMsg);
	}

	const resetToken = teacher.createPasswordResetToken();
	await teacher.save({ validateBeforeSave: false });

	const result = await sendPasswordResetEmail(
		teacher.email,
		teacher.fullname,
		resetToken,
		'teacher',
	);

	if (!result.success) {
		teacher.resetPasswordToken = undefined;
		teacher.resetPasswordExpires = undefined;
		await teacher.save({ validateBeforeSave: false });
		throw ApiError.InternalServerError(
			'There was an error sending the email. Please try again.',
		);
	}

	return ApiResponse.success(res, null, genericMsg);
});

const resetTeacherPassword = asyncHandler(async (req, res) => {
	const { token, newPassword } = req.body;
	if (!token || !newPassword) {
		throw ApiError.BadRequest('Token and new password are required');
	}
	if (newPassword.length < 8) {
		throw ApiError.BadRequest('Password must be at least 8 characters');
	}

	const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

	const teacher = await Teacher.findOne({
		resetPasswordToken: hashedToken,
		resetPasswordExpires: { $gt: Date.now() },
	}).select('+password');

	if (!teacher) {
		throw ApiError.BadRequest(
			'Invalid or expired reset link. Please request a new password reset.',
		);
	}

	teacher.password = newPassword;
	teacher.resetPasswordToken = undefined;
	teacher.resetPasswordExpires = undefined;
	teacher.refreshToken = undefined;
	await teacher.save();

	sendPasswordChangedEmail(teacher.email, teacher.fullname).catch(() => {});

	return ApiResponse.success(
		res,
		null,
		'Password reset successfully. You can now log in with your new password.',
	);
});
