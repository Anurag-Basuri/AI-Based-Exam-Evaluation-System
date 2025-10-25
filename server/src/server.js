import http from 'http';
import dotenv from 'dotenv';
import colors from 'colors';
import app from './app.js';
import connectDB from './db.js';
import { initSocket } from './socket/initSocket.js';
import { startExamStatusScheduler } from './services/examStatus.service.js';

dotenv.config();

const PORT = process.env.PORT || 8000;

// Validate critical environment variables (PORT is optional due to default)
const requiredEnvVars = ['MONGODB_URI', 'ACCESS_TOKEN_SECRET'];
const missingVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingVars.length > 0) {
	missingVars.forEach(v =>
		console.error(
			colors.red(`❌ Environment variable ${v} is not defined. Check your .env file.`),
		),
	);
	process.exit(1);
}

// Centralized error handler for fatal errors
function handleFatalError(error, type = 'Fatal Error') {
	console.error(colors.red(`❌ ${type}:`), error instanceof Error ? error.stack : error);
	process.exit(1);
}

// Attach global error handlers early
process.on('uncaughtException', err => handleFatalError(err, 'Uncaught Exception'));
process.on('unhandledRejection', err => handleFatalError(err, 'Unhandled Rejection'));

(async () => {
	try {
		// 1) Connect DB first
		await connectDB();

		// 2) Create HTTP server and initialize Socket.IO exactly once
		const httpServer = http.createServer(app);
		const io = initSocket(httpServer, app);

		// 3) Start listening
		httpServer.listen(PORT, () => {
			console.log(
				colors.green(
					`🚀 API listening on http://localhost:${PORT} [${process.env.NODE_ENV}]`,
				),
			);
		});

		// 4) Start background jobs
		startExamStatusScheduler();

		// 5) Graceful shutdown
		const shutdown = signal => {
			console.log(colors.yellow(`\n🛑 Received ${signal}. Shutting down gracefully...`));
			// Stop accepting new connections
			httpServer.close(() => {
				console.log(colors.magenta('🔒 HTTP server closed.'));
				// Close Socket.IO
				try {
					io?.close(() => console.log(colors.magenta('📡 Socket.IO server closed.')));
				} catch {
					// ignore
				}
				process.exit(0);
			});
			// Optional: close DB or other resources here if needed
		};

		process.on('SIGINT', () => shutdown('SIGINT'));
		process.on('SIGTERM', () => shutdown('SIGTERM'));
	} catch (error) {
		handleFatalError(error, 'Failed to start server');
	}
})();
