import { Server } from 'socket.io';

const buildCors = () => {
	// Prefer explicit origins in prod; allow localhost:* in dev
	const fromEnv = process.env.CORS_ORIGIN?.split(',')
		.map(s => s.trim())
		.filter(Boolean);
	if (fromEnv?.length) return { origin: fromEnv, credentials: true };
	return { origin: [/^http:\/\/localhost:\d+$/], credentials: true };
};

export function initSocket(httpServer, app) {
	const io = new Server(httpServer, {
		cors: buildCors(),
		pingInterval: 20000,
		pingTimeout: 20000,
	});

	// Expose io to routes/controllers
	app.set('io', io);
	app.use((req, res, next) => {
		req.io = io;
		next();
	});

	io.on('connection', socket => {
		try {
			const { userId, role } = socket.handshake.query || {};
			if (userId) socket.join(String(userId));
			if (role === 'teacher') socket.join('teachers');

			// Optional manual join
			socket.on('join', room => {
				if (typeof room === 'string' && room.trim()) socket.join(room.trim());
			});

			socket.on('disconnect', () => {
				// no-op; reserved for future metrics/cleanup
			});
		} catch {
			// no-op
		}
	});

	return io;
}
