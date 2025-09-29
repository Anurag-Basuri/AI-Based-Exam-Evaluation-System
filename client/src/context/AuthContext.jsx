import React, { createContext, useState, useEffect } from 'react';
import {
	registerStudent,
	loginStudent,
	logoutStudent,
	registerTeacher,
	loginTeacher,
	logoutTeacher,
} from '../services/apiServices';
import { getToken, removeToken, isTokenExpired, decodeToken } from '../utils/handleToken';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [role, setRole] = useState(null);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();

	// Check token and user info on mount
	useEffect(() => {
		try {
			const { accessToken } = getToken() || {};
			if (accessToken && !isTokenExpired(accessToken)) {
				const decoded = decodeToken(accessToken);
				setUser(decoded);
				setRole(decoded?.role || null);
				setIsAuthenticated(true);
			} else {
				setUser(null);
				setRole(null);
				setIsAuthenticated(false);
				removeToken();
			}
		} catch (err) {
			// Fallback to a clean state
			setUser(null);
			setRole(null);
			setIsAuthenticated(false);
			try {
				removeToken();
			} catch {}
			// Optional: log for diagnostics
			// console.error('Auth init failed:', err);
		} finally {
			setLoading(false);
		}
	}, []);

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
				setIsAuthenticated(true);
				navigate('/student', { replace: true });
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
				setIsAuthenticated(true);
				navigate('/student', { replace: true });
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
			} catch {}
			setLoading(false);
			navigate('/auth?mode=login', { replace: true });
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
				setIsAuthenticated(true);
				navigate('/teacher', { replace: true });
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
				setIsAuthenticated(true);
				navigate('/teacher', { replace: true });
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
			} catch {}
			setLoading(false);
			navigate('/auth?mode=login', { replace: true });
		}
	};

	const value = {
		user,
		isAuthenticated,
		role,
		loading,
		registerStudent: handleRegisterStudent,
		loginStudent: handleLoginStudent,
		logoutStudent: handleLogoutStudent,
		registerTeacher: handleRegisterTeacher,
		loginTeacher: handleLoginTeacher,
		logoutTeacher: handleLogoutTeacher,
		setUser,
		setRole,
		setIsAuthenticated,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
