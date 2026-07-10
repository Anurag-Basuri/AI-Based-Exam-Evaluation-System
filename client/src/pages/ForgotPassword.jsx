import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, AlertCircle, Loader2, Moon, Sun, Home, CheckCircle2 } from 'lucide-react';
import { forgotPassword } from '../services/apiServices';
import { useTheme } from '../hooks/useTheme.js';
import heroImage from '../assets/hero_3.png';
import './Auth.css';

export default function ForgotPassword() {
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();

	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [globalError, setGlobalError] = useState('');
	const [sent, setSent] = useState(false);

	const handleSubmit = async e => {
		e.preventDefault();
		setGlobalError('');
		if (!email.trim()) {
			setGlobalError('Please enter your email address.');
			return;
		}

		setLoading(true);
		try {
			await forgotPassword(email.trim().toLowerCase());
			setSent(true);
		} catch (err) {
			const message = err?.response?.data?.message || err?.message || 'Failed to send reset link. Please try again.';
			setGlobalError(message);
		} finally {
			setLoading(false);
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

				<div className="auth-form-container mt-12 sm:mt-0">
					{sent ? (
						<div className="flex flex-col items-center text-center">
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
								<Mail className="h-10 w-10 text-green-600 dark:text-green-400" />
							</div>
							<h1 className="auth-title">Check Your Email</h1>
							<p className="auth-subtitle mb-8 text-center max-w-sm mx-auto">
								We've carefully sent a password reset link to <strong className="text-[var(--text)]">{email}</strong>. 
								It expires securely in <strong>10 minutes</strong>.
							</p>
							
							<div className="mb-8 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600 dark:border-gray-700/50 dark:bg-gray-800/50 dark:text-gray-400">
								Didn't receive it? Check your spam folder or try again.
							</div>

							<div className="flex w-full flex-col gap-3">
								<button
									type="button"
									onClick={() => setSent(false)}
									className="btn-primary w-full justify-center py-3"
								>
									Try Another Email
								</button>
								<button
									type="button"
									onClick={() => navigate('/login')}
									className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700/50"
								>
									<ArrowLeft size={16} />
									Back to Login
								</button>
							</div>
						</div>
					) : (
						<>
							<div className="auth-header">
								<div className="auth-header-icon">
									<Mail size={24} />
								</div>
								<h1 className="auth-title">Forgot Password?</h1>
								<p className="auth-subtitle">
									Enter the email address securely associated with your account and
									we'll dispatch a link to reset your password.
								</p>
							</div>

							{globalError && (
								<div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
									<AlertCircle size={20} className="mt-0.5 shrink-0" />
									<p className="text-sm font-medium">{globalError}</p>
								</div>
							)}

							<form className="auth-form" onSubmit={handleSubmit}>
								<div className="form-group">
									<label className="form-label" htmlFor="email">
										Email Address
									</label>
									<div className="relative">
										<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
											<Mail size={18} className="text-[var(--text-muted)]" />
										</div>
										<input
											id="email"
											className="form-input !pl-11"
											type="email"
											placeholder="Enter your registered email"
											value={email}
											onChange={e => {
												setEmail(e.target.value);
												if (globalError) setGlobalError('');
											}}
											autoComplete="email"
											autoFocus
										/>
									</div>
								</div>

								<button
									type="submit"
									className="btn-primary w-full justify-center py-3 mt-4"
									disabled={loading}
								>
									{loading ? (
										<>
											<Loader2 size={18} className="animate-spin" />
											Sending...
										</>
									) : (
										'Send Reset Link'
									)}
								</button>
							</form>

							<div className="mt-8 text-center">
								<button
									type="button"
									onClick={() => navigate('/login')}
									className="inline-flex items-center justify-center gap-2 text-sm font-medium text-[var(--primary)] hover:text-[var(--primary-strong)] transition-colors"
								>
									<ArrowLeft size={16} />
									Back to Login
								</button>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Right Side: Visual Content */}
			<div className="auth-visual-section">
				<div className="auth-visual-content">
					<h2 className="mb-4 text-3xl font-bold leading-tight">
						Account Recovery
					</h2>
					<p className="mb-12 text-lg text-white/80">
						Don't worry! It happens. Please enter the address associated with your account.
					</p>
					
					<div className="relative mx-auto max-w-md">
						{/* Glow effect */}
						<div className="absolute -inset-4 rounded-full bg-white/20 blur-2xl filter mix-blend-overlay"></div>
						<img 
							src={heroImage} 
							alt="Recovery Illustration" 
							className="relative w-full drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
							style={{ maxHeight: '400px', objectFit: 'contain' }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
