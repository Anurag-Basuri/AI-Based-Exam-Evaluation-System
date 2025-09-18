import cors from 'cors';

const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    // Add more origins if needed
];

export const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    optionsSuccessStatus: 200,
};

export const applyCors = cors(corsOptions);