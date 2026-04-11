import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { resetStudentPassword, resetTeacherPassword } from '../services/apiServices';

const ResetPassword = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') || '';
	const role = searchParams.get('role') || 'student';

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState(false);

	// Password strength indicator
	const strength = useMemo(() => {
		if (!password) return { level: 0, text: '', color: '#e2e8f0' };
		let score = 0;
		if (password.length >= 8) score++;
		if (password.length >= 12) score++;
		if (/[A-Z]/.test(password)) score++;
		if (/[0-9]/.test(password)) score++;
		if (/[^A-Za-z0-9]/.test(password)) score++;

		const levels = [
			{ text: 'Very Weak', color: '#ef4444' },
			{ text: 'Weak', color: '#f97316' },
			{ text: 'Fair', color: '#eab308' },
			{ text: 'Good', color: '#22c55e' },
			{ text: 'Strong', color: '#16a34a' },
		];
		const idx = Math.min(score, levels.length) - 1;
		return { level: score, ...levels[Math.max(0, idx)] };
	}, [password]);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');

		if (!token) {
			setError('Missing reset token. Please use the link from your email.');
			return;
		}
		if (password.length < 8) {
			setError('Password must be at least 8 characters.');
			return;
		}
		if (password !== confirmPassword) {
			setError('Passwords do not match.');
			return;
		}

		setLoading(true);
		try {
			const fn = role === 'teacher' ? resetTeacherPassword : resetStudentPassword;
			await fn(token, password);
			setSuccess(true);
			// Auto-redirect to login after 3s
			setTimeout(() => navigate('/auth?mode=login', { replace: true }), 3000);
		} catch (err) {
			setError(err?.message || 'Failed to reset password. The link may have expired.');
		} finally {
			setLoading(false);
		}
	};

	const primary = role === 'teacher' ? '#f97316' : '#4f46e5';
	const secondary = role === 'teacher' ? '#fb923c' : '#6366f1';
	const grad = `linear-gradient(135deg, ${primary}, ${secondary})`;

	return (
		<div style={styles.page}>
			<div style={styles.card}>
				{success ? (
					<>
						<div style={styles.iconWrap}>
							<span style={{ fontSize: 48 }}>✅</span>
						</div>
						<h2 style={styles.title}>Password Reset!</h2>
						<p style={styles.text}>
							Your password has been successfully changed. Redirecting to login...
						</p>
						<button
							type="button"
							onClick={() => navigate('/auth?mode=login', { replace: true })}
							style={{ ...styles.btn, background: grad }}
						>
							Go to Login
						</button>
					</>
				) : (
					<>
						<h2 style={styles.title}>Set New Password</h2>
						<p style={styles.text}>
							Choose a strong password for your{' '}
							<strong>{role}</strong> account.
						</p>

						<form onSubmit={handleSubmit}>
							<div style={styles.field}>
								<label style={styles.label} htmlFor="rp-password">
									New Password
								</label>
								<div style={styles.passwordWrap}>
									<input
										id="rp-password"
										type={showPassword ? 'text' : 'password'}
										placeholder="Minimum 8 characters"
										value={password}
										onChange={(e) => setPassword(e.target.value)}
										style={styles.input}
										autoComplete="new-password"
										autoFocus
									/>
									<button
										type="button"
										onClick={() => setShowPassword((s) => !s)}
										style={styles.eyeBtn}
										aria-label={showPassword ? 'Hide password' : 'Show password'}
									>
										{showPassword ? '🙈' : '👁️'}
									</button>
								</div>

								{/* Strength bar */}
								{password && (
									<div style={{ marginTop: 8 }}>
										<div style={styles.strengthTrack}>
											<div
												style={{
													...styles.strengthBar,
													width: `${(strength.level / 5) * 100}%`,
													background: strength.color,
												}}
											/>
										</div>
										<span style={{ fontSize: 12, color: strength.color, fontWeight: 600 }}>
											{strength.text}
										</span>
									</div>
								)}
							</div>

							<div style={styles.field}>
								<label style={styles.label} htmlFor="rp-confirm">
									Confirm Password
								</label>
								<input
									id="rp-confirm"
									type={showPassword ? 'text' : 'password'}
									placeholder="Re-enter your password"
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									style={{
										...styles.input,
										...(confirmPassword && confirmPassword !== password
											? { borderColor: '#ef4444', background: '#fff7f7' }
											: {}),
									}}
									autoComplete="new-password"
								/>
								{confirmPassword && confirmPassword !== password && (
									<span style={styles.helperText}>Passwords do not match</span>
								)}
							</div>

							{error ? (
								<div style={styles.error} role="alert">
									{error}
								</div>
							) : null}

							<button
								type="submit"
								disabled={loading}
								style={{
									...styles.btn,
									background: grad,
									boxShadow: `0 8px 22px ${role === 'teacher' ? 'rgba(249,115,22,0.3)' : 'rgba(79,70,229,0.3)'}`,
									opacity: loading ? 0.7 : 1,
								}}
							>
								{loading ? 'Resetting...' : 'Reset Password'}
							</button>
						</form>

						<button
							type="button"
							onClick={() => navigate('/auth/forgot-password')}
							style={styles.linkBtn}
						>
							← Request a new reset link
						</button>
					</>
				)}
			</div>
		</div>
	);
};

const styles = {
	page: {
		minHeight: '100vh',
		display: 'grid',
		placeItems: 'center',
		padding: 24,
		background: 'var(--bg, #f1f5f9)',
		fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, sans-serif",
	},
	card: {
		width: '100%',
		maxWidth: 440,
		background: 'var(--surface, #ffffff)',
		border: '1px solid var(--border, #e2e8f0)',
		borderRadius: 20,
		padding: 'clamp(24px, 5vw, 36px)',
		boxShadow: '0 20px 60px rgba(2,6,23,0.10)',
	},
	iconWrap: { textAlign: 'center', marginBottom: 12 },
	title: {
		margin: '0 0 8px',
		fontSize: 22,
		fontWeight: 800,
		color: 'var(--text, #0f172a)',
		textAlign: 'center',
	},
	text: {
		margin: '0 0 20px',
		fontSize: 14,
		lineHeight: 1.7,
		color: 'var(--text-muted, #64748b)',
		textAlign: 'center',
	},
	field: { marginBottom: 16 },
	label: {
		display: 'block',
		fontSize: 14,
		fontWeight: 600,
		marginBottom: 6,
		color: 'var(--text, #334155)',
	},
	input: {
		width: '100%',
		padding: '11px 14px',
		paddingRight: 44,
		borderRadius: 10,
		border: '1px solid var(--border, #cbd5e1)',
		outline: 'none',
		fontSize: 14,
		color: 'var(--text, #0f172a)',
		background: 'var(--bg, #fff)',
		boxSizing: 'border-box',
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
	strengthTrack: {
		height: 4,
		borderRadius: 2,
		background: '#e2e8f0',
		overflow: 'hidden',
		marginBottom: 4,
	},
	strengthBar: {
		height: '100%',
		borderRadius: 2,
		transition: 'width 0.3s, background 0.3s',
	},
	helperText: {
		display: 'block',
		marginTop: 6,
		fontSize: 12,
		color: '#ef4444',
	},
	error: {
		background: '#fdecea',
		color: '#b3261e',
		padding: '10px 12px',
		borderRadius: 10,
		marginBottom: 12,
		fontSize: 13,
		border: '1px solid #f5c2c0',
	},
	btn: {
		width: '100%',
		padding: '12px 14px',
		border: 'none',
		borderRadius: 10,
		color: '#fff',
		fontWeight: 700,
		fontSize: 15,
		cursor: 'pointer',
		marginBottom: 12,
		transition: 'opacity 0.2s',
	},
	linkBtn: {
		display: 'block',
		width: '100%',
		textAlign: 'center',
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		color: 'var(--text-muted, #64748b)',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: 14,
		padding: '6px 0',
	},
};

export default ResetPassword;
