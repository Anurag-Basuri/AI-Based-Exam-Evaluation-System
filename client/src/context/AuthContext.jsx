/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	registerUser,
	loginUser,
	googleLogin,
	logoutUser,
} from '../services/apiServices';
import { getToken, removeToken, isTokenExpired, decodeToken } from '../utils/handleToken';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const navigate = useNavigate();

	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [role, setRole] = useState(null);
	const [isEmailVerified, setIsEmailVerified] = useState(false);
	const [loading, setLoading] = useState(true);

	// ── Hydrate auth state from stored token on mount ──────────────
	useEffect(() => {
		try {
			const { accessToken } = getToken() || {};
			if (accessToken && !isTokenExpired(accessToken)) {
				const decoded = decodeToken(accessToken);
				setUser(decoded);
				setRole(decoded?.role || null);
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
			} else {
				clearAuthState();
				removeToken();
			}
		} catch (err) {
			clearAuthState();
			try { removeToken(); } catch {
				/* ignore */
			}
			console.error('Auth init failed:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	// ── Listen for 401 / token-expired events from the Axios interceptor ──
	useEffect(() => {
		const handleUnauthorized = () => {
			if (!isAuthenticated) return;
			clearAuthState();
			try { removeToken(); } catch {
				/* ignore */
			}
			navigate('/login?session_expired=true', { replace: true });
		};

		window.addEventListener('api:unauthorized', handleUnauthorized);
		return () => window.removeEventListener('api:unauthorized', handleUnauthorized);
	}, [isAuthenticated, navigate]);

	// ── Helpers ──────────────────────────────────────────────────────

	/** Reset all auth state to logged-out defaults. */
	const clearAuthState = () => {
		setUser(null);
		setRole(null);
		setIsEmailVerified(false);
		setIsAuthenticated(false);
	};

	/**
	 * Apply decoded JWT claims to context state.
	 * Called after any successful login / register / Google auth.
	 */
	const applyAuthFromToken = (decoded, fallbackRole) => {
		setUser(decoded);
		setRole(decoded?.role || fallbackRole);
		setIsEmailVerified(decoded?.isEmailVerified || false);
		setIsAuthenticated(true);
	};

	/** Normalize API/Axios errors, preserving structure for classifyError. */
	const normalizeError = err => {
		const response = err?.response;
		const data = response?.data || err?.data;
		const status = response?.status || err?.status;
		const msg = data?.message || err?.message || 'Unexpected error occurred';

		const e = new Error(msg);
		e.status = status;
		e.data = data;
		// Preserve the response object so classifyError can access response.status / response.data
		e.response = response || (status ? { status, data } : undefined);
		e.code = err?.code;
		e.cause = err;
		return e;
	};

	// ── Unified auth handlers ───────────────────────────────────────
	// NOTE: These handlers update context state only.
	// Navigation is the caller's responsibility (Login.jsx, Register.jsx, etc.)

	const handleRegister = async userData => {
		setLoading(true);
		try {
			const res = await registerUser(userData);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), userData.role);
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleLogin = async credentials => {
		setLoading(true);
		try {
			const res = await loginUser(credentials);
			if (res?.data?.authToken) {
				// We don't know the role until the backend tells us
				applyAuthFromToken(decodeToken(res.data.authToken));
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async (idToken, roleHint) => {
		setLoading(true);
		try {
			const res = await googleLogin(idToken, roleHint);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), roleHint);
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = async () => {
		setLoading(true);
		try {
			await logoutUser();
		} catch {
			// Best-effort: server logout may fail, but we still clear locally
		} finally {
			clearAuthState();
			try { removeToken(); } catch {
				/* ignore */
			}
			setLoading(false);
			navigate('/login', { replace: true });
		}
	};

	// ── Context value ───────────────────────────────────────────────

	const value = {
		user,
		isAuthenticated,
		role,
		isEmailVerified,
		loading,
		register: handleRegister,
		login: handleLogin,
		googleLogin: handleGoogleLogin,
		logout: handleLogout,
		setUser,
		setRole,
		setIsAuthenticated,
		setIsEmailVerified,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
