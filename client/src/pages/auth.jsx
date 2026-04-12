import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Login from '../components/Login';
import Register from '../components/Register';
import { useTheme } from '../hooks/useTheme.js';
import './Auth.css'; // New centralized CSS

const AuthPage = () => {
	const location = useLocation();
	const navigate = useNavigate();

	// Read mode from URL (?mode=login|register). Also accept legacy ?auth=
	const getModeFromSearch = search => {
		const sp = new URLSearchParams(search);
		const raw = (sp.get('mode') || sp.get('auth') || '').toLowerCase();
		return raw === 'register' ? 'register' : 'login';
	};

	const [isRegister, setIsRegister] = useState(() => getModeFromSearch(location.search) === 'register');

	useEffect(() => {
		const mode = getModeFromSearch(location.search);
		const shouldRegister = mode === 'register';
		setIsRegister(prev => (prev !== shouldRegister ? shouldRegister : prev));
	}, [location.search]);

	const setUrlMode = (mode, { replace = false } = {}) => {
		const sp = new URLSearchParams(location.search);
		sp.set('mode', mode);
		navigate({ pathname: location.pathname, search: `?${sp.toString()}` }, { replace });
	};

	const handleSwitchToRegister = () => setUrlMode('register');
	const handleSwitchToLogin = () => setUrlMode('login');

	const { theme, toggleTheme } = useTheme();

	return (
		<div className="auth-page">
			{/* Theme Toggle */}
			<button
				className="auth-theme-toggle"
				onClick={toggleTheme}
				title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				aria-label="Toggle theme"
			>
				<span aria-hidden>{theme === 'light' ? '🌞' : '🌙'}</span>
				{theme === 'light' ? 'Light' : 'Dark'}
			</button>

			{/* Background Layers */}
			<div className="auth-bg-layer" />
			<div className="auth-blob auth-blob-1" />
			<div className="auth-blob auth-blob-2" />

			{/* Glass Card Container */}
			<div className="auth-glass-card">
				{/* Toggle Switch */}
				<div className="auth-toggle-pill" role="tablist" aria-label="Authentication mode">
					<button
						type="button"
						role="tab"
						aria-selected={!isRegister}
						onClick={handleSwitchToLogin}
						className={`auth-toggle-btn login ${!isRegister ? 'active' : ''}`}
					>
						<span aria-hidden style={{ marginRight: 6 }}>🔑</span> Login
					</button>
					<button
						type="button"
						role="tab"
						aria-selected={isRegister}
						onClick={handleSwitchToRegister}
						className={`auth-toggle-btn register ${isRegister ? 'active' : ''}`}
					>
						<span aria-hidden style={{ marginRight: 6 }}>✨</span> Register
					</button>
				</div>

				{/* Form Component */}
				{!isRegister ? (
					<Login onSwitchToRegister={handleSwitchToRegister} />
				) : (
					<Register onSwitchToLogin={handleSwitchToLogin} />
				)}
			</div>
		</div>
	);
};

export default AuthPage;
