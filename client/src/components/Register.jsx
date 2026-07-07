import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../hooks/useAuth.js';
import AuthAlert, { classifyError } from './AuthAlert.jsx';

// Password Strength Calculator
const calculateStrength = pwd => {
	let score = 0;
	if (pwd.length >= 8) score += 1;
	if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score += 1;
	if (/\d/.test(pwd)) score += 1;
	if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
	if (pwd.length >= 12) score += 1;
	return score;
};

const getStrengthDetails = score => {
	if (score <= 1) return { label: 'Weak', color: '#ef4444', width: '25%' };
	if (score <= 3) return { label: 'Medium', color: '#f59e0b', width: '50%' };
	if (score <= 4) return { label: 'Good', color: '#84cc16', width: '75%' };
	return { label: 'Strong', color: '#10b981', width: '100%' };
};

const Register = ({ onRegister, onSwitchToLogin }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const returnTo = searchParams.get('redirect') || location?.state?.from || null;
	const { register, googleLogin } = useAuth();

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [username, setUsername] = useState('');
	const [fullname, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const [successRedirecting, setSuccessRedirecting] = useState(false);

	const [fieldErrors, setFieldErrors] = useState({});
	const [alertObj, setAlertObj] = useState(null);

	const pwdStrengthScore = useMemo(() => calculateStrength(password), [password]);
	const pwdStrength = getStrengthDetails(pwdStrengthScore);

	useEffect(() => {
		try {
			const pref = localStorage.getItem('preferredRole');
			if (pref === 'student' || pref === 'teacher') setRole(pref);
		} catch {}
	}, []);

	const emailValid = useMemo(() => {
		if (!email) return true;
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	}, [email]);

	const handleInputChange = (field, value, setter) => {
		setter(value);
		if (fieldErrors[field]) {
			setFieldErrors(prev => ({ ...prev, [field]: null }));
		}
		if (alertObj) setAlertObj(null);
	};

	const validate = () => {
		const errs = {};
		if (!fullname.trim()) errs.fullname = 'Full name is required.';
		else if (fullname.trim().length < 2)
			errs.fullname = 'Full name must be at least 2 characters.';
		if (!username.trim()) errs.username = 'Username is required.';
		else if (username.trim().length < 3)
			errs.username = 'Username must be at least 3 characters.';
		else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim()))
			errs.username = 'Use letters, numbers, dot, underscore, or hyphen.';
		if (!email.trim()) errs.email = 'Email is required.';
		else if (!emailValid) errs.email = 'Enter a valid email address.';
		if (!password) errs.password = 'Password is required.';
		else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
		if (!confirm) errs.confirm = 'Please confirm your password.';
		else if (password && confirm !== password) errs.confirm = 'Passwords do not match.';
		return errs;
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setAlertObj(null);
		const errs = validate();
		setFieldErrors(errs);
		if (Object.keys(errs).length) return;

		setLoading(true);
		try {
			// New users always get persistent storage
			localStorage.setItem('rememberMe', 'true');

			const payload = {
				username: username.trim(),
				fullname: fullname.trim(),
				email: email.trim(),
				password, // Never trim passwords — spaces may be intentional
				role, // Add role to payload
			};

			const res = await register(payload);

			const actualRole = res?.data?.user?.role || role;
			try {
				localStorage.setItem('preferredRole', actualRole);
			} catch {}

			const user = res?.data?.user || res?.user || null;
			if (typeof onRegister === 'function') onRegister({ role: actualRole, user });

			// Show success flash
			setSuccessRedirecting(true);
			setAlertObj({
				type: 'success',
				icon: '🎉',
				title: 'Account Created!',
				message: 'Redirecting to your dashboard...',
			});

			setTimeout(() => {
				const dashboard = actualRole === 'teacher' ? '/teacher' : '/student';
				navigate(returnTo || dashboard, { replace: true });
			}, 1500);
		} catch (err) {
			setAlertObj(classifyError(err));
			setLoading(false);
		}
	};

	const handleGoogleSuccess = async credentialResponse => {
		setAlertObj(null);
		setGoogleLoading(true);
		try {
			localStorage.setItem('rememberMe', 'true');

			const { credential } = credentialResponse;
			// Provide the currently selected role tab as a hint for registration if they don't exist
			const res = await googleLogin(credential, role);

			const actualRole = res?.data?.user?.role || role;
			try {
				localStorage.setItem('preferredRole', actualRole);
			} catch {}

			if (typeof onRegister === 'function') {
				onRegister({ role: actualRole, user: res?.data?.user || null }); // generic passback
			}

			const dashboard = actualRole === 'teacher' ? '/teacher' : '/student';
			navigate(returnTo || dashboard, { replace: true });
		} catch (err) {
			setAlertObj(classifyError(err));
			setGoogleLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} aria-labelledby="register-title" noValidate>
			{googleLoading && (
				<div className="auth-google-loading">
					<div
						className="auth-spinner"
						style={{ borderTopColor: 'var(--primary)', marginBottom: 12 }}
					></div>
					<div style={{ fontWeight: 600 }}>Connecting to Google...</div>
				</div>
			)}

			<h2 id="register-title" className="auth-title">
				Create your account
			</h2>
			<p className="auth-subtitle">
				Join us to {role === 'student' ? 'learn and excel' : 'create and manage exams'}.
			</p>

			{/* Role Switcher */}
			<div className="role-pill-container" role="tablist" aria-label="Choose role">
				<div className={`role-pill-bg ${role}-active`}></div>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'student'}
					onClick={() => {
						setRole('student');
						setAlertObj(null);
					}}
					className={`role-pill ${role === 'student' ? 'active student' : ''}`}
				>
					🎓 Student
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'teacher'}
					onClick={() => {
						setRole('teacher');
						setAlertObj(null);
					}}
					className={`role-pill ${role === 'teacher' ? 'active teacher' : ''}`}
				>
					👨‍🏫 Teacher
				</button>
			</div>

			{/* Top Alert */}
			{alertObj && (
				<AuthAlert
					type={alertObj.type}
					icon={alertObj.icon}
					title={alertObj.title}
					onDismiss={!successRedirecting ? () => setAlertObj(null) : undefined}
				>
					{alertObj.message}
					{alertObj.hint && !successRedirecting && (
						<span className="auth-alert-hint">{alertObj.hint}</span>
					)}
				</AuthAlert>
			)}

			<div className={`input-group ${fieldErrors.fullname ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="fullname">
					Full Name
				</label>
				<input
					id="fullname"
					className="auth-input"
					type="text"
					placeholder="e.g. Alex Morgan"
					value={fullname}
					onChange={e => handleInputChange('fullname', e.target.value, setFullName)}
					autoComplete="name"
				/>
				{fieldErrors.fullname && (
					<span className="error-text">❌ {fieldErrors.fullname}</span>
				)}
			</div>

			<div className={`input-group ${fieldErrors.username ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="username">
					Username
				</label>
				<input
					id="username"
					className="auth-input"
					type="text"
					placeholder="e.g. alex.morgan"
					value={username}
					onChange={e => handleInputChange('username', e.target.value, setUsername)}
					autoComplete="username"
				/>
				{fieldErrors.username && (
					<span className="error-text">❌ {fieldErrors.username}</span>
				)}
			</div>

			<div className={`input-group ${fieldErrors.email ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="email">
					Email
				</label>
				<input
					id="email"
					className="auth-input"
					type="email"
					placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
					value={email}
					onChange={e => handleInputChange('email', e.target.value, setEmail)}
					autoComplete="email"
				/>
				{fieldErrors.email && <span className="error-text">❌ {fieldErrors.email}</span>}
			</div>

			<div className={`input-group ${fieldErrors.password ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="password">
					Password
				</label>
				<div className="password-input-wrapper">
					<input
						id="password"
						className="auth-input"
						type={showPassword ? 'text' : 'password'}
						placeholder="Minimum 8 characters"
						value={password}
						onChange={e => handleInputChange('password', e.target.value, setPassword)}
						autoComplete="new-password"
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
				{password.length > 0 && (
					<div className="password-strength">
						<div className="password-strength-bar-bg">
							<div
								className="password-strength-bar"
								style={{
									width: pwdStrength.width,
									backgroundColor: pwdStrength.color,
								}}
							/>
						</div>
						<div
							className="password-strength-label"
							style={{ color: pwdStrength.color }}
						>
							{pwdStrength.label}
						</div>
					</div>
				)}
				{fieldErrors.password && (
					<span className="error-text">❌ {fieldErrors.password}</span>
				)}
			</div>

			<div
				className={`input-group ${fieldErrors.confirm ? 'has-error' : ''}`}
				style={{ marginBottom: 28 }}
			>
				<label className="floating-label" htmlFor="confirm">
					Confirm password
				</label>
				<div className="password-input-wrapper">
					<input
						id="confirm"
						className="auth-input"
						type={showConfirm ? 'text' : 'password'}
						placeholder="Re-enter your password"
						value={confirm}
						onChange={e => handleInputChange('confirm', e.target.value, setConfirm)}
						autoComplete="new-password"
					/>
					<button
						type="button"
						className="eye-btn"
						aria-label={showConfirm ? 'Hide password' : 'Show password'}
						onClick={() => setShowConfirm(s => !s)}
						title={showConfirm ? 'Hide password' : 'Show password'}
					>
						{showConfirm ? '🙈' : '👁️'}
					</button>
				</div>
				{fieldErrors.confirm && (
					<span className="error-text">❌ {fieldErrors.confirm}</span>
				)}
			</div>

			<button
				type="submit"
				className={`auth-submit-btn ${role} ${loading ? 'loading' : ''}`}
				disabled={loading || googleLoading || successRedirecting}
			>
				{loading || successRedirecting ? (
					<>
						<span className="auth-spinner" />
						{successRedirecting ? 'Redirecting...' : 'Creating account...'}
					</>
				) : (
					`Create ${role} account`
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
					onError={() =>
						setAlertObj({
							type: 'error',
							icon: '❌',
							title: 'Google Sign-In failed',
							message: 'Could not connect to Google.',
						})
					}
					text="signup_with"
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
				<span>Already have an account? </span>
				<button
					type="button"
					className={`link-btn ${role}`}
					onClick={onSwitchToLogin}
					disabled={loading || successRedirecting || googleLoading}
				>
					Sign in
				</button>
			</div>
		</form>
	);
};

export default Register;
