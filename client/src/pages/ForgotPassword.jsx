import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotStudentPassword, forgotTeacherPassword } from '../services/apiServices';
import './Auth.css'; // Utilizing standard auth UI architecture

const ForgotPassword = () => {
	const navigate = useNavigate();
	const [role, setRole] = useState('student');
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [sent, setSent] = useState(false);

	const handleSubmit = async e => {
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

	return (
		<div className="auth-page">
			{/* Shared background blobs */}
			<div className="auth-bg-layer" />
			<div className="auth-blob auth-blob-1" />
			<div className="auth-blob auth-blob-2" />

			<div className="auth-glass-card">
				{sent ? (
					<>
						<div style={{ textAlign: 'center', marginBottom: 12 }}>
							<span style={{ fontSize: 48 }}>📧</span>
						</div>
						<h2 className="auth-title" style={{ textAlign: 'center' }}>
							Check Your Email
						</h2>
						<p
							className="auth-subtitle"
							style={{ textAlign: 'center', marginBottom: 20 }}
						>
							If an account with <strong>{email}</strong> exists, we've carefully sent
							a password reset link. It expires securely in{' '}
							<strong>10 minutes</strong>.
						</p>
						<p className="auth-subtitle" style={{ fontSize: 13, textAlign: 'center' }}>
							Didn't receive it? Check your spam folder or try again safely.
						</p>
						<button
							type="button"
							onClick={() => setSent(false)}
							className={`auth-submit-btn ${role}`}
							style={{ marginBottom: 16 }}
						>
							Try Another Email
						</button>
						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							className={`link-btn ${role}`}
							style={{ width: '100%', textAlign: 'center' }}
						>
							← Back to Login
						</button>
					</>
				) : (
					<>
						<h2 className="auth-title">Forgot Password?</h2>
						<p className="auth-subtitle">
							Enter the email address securely associated with your account state and
							we'll dispatch a link to reset your password.
						</p>

						{/* Standard Role Switcher */}
						<div className="role-pill-container" role="tablist">
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

						<form onSubmit={handleSubmit} noValidate>
							<div className="input-group">
								<label className="floating-label" htmlFor="fp-email">
									Email Address
								</label>
								<input
									id="fp-email"
									className="auth-input"
									type="email"
									placeholder="Enter your registered email"
									value={email}
									onChange={e => setEmail(e.target.value)}
									autoComplete="email"
									autoFocus
								/>
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
										Sending...
									</>
								) : (
									'Send Reset Link'
								)}
							</button>
						</form>

						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							className={`link-btn ${role}`}
							style={{ width: '100%', textAlign: 'center' }}
						>
							← Back to Login
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default ForgotPassword;
