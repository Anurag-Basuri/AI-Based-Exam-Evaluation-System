import { Server } from 'socket.io';

export function initSocket(httpServer, app) {
	const io = new Server(httpServer, {
		cors: {
			origin: [/^http:\/\/localhost:\d+$/],
			credentials: true,
		},
	});

	// Make io available in routes/controllers
	app.set('io', io);
	app.use((req, res, next) => {
		req.io = io;
		next();
	});

	io.on('connection', socket => {
		try {
			const { userId, role } = socket.handshake.query || {};
			if (userId) {
				socket.join(String(userId));
			}
			if (role === 'teacher') {
				socket.join('teachers');
			}

			// Fallback manual join
			socket.on('join', room => {
				if (typeof room === 'string' && room.trim()) {
					socket.join(room.trim());
				}
			});
		} catch (e) {
			// no-op
		}
	});
	return io;
}
