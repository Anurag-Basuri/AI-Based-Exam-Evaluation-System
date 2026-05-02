import React, { createContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
	registerStudent,
	loginStudent,
	googleLoginStudent,
	logoutStudent,
	registerTeacher,
	loginTeacher,
	googleLoginTeacher,
	logoutTeacher,
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
			try { removeToken(); } catch {}
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
			try { removeToken(); } catch {}
			navigate('/auth?mode=login&session_expired=true', { replace: true });
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

	/** Normalize API/Axios errors into a simple Error with a readable message. */
	const normalizeError = err => {
		const msg = err?.response?.data?.message || err?.message || 'Unexpected error occurred';
		const e = new Error(msg);
		e.status = err?.response?.status || err?.status;
		e.cause = err;
		return e;
	};

	// ── Student auth handlers ───────────────────────────────────────
	// NOTE: These handlers update context state only.
	// Navigation is the caller's responsibility (Login.jsx, Register.jsx, etc.)

	const handleRegisterStudent = async studentData => {
		setLoading(true);
		try {
			const res = await registerStudent(studentData);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), 'student');
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleLoginStudent = async credentials => {
		setLoading(true);
		try {
			const res = await loginStudent(credentials);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), 'student');
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLoginStudent = async idToken => {
		setLoading(true);
		try {
			const res = await googleLoginStudent(idToken);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), 'student');
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleLogoutStudent = async () => {
		setLoading(true);
		try {
			await logoutStudent();
		} catch {
			// Best-effort: server logout may fail, but we still clear locally
		} finally {
			clearAuthState();
			try { removeToken(); } catch {}
			setLoading(false);
			navigate('/auth?mode=login', { replace: true });
		}
	};

	// ── Teacher auth handlers ───────────────────────────────────────

	const handleRegisterTeacher = async teacherData => {
		setLoading(true);
		try {
			const res = await registerTeacher(teacherData);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), 'teacher');
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleLoginTeacher = async credentials => {
		setLoading(true);
		try {
			const res = await loginTeacher(credentials);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), 'teacher');
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLoginTeacher = async idToken => {
		setLoading(true);
		try {
			const res = await googleLoginTeacher(idToken);
			if (res?.data?.authToken) {
				applyAuthFromToken(decodeToken(res.data.authToken), 'teacher');
			}
			return res;
		} catch (err) {
			clearAuthState();
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	const handleLogoutTeacher = async () => {
		setLoading(true);
		try {
			await logoutTeacher();
		} catch {
			// Best-effort: server logout may fail, but we still clear locally
		} finally {
			clearAuthState();
			try { removeToken(); } catch {}
			setLoading(false);
			navigate('/auth?mode=login', { replace: true });
		}
	};

	// ── Unified logout ──────────────────────────────────────────────

	const logout = useCallback(async () => {
		if (role === 'teacher') {
			await handleLogoutTeacher();
		} else {
			await handleLogoutStudent();
		}
	}, [role]);

	// ── Context value ───────────────────────────────────────────────

	const value = {
		user,
		isAuthenticated,
		role,
		isEmailVerified,
		loading,
		registerStudent: handleRegisterStudent,
		loginStudent: handleLoginStudent,
		googleLoginStudent: handleGoogleLoginStudent,
		logoutStudent: handleLogoutStudent,
		registerTeacher: handleRegisterTeacher,
		loginTeacher: handleLoginTeacher,
		googleLoginTeacher: handleGoogleLoginTeacher,
		logoutTeacher: handleLogoutTeacher,
		// Unified alias so UI can just call `logout()`
		logout,
		setUser,
		setRole,
		setIsAuthenticated,
		setIsEmailVerified,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
