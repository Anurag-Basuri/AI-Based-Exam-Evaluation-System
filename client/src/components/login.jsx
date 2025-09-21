import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Login = ({ onLogin, embedded = false }) => {
	const navigate = useNavigate();
	const { loginStudent, loginTeacher } = useAuth();

	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [identifier, setIdentifier] = useState(''); // username or email
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(true);
	const [loading, setLoading] = useState(false);

	// field-level + top-level error
	const [fieldErrors, setFieldErrors] = useState({});
	const [topError, setTopError] = useState('');

	useEffect(() => {
		try {
			const pref = localStorage.getItem('preferredRole');
			if (pref === 'student' || pref === 'teacher') setRole(pref);
			// eslint-disable-next-line no-empty
		} catch {}
	}, []);

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
			const res =
				role === 'student' ? await loginStudent(payload) : await loginTeacher(payload);
			if (remember) {
				try {
					localStorage.setItem('preferredRole', role);
					// eslint-disable-next-line no-empty
				} catch {}
			}

			if (typeof onLogin === 'function') {
				onLogin({ role, user: res?.data?.user || null });
			}
		} catch (err) {
			setTopError(extractError(err));
		} finally {
			setLoading(false);
		}
	};

	// Role-based palette (orange for teacher)
	const primary = role === 'teacher' ? '#f97316' : '#4f46e5';
	const secondary = role === 'teacher' ? '#fb923c' : '#6366f1';
	const buttonGradient = `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
	const buttonShadow =
		role === 'teacher'
			? '0 10px 24px rgba(249,115,22,0.28)'
			: '0 10px 24px rgba(79,70,229,0.25)';
	const linkColor = primary;

	return embedded ? (
		<form
			onSubmit={handleSubmit}
			style={styles.formFlat}
			aria-labelledby="login-title"
			noValidate
		>
			<h2 id="login-title" style={styles.title}>
				Sign in
			</h2>
			{/* Role switch */}
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

			{/* Identifier */}
			<div style={styles.field}>
				<label style={styles.label} htmlFor="identifier">
					{idLabel}
				</label>
				<input
					id="identifier"
					style={{
						...styles.input,
						...(fieldErrors.identifier ? styles.inputInvalid : {}),
					}}
					type="text"
					placeholder={idPlaceholder}
					value={identifier}
					onChange={e => setIdentifier(e.target.value)}
					autoComplete="username"
					inputMode="text"
				/>
				{fieldErrors.identifier ? (
					<span style={styles.helperText}>{fieldErrors.identifier}</span>
				) : null}
			</div>

			{/* Password */}
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
						placeholder="••••••••"
						value={password}
						onChange={e => setPassword(e.target.value)}
						autoComplete="current-password"
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

			<div style={styles.row}>
				<label style={styles.checkLabel}>
					<input
						type="checkbox"
						checked={remember}
						onChange={() => setRemember(v => !v)}
					/>
					Remember me
				</label>
				<button
					type="button"
					style={{ ...styles.linkBtn, color: linkColor }}
					onClick={() => alert('Forgot password flow is not configured.')}
				>
					Forgot password?
				</button>
			</div>

			{topError ? (
				<div style={styles.error} role="alert" aria-live="assertive">
					{topError}
				</div>
			) : null}

			<button
				type="submit"
				style={{
					...styles.button,
					background: buttonGradient,
					boxShadow: buttonShadow,
				}}
				disabled={loading}
			>
				{loading ? 'Signing in...' : `Sign in as ${role}`}
			</button>

			<div style={styles.bottomRow}>
				<span>New here?</span>
				<button
					type="button"
					style={{ ...styles.linkBtn, color: linkColor }}
					onClick={() => navigate('/auth?mode=register')}
				>
					Create account
				</button>
			</div>
		</form>
	) : (
		<div style={styles.container}>
			<form
				onSubmit={handleSubmit}
				style={styles.form}
				aria-labelledby="login-title"
				noValidate
			>
				<h2 id="login-title" style={styles.title}>
					Sign in
				</h2>

				{/* Role switch (segmented control) */}
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
					<label style={styles.label} htmlFor="identifier">
						{idLabel}
					</label>
					<input
						id="identifier"
						style={{
							...styles.input,
							...(fieldErrors.identifier ? styles.inputInvalid : {}),
						}}
						type="text"
						placeholder={idPlaceholder}
						value={identifier}
						onChange={e => setIdentifier(e.target.value)}
						autoComplete="username"
						inputMode="text"
					/>
					{fieldErrors.identifier ? (
						<span style={styles.helperText}>{fieldErrors.identifier}</span>
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
							placeholder="••••••••"
							value={password}
							onChange={e => setPassword(e.target.value)}
							autoComplete="current-password"
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

				<div style={styles.row}>
					<label style={styles.checkLabel}>
						<input
							type="checkbox"
							checked={remember}
							onChange={() => setRemember(v => !v)}
						/>
						Remember me
					</label>

					<button
						type="button"
						style={{ ...styles.linkBtn, color: linkColor }}
						onClick={() => alert('Forgot password flow is not configured.')}
					>
						Forgot password?
					</button>
				</div>

				{topError ? (
					<div style={styles.error} role="alert" aria-live="assertive">
						{topError}
					</div>
				) : null}

				<button
					type="submit"
					style={{
						...styles.button,
						background: buttonGradient,
						boxShadow: buttonShadow,
					}}
					disabled={loading}
				>
					{loading ? 'Signing in...' : `Sign in as ${role}`}
				</button>

				<div style={styles.bottomRow}>
					<span>New here?</span>
					<button
						type="button"
						style={{ ...styles.linkBtn, color: linkColor }}
						onClick={() => navigate('/auth?mode=register')}
					>
						Create account
					</button>
				</div>

				<p style={styles.note}>
					By continuing, you agree to the acceptable use of this system.
				</p>
			</form>
		</div>
	);
};

const styles = {
	container: {
		minHeight: '100vh',
		display: 'grid',
		placeItems: 'center',
		background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
		padding: 16,
		fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif",
		color: '#0f172a',
	},
	form: {
		width: '100%',
		maxWidth: 440,
		background: '#ffffff',
		padding: 24,
		borderRadius: 16,
		boxShadow: '0 10px 30px rgba(2,6,23,0.08)',
		border: '1px solid #e2e8f0',
	},
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
	row: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
		gap: 8,
	},
	checkLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#334155' },
	linkBtn: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		color: '#4f46e5', // overridden inline per role
		cursor: 'pointer',
		fontWeight: 600,
		padding: 0,
	},
	button: {
		width: '100%',
		padding: '12px 14px',
		borderRadius: 10,
		border: 'none',
		background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', // overridden inline
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
		marginTop: 10,
		fontSize: 14,
		color: '#64748b',
	},
	note: {
		marginTop: 10,
		fontSize: 12,
		color: '#64748b',
		textAlign: 'center',
	},
};

export default Login;
