import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetStudentPassword, resetTeacherPassword } from '../services/apiServices';
import './Auth.css';

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

	const handleSubmit = async e => {
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

	return (
		<div className="auth-page">
			{/* Shared background blobs */}
			<div className="auth-bg-layer" />
			<div className="auth-blob auth-blob-1" />
			<div className="auth-blob auth-blob-2" />

			<div className="auth-glass-card">
				{success ? (
					<>
						<div style={{ textAlign: 'center', marginBottom: 16 }}>
							<span style={{ fontSize: 48 }}>✅</span>
						</div>
						<h2 className="auth-title" style={{ textAlign: 'center' }}>
							Password Reset!
						</h2>
						<p
							className="auth-subtitle"
							style={{ textAlign: 'center', marginBottom: 24 }}
						>
							Your password has been securely changed. You will be automatically
							redirected to login...
						</p>
						<button
							type="button"
							onClick={() => navigate('/auth?mode=login', { replace: true })}
							className={`auth-submit-btn ${role}`}
						>
							Go to Login Now
						</button>
					</>
				) : (
					<>
						<h2 className="auth-title">Set New Password</h2>
						<p className="auth-subtitle" style={{ marginBottom: 24 }}>
							Choose a strong password for your <strong>{role}</strong> account.
						</p>

						<form onSubmit={handleSubmit} noValidate>
							<div className="input-group">
								<label className="floating-label" htmlFor="rp-password">
									New Password
								</label>
								<div style={{ position: 'relative' }}>
									<input
										id="rp-password"
										className="auth-input"
										style={{ paddingRight: 48 }}
										type={showPassword ? 'text' : 'password'}
										placeholder="Minimum 8 characters"
										value={password}
										onChange={e => setPassword(e.target.value)}
										autoComplete="new-password"
										autoFocus
									/>
									<button
										type="button"
										onClick={() => setShowPassword(s => !s)}
										className="eye-btn"
										aria-label={
											showPassword ? 'Hide password' : 'Show password'
										}
									>
										{showPassword ? '🙈' : '👁️'}
									</button>
								</div>

								{/* Strength bar */}
								{password && (
									<div style={{ marginTop: 8 }}>
										<div
											style={{
												height: 4,
												borderRadius: 2,
												background: 'var(--border)',
												overflow: 'hidden',
												marginBottom: 4,
											}}
										>
											<div
												style={{
													height: '100%',
													borderRadius: 2,
													transition: 'width 0.3s, background 0.3s',
													width: `${(strength.level / 5) * 100}%`,
													background: strength.color,
												}}
											/>
										</div>
										<span
											style={{
												fontSize: 12,
												color: strength.color,
												fontWeight: 600,
											}}
										>
											{strength.text}
										</span>
									</div>
								)}
							</div>

							<div
								className={`input-group ${confirmPassword && confirmPassword !== password ? 'has-error' : ''}`}
							>
								<label className="floating-label" htmlFor="rp-confirm">
									Confirm Password
								</label>
								<div style={{ position: 'relative' }}>
									<input
										id="rp-confirm"
										className="auth-input"
										style={{ paddingRight: 48 }}
										type={showPassword ? 'text' : 'password'}
										placeholder="Re-enter your password"
										value={confirmPassword}
										onChange={e => setConfirmPassword(e.target.value)}
										autoComplete="new-password"
									/>
								</div>
								{confirmPassword && confirmPassword !== password && (
									<span className="error-text">Passwords do not match</span>
								)}
							</div>

							{error && (
								<div
									className="top-error-banner"
									role="alert"
									aria-live="assertive"
								>
									<span>⚠️</span>
									<div>{error}</div>
								</div>
							)}

							<button
								type="submit"
								className={`auth-submit-btn ${role}`}
								disabled={loading}
								style={{ marginBottom: 16 }}
							>
								{loading ? (
									<>
										<span className="auth-spinner" />
										Resetting securely...
									</>
								) : (
									'Reset Password'
								)}
							</button>
						</form>

						<button
							type="button"
							onClick={() => navigate('/auth/forgot-password')}
							className={`link-btn ${role}`}
							style={{ width: '100%', textAlign: 'center' }}
						>
							← Request a new reset link
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default ResetPassword;
