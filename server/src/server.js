import app from './app.js';
import connectDB from './db.js';
import colors from 'colors';
import dotenv from 'dotenv';
import { startExamStatusScheduler } from './services/examStatus.service.js';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = [
    'MONGODB_URI',
    'PORT',
    'NODE_ENV',
    'ACCESS_TOKEN_SECRET'
];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
    missingVars.forEach(varName => {
        console.error(colors.red(`❌ Environment variable ${varName} is not defined. Check your .env file.`));
    });
    process.exit(1);
}

const PORT = process.env.PORT || 8000;

// Centralized error handler for fatal errors
function handleFatalError(error, type = 'Fatal Error') {
    console.error(colors.red(`❌ ${type}:`), error instanceof Error ? error.stack : error);
    // Optionally flush logs or notify monitoring here
    process.exit(1);
}

// Attach global error handlers early
process.on('uncaughtException', error => handleFatalError(error, 'Uncaught Exception'));
process.on('unhandledRejection', error => handleFatalError(error, 'Unhandled Rejection'));

// Start server
(async () => {
    try {
        await connectDB();

        const server = app.listen(PORT, () => {
            console.log(colors.green(`🚀 Server running on http://localhost:${PORT} [${process.env.NODE_ENV}]`));
        });

        // Graceful shutdown
        const shutdown = async (signal) => {
            console.log(colors.yellow(`\n🛑 Received ${signal}. Shutting down gracefully...`));
            server.close(() => {
                console.log(colors.magenta('🔒 HTTP server closed.'));
                process.exit(0);
            });
            // If needed, close other resources here (e.g., DB, cache)
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));

        // Start background exam status scheduler
        startExamStatusScheduler();
    } catch (error) {
        handleFatalError(error, 'Failed to start server');
    }
})();