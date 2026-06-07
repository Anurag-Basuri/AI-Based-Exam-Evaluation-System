import rateLimit from 'express-rate-limit';
import IORedis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

// ── Shared Redis connection for rate limiting ───────────────────
let redisClient = null;

if (process.env.UPSTASH_REDIS_URL) {
	try {
		redisClient = new IORedis(process.env.UPSTASH_REDIS_URL, {
			tls: {},
			enableOfflineQueue: true,
		});
		console.log('[RATE_LIMIT] ✅ Using Redis-backed rate limiter');
	} catch (err) {
		console.warn('[RATE_LIMIT] ⚠️ Redis unavailable, using in-memory store:', err.message);
	}
}

if (!redisClient) {
	console.log('[RATE_LIMIT] 📦 Using in-memory rate limit store');
}

/**
 * Create a RedisStore config if Redis is available, otherwise return
 * an empty object so express-rate-limit falls back to its built-in MemoryStore.
 * @param {string} prefix - Key prefix for this limiter (e.g. 'auth', 'email')
 */
export const getRedisStore = (prefix) => {
	if (!redisClient) return {};
	return {
		store: new RedisStore({
			sendCommand: (...args) => redisClient.call(...args),
			prefix: `rl:${prefix}:`,
		}),
	};
};

/**
 * Rate limiter for authentication endpoints (login, register).
 * 10 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 10,
	standardHeaders: true,
	legacyHeaders: false,
	...getRedisStore('auth'),
	message: {
		status: 'error',
		statusCode: 429,
		message: 'Too many attempts. Please try again after 15 minutes.',
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
	...getRedisStore('email'),
	message: {
		status: 'error',
		statusCode: 429,
		message: 'Too many email requests. Please try again after 15 minutes.',
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
	...getRedisStore('verify'),
	message: {
		status: 'error',
		statusCode: 429,
		message: 'Too many verification attempts. Please try again after 15 minutes.',
	},
});
