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

	return ApiResponse.success(res, { message: 'Password changed successfully. Please log in again.' });
});

// Get dashboard statistics for teacher
const getDashboardStats = asyncHandler(async (req, res) => {
	const teacherId = req.teacher._id;

	// 1. Get all exams for the teacher
	const exams = await Exam.find({ teacher: teacherId }).select(
		'derivedStatus submissionsCount evaluatedCount title',
	);

	// 2. Get open issues
	const openIssuesCount = await Issue.countDocuments({
		teacher: teacherId,
		status: 'open',
	});

	// 3. Calculate stats from exams
	let liveExams = 0;
	let scheduledExams = 0;
	let draftExams = 0;
	let pendingSubmissions = 0;

	exams.forEach(exam => {
		if (exam.derivedStatus === 'live') liveExams++;
		if (exam.derivedStatus === 'scheduled') scheduledExams++;
		if (exam.derivedStatus === 'draft') draftExams++;
		// Correctly calculate pending submissions
		pendingSubmissions += (exam.submissionsCount || 0) - (exam.evaluatedCount || 0);
	});

	// 4. Get exams that need review
	const examsToReview = exams
		.filter(exam => (exam.submissionsCount || 0) > (exam.evaluatedCount || 0))
		.map(exam => ({
			_id: exam._id,
			title: exam.title,
			submissionsCount: exam.submissionsCount,
			evaluatedCount: exam.evaluatedCount,
		}))
		.sort((a, b) => b.submissionsCount - a.submissionsCount) // Sort by most submissions
		.slice(0, 5); // Limit to top 5

	// 5. Get recent submissions
	const recentSubmissions = await Submission.find({ teacher: teacherId })
		.sort({ createdAt: -1 })
		.limit(5)
		.populate('student', 'fullname username')
		.populate('exam', 'title');

	const stats = {
		exams: {
			live: liveExams,
			scheduled: scheduledExams,
			draft: draftExams,
		},
		issues: {
			open: openIssuesCount,
		},
		submissions: {
			pending: pendingSubmissions,
		},
		examsToReview,
		recentSubmissions,
	};

	return ApiResponse.success(res, stats, 'Dashboard stats fetched successfully');
});

export {
    createTeacher,
    loginTeacher,
    logoutTeacher,
    updateTeacher,
	changePassword,
    getDashboardStats
};
