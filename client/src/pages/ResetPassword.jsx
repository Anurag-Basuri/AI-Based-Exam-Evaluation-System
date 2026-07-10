import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, Loader2, CheckCircle2, Moon, Sun, Home, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../services/apiServices';
import { useTheme } from '../hooks/useTheme.js';
import heroImage from '../assets/hero_4.png';
import './Auth.css';

export default function ResetPassword() {
	const navigate = useNavigate();
	const { theme, toggleTheme } = useTheme();
	const [searchParams] = useSearchParams();
	const token = searchParams.get('token') || '';
	const role = searchParams.get('role') || 'student';

	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);
	const [globalError, setGlobalError] = useState('');
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
		setGlobalError('');

		if (!token) {
			setGlobalError('Missing reset token. Please use the link from your email.');
			return;
		}
		if (password.length < 8) {
			setGlobalError('Password must be at least 8 characters.');
			return;
		}
		if (password !== confirmPassword) {
			setGlobalError('Passwords do not match.');
			return;
		}

		setLoading(true);
		try {
			await resetPassword(token, password);
			setSuccess(true);
			setTimeout(() => navigate('/login', { replace: true }), 3000);
		} catch (err) {
			setGlobalError(err?.response?.data?.message || err?.message || 'Failed to reset password. The link may have expired.');
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
					{success ? (
						<div className="flex flex-col items-center text-center">
							<div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20">
								<CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
							</div>
							<h1 className="auth-title">Password Reset!</h1>
							<p className="auth-subtitle mb-8 text-center max-w-sm mx-auto">
								Your password has been securely changed. You will be automatically
								redirected to login in a moment...
							</p>
							<button
								type="button"
								onClick={() => navigate('/login', { replace: true })}
								className="btn-primary w-full justify-center py-3"
							>
								Go to Login Now
							</button>
						</div>
					) : (
						<>
							<div className="auth-header">
								<div className="auth-header-icon">
									<Lock size={24} />
								</div>
								<h1 className="auth-title">Set New Password</h1>
								<p className="auth-subtitle">
									Choose a strong password for your account to keep it secure.
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
									<label className="form-label" htmlFor="password">
										New Password
									</label>
									<div className="relative">
										<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
											<Lock size={18} className="text-[var(--text-muted)]" />
										</div>
										<input
											id="password"
											className="form-input !pl-11 !pr-11"
											type={showPassword ? 'text' : 'password'}
											placeholder="Enter new password"
											value={password}
											onChange={e => {
												setPassword(e.target.value);
												if (globalError) setGlobalError('');
											}}
											autoFocus
										/>
										<button
											type="button"
											className="absolute inset-y-0 right-0 flex items-center pr-4 text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
											onClick={() => setShowPassword(!showPassword)}
											tabIndex="-1"
										>
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>

									{/* Strength Meter */}
									{password.length > 0 && (
										<div className="mt-2 flex items-center gap-3 px-1">
											<div className="flex flex-1 gap-1 h-1.5">
												{[1, 2, 3, 4].map(idx => (
													<div
														key={idx}
														className="h-full flex-1 rounded-full transition-colors duration-300"
														style={{
															backgroundColor:
																strength.level >= idx ? strength.color : 'var(--border)',
														}}
													/>
												))}
											</div>
											<span
												className="text-xs font-semibold"
												style={{ color: strength.color }}
											>
												{strength.text}
											</span>
										</div>
									)}
								</div>

								<div className="form-group">
									<label className="form-label" htmlFor="confirmPassword">
										Confirm Password
									</label>
									<div className="relative">
										<div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
											<Lock size={18} className="text-[var(--text-muted)]" />
										</div>
										<input
											id="confirmPassword"
											className="form-input !pl-11 !pr-11"
											type={showPassword ? 'text' : 'password'}
											placeholder="Confirm new password"
											value={confirmPassword}
											onChange={e => {
												setConfirmPassword(e.target.value);
												if (globalError) setGlobalError('');
											}}
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
											Resetting...
										</>
									) : (
										'Reset Password'
									)}
								</button>
							</form>
						</>
					)}
				</div>
			</div>

			{/* Right Side: Visual Content */}
			<div className="auth-visual-section">
				<div className="auth-visual-content">
					<h2 className="mb-4 text-3xl font-bold leading-tight">
						Secure Your Future
					</h2>
					<p className="mb-12 text-lg text-white/80">
						Please make sure to choose a password you won't forget, and never share it with anyone.
					</p>
					
					<div className="relative mx-auto max-w-md">
						<div className="absolute -inset-4 rounded-full bg-white/20 blur-2xl filter mix-blend-overlay"></div>
						<img 
							src={heroImage} 
							alt="Security Illustration" 
							className="relative w-full drop-shadow-2xl hover:scale-105 transition-transform duration-500" 
							style={{ maxHeight: '400px', objectFit: 'contain' }}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
