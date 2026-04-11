import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { forgotStudentPassword, forgotTeacherPassword } from '../services/apiServices';

const ForgotPassword = () => {
	const navigate = useNavigate();
	const [role, setRole] = useState('student');
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [sent, setSent] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		if (!email.trim()) {
			setError('Please enter your email address.');
			return;
		}

		setLoading(true);
		try {
			const fn = role === 'student' ? forgotStudentPassword : forgotTeacherPassword;
			await fn(email.trim().toLowerCase());
			setSent(true);
		} catch (err) {
			setError(err?.message || 'Something went wrong. Please try again.');
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
				{sent ? (
					<>
						<div style={styles.iconWrap}>
							<span style={{ fontSize: 48 }}>📧</span>
						</div>
						<h2 style={styles.title}>Check Your Email</h2>
						<p style={styles.text}>
							If an account with <strong>{email}</strong> exists, we've sent a password reset link. It
							expires in <strong>10 minutes</strong>.
						</p>
						<p style={{ ...styles.text, fontSize: 13, color: '#94a3b8' }}>
							Didn't receive it? Check your spam folder or try again.
						</p>
						<button
							type="button"
							onClick={() => setSent(false)}
							style={{ ...styles.btn, background: grad, marginBottom: 8 }}
						>
							Try Another Email
						</button>
						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							style={styles.linkBtn}
						>
							← Back to Login
						</button>
					</>
				) : (
					<>
						<h2 style={styles.title}>Forgot Password?</h2>
						<p style={styles.text}>
							Enter the email address associated with your account and we'll send you a link to reset
							your password.
						</p>

						{/* Role Switch */}
						<div style={styles.roleSwitch}>
							{['student', 'teacher'].map((r) => (
								<button
									key={r}
									type="button"
									onClick={() => setRole(r)}
									style={{
										...styles.roleTab,
										...(role === r
											? {
													background:
														r === 'teacher'
															? 'linear-gradient(135deg, #f97316, #fb923c)'
															: 'linear-gradient(135deg, #4f46e5, #6366f1)',
													color: '#fff',
													boxShadow: `0 6px 18px ${r === 'teacher' ? 'rgba(249,115,22,0.25)' : 'rgba(79,70,229,0.25)'}`,
											  }
											: {}),
									}}
								>
									{r.charAt(0).toUpperCase() + r.slice(1)}
								</button>
							))}
						</div>

						<form onSubmit={handleSubmit}>
							<div style={styles.field}>
								<label style={styles.label} htmlFor="fp-email">
									Email Address
								</label>
								<input
									id="fp-email"
									type="email"
									placeholder="Enter your registered email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									style={styles.input}
									autoComplete="email"
									autoFocus
								/>
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
								{loading ? 'Sending...' : 'Send Reset Link'}
							</button>
						</form>

						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							style={styles.linkBtn}
						>
							← Back to Login
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
	iconWrap: {
		textAlign: 'center',
		marginBottom: 12,
	},
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
	roleSwitch: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 8,
		background: 'var(--bg, #f1f5f9)',
		borderRadius: 12,
		padding: 5,
		marginBottom: 20,
	},
	roleTab: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		padding: '10px 12px',
		borderRadius: 10,
		cursor: 'pointer',
		fontWeight: 700,
		fontSize: 14,
		color: 'var(--text-muted, #334155)',
		transition: 'all 0.2s',
	},
	field: {
		marginBottom: 16,
	},
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
		borderRadius: 10,
		border: '1px solid var(--border, #cbd5e1)',
		outline: 'none',
		fontSize: 14,
		color: 'var(--text, #0f172a)',
		background: 'var(--bg, #fff)',
		boxSizing: 'border-box',
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

export default ForgotPassword;
