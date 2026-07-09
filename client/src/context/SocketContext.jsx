/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../services/api.js';
import { getToken } from '../utils/handleToken.js';
import { useAuth } from '../hooks/useAuth.js';

// SOCKET CONTEXT — Singleton authenticated Socket.IO connection
export const SocketContext = createContext(null);


// Provides a single, authenticated Socket.IO connection to the entire component tree. The socket:
export const SocketProvider = ({ children }) => {
	const { isAuthenticated, user } = useAuth();
	const socketRef = useRef(null);
	const [connected, setConnected] = useState(false);

	useEffect(() => {
		// Only connect when authenticated and we have user identity
		if (!isAuthenticated || !user?.id) {
			// Clean up any lingering connection from a previous session
			if (socketRef.current) {
				socketRef.current.disconnect();
				socketRef.current = null;
				setConnected(false);
			}
			return;
		}

		const { accessToken } = getToken();
		if (!accessToken) return;

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			auth: { token: `Bearer ${accessToken}` },
			transports: ['websocket', 'polling'], // prefer WS, fall back to polling
			reconnection: true,
			reconnectionAttempts: 10,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 10000,
		});

		socketRef.current = socket;

		socket.on('connect', () => {
			console.log('[SOCKET] ✅ Connected:', socket.id);
			setConnected(true);
		});

		socket.on('disconnect', (reason) => {
			console.log('[SOCKET] ❌ Disconnected:', reason);
			setConnected(false);
		});

		socket.on('connect_error', (err) => {
			console.warn('[SOCKET] Connection error:', err.message);
			setConnected(false);

			// If auth failed, try refreshing the token for the next attempt
			if (err.message?.includes('Authentication') || err.message?.includes('token')) {
				const freshTokens = getToken();
				if (freshTokens?.accessToken) {
					socket.auth = { token: `Bearer ${freshTokens.accessToken}` };
				}
			}
		});

		return () => {
			socket.disconnect();
			socketRef.current = null;
			setConnected(false);
		};
	}, [isAuthenticated, user?.id]);

	const value = { socket: socketRef.current, connected };

	return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};
