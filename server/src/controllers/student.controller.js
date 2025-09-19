import Student from '../models/student.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

// Create a new student
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
    const authToken = newStudent.generateAuthToken();
    const refreshToken = newStudent.generateRefreshToken();
    await newStudent.save();

    // Remove sensitive fields before sending response
    const studentData = newStudent.toObject();
    delete studentData.password;
    delete studentData.refreshToken;
    delete studentData.resetPasswordToken;
    delete studentData.resetPasswordExpires;

    return ApiResponse.success(
        res,
        {
            student: newStudent,
            authToken,
            refreshToken
        },
        'Student created successfully',
        201
    );
});

// Student login
const loginStudent = asyncHandler(async (req, res) => {
    const { username, email, password } = req.body;
    if ((!username && !email) || !password) {
        throw ApiError.BadRequest('Username or email and password are required');
    }

    const student = await Student.findOne(username? { username } : { email });
    if( !student ){
        throw ApiError.NotFound('Student not found');
    }

    const isMatch = await student.correctPassword(password, student.password);
    if (!isMatch) {
        throw ApiError.Unauthorized('Invalid password');
    }

    const authToken = student.generateAuthToken();
    const refreshToken = student.generateRefreshToken();

    // Remove sensitive fields before sending response
    const studentData = student.toObject();
    delete studentData.password;
    delete studentData.refreshToken;
    delete studentData.resetPasswordToken;
    delete studentData.resetPasswordExpires;

    return ApiResponse.success(
        res,
        {
            student: studentData,
            authToken,
            refreshToken
        },
        'Login successful'
    );
});

// Student logout
const logoutStudent = asyncHandler(async (req, res) => {
    const studentId = req.student?._id || req.user?.id;

    await Student.findByIdAndUpdate(studentId, { refreshToken: null });

    return ApiResponse.success(res, { message: 'Logged out successfully' });
});

// Update student details
const updateStudent = asyncHandler(async (req, res) => {
    const studentId = req.student?._id || req.user?.id;
    const { username, fullname, email, phonenumber, gender, address } = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(
        studentId,
        { username, fullname, email, phonenumber, gender, address },
        { new: true, runValidators: true }
    ).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');

    if (!updatedStudent) {
        throw ApiError.NotFound('Student not found');
    }

    return ApiResponse.success(res, updatedStudent, 'Student updated successfully');
});

// Update student password
const changePassword = asyncHandler(async (req, res) => {
    const studentId = req.student?._id || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw ApiError.BadRequest('Current and new passwords are required');
    }

    const student = await Student.findById(studentId);
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

export {
    createStudent,
    loginStudent,
    logoutStudent,
    updateStudent,
    changePassword
};