import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth.js';
import AuthAlert, { classifyError } from './AuthAlert.jsx';

const Login = ({ onLogin, onSwitchToRegister }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const returnTo = location?.state?.from || null;
	const sessionExpired = searchParams.get('session_expired') === 'true';

	const { loginStudent, loginTeacher, googleLoginStudent, googleLoginTeacher } = useAuth();

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [identifier, setIdentifier] = useState(''); // username or email
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(true);
	
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);

	const [fieldErrors, setFieldErrors] = useState({});
	const [alertObj, setAlertObj] = useState(null);

	useEffect(() => {
		try {
			const pref = localStorage.getItem('preferredRole');
			if (pref === 'student' || pref === 'teacher') setRole(pref);
		} catch {}
	}, []);

	// Clear session expired warning if user changes role or starts typing
	const handleInputChange = (field, value, setter) => {
		setter(value);
		if (fieldErrors[field]) {
			setFieldErrors(prev => ({ ...prev, [field]: null }));
		}
		if (alertObj) setAlertObj(null);
	};

	const idLabel = useMemo(() => 'Username or Email', []);
	const idPlaceholder = useMemo(
		() =>
			role === 'student'
				? 'e.g. alex.m or student@school.edu'
				: 'e.g. prof.smith or teacher@school.edu',
		[role],
	);

	const validate = () => {
		const errs = {};
		if (!identifier.trim()) errs.identifier = 'Username or email is required.';
		if (!password) errs.password = 'Password is required.';
		return errs;
	};

	const buildPayload = () => {
		const value = identifier.trim();
		const isEmail = value.includes('@');
		return isEmail ? { email: value, password } : { username: value, password };
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setAlertObj(null);
		const errs = validate();
		setFieldErrors(errs);
		if (Object.keys(errs).length) return;

		setLoading(true);
		try {
			// Set persistence preference before the auth call stores tokens
			localStorage.setItem('rememberMe', remember ? 'true' : 'false');

			const payload = buildPayload();
			const res =
				role === 'student' ? await loginStudent(payload) : await loginTeacher(payload);

			try { localStorage.setItem('preferredRole', role); } catch {}

			if (typeof onLogin === 'function') {
				onLogin({ role, user: res?.data?.user || null });
			}

			const dashboard = role === 'teacher' ? '/teacher' : '/student';
			navigate(returnTo || dashboard, { replace: true });
		} catch (err) {
			setAlertObj(classifyError(err));
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleSuccess = async credentialResponse => {
		setAlertObj(null);
		setGoogleLoading(true);
		try {
			localStorage.setItem('rememberMe', remember ? 'true' : 'false');

			const { credential } = credentialResponse;
			if (role === 'student') await googleLoginStudent(credential);
			else await googleLoginTeacher(credential);

			try { localStorage.setItem('preferredRole', role); } catch {}
			
			if (typeof onLogin === 'function') {
				onLogin({ role, user: null });
			}

			const dashboard = role === 'teacher' ? '/teacher' : '/student';
			navigate(returnTo || dashboard, { replace: true });
		} catch (err) {
			setAlertObj(classifyError(err));
		} finally {
			setGoogleLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} aria-labelledby="login-title" noValidate>
			{googleLoading && (
				<div className="auth-google-loading">
					<div className="auth-spinner" style={{ borderTopColor: 'var(--primary)', marginBottom: 12 }}></div>
					<div style={{ fontWeight: 600 }}>Connecting to Google...</div>
				</div>
			)}

			<h2 id="login-title" className="auth-title">
				Welcome Back
			</h2>
			<p className="auth-subtitle">Log in to continue to your dashboard.</p>

			{/* Session Expired Banner */}
			{sessionExpired && !alertObj && (
				<AuthAlert type="warning" icon="⏱️" title="Session Expired" autoDismiss={0}>
					Your session has expired. Please sign in again.
				</AuthAlert>
			)}

			{/* Role Switcher */}
			<div className="role-pill-container" role="tablist" aria-label="Choose role">
				<div className={`role-pill-bg ${role}-active`}></div>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'student'}
					onClick={() => { setRole('student'); setAlertObj(null); }}
					className={`role-pill ${role === 'student' ? 'active student' : ''}`}
				>
					🎓 Student
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'teacher'}
					onClick={() => { setRole('teacher'); setAlertObj(null); }}
					className={`role-pill ${role === 'teacher' ? 'active teacher' : ''}`}
				>
					👨‍🏫 Teacher
				</button>
			</div>

			{/* Top Error Alert */}
			{alertObj && (
				<AuthAlert 
					type={alertObj.type} 
					icon={alertObj.icon} 
					title={alertObj.title}
					onDismiss={() => setAlertObj(null)}
				>
					{alertObj.message}
					{alertObj.hint && <span className="auth-alert-hint">{alertObj.hint}</span>}
				</AuthAlert>
			)}

			{/* Identifier */}
			<div className={`input-group ${fieldErrors.identifier ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="identifier">
					{idLabel}
				</label>
				<input
					id="identifier"
					className="auth-input"
					type="text"
					placeholder={idPlaceholder}
					value={identifier}
					onChange={e => handleInputChange('identifier', e.target.value, setIdentifier)}
					autoComplete="username"
					inputMode="text"
				/>
				{fieldErrors.identifier && (
					<span className="error-text">❌ {fieldErrors.identifier}</span>
				)}
			</div>

			{/* Password */}
			<div className={`input-group ${fieldErrors.password ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="password">
					Password
				</label>
				<div className="password-input-wrapper">
					<input
						id="password"
						className="auth-input"
						type={showPassword ? 'text' : 'password'}
						placeholder="••••••••"
						value={password}
						onChange={e => handleInputChange('password', e.target.value, setPassword)}
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
				{fieldErrors.password && <span className="error-text">❌ {fieldErrors.password}</span>}
			</div>

			<div className="options-row">
				<label className="check-label">
					<input
						type="checkbox"
						checked={remember}
						onChange={() => setRemember(v => !v)}
					/>
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

			<button type="submit" className={`auth-submit-btn ${role} ${loading ? 'loading' : ''}`} disabled={loading || googleLoading}>
				{loading ? (
					<>
						<span className="auth-spinner" />
						Signing in...
					</>
				) : (
					`Sign in as ${role}`
				)}
			</button>

			<div className="auth-divider">
				<div className="auth-divider-line" />
				<span className="auth-divider-text">OR</span>
				<div className="auth-divider-line" />
			</div>

			<div style={{ display: 'flex', justifyContent: 'center' }}>
				<GoogleLogin
					onSuccess={handleGoogleSuccess}
					onError={() => setAlertObj({
						type: 'error', icon: '❌', title: 'Google Sign-In failed', message: 'Could not connect to Google.'
					})}
					text="signin_with"
					shape="rectangular"
					size="large"
					theme="outline"
				/>
			</div>

			<div
				style={{
					textAlign: 'center',
					marginTop: '20px',
					fontSize: '0.9rem',
					color: 'var(--text-muted)',
				}}
			>
				<span>New here? </span>
				<button type="button" className={`link-btn ${role}`} onClick={onSwitchToRegister}>
					Create account
				</button>
			</div>
		</form>
	);
};

export default Login;
