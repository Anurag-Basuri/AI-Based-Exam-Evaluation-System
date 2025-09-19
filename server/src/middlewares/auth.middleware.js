import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import Student from '../models/student.model.js';
import Teacher from '../models/teacher.model.js';

const checkAuth = asyncHandler(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next(ApiError.Unauthorized('No token provided'));
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return next(ApiError.Unauthorized('Token expired'));
        }
        if (error.name === 'JsonWebTokenError') {
            return next(ApiError.Unauthorized('Invalid token'));
        }
        return next(ApiError.InternalServerError('Authentication error', error.message));
    }
});

const verifyStudent = asyncHandler(async (req, res, next) => {
    const student = await Student.findById(req.user.id).select('-password');
    if (!student) {
        return next(ApiError.Forbidden('Access denied: Not a student'));
    }
    req.student = student;
    next();
});

const verifyTeacher = asyncHandler(async (req, res, next) => {
    const teacher = await Teacher.findById(req.user.id).select('-password');
    if (!teacher) {
        return next(ApiError.Forbidden('Access denied: Not a teacher'));
    }
    req.teacher = teacher;
    next();
});

export {
    checkAuth,
    verifyStudent,
    verifyTeacher
};