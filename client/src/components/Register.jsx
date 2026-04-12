import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Register = ({ onRegister, onSwitchToLogin }) => {
	const navigate = useNavigate();
	const location = useLocation();
	const returnTo = location?.state?.from || null;
	const { registerStudent, registerTeacher } = useAuth(); // removed loading from hook since we use local state

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [username, setUsername] = useState('');
	const [fullname, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	
	const [loading, setLoading] = useState(false);
	const [fieldErrors, setFieldErrors] = useState({});
	const [topError, setTopError] = useState('');

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

	const validate = () => {
		const errs = {};
		if (!fullname.trim()) errs.fullname = 'Full name is required.';
		else if (fullname.trim().length < 2) errs.fullname = 'Full name must be at least 2 characters.';
		if (!username.trim()) errs.username = 'Username is required.';
		else if (username.trim().length < 3) errs.username = 'Username must be at least 3 characters.';
		else if (!/^[a-zA-Z0-9._-]+$/.test(username.trim())) errs.username = 'Use letters, numbers, dot, underscore, or hyphen.';
		if (!email.trim()) errs.email = 'Email is required.';
		else if (!emailValid) errs.email = 'Enter a valid email address.';
		if (!password) errs.password = 'Password is required.';
		else if (password.length < 8) errs.password = 'Password must be at least 8 characters.';
		if (!confirm) errs.confirm = 'Please confirm your password.';
		else if (password && confirm !== password) errs.confirm = 'Passwords do not match.';
		return errs;
	};

	const extractServerError = err => {
		const data = err?.response?.data;
		if (Array.isArray(data?.errors)) {
			return data.errors.map(e => e?.msg || e?.message || String(e)).join(' ');
		}
		return data?.message || data?.error || err?.message || 'Registration failed. Please try again.';
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setTopError('');
		const errs = validate();
		setFieldErrors(errs);
		if (Object.keys(errs).length) return;

		setLoading(true);
		try {
			const payload = {
				username: username.trim(),
				fullname: fullname.trim(),
				email: email.trim(),
				password: password.trim(),
			};
			const res = role === 'student' ? await registerStudent(payload) : await registerTeacher(payload);
			try {
				localStorage.setItem('preferredRole', role);
			} catch {}
			
			const user = res?.data?.user || res?.user || null;
			if (typeof onRegister === 'function') onRegister({ role, user });

			const dashboard = role === 'teacher' ? '/teacher' : '/student';
			navigate(returnTo || dashboard, { replace: true });
		} catch (err) {
			setTopError(extractServerError(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} aria-labelledby="register-title" noValidate>
			<h2 id="register-title" className="auth-title">Create your account</h2>
			<p className="auth-subtitle">Join us to {role === 'student' ? 'learn and excel' : 'create and manage exams'}.</p>

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

			<div className={`input-group ${fieldErrors.fullname ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="fullname">Full Name</label>
				<input
					id="fullname"
					className="auth-input"
					type="text"
					placeholder="e.g. Alex Morgan"
					value={fullname}
					onChange={e => setFullName(e.target.value)}
					autoComplete="name"
				/>
				{fieldErrors.fullname && <span className="error-text">{fieldErrors.fullname}</span>}
			</div>

			<div className={`input-group ${fieldErrors.username ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="username">Username</label>
				<input
					id="username"
					className="auth-input"
					type="text"
					placeholder="e.g. alex.morgan"
					value={username}
					onChange={e => setUsername(e.target.value)}
					autoComplete="username"
				/>
				{fieldErrors.username && <span className="error-text">{fieldErrors.username}</span>}
			</div>

			<div className={`input-group ${fieldErrors.email ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="email">Email</label>
				<input
					id="email"
					className="auth-input"
					type="email"
					placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
					value={email}
					onChange={e => setEmail(e.target.value)}
					autoComplete="email"
				/>
				{fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
			</div>

			<div className={`input-group ${fieldErrors.password ? 'has-error' : ''}`}>
				<label className="floating-label" htmlFor="password">Password</label>
				<div style={{ position: 'relative' }}>
					<input
						id="password"
						className="auth-input"
						style={{ paddingRight: 48 }}
						type={showPassword ? 'text' : 'password'}
						placeholder="Minimum 8 characters"
						value={password}
						onChange={e => setPassword(e.target.value)}
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
				{fieldErrors.password && <span className="error-text">{fieldErrors.password}</span>}
			</div>

			<div className={`input-group ${fieldErrors.confirm ? 'has-error' : ''}`} style={{ marginBottom: 28 }}>
				<label className="floating-label" htmlFor="confirm">Confirm password</label>
				<div style={{ position: 'relative' }}>
					<input
						id="confirm"
						className="auth-input"
						style={{ paddingRight: 48 }}
						type={showConfirm ? 'text' : 'password'}
						placeholder="Re-enter your password"
						value={confirm}
						onChange={e => setConfirm(e.target.value)}
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
				{fieldErrors.confirm && <span className="error-text">{fieldErrors.confirm}</span>}
			</div>

			<button
				type="submit"
				className={`auth-submit-btn ${role}`}
				disabled={loading}
			>
				{loading ? (
					<>
						<span className="auth-spinner" />
						Creating account...
					</>
				) : (
					`Create ${role} account`
				)}
			</button>

			<div style={{ textAlign: 'center', marginTop: '20px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
				<span>Already have an account? </span>
				<button type="button" className={`link-btn ${role}`} onClick={onSwitchToLogin}>
					Sign in
				</button>
			</div>
		</form>
	);
};

export default Register;
