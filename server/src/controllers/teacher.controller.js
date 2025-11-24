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

// Get dashboard statistics for teacher
const getDashboardStats = asyncHandler(async (req, res) => {
	const teacherId = req.teacher?._id || req.user?.id;
	if (!teacherId) {
		throw ApiError.Unauthorized('Teacher identification missing');
	}

	// 1. Get all exams for the teacher (lean for faster read-only ops)
	const exams = await Exam.find({ teacher: teacherId })
		.select(
			'derivedStatus submissionsCount evaluatedCount title enrolledCount enrolled startAt startTime duration',
		)
		.lean();

	const examIds = exams.map(e => e._id);

	// 2. Get open issues
	const openIssuesCount = await Issue.countDocuments({
		teacher: teacherId,
		status: 'open',
	});

	// 3. Calculate stats from exams (defensive, numeric)
	let liveExams = 0;
	let scheduledExams = 0;
	let draftExams = 0;
	let totalExams = exams.length;
	let pendingSubmissions = 0;
	let totalEnrolled = 0;

	exams.forEach(exam => {
		const status = (exam.derivedStatus || '').toString().toLowerCase();
		if (status === 'live' || status === 'active') liveExams++;
		if (status === 'scheduled') scheduledExams++;
		if (status === 'draft') draftExams++;

		const submissionsCount = Number(exam.submissionsCount || 0);
		const evaluatedCount = Number(exam.evaluatedCount || 0);
		const pendingForExam = Math.max(0, submissionsCount - evaluatedCount);
		pendingSubmissions += pendingForExam;

		// enrolledCount may be stored in different fields; support multiple shapes
		if (typeof exam.enrolledCount === 'number') {
			totalEnrolled += Math.max(0, exam.enrolledCount);
		} else if (Array.isArray(exam.enrolled)) {
			totalEnrolled += exam.enrolled.length;
		}
	});

	// 4. Get exams that need review: include pendingCount and keep only >0
	const examsToReview = exams
		.map(exam => {
			const submissionsCount = Number(exam.submissionsCount || 0);
			const evaluatedCount = Number(exam.evaluatedCount || 0);
			const pendingCount = Math.max(0, submissionsCount - evaluatedCount);
			return {
				_id: exam._id,
				title: exam.title || 'Untitled',
				submissionsCount,
				evaluatedCount,
				pendingCount,
			};
		})
		.filter(e => e.pendingCount > 0)
		.sort((a, b) => b.pendingCount - a.pendingCount)
		.slice(0, 5);

	// 5. Get recent submissions (query by exam ids to ensure teacher's)
	let recentSubmissions = [];
	if (examIds.length > 0) {
		recentSubmissions = await Submission.find({ exam: { $in: examIds } })
			.sort({ createdAt: -1 })
			.limit(5)
			.populate('student', 'fullname username')
			.populate('exam', 'title')
			.lean();
	}

	const stats = {
		exams: {
			total: Number(totalExams || 0),
			live: Number(liveExams || 0),
			scheduled: Number(scheduledExams || 0),
			draft: Number(draftExams || 0),
			totalEnrolled: Number(totalEnrolled || 0),
		},
		issues: {
			open: Number(openIssuesCount || 0),
		},
		submissions: {
			pending: Number(pendingSubmissions || 0),
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
	getDashboardStats,
};
