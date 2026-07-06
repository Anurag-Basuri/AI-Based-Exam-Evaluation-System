import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../services/apiServices';
import AuthAlert, { classifyError } from '../components/AuthAlert.jsx';
import './Auth.css'; // Utilizing standard auth UI architecture

const ForgotPassword = () => {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [alertObj, setAlertObj] = useState(null);
	const [sent, setSent] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault();
		setAlertObj(null);
		if (!email.trim()) {
			setAlertObj({
				type: 'error',
				icon: '⚠️',
				title: 'Invalid Email',
				message: 'Please enter your email address.',
			});
			return;
		}

		setLoading(true);
		try {
			await forgotPassword(email.trim().toLowerCase());
			setSent(true);
		} catch (err) {
			setAlertObj(classifyError(err));
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
							We've carefully sent a password reset link to <strong>{email}</strong>. 
							It expires securely in <strong>10 minutes</strong>.
						</p>
						<p className="auth-subtitle" style={{ fontSize: 13, textAlign: 'center' }}>
							Didn't receive it? Check your spam folder or try again.
						</p>
						<button
							type="button"
							onClick={() => setSent(false)}
							className="auth-submit-btn"
							style={{ marginBottom: 16 }}
						>
							Try Another Email
						</button>
						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							className="link-btn"
							style={{ width: '100%', textAlign: 'center' }}
						>
							← Back to Login
						</button>
					</>
				) : (
					<>
						<h2 className="auth-title">Forgot Password?</h2>
						<p className="auth-subtitle">
							Enter the email address securely associated with your account and
							we'll dispatch a link to reset your password.
						</p>

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
									onChange={e => {
										setEmail(e.target.value);
										if (alertObj) setAlertObj(null);
									}}
									autoComplete="email"
									autoFocus
								/>
							</div>

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

							<button
								type="submit"
								className="auth-submit-btn"
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
							className="link-btn"
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
