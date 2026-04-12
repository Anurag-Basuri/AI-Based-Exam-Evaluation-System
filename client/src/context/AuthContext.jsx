import React, { createContext, useState, useEffect } from 'react';
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

// NOTE: do NOT use useNavigate here (provider may be above <Router>)
const navigateSafe = (path, opts = { replace: false }) => {
	try {
		if (typeof window === 'undefined') return;
		if (opts.replace) {
			window.history.replaceState({}, '', path);
		} else {
			window.history.pushState({}, '', path);
		}
		// Let any Router (if mounted) react to the new location
		window.dispatchEvent(new PopStateEvent('popstate'));
	} catch {
		try {
			window.location.assign(path);
		} catch (err) {
			console.error('Navigation error:', err);
		}
	}
};

/**
 * After login, check if the current URL has ?redirect= param.
 * If so, go there instead of the default dashboard path.
 */
const getRedirectPath = defaultPath => {
	try {
		const sp = new URLSearchParams(window.location.search);
		const redirect = sp.get('redirect');
		// Only allow internal redirects (starting with /)
		if (redirect && redirect.startsWith('/')) return redirect;
	} catch {
		/* fallback */
	}
	return defaultPath;
};

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [role, setRole] = useState(null);
	const [isEmailVerified, setIsEmailVerified] = useState(false);
	const [loading, setLoading] = useState(true);

	// Check token and user info on mount
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
				setUser(null);
				setRole(null);
				setIsEmailVerified(false);
				setIsAuthenticated(false);
				removeToken();
			}
		} catch (err) {
			// Fallback to a clean state
			setUser(null);
			setRole(null);
			setIsEmailVerified(false);
			setIsAuthenticated(false);
			try {
				removeToken();
			} catch {}
			// Optional: log for diagnostics
			console.error('Auth init failed:', err);
		} finally {
			setLoading(false);
		}
	}, []);

	// ── Listen for 401 / token-expired events dispatched by the Axios interceptor ──
	useEffect(() => {
		const handleUnauthorized = () => {
			// Only act if we currently consider ourselves authenticated
			if (!isAuthenticated) return;
			setUser(null);
			setRole(null);
			setIsEmailVerified(false);
			setIsAuthenticated(false);
			try {
				removeToken();
			} catch {}
			navigateSafe('/auth?mode=login&session_expired=true', { replace: true });
		};

		window.addEventListener('api:unauthorized', handleUnauthorized);
		return () => window.removeEventListener('api:unauthorized', handleUnauthorized);
	}, [isAuthenticated]);

	const normalizeError = err => {
		const msg = err?.response?.data?.message || err?.message || 'Unexpected error occurred';
		const e = new Error(msg);
		e.cause = err;
		return e;
	};

	// Student registration
	const handleRegisterStudent = async studentData => {
		setLoading(true);
		try {
			const res = await registerStudent(studentData);
			if (res?.data?.authToken) {
				const decoded = decodeToken(res.data.authToken);
				setUser(decoded);
				setRole(decoded?.role || 'student');
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
				navigateSafe(getRedirectPath('/student'), { replace: true });
			}
			return res;
		} catch (err) {
			setUser(null);
			setRole(null);
			setIsAuthenticated(false);
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	// Student login
	const handleLoginStudent = async credentials => {
		setLoading(true);
		try {
			const res = await loginStudent(credentials);
			if (res?.data?.authToken) {
				const decoded = decodeToken(res.data.authToken);
				setUser(decoded);
				setRole(decoded?.role || 'student');
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
				navigateSafe(getRedirectPath('/student'), { replace: true });
			}
			return res;
		} catch (err) {
			setUser(null);
			setRole(null);
			setIsEmailVerified(false);
			setIsAuthenticated(false);
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	// Student Google login
	const handleGoogleLoginStudent = async idToken => {
		setLoading(true);
		try {
			const res = await googleLoginStudent(idToken);
			if (res?.data?.authToken) {
				const decoded = decodeToken(res.data.authToken);
				setUser(decoded);
				setRole(decoded?.role || 'student');
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
				navigateSafe(getRedirectPath('/student'), { replace: true });
			}
			return res;
		} catch (err) {
			setUser(null);
			setRole(null);
			setIsEmailVerified(false);
			setIsAuthenticated(false);
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	// Student logout
	const handleLogoutStudent = async () => {
		setLoading(true);
		try {
			await logoutStudent();
		} catch {
			// Ignore error on logout
		} finally {
			setUser(null);
			setRole(null);
			setIsAuthenticated(false);
			try {
				removeToken();
			} catch (err) {
				console.error('Error removing token:', err);
			}
			setLoading(false);
			navigateSafe('/auth?mode=login', { replace: true });
		}
	};

	// Teacher registration
	const handleRegisterTeacher = async teacherData => {
		setLoading(true);
		try {
			const res = await registerTeacher(teacherData);
			if (res?.data?.authToken) {
				const decoded = decodeToken(res.data.authToken);
				setUser(decoded);
				setRole(decoded?.role || 'teacher');
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
				navigateSafe(getRedirectPath('/teacher'), { replace: true });
			}
			return res;
		} catch (err) {
			setUser(null);
			setRole(null);
			setIsAuthenticated(false);
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	// Teacher login
	const handleLoginTeacher = async credentials => {
		setLoading(true);
		try {
			const res = await loginTeacher(credentials);
			if (res?.data?.authToken) {
				const decoded = decodeToken(res.data.authToken);
				setUser(decoded);
				setRole(decoded?.role || 'teacher');
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
				navigateSafe(getRedirectPath('/teacher'), { replace: true });
			}
			return res;
		} catch (err) {
			setUser(null);
			setRole(null);
			setIsAuthenticated(false);
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	// Teacher Google login
	const handleGoogleLoginTeacher = async idToken => {
		setLoading(true);
		try {
			const res = await googleLoginTeacher(idToken);
			if (res?.data?.authToken) {
				const decoded = decodeToken(res.data.authToken);
				setUser(decoded);
				setRole(decoded?.role || 'teacher');
				setIsEmailVerified(decoded?.isEmailVerified || false);
				setIsAuthenticated(true);
				navigateSafe(getRedirectPath('/teacher'), { replace: true });
			}
			return res;
		} catch (err) {
			setUser(null);
			setRole(null);
			setIsEmailVerified(false);
			setIsAuthenticated(false);
			throw normalizeError(err);
		} finally {
			setLoading(false);
		}
	};

	// Teacher logout
	const handleLogoutTeacher = async () => {
		setLoading(true);
		try {
			await logoutTeacher();
		} catch {
			// Ignore error on logout
		} finally {
			setUser(null);
			setRole(null);
			setIsAuthenticated(false);
			try {
				removeToken();
			} catch (err) {
				console.error('Error removing token:', err);
			}
			setLoading(false);
			navigateSafe('/auth?mode=login', { replace: true });
		}
	};

	// Unified logout for consumers
	const logout = React.useCallback(async () => {
		if (role === 'teacher') {
			await handleLogoutTeacher();
		} else {
			await handleLogoutStudent();
		}
	}, [role]);

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
		// unified alias so UI can just call `logout()`
		logout,
		setUser,
		setRole,
		setIsAuthenticated,
		setIsEmailVerified,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
