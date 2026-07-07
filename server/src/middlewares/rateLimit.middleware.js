import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash REST-based Redis client (connectionless, HTTP-based)
let redis = null;
let isUpstashAvailable = false;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
	try {
		redis = new Redis({
			url: process.env.UPSTASH_REDIS_REST_URL,
			token: process.env.UPSTASH_REDIS_REST_TOKEN,
		});
		isUpstashAvailable = true;
		console.log('[RATE_LIMIT] ✅ Upstash rate limiter initialized');
	} catch (err) {
		console.warn('[RATE_LIMIT] ⚠️ Upstash initialization failed:', err.message);
	}
} else {
	console.warn(
		'[RATE_LIMIT] ⚠️ UPSTASH_REDIS_REST_URL or TOKEN not set — rate limiting disabled (fail-open)',
	);
}

// Build an Express middleware from an @upstash/ratelimit instance.
// identifierFn(req) returns the key string to rate-limit by.
// On failure (Upstash down), requests pass through (fail-open).
const buildMiddleware = (limiter, identifierFn, errorMessage) => {
	return async (req, res, next) => {
		// Fail-open if Upstash is unavailable
		if (!limiter) return next();

		try {
			const identifier = identifierFn(req);
			const result = await limiter.limit(identifier);

			// Set standard rate limit headers
			res.setHeader('X-RateLimit-Limit', result.limit);
			res.setHeader('X-RateLimit-Remaining', result.remaining);
			res.setHeader('X-RateLimit-Reset', result.reset);

			if (!result.success) {
				const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
				res.setHeader('Retry-After', retryAfterSec);

				return res.status(429).json({
					status: 'error',
					statusCode: 429,
					message: errorMessage,
					retryAfter: retryAfterSec,
				});
			}

			next();
		} catch (err) {
			// Fail-open: if Upstash is unreachable, let the request through
			console.warn('[RATE_LIMIT] ⚠️ Upstash error (fail-open):', err.message);
			next();
		}
	};
};

// Identifier helpers
const byIP = req => {
	const forwarded = req.headers['x-forwarded-for'];
	const ip = forwarded
		? forwarded.split(',')[0].trim()
		: req.ip || req.socket?.remoteAddress || 'unknown';
	return `ip:${ip}`;
};

const byUser = req => {
	return `user:${req.user?.id || req.user?._id || 'anon'}`;
};

const byIPAndUser = req => {
	const ip = byIP(req);
	const userId = req.user?.id || req.user?._id || 'anon';
	return `${ip}:user:${userId}`;
};

// Rate Limiter Definitions

// 1. Global — 200 req/min per IP (sliding window)
const globalRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(200, '60s'),
			prefix: 'rl:global',
			analytics: false,
		})
	: null;

// 2. Auth — 10 req/15 min per IP (sliding window)
const authRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(10, '900s'),
			prefix: 'rl:auth',
			analytics: false,
		})
	: null;

// 3. Email — 3 req/15 min per IP+User (fixed window)
const emailRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.fixedWindow(3, '900s'),
			prefix: 'rl:email',
			analytics: false,
		})
	: null;

// 4. Verify — 10 req/15 min per IP (sliding window)
const verifyRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(10, '900s'),
			prefix: 'rl:verify',
			analytics: false,
		})
	: null;

// 5. Sensitive Write — 30 req/min per User (sliding window)
const sensitiveWriteRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(30, '60s'),
			prefix: 'rl:write',
			analytics: false,
		})
	: null;

// 6. Submission — 10 req/min per User (sliding window)
const submissionRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.slidingWindow(10, '60s'),
			prefix: 'rl:submit',
			analytics: false,
		})
	: null;

// 7. Export — 5 req/15 min per User (fixed window)
const exportRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.fixedWindow(5, '900s'),
			prefix: 'rl:export',
			analytics: false,
		})
	: null;

// 8. AI Evaluation — 5 req/min per User (token bucket)
const aiEvalRL = isUpstashAvailable
	? new Ratelimit({
			redis,
			limiter: Ratelimit.tokenBucket(5, '60s', 5),
			prefix: 'rl:ai-eval',
			analytics: false,
		})
	: null;

// Exported Middlewares

export const globalLimiter = buildMiddleware(
	globalRL,
	byIP,
	'Too many requests. Please slow down.',
);

export const authLimiter = buildMiddleware(
	authRL,
	byIP,
	'Too many authentication attempts. Please try again after 15 minutes.',
);

export const emailLimiter = buildMiddleware(
	emailRL,
	byIPAndUser,
	'Too many email requests. Please try again after 15 minutes.',
);

export const verifyLimiter = buildMiddleware(
	verifyRL,
	byIP,
	'Too many verification attempts. Please try again after 15 minutes.',
);

export const sensitiveWriteLimiter = buildMiddleware(
	sensitiveWriteRL,
	byUser,
	'Too many write operations. Please slow down.',
);

export const submissionLimiter = buildMiddleware(
	submissionRL,
	byUser,
	'Too many exam submission attempts. Please slow down.',
);

export const exportLimiter = buildMiddleware(
	exportRL,
	byUser,
	'Too many export requests. Please try again after 15 minutes.',
);

export const aiEvalLimiter = buildMiddleware(
	aiEvalRL,
	byUser,
	'AI evaluation rate limit exceeded. Please wait before triggering more evaluations.',
);
