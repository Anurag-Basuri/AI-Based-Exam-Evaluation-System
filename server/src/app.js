import express from 'express';
import { applyCors } from './middlewares/Cors.middleware.js';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { ApiError } from './utils/ApiError.js';
import colors from 'colors';
import dotenv from 'dotenv';

dotenv.config();

import studentRouter from './routes/student.routes.js';
import teacherRouter from './routes/teacher.routes.js';
import examRouter from './routes/exam.routes.js';
import questionRouter from './routes/question.routes.js';
import submissionRouter from './routes/submission.routes.js';
import issueRouter from './routes/issue.routes.js';

const app = express();

// Security & Logging Middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());
app.use(applyCors);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is running' });
});

// API Routes
app.use('/api/students', studentRouter);
app.use('/api/teachers', teacherRouter);
app.use('/api/exams', examRouter);
app.use('/api/questions', questionRouter);
app.use('/api/submissions', submissionRouter);
app.use('/api/issues', issueRouter);

// 404 Handler (for unmatched routes)
app.use((req, res, next) => {
    next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global Error Handler
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    if (process.env.NODE_ENV !== 'production') {
        console.error(colors.red(`[ERROR] ${err.message}`));
    }
    res.status(statusCode).json({
        status: 'error',
        statusCode,
        message: err.message || 'Internal Server Error',
    });
});

export default app;