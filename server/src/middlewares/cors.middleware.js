import cors from 'cors';

const allowedOrigins = [
	process.env.FRONTEND_URL,
	'http://localhost:5173',
	'https://ai-based-exam-evaluation-system.vercel.app',
].filter(Boolean); // removes undefined

export const corsOptions = {
	origin: (origin, callback) => {
		// Allow server-to-server, Render health checks, curl, etc.
		if (!origin) return callback(null, true);

		if (allowedOrigins.includes(origin)) {
			return callback(null, true);
		}

		return callback(null, false);
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	credentials: true,
	optionsSuccessStatus: 204,
};

export const applyCors = cors(corsOptions);
