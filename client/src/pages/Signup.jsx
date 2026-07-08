import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams, Link } from 'react-router-dom';
import { 
	UserPlus, 
	Mail, 
	Lock, 
	User, 
	GraduationCap, 
	Presentation,
	Eye, 
	EyeOff, 
	AlertCircle, 
	Loader2, 
	Moon, 
	Sun 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import { pingBackendHealth } from '../services/api.js';
import heroImage from '../assets/hero_3.png'; // Make sure this asset exists
import './Auth.css';

export default function Signup() {
	const navigate = useNavigate();
	const location = useLocation();
	const [searchParams] = useSearchParams();
	const returnTo = searchParams.get('redirect') || location?.state?.from || null;

	const { register } = useAuth();
	const { theme, toggleTheme } = useTheme();

	const [role, setRole] = useState('student');
	const [formData, setFormData] = useState({
		fullname: '',
		email: '',
		username: '',
		password: '',
	});
	const [showPassword, setShowPassword] = useState(false);
	const [loading, setLoading] = useState(false);

	const [errors, setErrors] = useState({});
	const [globalError, setGlobalError] = useState('');

	useEffect(() => {
		pingBackendHealth();
	}, []);

	const handleInputChange = (e) => {
		const { name, value } = e.target;
		setFormData(prev => ({ ...prev, [name]: value }));
		
		if (errors[name]) {
			setErrors(prev => ({ ...prev, [name]: null }));
		}
		if (globalError) setGlobalError('');
	};

	const validate = () => {
		const newErrors = {};
		
		if (!formData.fullname.trim()) newErrors.fullname = 'Full name is required.';
		
		const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!formData.email.trim()) {
			newErrors.email = 'Email is required.';
		} else if (!emailPattern.test(formData.email)) {
			newErrors.email = 'Please enter a valid email address.';
		}

		const usernamePattern = /^[a-zA-Z0-9_]{3,20}$/;
		if (!formData.username.trim()) {
			newErrors.username = 'Username is required.';
		} else if (!usernamePattern.test(formData.username)) {
			newErrors.username = '3-20 chars, alphanumeric or underscores only.';
		}

		if (!formData.password) {
			newErrors.password = 'Password is required.';
		} else if (formData.password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters.';
		}

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
			await register({ ...formData, role });
			navigate('/auth/verify-email', {
				state: { email: formData.email, type: 'register' },
			});
		} catch (err) {
			const status = err?.response?.status || err?.status;
			const message = err?.response?.data?.message || err?.message || 'Registration failed';

			if (status === 409 && message.toLowerCase().includes('email')) {
				setErrors(prev => ({ ...prev, email: 'This email is already in use.' }));
			} else if (status === 409 && message.toLowerCase().includes('username')) {
				setErrors(prev => ({ ...prev, username: 'This username is already taken.' }));
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

				<div className="auth-form-container" style={{ maxWidth: '480px' }}>
					<div className="auth-header">
						<div className="auth-header-icon">
							<UserPlus size={24} />
						</div>
						<h1 className="auth-title">Create an account</h1>
						<p className="auth-subtitle">Join the platform to start {role === 'teacher' ? 'evaluating' : 'taking'} exams</p>
					</div>

					{globalError && (
						<div className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-400">
							<AlertCircle size={20} className="mt-0.5 shrink-0" />
							<p className="text-sm font-medium">{globalError}</p>
						</div>
					)}

					<form className="auth-form" onSubmit={handleSubmit}>
						{/* Role Selection */}
						<div className="role-selector">
							<div 
								className={`role-card ${role === 'student' ? 'selected' : ''}`}
								onClick={() => setRole('student')}
							>
								<div className="role-card-icon">
									<GraduationCap size={18} />
								</div>
								<div className="role-card-info">
									<span className="role-card-title">Student</span>
									<span className="role-card-desc">Take exams</span>
								</div>
							</div>
							
							<div 
								className={`role-card ${role === 'teacher' ? 'selected' : ''}`}
								onClick={() => setRole('teacher')}
							>
								<div className="role-card-icon">
									<Presentation size={18} />
								</div>
								<div className="role-card-info">
									<span className="role-card-title">Teacher</span>
									<span className="role-card-desc">Create exams</span>
								</div>
							</div>
						</div>

						<div className="form-group">
							<label className="form-label" htmlFor="fullname">
								Full Name
							</label>
							<div className="form-input-wrapper">
								<User size={18} className="form-input-icon" />
								<input
									id="fullname"
									name="fullname"
									type="text"
									className={`form-input ${errors.fullname ? 'has-error' : ''}`}
									placeholder="John Doe"
									value={formData.fullname}
									onChange={handleInputChange}
								/>
							</div>
							{errors.fullname && (
								<div className="inline-error">
									<AlertCircle size={14} />
									{errors.fullname}
								</div>
							)}
						</div>

						<div className="form-group">
							<label className="form-label" htmlFor="email">
								Email Address
							</label>
							<div className="form-input-wrapper">
								<Mail size={18} className="form-input-icon" />
								<input
									id="email"
									name="email"
									type="email"
									className={`form-input ${errors.email ? 'has-error' : ''}`}
									placeholder="john@example.com"
									value={formData.email}
									onChange={handleInputChange}
								/>
							</div>
							{errors.email && (
								<div className="inline-error">
									<AlertCircle size={14} />
									{errors.email}
								</div>
							)}
						</div>

						<div className="form-group">
							<label className="form-label" htmlFor="username">
								Username
							</label>
							<div className="form-input-wrapper">
								<span className="form-input-icon font-medium text-gray-400">@</span>
								<input
									id="username"
									name="username"
									type="text"
									className={`form-input ${errors.username ? 'has-error' : ''}`}
									placeholder="johndoe123"
									value={formData.username}
									onChange={handleInputChange}
								/>
							</div>
							{errors.username && (
								<div className="inline-error">
									<AlertCircle size={14} />
									{errors.username}
								</div>
							)}
						</div>

						<div className="form-group">
							<label className="form-label" htmlFor="password">
								Password
							</label>
							<div className="form-input-wrapper">
								<Lock size={18} className="form-input-icon" />
								<input
									id="password"
									name="password"
									type={showPassword ? 'text' : 'password'}
									className={`form-input ${errors.password ? 'has-error' : ''}`}
									placeholder="At least 6 characters"
									value={formData.password}
									onChange={handleInputChange}
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
								'Create Account'
							)}
						</button>
					</form>

					<p className="auth-footer">
						Already have an account?
						<Link to="/login" className="auth-link">
							Log in
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
					<h2 className="auth-visual-title">Start your journey today</h2>
					<p className="auth-visual-subtitle">
						Join thousands of students and teachers who are transforming education through intelligent evaluation.
					</p>
				</div>
			</div>
		</div>
	);
}
