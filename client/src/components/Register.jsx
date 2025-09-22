import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Register = ({ onRegister, onSwitchToLogin }) => {
	const navigate = useNavigate();
	const { registerStudent, registerTeacher, loading } = useAuth();

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [username, setUsername] = useState('');
	const [fullname, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
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

	const canSubmit = useMemo(() => {
		const errs = validate();
		return Object.keys(errs).length === 0;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [username, fullname, email, emailValid, password, confirm]);

	const extractServerError = err => {
		const data = err?.response?.data;
		if (Array.isArray(data?.errors)) {
			return data.errors.map(e => e?.msg || e?.message || String(e)).join(' ');
		}
		return (
			data?.message || data?.error || err?.message || 'Registration failed. Please try again.'
		);
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setTopError('');
		const errs = validate();
		setFieldErrors(errs);
		if (Object.keys(errs).length) return;

		try {
			const payload = {
				username: username.trim(),
				fullName: fullname.trim(),
				email: email.trim(),
				password: password.trim(),
			};
			const res =
				role === 'student'
					? await registerStudent(payload)
					: await registerTeacher(payload);
			try {
				localStorage.setItem('preferredRole', role);
			} catch {}
			if (typeof onRegister === 'function')
				onRegister({ role, user: res?.data?.user || null });
		} catch (err) {
			setTopError(extractServerError(err));
		}
	};

	const buttonGradient =
		role === 'teacher'
			? 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
			: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)';
	const buttonShadow =
		role === 'teacher'
			? '0 10px 24px rgba(249,115,22,0.28)'
			: '0 10px 24px rgba(79,70,229,0.25)';
	const linkColor = role === 'teacher' ? '#f97316' : '#4f46e5';

	return (
		<form
			onSubmit={handleSubmit}
			style={styles.formFlat}
			aria-labelledby="register-title"
			noValidate
		>
			<h2 id="register-title" style={styles.title}>
				Create your account
			</h2>

			<div style={styles.roleSwitch} role="tablist" aria-label="Choose role">
				<button
					type="button"
					role="tab"
					aria-selected={role === 'student'}
					onClick={() => setRole('student')}
					style={{
						...styles.roleTab,
						...(role === 'student' ? styles.roleTabActive : {}),
					}}
				>
					Student
				</button>
				<button
					type="button"
					role="tab"
					aria-selected={role === 'teacher'}
					onClick={() => setRole('teacher')}
					style={{
						...styles.roleTab,
						...(role === 'teacher' ? styles.roleTabActiveTeacher : {}),
					}}
				>
					Teacher
				</button>
			</div>

			<div style={styles.field}>
				<label style={styles.label} htmlFor="fullname">
					Full Name
				</label>
				<input
					id="fullname"
					style={{
						...styles.input,
						...(fieldErrors.fullname ? styles.inputInvalid : {}),
					}}
					type="text"
					placeholder="e.g. Alex Morgan"
					value={fullname}
					onChange={e => setFullName(e.target.value)}
					autoComplete="name"
				/>
				{fieldErrors.fullname ? (
					<span style={styles.helperText}>{fieldErrors.fullname}</span>
				) : null}
			</div>

			<div style={styles.field}>
				<label style={styles.label} htmlFor="username">
					Username
				</label>
				<input
					id="username"
					style={{
						...styles.input,
						...(fieldErrors.username ? styles.inputInvalid : {}),
					}}
					type="text"
					placeholder="e.g. alex.morgan"
					value={username}
					onChange={e => setUsername(e.target.value)}
					autoComplete="username"
				/>
				{fieldErrors.username ? (
					<span style={styles.helperText}>{fieldErrors.username}</span>
				) : null}
			</div>

			<div style={styles.field}>
				<label style={styles.label} htmlFor="email">
					Email
				</label>
				<input
					id="email"
					style={{ ...styles.input, ...(fieldErrors.email ? styles.inputInvalid : {}) }}
					type="email"
					placeholder={role === 'teacher' ? 'teacher@school.edu' : 'student@school.edu'}
					value={email}
					onChange={e => setEmail(e.target.value)}
					autoComplete="email"
				/>
				{fieldErrors.email ? (
					<span style={styles.helperText}>{fieldErrors.email}</span>
				) : null}
			</div>

			<div style={styles.field}>
				<label style={styles.label} htmlFor="password">
					Password
				</label>
				<div style={styles.passwordWrap}>
					<input
						id="password"
						style={{
							...styles.input,
							paddingRight: 44,
							...(fieldErrors.password ? styles.inputInvalid : {}),
						}}
						type={showPassword ? 'text' : 'password'}
						placeholder="Minimum 8 characters"
						value={password}
						onChange={e => setPassword(e.target.value)}
						autoComplete="new-password"
					/>
					<button
						type="button"
						aria-label={showPassword ? 'Hide password' : 'Show password'}
						onClick={() => setShowPassword(s => !s)}
						style={styles.eyeBtn}
						title={showPassword ? 'Hide password' : 'Show password'}
					>
						{showPassword ? '🙈' : '👁️'}
					</button>
				</div>
				{fieldErrors.password ? (
					<span style={styles.helperText}>{fieldErrors.password}</span>
				) : null}
			</div>

			<div style={styles.field}>
				<label style={styles.label} htmlFor="confirm">
					Confirm password
				</label>
				<div style={styles.passwordWrap}>
					<input
						id="confirm"
						style={{
							...styles.input,
							paddingRight: 44,
							...(fieldErrors.confirm ? styles.inputInvalid : {}),
						}}
						type={showConfirm ? 'text' : 'password'}
						placeholder="Re-enter your password"
						value={confirm}
						onChange={e => setConfirm(e.target.value)}
						autoComplete="new-password"
					/>
					<button
						type="button"
						aria-label={showConfirm ? 'Hide password' : 'Show password'}
						onClick={() => setShowConfirm(s => !s)}
						style={styles.eyeBtn}
						title={showConfirm ? 'Hide password' : 'Show password'}
					>
						{showConfirm ? '🙈' : '👁️'}
					</button>
				</div>
				{fieldErrors.confirm ? (
					<span style={styles.helperText}>{fieldErrors.confirm}</span>
				) : null}
			</div>

			{topError ? (
				<div style={styles.error} role="alert" aria-live="assertive">
					{topError}
				</div>
			) : null}

			<button
				type="submit"
				style={{ ...styles.button, background: buttonGradient, boxShadow: buttonShadow }}
				disabled={loading || !canSubmit}
			>
				{loading ? 'Creating account...' : `Create ${role} account`}
			</button>

			<div style={styles.bottomRow}>
				<span>Already have an account?</span>
				<button
					type="button"
					style={{ ...styles.linkBtn, color: linkColor }}
					onClick={onSwitchToLogin}
				>
					Sign in
				</button>
			</div>
		</form>
	);
};

const styles = {
	formFlat: {
		width: '100%',
		background: 'transparent',
		padding: 0,
		borderRadius: 0,
		border: 'none',
	},
	title: {
		margin: 0,
		marginBottom: 14,
		fontWeight: 800,
		fontSize: 22,
		letterSpacing: 0.2,
		background: 'linear-gradient(90deg, #0f172a, #334155)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
	},
	roleSwitch: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 8,
		background: '#f1f5f9',
		borderRadius: 12,
		padding: 6,
		marginBottom: 16,
	},
	roleTab: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		padding: '10px 12px',
		borderRadius: 10,
		cursor: 'pointer',
		fontWeight: 700,
		color: '#334155',
		transition: 'background 0.2s, color 0.2s, transform 0.1s',
	},
	roleTabActive: {
		background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
		color: '#fff',
		boxShadow: '0 6px 18px rgba(79,70,229,0.25)',
	},
	roleTabActiveTeacher: {
		background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
		color: '#fff',
		boxShadow: '0 6px 18px rgba(249,115,22,0.25)',
	},
	field: { marginBottom: 12 },
	label: { display: 'block', fontSize: 14, marginBottom: 6, color: '#334155', fontWeight: 600 },
	input: {
		width: '100%',
		padding: '10px 12px',
		borderRadius: 10,
		border: '1px solid #cbd5e1',
		outline: 'none',
		fontSize: 14,
		color: '#0f172a',
		background: '#fff',
	},
	inputInvalid: {
		borderColor: '#ef4444',
		background: '#fff7f7',
	},
	helperText: {
		display: 'block',
		marginTop: 6,
		fontSize: 12,
		color: '#ef4444',
	},
	passwordWrap: { position: 'relative', display: 'grid' },
	eyeBtn: {
		position: 'absolute',
		right: 8,
		top: '50%',
		transform: 'translateY(-50%)',
		border: 'none',
		background: 'transparent',
		cursor: 'pointer',
		fontSize: 16,
		lineHeight: 1,
	},
	button: {
		width: '100%',
		padding: '12px 14px',
		borderRadius: 10,
		border: 'none',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 800,
		letterSpacing: 0.2,
		boxShadow: '0 10px 24px rgba(79,70,229,0.25)', // overridden inline
		marginTop: 4,
	},
	error: {
		background: '#fdecea',
		color: '#b3261e',
		padding: '10px 12px',
		borderRadius: 10,
		marginBottom: 12,
		fontSize: 14,
		border: '1px solid #f5c2c0',
	},
	bottomRow: {
		display: 'flex',
		justifyContent: 'center',
		gap: 8,
		marginTop: 12,
		fontSize: 14,
		color: '#64748b',
	},
	linkBtn: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		color: '#4f46e5', // overridden inline per role
		cursor: 'pointer',
		fontWeight: 700,
		padding: 0,
	},
};

export default Register;
