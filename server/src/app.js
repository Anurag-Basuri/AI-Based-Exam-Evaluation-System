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

import v1Router from './routes/v1/index.js';

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
app.get('/api/v1/health', (req, res) => {
	res.status(200).json({ status: 'ok', message: 'API is running', version: 'v1' });
});

// Root Route
app.get('/', (req, res) => {
	res.status(200).json({
		status: 'success',
		message: 'Welcome to the AI-Based Exam Evaluation System API',
		documentation: 'https://github.com/Anurag-Basuri/AI-Based-Exam-Evaluation-System',
	});
});

// ── API Routes (versioned) ──────────────────────────────────────
app.use('/api/v1', v1Router);

// Legacy compatibility: /api/* still works (same router)
// This can be removed once frontend is migrated to /api/v1
app.use('/api', v1Router);

// 404 handler
app.use((req, res, next) => {
	next(new ApiError(404, `Route ${req.originalUrl} not found`));
});

// ── Global Error Handler ────────────────────────────────────────
// Normalizes ALL error types into a consistent JSON shape:
//   { status, statusCode, message, details? }
app.use((err, req, res, next) => {
	// ── Already an ApiError? Use it directly.
	if (err instanceof ApiError || (err.statusCode && err.name === 'ApiError')) {
		const statusCode = err.statusCode;

		if (process.env.NODE_ENV !== 'production') {
			console.error(colors.red(`[ERROR] ${statusCode} ${err.message}`));
			if (err.stack) console.error(colors.gray(err.stack));
		}

		return res.status(statusCode).json({
			status: 'error',
			statusCode,
			message: err.message,
			...(err.details && { details: err.details }),
			...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
		});
	}

	// ── Mongoose ValidationError ────────────────────────────────
	if (err.name === 'ValidationError' && err.errors) {
		const details = Object.values(err.errors).map(e => ({
			field: e.path,
			message: e.message,
			value: e.value,
		}));
		return res.status(400).json({
			status: 'error',
			statusCode: 400,
			message: 'Validation failed',
			details,
		});
	}

	// ── Mongoose CastError (invalid ObjectId, etc.) ─────────────
	if (err.name === 'CastError') {
		return res.status(400).json({
			status: 'error',
			statusCode: 400,
			message: `Invalid ${err.path}: ${err.value}`,
		});
	}

	// ── MongoDB Duplicate Key (code 11000) ──────────────────────
	if (err.code === 11000) {
		const field = Object.keys(err.keyValue || {})[0] || 'field';
		return res.status(409).json({
			status: 'error',
			statusCode: 409,
			message: `Duplicate value for '${field}'. This ${field} already exists.`,
		});
	}

	// ── JWT Errors ──────────────────────────────────────────────
	if (err.name === 'JsonWebTokenError') {
		return res.status(401).json({
			status: 'error',
			statusCode: 401,
			message: 'Invalid token',
		});
	}
	if (err.name === 'TokenExpiredError') {
		return res.status(401).json({
			status: 'error',
			statusCode: 401,
			message: 'Token expired',
		});
	}

	// ── Fallback: Unknown error ─────────────────────────────────
	const statusCode = err.statusCode || 500;

	if (process.env.NODE_ENV !== 'production') {
		console.error(colors.red(`[ERROR] ${err.message}`));
		if (err.stack) console.error(colors.gray(err.stack));
	}

	res.status(statusCode).json({
		status: 'error',
		statusCode,
		message: process.env.NODE_ENV === 'production'
			? 'Internal Server Error'
			: err.message || 'Internal Server Error',
		...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
	});
});

export default app;
