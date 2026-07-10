import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, CheckCircle2, XCircle, Loader2, ArrowLeft, Moon, Sun, Home } from 'lucide-react';
import { verifyEmail, resendVerification } from '../services/apiServices';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { setToken } from '../utils/handleToken.js';
import heroImage from '../assets/hero_2.png';
import './Auth.css';

export default function VerifyEmail() {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();
	const { isAuthenticated, role: authRole, setIsEmailVerified } = useAuth();
	const { theme, toggleTheme } = useTheme();

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
				const result = await verifyEmail(token);
				if (result?.data?.authToken) {
					setToken({ accessToken: result.data.authToken });
					setIsEmailVerified(true);
				}
				setStatus('success');
				setTimeout(() => {
					if (isAuthenticated) {
						navigate(role === 'teacher' ? '/teacher' : '/student', { replace: true });
					} else {
						navigate('/login', { replace: true });
					}
				}, 3000);
			} catch (err) {
				setStatus('error');
				setError(err?.response?.data?.message || err?.message || 'Verification failed. The link may be invalid or expired.');
			}
		})();
	}, [token, role, navigate, isAuthenticated, setIsEmailVerified]);

	const handleResend = async () => {
		if (!isAuthenticated) {
			navigate('/login');
			return;
		}
		setResending(true);
		setResendSuccess(false);
		try {
			await resendVerification();
			setResendSuccess(true);
		} catch (err) {
			setError(err?.response?.data?.message || err?.message || 'Failed to resend verification email.');
		} finally {
			setResending(false);
		}
	};

	return (
		<div className="auth-split-container">
			{/* Left Side: Form */}
			<div className="auth-form-section">
				{/* Top Controls */}
				<div className="absolute top-6 left-6 right-6 flex items-center justify-between z-50">
					<button
						className="flex items-center gap-2 rounded-full bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						onClick={() => navigate('/')}
					>
						<Home size={16} />
						<span className="hidden sm:inline">Back to Home</span>
					</button>
					<button
						className="auth-theme-toggle !static"
						onClick={toggleTheme}
						title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					>
						{theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
					</button>
				</div>

				<div className="auth-form-container mt-12 sm:mt-0 flex flex-col items-center justify-center text-center">
					{status === 'verifying' && (
						<>
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--primary-light)] text-[var(--primary-strong)]">
								<Loader2 className="h-10 w-10 animate-spin" />
							</div>
							<h1 className="auth-title">Verifying Email...</h1>
							<p className="auth-subtitle max-w-sm mx-auto">
								Please wait while we establish a secure connection and verify your email address.
							</p>
						</>
					)}

					{status === 'success' && (
						<>
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
								<CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
							</div>
							<h1 className="auth-title !text-green-600 dark:!text-green-400">Email Verified!</h1>
							<p className="auth-subtitle mb-8 max-w-sm mx-auto">
								Your email has been successfully verified. You now have full access to all features. Redirecting securely...
							</p>
							<button
								type="button"
								onClick={() => navigate(isAuthenticated ? (role === 'teacher' ? '/teacher' : '/student') : '/login', { replace: true })}
								className="btn-primary w-full justify-center py-3 bg-green-600 hover:bg-green-700"
							>
								{isAuthenticated ? 'Go to Dashboard' : 'Go to Login'}
							</button>
						</>
					)}

					{status === 'error' && (
						<>
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 dark:bg-red-500/20">
								<XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
							</div>
							<h1 className="auth-title">Verification Failed</h1>
							<p className="auth-subtitle mb-8 max-w-sm mx-auto !text-red-600 dark:!text-red-400">
								{error}
							</p>

							{resendSuccess ? (
								<div className="mb-8 w-full rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
									✅ A new verification email has been dispatched.
								</div>
							) : (
								<button
									type="button"
									onClick={handleResend}
									disabled={resending}
									className="btn-primary w-full justify-center py-3 mb-4"
								>
									{resending ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
									{resending ? 'Sending...' : 'Resend Verification Email'}
								</button>
							)}

							<button
								type="button"
								onClick={() => navigate('/login')}
								className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50"
							>
								<ArrowLeft size={16} />
								Back to Login
							</button>
						</>
					)}

					{status === 'idle' && (
						<>
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-500/20">
								<Mail className="h-10 w-10 text-blue-600 dark:text-blue-400" />
							</div>
							<h1 className="auth-title">Verify Your Email</h1>
							<p className="auth-subtitle mb-8 max-w-sm mx-auto">
								Please check your inbox for the verification email we securely sent when you registered. Click the link in the email to verify your account natively.
							</p>

							{resendSuccess ? (
								<div className="mb-8 w-full rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">
									✅ A new verification email has been dispatched.
								</div>
							) : (
								<button
									type="button"
									onClick={handleResend}
									disabled={resending}
									className="btn-primary w-full justify-center py-3 mb-4"
								>
									{resending ? <Loader2 size={18} className="animate-spin mr-2" /> : null}
									{resending ? 'Sending...' : 'Resend Verification Email'}
								</button>
							)}

							<button
								type="button"
								onClick={() => navigate(isAuthenticated ? (role === 'teacher' ? '/teacher' : '/student') : '/login')}
								className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50"
							>
								<ArrowLeft size={16} />
								{isAuthenticated ? 'Back to Dashboard' : 'Back to Login'}
							</button>
						</>
					)}
				</div>
			</div>

			{/* Right Side: Visual Content */}
			<div className="auth-visual-section">
				<div className="auth-visual-content">
					<h2 className="mb-4 text-3xl font-bold leading-tight">
						Verify to Access
					</h2>
					<p className="mb-12 text-lg text-white/80">
						Account verification adds an extra layer of security and unlocks the full potential of your platform.
					</p>
					
					<div className="relative mx-auto max-w-md">
						<div className="absolute -inset-4 rounded-full bg-white/20 blur-2xl filter mix-blend-overlay"></div>
						<img 
							src={heroImage} 
							alt="Verification Illustration" 
							className="relative w-full drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
							style={{ maxHeight: '400px', objectFit: 'contain' }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
