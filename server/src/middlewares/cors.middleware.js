import cors from 'cors';

// Build allowed origins from environment and defaults
// CORS_ORIGINS env var should be comma-separated (e.g., "https://app.com,https://staging.app.com")
const buildAllowedOrigins = () => {
	const origins = new Set();

	// Always allow localhost for development
	origins.add('http://localhost:5173');
	origins.add('http://localhost:3000');

	// Add FRONTEND_URL if set
	if (process.env.FRONTEND_URL) {
		origins.add(process.env.FRONTEND_URL);
	}

	// Add any additional origins from CORS_ORIGINS (comma-separated)
	if (process.env.CORS_ORIGINS) {
		process.env.CORS_ORIGINS.split(',')
			.map(origin => origin.trim())
			.filter(Boolean)
			.forEach(origin => origins.add(origin));
	}

	// Production Vercel deployment
	origins.add('https://ai-based-exam-evaluation-system.vercel.app');

	return [...origins];
};

const allowedOrigins = buildAllowedOrigins();

export const corsOptions = {
	origin: (origin, callback) => {
		// Allow requests with no origin (server-to-server, health checks, curl, Postman)
		if (!origin) {
			return callback(null, true);
		}

		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		// Log blocked origin in development for debugging
		if (process.env.NODE_ENV !== 'production') {
			console.warn(`[CORS] Blocked origin: ${origin}`);
		}

		return callback(new Error(`Origin ${origin} not allowed by CORS`), false);
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
	exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
	credentials: true,
	maxAge: 86400, // 24 hours - browsers cache preflight response
	optionsSuccessStatus: 200, // Some legacy browsers choke on 204
};

export const applyCors = cors(corsOptions);
