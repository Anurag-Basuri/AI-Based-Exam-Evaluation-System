import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

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

	// ── Authentication Middleware ────────────────────────────────
	// Verify JWT before allowing connection.
	// Client must pass token via: io(url, { auth: { token: 'Bearer xxx' } })
	io.use((socket, next) => {
		try {
			const raw = socket.handshake.auth?.token || '';
			const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw;

			if (!token) {
				return next(new Error('Authentication required'));
			}

			const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

			// Attach verified user data to socket — no trusting query params
			socket.user = {
				id: decoded.id,
				role: decoded.role,
				username: decoded.username,
			};
			next();
		} catch (err) {
			console.warn('[SOCKET] Auth failed:', err.message);
			next(new Error('Invalid or expired token'));
		}
	});

	// Expose io to routes/controllers
	app.set('io', io);
	app.use((req, res, next) => {
		req.io = io;
		next();
	});

	io.on('connection', socket => {
		try {
			const { id: userId, role } = socket.user;

			// Auto-join user to their personal room (for targeted events)
			if (userId) socket.join(String(userId));

			// Teachers join a shared 'teachers' room
			if (role === 'teacher') socket.join('teachers');

			// Allow joining specific rooms (e.g., exam rooms)
			socket.on('join', room => {
				if (typeof room === 'string' && room.trim()) {
					socket.join(room.trim());
				}
			});

			socket.on('disconnect', () => {
				// Reserved for future metrics/cleanup
			});
		} catch {
			// Silently handle edge cases
		}
	});

	return io;
}

