import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	verifyStudentEmail,
	verifyTeacherEmail,
	resendStudentVerification,
	resendTeacherVerification,
} from '../services/apiServices';
import { useAuth } from '../hooks/useAuth.js';

const VerifyEmail = () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { user, isAuthenticated, role: authRole } = useAuth();

	const token = searchParams.get('token') || '';
	const role = searchParams.get('role') || authRole || 'student';

	const [status, setStatus] = useState(token ? 'verifying' : 'idle'); // 'idle' | 'verifying' | 'success' | 'error'
	const [error, setError] = useState('');
	const [resending, setResending] = useState(false);
	const [resendSuccess, setResendSuccess] = useState(false);
	const attemptedRef = useRef(false);

	// Auto-verify on mount if token is present
	useEffect(() => {
		if (!token || attemptedRef.current) return;
		attemptedRef.current = true;

		(async () => {
			try {
				const fn = role === 'teacher' ? verifyTeacherEmail : verifyStudentEmail;
				await fn(token);
				setStatus('success');
				// Auto-redirect after 3s
				setTimeout(() => {
					if (isAuthenticated) {
						navigate(role === 'teacher' ? '/teacher' : '/student', { replace: true });
					} else {
						navigate('/auth?mode=login', { replace: true });
					}
				}, 3000);
			} catch (err) {
				setStatus('error');
				setError(err?.message || 'Verification failed. The link may be invalid or expired.');
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
		<div style={styles.page}>
			<div style={styles.card}>
				{status === 'verifying' && (
					<>
						<div style={styles.iconWrap}>
							<div style={styles.spinner} />
						</div>
						<h2 style={styles.title}>Verifying Your Email...</h2>
						<p style={styles.text}>Please wait while we verify your email address.</p>
					</>
				)}

				{status === 'success' && (
					<>
						<div style={styles.iconWrap}>
							<span style={{ fontSize: 56 }}>🎉</span>
						</div>
						<h2 style={{ ...styles.title, color: '#16a34a' }}>Email Verified!</h2>
						<p style={styles.text}>
							Your email has been successfully verified. You now have full access to all features.
							Redirecting...
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
							style={{
								...styles.btn,
								background: 'linear-gradient(135deg, #16a34a, #22c55e)',
								boxShadow: '0 8px 22px rgba(22,163,74,0.3)',
							}}
						>
							{isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
						</button>
					</>
				)}

				{status === 'error' && (
					<>
						<div style={styles.iconWrap}>
							<span style={{ fontSize: 56 }}>😕</span>
						</div>
						<h2 style={styles.title}>Verification Failed</h2>
						<p style={styles.text}>{error}</p>

						{resendSuccess ? (
							<div style={styles.successBanner}>
								✅ A new verification email has been sent. Check your inbox!
							</div>
						) : (
							<button
								type="button"
								onClick={handleResend}
								disabled={resending}
								style={{
									...styles.btn,
									background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
									boxShadow: '0 8px 22px rgba(79,70,229,0.3)',
									opacity: resending ? 0.7 : 1,
								}}
							>
								{resending ? 'Sending...' : 'Resend Verification Email'}
							</button>
						)}

						<button
							type="button"
							onClick={() => navigate('/auth?mode=login')}
							style={styles.linkBtn}
						>
							← Back to Login
						</button>
					</>
				)}

				{status === 'idle' && (
					<>
						<div style={styles.iconWrap}>
							<span style={{ fontSize: 56 }}>📫</span>
						</div>
						<h2 style={styles.title}>Verify Your Email</h2>
						<p style={styles.text}>
							Please check your inbox for the verification email we sent when you registered.
							Click the link in the email to verify your account.
						</p>

						{resendSuccess ? (
							<div style={styles.successBanner}>
								✅ A new verification email has been sent. Check your inbox!
							</div>
						) : (
							<button
								type="button"
								onClick={handleResend}
								disabled={resending}
								style={{
									...styles.btn,
									background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
									boxShadow: '0 8px 22px rgba(79,70,229,0.3)',
									opacity: resending ? 0.7 : 1,
								}}
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
							style={styles.linkBtn}
						>
							← {isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
						</button>
					</>
				)}
			</div>

			<style>{`
				@keyframes spin { to { transform: rotate(360deg) } }
			`}</style>
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
		textAlign: 'center',
	},
	iconWrap: {
		marginBottom: 16,
		display: 'flex',
		justifyContent: 'center',
	},
	spinner: {
		width: 48,
		height: 48,
		border: '4px solid #e2e8f0',
		borderTopColor: '#4f46e5',
		borderRadius: '50%',
		animation: 'spin 0.8s linear infinite',
	},
	title: {
		margin: '0 0 8px',
		fontSize: 22,
		fontWeight: 800,
		color: 'var(--text, #0f172a)',
	},
	text: {
		margin: '0 0 24px',
		fontSize: 14,
		lineHeight: 1.7,
		color: 'var(--text-muted, #64748b)',
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
	successBanner: {
		background: '#f0fdf4',
		color: '#166534',
		padding: '12px 16px',
		borderRadius: 10,
		marginBottom: 12,
		fontSize: 14,
		fontWeight: 600,
		border: '1px solid #bbf7d0',
	},
};

export default VerifyEmail;
