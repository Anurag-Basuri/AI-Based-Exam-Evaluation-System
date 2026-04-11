import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for authentication endpoints (login, register).
 * 10 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		status: 'error',
		statusCode: 429,
		message: 'Too many attempts. Please try again after 15 minutes.',
	},
	keyGenerator: (req) => {
		// Use X-Forwarded-For behind proxies, fallback to socket IP
		return req.ip || req.connection?.remoteAddress || 'unknown';
	},
});

/**
 * Rate limiter for email-sensitive operations (forgot password, resend verification).
 * 5 requests per 15-minute window per IP.
 */
export const emailLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 5,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		status: 'error',
		statusCode: 429,
		message: 'Too many email requests. Please try again after 15 minutes.',
	},
	keyGenerator: (req) => {
		return req.ip || req.connection?.remoteAddress || 'unknown';
	},
});

/**
 * Rate limiter for token verification endpoints (verify email, reset password).
 * 10 requests per 15-minute window per IP.
 */
export const verifyLimiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	message: {
		status: 'error',
		statusCode: 429,
		message: 'Too many verification attempts. Please try again after 15 minutes.',
	},
	keyGenerator: (req) => {
		return req.ip || req.connection?.remoteAddress || 'unknown';
	},
});
