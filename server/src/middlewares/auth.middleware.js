import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import User from '../models/user.model.js';

const checkAuth = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
        token = req.query.token; // Fallback for EventSource / SSE
    }

    if (!token) {
        return next(ApiError.Unauthorized('No token provided'));
    }

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
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'student') {
        return next(ApiError.Forbidden('Access denied: Not a student'));
    }
    req.userDoc = user;
    req.student = user; // Legacy compat
    next();
});

const verifyTeacher = asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user.id).select('-password');
    if (!user || user.role !== 'teacher') {
        return next(ApiError.Forbidden('Access denied: Not a teacher'));
    }
    req.userDoc = user;
    req.teacher = user; // Legacy compat
    next();
});

const requireVerifiedEmail = asyncHandler(async (req, res, next) => {
    const user = req.userDoc || req.student || req.teacher;
    if (!user) {
        return next(ApiError.Unauthorized('Authentication required'));
    }
    if (!user.isEmailVerified) {
        return next(ApiError.Forbidden(
            'Please verify your email address before performing this action. Check your inbox or resend the verification email from your profile.'
        ));
    }
    next();
});

export {
    checkAuth,
    verifyStudent,
    verifyTeacher,
    requireVerifiedEmail
};