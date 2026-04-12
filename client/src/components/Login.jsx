import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Login = ({ onLogin, onSwitchToRegister }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const returnTo = location?.state?.from || null;
	const { loginStudent, loginTeacher } = useAuth();

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [identifier, setIdentifier] = useState(''); // username or email
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(true);
	const [loading, setLoading] = useState(false);

	const [fieldErrors, setFieldErrors] = useState({});
	const [topError, setTopError] = useState('');

	useEffect(() => {
		try {
			const pref = localStorage.getItem('preferredRole');
			if (pref === 'student' || pref === 'teacher') setRole(pref);
		} catch {}
	}, []);

	const idLabel = useMemo(() => 'Username or Email', []);
	const idPlaceholder = useMemo(
		() => role === 'student' ? 'e.g. alex.m or student@school.edu' : 'e.g. prof.smith or teacher@school.edu',
		[role],
	);

	const validate = () => {
		const errs = {};
		if (!identifier.trim()) errs.identifier = 'Username or email is required.';
		if (!password) errs.password = 'Password is required.';
		return errs;
	};

	const extractError = err => {
		const data = err?.response?.data;
		if (Array.isArray(data?.errors)) {
			return data.errors.map(e => e?.msg || e?.message || String(e)).join(' ');
		}
		if (data?.message) return data.message;
		if (data?.error) return data.error;
		if (err?.code === 'ERR_NETWORK') return 'Network error. Check your connection.';
		return err?.message || 'Login failed. Please try again.';
	};

	const buildPayload = () => {
		const value = identifier.trim();
		const isEmail = value.includes('@');
		return isEmail ? { email: value, password } : { username: value, password };
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setTopError('');
		const errs = validate();
		setFieldErrors(errs);
		if (Object.keys(errs).length) return;

		setLoading(true);
		try {
			const payload = buildPayload();
			const res = role === 'student' ? await loginStudent(payload) : await loginTeacher(payload);
			if (remember) {
				try {
					localStorage.setItem('preferredRole', role);
				} catch {}
			}

			if (typeof onLogin === 'function') {
				onLogin({ role, user: res?.data?.user || null });
			}

			const dashboard = role === 'teacher' ? '/teacher' : '/student';
			navigate(returnTo || dashboard, { replace: true });
		} catch (err) {
			setTopError(extractError(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} aria-labelledby="login-title" noValidate>
			<h2 id="login-title" className="auth-title">Welcome Back</h2>
			<p className="auth-subtitle">Log in to continue to your dashboard.</p>

			{/* Role Switcher */}
			<div className="role-pill-container" role="tablist" aria-label="Choose role">
				<button
					type="button"
					role="tab"
					aria-selected={role === 'student'}
					onClick={() => setRole('student')}
					className={`role-pill ${role === 'student' ? 'active student' : ''}`}
				>
					🎓 Student
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'teacher'}
					onClick={() => setRole('teacher')}
					className={`role-pill ${role === 'teacher' ? 'active teacher' : ''}`}
				>
					👨‍🏫 Teacher
				</button>
			</div>

			{/* Top Error */}
			{topError && (
				<div className="top-error-banner" role="alert" aria-live="assertive">
					<span>⚠️</span>
					<div>{topError}</div>
				</div>
			)}

			{/* Identifier */}
			<div className={`input-group ${fieldErrors.identifier ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="identifier">{idLabel}</label>
				<input
					id="identifier"
					className="auth-input"
					type="text"
					placeholder={idPlaceholder}
					value={identifier}
					onChange={e => setIdentifier(e.target.value)}
					autoComplete="username"
					inputMode="text"
				/>
				{fieldErrors.identifier && <span className="error-text">{fieldErrors.identifier}</span>}
			</div>

			{/* Password */}
			<div className={`input-group ${fieldErrors.password ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="password">Password</label>
				<div style={{ position: 'relative' }}>
					<input
						id="password"
						className="auth-input"
						style={{ paddingRight: 48 }}
						type={showPassword ? 'text' : 'password'}
						placeholder="••••••••"
						value={password}
						onChange={e => setPassword(e.target.value)}
						autoComplete="current-password"
					/>
					<button
						type="button"
						className="eye-btn"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						onClick={() => setShowPassword(s => !s)}
						title={showPassword ? 'Hide password' : 'Show password'}
					>
						{showPassword ? '🙈' : '👁️'}
					</button>
				</div>
				{fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
			</div>

			<div className="options-row">
				<label className="check-label">
					<input type="checkbox" checked={remember} onChange={() => setRemember(v => !v)} />
					Remember me
				</label>
				<button
					type="button"
					className={`link-btn ${role}`}
					onClick={() => navigate('/auth/forgot-password')}
				>
					Forgot password?
				</button>
			</div>

			<button
				type="submit"
				className={`auth-submit-btn ${role}`}
				disabled={loading}
			>
				{loading ? (
					<>
						<span className="auth-spinner" />
						Signing in...
					</>
				) : (
					`Sign in as ${role}`
				)}
			</button>

			<div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
				<span>New here? </span>
				<button type="button" className={`link-btn ${role}`} onClick={onSwitchToRegister}>
					Create account
				</button>
			</div>
		</form>
	);
};

export default Login;
