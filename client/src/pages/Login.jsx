import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Eye, EyeOff, AlertCircle, Loader2, Moon, Sun } from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { pingBackendHealth } from '../services/api.js';
import heroImage from '../assets/hero_1.png'; // Make sure this asset exists
import './Auth.css';

export default function Login() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const returnTo = searchParams.get('redirect') || location?.state?.from || null;

	const { login } = useAuth();
	const { theme, toggleTheme } = useTheme();

	const [identifier, setIdentifier] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const [errors, setErrors] = useState({});
	const [globalError, setGlobalError] = useState('');

	// Wake up Render backend
	useEffect(() => {
		pingBackendHealth();
	}, []);

	const handleInputChange = (field, value, setter) => {
		setter(value);
		if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }));
		if (globalError) setGlobalError('');
	};

	const validate = () => {
		const newErrors = {};
		if (!identifier.trim()) newErrors.identifier = 'Email or username is required.';
		if (!password) newErrors.password = 'Password is required.';
		return newErrors;
	};

	const handleSubmit = async e => {
		e.preventDefault();
		const validationErrors = validate();
		setErrors(validationErrors);
		if (Object.keys(validationErrors).length > 0) return;

		setLoading(true);
		setGlobalError('');

		try {
			const value = identifier.trim();
			const isEmail = value.includes('@');
			const payload = isEmail ? { email: value, password } : { username: value, password };

			const res = await login(payload);
			const actualRole = res?.data?.user?.role || 'student';
			
			try {
				localStorage.setItem('preferredRole', actualRole);
			} catch {}

			const dashboard = actualRole === 'teacher' ? '/teacher' : '/student';
			navigate(returnTo || dashboard, { replace: true });
		} catch (err) {
			const status = err?.response?.status || err?.status;
			const message = err?.response?.data?.message || err?.message || 'Login failed';

			if (status === 401) {
				setGlobalError('Incorrect username/email or password.');
			} else {
				setGlobalError(message);
			}
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="auth-split-container">
			{/* Left Side: Form */}
			<div className="auth-form-section">
				<button
					className="auth-theme-toggle"
					onClick={toggleTheme}
					title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				>
					{theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
				</button>

				<div className="auth-form-container">
					<div className="auth-header">
						<div className="auth-header-icon">
							<LogIn size={24} />
						</div>
						<h1 className="auth-title">Welcome back</h1>
						<p className="auth-subtitle">Log in to your account to continue</p>
					</div>

					{globalError && (
						<div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
							<AlertCircle size={20} className="mt-0.5 shrink-0" />
							<p className="text-sm font-medium">{globalError}</p>
						</div>
					)}

					<form className="auth-form" onSubmit={handleSubmit}>
						<div className="form-group">
							<label className="form-label" htmlFor="identifier">
								Username or Email
							</label>
							<div className="form-input-wrapper">
								<Mail size={18} className="form-input-icon" />
								<input
									id="identifier"
									type="text"
									className={`form-input ${errors.identifier ? 'has-error' : ''}`}
									placeholder="e.g. alex.m or student@school.edu"
									value={identifier}
									onChange={e => handleInputChange('identifier', e.target.value, setIdentifier)}
									autoFocus
								/>
							</div>
							{errors.identifier && (
								<div className="inline-error">
									<AlertCircle size={14} />
									{errors.identifier}
								</div>
							)}
						</div>

						<div className="form-group">
							<div className="flex items-center justify-between">
								<label className="form-label" htmlFor="password">
									Password
								</label>
								<Link
									to="/auth/forgot-password"
									className="text-xs font-medium text-primary hover:underline"
								>
									Forgot password?
								</Link>
							</div>
							<div className="form-input-wrapper">
								<Lock size={18} className="form-input-icon" />
								<input
									id="password"
									type={showPassword ? 'text' : 'password'}
									className={`form-input ${errors.password ? 'has-error' : ''}`}
									placeholder="Enter your password"
									value={password}
									onChange={e => handleInputChange('password', e.target.value, setPassword)}
								/>
								<button
									type="button"
									className="password-toggle"
									onClick={() => setShowPassword(!showPassword)}
									title={showPassword ? 'Hide password' : 'Show password'}
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							{errors.password && (
								<div className="inline-error">
									<AlertCircle size={14} />
									{errors.password}
								</div>
							)}
						</div>

						<button type="submit" className="auth-submit-btn mt-2" disabled={loading}>
							{loading ? (
								<Loader2 className="h-5 w-5 animate-spin" />
							) : (
								'Log In'
							)}
						</button>
					</form>

					<p className="auth-footer">
						Don't have an account?
						<Link to="/signup" className="auth-link">
							Sign up
						</Link>
					</p>
				</div>
			</div>

			{/* Right Side: Visual */}
			<div className="auth-visual-section">
				<div className="auth-visual-blob auth-visual-blob-1" />
				<div className="auth-visual-blob auth-visual-blob-2" />
				
				<div className="auth-visual-content">
					<img 
						src={heroImage} 
						alt="Platform Preview" 
						className="auth-visual-image"
					/>
					<h2 className="auth-visual-title">Evaluate Exams with AI</h2>
					<p className="auth-visual-subtitle">
						The most advanced platform for automated grading, instant feedback, and seamless classroom management.
					</p>
				</div>
			</div>
		</div>
	);
}
