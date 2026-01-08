import express from 'express';
import cors from 'cors';
import { corsOptions } from './middlewares/cors.middleware.js';
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

// Trust proxy (required for Render, Heroku, etc. behind reverse proxy)
app.set('trust proxy', 1);

// Disable x-powered-by header
app.disable('x-powered-by');

// CORS - must be first middleware before any routes
app.use(cors(corsOptions));

// Security headers with CORS-friendly settings
app.use(
	helmet({
		crossOriginResourcePolicy: { policy: 'cross-origin' },
		crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
	}),
);

// Logging - use 'combined' format in production for detailed logs
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Health check (before API routes for quick response)
app.get('/api/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Root Route
app.get('/', (req, res) => {
	res.status(200).json({
		status: 'success',
		message: 'Welcome to the AI-Based Exam Evaluation System API',
		documentation: 'https://github.com/Anurag-Basuri/AI-Based-Exam-Evaluation-System',
	});
});

// API Routes
app.use('/api/students', studentRouter);
app.use('/api/teachers', teacherRouter);
app.use('/api/exams', examRouter);
app.use('/api/questions', questionRouter);
app.use('/api/submissions', submissionRouter);
app.use('/api/issues', issueRouter);

// 404 handler
app.use((req, res, next) => {
	next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// Global error handler
app.use((err, req, res, next) => {
	const statusCode = err.statusCode || 500;

	// Log errors in development
	if (process.env.NODE_ENV !== 'production') {
		console.error(colors.red(`[ERROR] ${err.message}`));
		if (err.stack) console.error(colors.gray(err.stack));
	}

	res.status(statusCode).json({
		status: 'error',
		statusCode,
		message: err.message || 'Internal Server Error',
		...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
	});
});

export default app;
