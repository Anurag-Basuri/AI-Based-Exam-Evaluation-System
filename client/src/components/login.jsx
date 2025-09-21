import React, { useState, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth.js';

const Login = ({ onLogin }) => {
	const { loginStudent, loginTeacher } = useAuth();
	const [role, setRole] = useState('student'); // "student" | "teacher"
	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [remember, setRemember] = useState(true);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');

	const idLabel = useMemo(
		() => (role === 'student' ? 'Student ID or Email' : 'Teacher Email'),
		[role],
	);
	const idPlaceholder = useMemo(
		() => (role === 'student' ? 'e.g. S12345 or student@domain.com' : 'teacher@domain.com'),
		[role],
	);

	const extractError = err =>
		err?.message ||
		err?.response?.data?.message ||
		err?.response?.data?.error ||
		'Login failed. Please try again.';

	const buildPayload = () => {
		if (role === 'student') {
			const isEmail = identifier.includes('@');
			return isEmail
				? { email: identifier.trim(), password }
				: { studentId: identifier.trim(), password };
		}
		// teacher
		return { email: identifier.trim(), password };
	};

	const handleSubmit = async e => {
		e.preventDefault();
		setError('');

		if (!identifier.trim() || !password) {
			setError('Please fill in all fields.');
			return;
		}

		setLoading(true);
		try {
			const payload = buildPayload();

			// Call the appropriate AuthContext method (handles token + navigation)
			const res =
				role === 'student' ? await loginStudent(payload) : await loginTeacher(payload);

			// Optionally notify parent
			if (typeof onLogin === 'function') {
				onLogin({ role, user: res?.data?.user || null });
			}

			// Persist role preference if desired
			if (remember) {
				try {
					localStorage.setItem('preferredRole', role);
				} catch {}
			}
		} catch (err) {
			setError(extractError(err));
		} finally {
			setLoading(false);
		}
	};

	return (
		<div style={styles.container}>
			<form onSubmit={handleSubmit} style={styles.form} aria-labelledby="login-title">
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
					<label style={styles.label}>{idLabel}</label>
					<input
						style={styles.input}
						type="text"
						placeholder={idPlaceholder}
						value={identifier}
						onChange={e => setIdentifier(e.target.value)}
						autoComplete="username"
						inputMode="email"
					/>
				</div>

				<div style={styles.field}>
					<label style={styles.label}>Password</label>
					<div style={styles.passwordWrap}>
						<input
							style={{ ...styles.input, paddingRight: 44 }}
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

					{/* Hook this up later if you add a route */}
					<button
						type="button"
						style={styles.linkBtn}
						onClick={() => alert('Forgot password flow is not configured.')}
					>
						Forgot password?
					</button>
				</div>

				{error ? (
					<div style={styles.error} role="alert" aria-live="assertive">
						{error}
					</div>
				) : null}

				<button type="submit" style={styles.button} disabled={loading}>
					{loading ? 'Signing in...' : `Sign in as ${role}`}
				</button>

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
		color: '#4f46e5',
		cursor: 'pointer',
		fontWeight: 600,
		padding: 0,
	},
	button: {
		width: '100%',
		padding: '12px 14px',
		borderRadius: 10,
		border: 'none',
		background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
		color: '#fff',
		cursor: 'pointer',
		fontWeight: 800,
		letterSpacing: 0.2,
		boxShadow: '0 10px 24px rgba(79,70,229,0.25)',
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
	note: {
		marginTop: 10,
		fontSize: 12,
		color: '#64748b',
		textAlign: 'center',
	},
};

export default Login;
