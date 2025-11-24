import mongoose from 'mongoose';
import Teacher from '../models/teacher.model.js';
import Exam from '../models/exam.model.js';
import Issue from '../models/issue.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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
	const authToken = newTeacher.generateAuthToken();
	const refreshToken = newTeacher.generateRefreshToken();
	await newTeacher.save();

	// Remove sensitive fields before sending response
	const teacherData = newTeacher.toObject();
	delete teacherData.password;
	delete teacherData.refreshToken;
	delete teacherData.resetPasswordToken;
	delete teacherData.resetPasswordExpires;

	return ApiResponse.success(
		res,
		{
			teacher: newTeacher,
			authToken,
			refreshToken,
		},
		'Teacher created successfully',
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

	// Save refresh token to DB for logout/invalidation
	teacher.refreshToken = refreshToken;
	await teacher.save();

	// Remove sensitive fields before sending response
	const teacherData = teacher.toObject();
	delete teacherData.password;
	delete teacherData.refreshToken;
	delete teacherData.resetPasswordToken;
	delete teacherData.resetPasswordExpires;

	return ApiResponse.success(
		res,
		{
			teacher: teacherData,
			authToken,
			refreshToken,
		},
		'Login successful',
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
	const { username, fullname, email, phonenumber, gender, address } = req.body;

	const updatedTeacher = await Teacher.findByIdAndUpdate(
		teacherId,
		{ username, fullname, email, phonenumber, gender, address },
		{ new: true, runValidators: true },
	).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');

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
	};

	return ApiResponse.success(res, stats, 'Dashboard stats fetched successfully');
});

export {
	createTeacher,
	loginTeacher,
	logoutTeacher,
	updateTeacher,
	changePassword,
	getDashboardStats,
};
