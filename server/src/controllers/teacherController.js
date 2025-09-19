import Teacher from '../models/teacher.model.js';
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
    await newTeacher.save();

    const authToken = newTeacher.generateAuthToken();
    const refreshToken = newTeacher.generateRefreshToken();

    return ApiResponse.success(
        res,
        {
            teacher: newTeacher,
            authToken,
            refreshToken
        },
        'Teacher created successfully',
        201
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

    // FIX: select password explicitly
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
            refreshToken
        },
        'Login successful'
    );
});

// Teacher logout
const logoutTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.teacher?._id || req.user?.id;

    await Teacher.findByIdAndUpdate(teacherId, { refreshToken: null });

    return ApiResponse.success(
        res,
        { message: 'Logged out successfully' }
    );
});

// Update teacher details
const updateTeacher = asyncHandler(async (req, res) => {
    const teacherId = req.teacher?._id || req.user?.id;
    const { username, fullname, email, phonenumber, gender, address } = req.body;

    const updatedTeacher = await Teacher.findByIdAndUpdate(
        teacherId,
        { username, fullname, email, phonenumber, gender, address },
        { new: true, runValidators: true }
    ).select('-password -refreshToken -resetPasswordToken -resetPasswordExpires');

    if (!updatedTeacher) {
        throw ApiError.NotFound('Teacher not found');
    }

    return ApiResponse.success(
        res,
        updatedTeacher,
        'Teacher updated successfully'
    );
});

// Update teacher password
const changePassword = asyncHandler(async (req, res) => {
    const teacherId = req.teacher?._id || req.user?.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        throw ApiError.BadRequest('Current and new passwords are required');
    }

    const teacher = await Teacher.findById(teacherId);
    if (!teacher) {
        throw ApiError.NotFound('Teacher not found');
    }

    const isMatch = await teacher.comparePassword(currentPassword);
    if (!isMatch) {
        throw ApiError.Unauthorized('Invalid current password');
    }

    teacher.password = newPassword;
    await teacher.save();

    return ApiResponse.success(
        res,
        { message: 'Password changed successfully' }
    );
});

export {
    createTeacher,
    loginTeacher,
    logoutTeacher,
    updateTeacher,
    changePassword
};