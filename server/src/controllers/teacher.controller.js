import User from '../models/user.model.js';
import Exam from '../models/exam.model.js';
import Issue from '../models/issue.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateCSV, sendCSVDowload } from '../services/export.service.js';
import * as AuthService from '../services/auth.service.js';

// ── Register ─────────────────────────────────────────────────────
const createTeacher = asyncHandler(async (req, res) => {
	const result = await AuthService.registerUser(User, req.body, 'teacher');
	return ApiResponse.success(
		res,
		{ teacher: result.user, authToken: result.authToken, refreshToken: result.refreshToken, emailVerificationSent: result.emailVerificationSent },
		'Teacher registered successfully. Please check your email to verify your account.',
		201,
	);
});

// ── Login ────────────────────────────────────────────────────────
const loginTeacher = asyncHandler(async (req, res) => {
	const result = await AuthService.loginWithCredentials(User, req.body);
	return ApiResponse.success(
		res,
		{ teacher: result.user, authToken: result.authToken, refreshToken: result.refreshToken },
		'Login successful',
	);
});

// ── Google Login ─────────────────────────────────────────────────
const googleLoginTeacher = asyncHandler(async (req, res) => {
	const result = await AuthService.loginWithGoogle(User, User, req.body.idToken, 'teacher');
	return ApiResponse.success(
		res,
		{ teacher: result.user, authToken: result.authToken, refreshToken: result.refreshToken },
		'Logged in with Google successfully',
	);
});

// ── Logout ───────────────────────────────────────────────────────
const logoutTeacher = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	const result = await AuthService.logoutUser(User, teacherId);
	return ApiResponse.success(res, result);
});

// ── Update Profile ───────────────────────────────────────────────
const updateTeacher = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;

	// Explicitly build update object to support partial updates
	const updateData = {};
	const allowedFields = ['username', 'fullname', 'email', 'phonenumber', 'gender', 'address'];

	allowedFields.forEach(field => {
		if (req.body[field] !== undefined) {
			updateData[field] = req.body[field];
		}
	});

	const updatedTeacher = await User.findByIdAndUpdate(teacherId, updateData, {
		new: true,
		runValidators: true,
	}).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');

	if (!updatedTeacher) {
		throw ApiError.NotFound('Teacher not found');
	}

	return ApiResponse.success(res, updatedTeacher, 'Profile updated successfully');
});

// ── Change Password ──────────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	const { currentPassword, newPassword, confirmNewPassword } = req.body;

	if (confirmNewPassword !== undefined && newPassword !== confirmNewPassword) {
		throw ApiError.BadRequest('New password and confirmation do not match');
	}

	if (newPassword === currentPassword) {
		throw ApiError.BadRequest('New password must be different from current password');
	}

	const result = await AuthService.changePassword(User, teacherId, currentPassword, newPassword);

	// Invalidate refresh token(s) to force re-login
	await User.findByIdAndUpdate(teacherId, { refreshToken: null });

	return ApiResponse.success(res, {
		message: 'Password changed successfully. Please log in again.',
	});
});

// ══════════════════════════════════════════════════════════════════
// DASHBOARD STATS (Teacher-specific — stays in controller)
// ══════════════════════════════════════════════════════════════════

// Get dashboard statistics for teacher (refactored, efficient, defensive)
const getDashboardStats = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	if (!teacherId) throw ApiError.Unauthorized('Teacher identification missing');

	const TID = new mongoose.Types.ObjectId(teacherId);

	// Aggregate exam-level summary and pending calculations server-side to avoid loading all docs
	const summaryAgg = await Exam.aggregate([
		{ $match: { createdBy: TID } },
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
		{ $match: { createdBy: TID } },
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
		{ $match: { 'exam.createdBy': TID } },
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
	const details = await User.findById(teacherId)
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
	const teacherId = req.userDoc?._id || req.user?.id;
	const teacher = await User.findById(teacherId).lean();

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
	const teacherId = req.userDoc?._id || req.user?.id;

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

// ══════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ══════════════════════════════════════════════════════════════════

const verifyTeacherEmail = asyncHandler(async (req, res) => {
	const result = await AuthService.verifyEmail(User, req.body.token);
	return ApiResponse.success(res, result, 'Email verified successfully! You now have full access.');
});

const resendTeacherVerification = asyncHandler(async (req, res) => {
	const teacherId = req.userDoc?._id || req.user?.id;
	const result = await AuthService.resendVerification(User, teacherId, 'teacher');
	if (result.alreadyVerified) {
		return ApiResponse.success(res, { isEmailVerified: true }, 'Email is already verified');
	}
	return ApiResponse.success(res, { emailVerificationSent: true }, 'Verification email sent. Please check your inbox.');
});

// ══════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ══════════════════════════════════════════════════════════════════

const forgotTeacherPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.forgotPassword(User, req.body.email, 'teacher');
	return ApiResponse.success(res, null, result.message);
});

const resetTeacherPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.resetPassword(User, req.body.token, req.body.newPassword);
	return ApiResponse.success(res, null, result.message);
});

// ══════════════════════════════════════════════════════════════════
// TOKEN REFRESH
// ══════════════════════════════════════════════════════════════════

const refreshTeacherToken = asyncHandler(async (req, res) => {
	const result = await AuthService.refreshTokens(User, req.body.refreshToken);
	return ApiResponse.success(res, result, 'Token refreshed successfully');
});

// ══════════════════════════════════════════════════════════════════
// EXPORTS (must be at the end to avoid const hoisting issues)
// ══════════════════════════════════════════════════════════════════

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
	refreshTeacherToken,
};
