import Student from '../models/student.model.js';
import Teacher from '../models/teacher.model.js';
import Submission from '../models/submission.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { generateCSV, sendCSVDowload } from '../services/export.service.js';
import * as AuthService from '../services/auth.service.js';

// ── Register ─────────────────────────────────────────────────────
const createStudent = asyncHandler(async (req, res) => {
	const result = await AuthService.registerUser(Student, req.body, 'student');
	return ApiResponse.success(
		res,
		{ student: result.user, authToken: result.authToken, refreshToken: result.refreshToken, emailVerificationSent: result.emailVerificationSent },
		'Student registered successfully. Please check your email to verify your account.',
		201,
	);
});

// ── Login ────────────────────────────────────────────────────────
const loginStudent = asyncHandler(async (req, res) => {
	const result = await AuthService.loginWithCredentials(Student, req.body);
	return ApiResponse.success(
		res,
		{ student: result.user, authToken: result.authToken, refreshToken: result.refreshToken },
		'Login successful',
	);
});

// ── Google Login ─────────────────────────────────────────────────
const googleLoginStudent = asyncHandler(async (req, res) => {
	const result = await AuthService.loginWithGoogle(Student, Teacher, req.body.idToken, 'student');
	return ApiResponse.success(
		res,
		{ student: result.user, authToken: result.authToken, refreshToken: result.refreshToken },
		'Logged in with Google successfully',
	);
});

// ── Logout ───────────────────────────────────────────────────────
const logoutStudent = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const result = await AuthService.logoutUser(Student, studentId);
	return ApiResponse.success(res, result);
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
	const result = await AuthService.changePassword(Student, studentId, req.body.currentPassword, req.body.newPassword);
	return ApiResponse.success(res, result);
});

// ══════════════════════════════════════════════════════════════════
// EMAIL VERIFICATION
// ══════════════════════════════════════════════════════════════════

const verifyStudentEmail = asyncHandler(async (req, res) => {
	const result = await AuthService.verifyEmail(Student, req.body.token);
	return ApiResponse.success(res, result, 'Email verified successfully! You now have full access.');
});

const resendStudentVerification = asyncHandler(async (req, res) => {
	const studentId = req.student?._id || req.user?.id;
	const result = await AuthService.resendVerification(Student, studentId, 'student');
	if (result.alreadyVerified) {
		return ApiResponse.success(res, { isEmailVerified: true }, 'Email is already verified');
	}
	return ApiResponse.success(res, { emailVerificationSent: true }, 'Verification email sent. Please check your inbox.');
});

// ══════════════════════════════════════════════════════════════════
// PASSWORD RESET
// ══════════════════════════════════════════════════════════════════

const forgotStudentPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.forgotPassword(Student, req.body.email, 'student');
	return ApiResponse.success(res, null, result.message);
});

const resetStudentPassword = asyncHandler(async (req, res) => {
	const result = await AuthService.resetPassword(Student, req.body.token, req.body.newPassword);
	return ApiResponse.success(res, null, result.message);
});

// ══════════════════════════════════════════════════════════════════
// DATA EXPORT
// ══════════════════════════════════════════════════════════════════

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
	const result = await AuthService.refreshTokens(Student, req.body.refreshToken);
	return ApiResponse.success(res, result, 'Token refreshed successfully');
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
