import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	verifyStudentEmail,
	verifyTeacherEmail,
	resendStudentVerification,
	resendTeacherVerification,
} from '../services/apiServices';
import { useAuth } from '../hooks/useAuth.js';
import './Auth.css';

const VerifyEmail = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { isAuthenticated, role: authRole } = useAuth();

	const token = searchParams.get('token') || '';
	const role = searchParams.get('role') || authRole || 'student';

	const [status, setStatus] = useState(token ? 'verifying' : 'idle'); // 'idle' | 'verifying' | 'success' | 'error'
	const [error, setError] = useState('');
	const [resending, setResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const attemptedRef = useRef(false);

	useEffect(() => {
		if (!token || attemptedRef.current) return;
		attemptedRef.current = true;

		(async () => {
			try {
				const fn = role === 'teacher' ? verifyTeacherEmail : verifyStudentEmail;
				await fn(token);
				setStatus('success');
				setTimeout(() => {
					if (isAuthenticated) {
						navigate(role === 'teacher' ? '/teacher' : '/student', { replace: true });
					} else {
						navigate('/auth?mode=login', { replace: true });
					}
				}, 3000);
			} catch (err) {
				setStatus('error');
				setError(
					err?.message || 'Verification failed. The link may be invalid or expired.',
				);
			}
		})();
	}, [token, role, navigate, isAuthenticated]);

	const handleResend = async () => {
		if (!isAuthenticated) {
			navigate('/auth?mode=login');
			return;
		}
		setResending(true);
		setResendSuccess(false);
		try {
			const fn = role === 'teacher' ? resendTeacherVerification : resendStudentVerification;
			await fn();
			setResendSuccess(true);
		} catch (err) {
			setError(err?.message || 'Failed to resend verification email.');
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="auth-page">
			{/* Shared background blobs */}
			<div className="auth-bg-layer" />
			<div className="auth-blob auth-blob-1" />
			<div className="auth-blob auth-blob-2" />

			<div className="auth-glass-card" style={{ textAlign: 'center' }}>
				{status === 'verifying' && (
					<>
						<div
							style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}
						>
							<div
								className="auth-spinner"
								style={{
									width: 48,
									height: 48,
									borderWidth: 4,
									borderTopColor: 'var(--primary)',
								}}
							/>
						</div>
						<h2 className="auth-title">Verifying Your Email...</h2>
						<p className="auth-subtitle">
							Please wait while we establish a secure connection and verify your email
							address.
						</p>
					</>
				)}

				{status === 'success' && (
					<>
						<div style={{ marginBottom: 16 }}>
							<span style={{ fontSize: 56 }}>🎉</span>
						</div>
						<h2 className="auth-title" style={{ color: '#16a34a' }}>
							Email Verified!
						</h2>
						<p className="auth-subtitle">
							Your email has been successfully verified. You now have full access to
							all features. Redirecting securely...
						</p>
						<button
							type="button"
							onClick={() =>
								navigate(
									isAuthenticated
										? role === 'teacher'
											? '/teacher'
											: '/student'
										: '/auth?mode=login',
									{ replace: true },
								)
							}
							className="auth-submit-btn"
							style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}
						>
							{isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
						</button>
					</>
				)}

				{status === 'error' && (
					<>
						<div style={{ marginBottom: 16 }}>
							<span style={{ fontSize: 56 }}>😕</span>
						</div>
						<h2 className="auth-title">Verification Failed</h2>
						<p className="auth-subtitle" style={{ color: '#ef4444' }}>
							{error}
						</p>

						{resendSuccess ? (
							<div
								className="top-error-banner"
								style={{
									background: '#f0fdf4',
									color: '#166534',
									borderColor: '#bbf7d0',
								}}
							>
								✅ A new verification email has been dispatched.
							</div>
						) : (
							<button
								type="button"
								onClick={handleResend}
								disabled={resending}
								className={`auth-submit-btn ${role}`}
								style={{ marginBottom: 16 }}
							>
								{resending ? 'Sending...' : 'Resend Verification Email'}
							</button>
						)}

						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							className={`link-btn ${role}`}
							style={{ width: '100%' }}
						>
							← Back to Login
						</button>
					</>
				)}

				{status === 'idle' && (
					<>
						<div style={{ marginBottom: 16 }}>
							<span style={{ fontSize: 56 }}>📫</span>
						</div>
						<h2 className="auth-title">Verify Your Email</h2>
						<p className="auth-subtitle" style={{ marginBottom: 24 }}>
							Please check your inbox for the verification email we securely sent when
							you registered. Click the link in the email to verify your account
							natively.
						</p>

						{resendSuccess ? (
							<div
								className="top-error-banner"
								style={{
									background: '#f0fdf4',
									color: '#166534',
									borderColor: '#bbf7d0',
								}}
							>
								✅ A new verification email has been dispatched.
							</div>
						) : (
							<button
								type="button"
								onClick={handleResend}
								disabled={resending}
								className={`auth-submit-btn ${role}`}
								style={{ marginBottom: 16 }}
							>
								{resending ? 'Sending...' : 'Resend Verification Email'}
							</button>
						)}

						<button
							type="button"
							onClick={() =>
								navigate(
									isAuthenticated
										? role === 'teacher'
											? '/teacher'
											: '/student'
										: '/auth?mode=login',
								)
							}
							className={`link-btn ${role}`}
							style={{ width: '100%' }}
						>
							← {isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
						</button>
					</>
				)}
			</div>
		</div>
	);
};

export default VerifyEmail;
