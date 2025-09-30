import React from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header';
import { useTheme } from './hooks/useTheme.js';

const App = () => {
	const { theme, toggleTheme } = useTheme();
	const location = useLocation();
	const isAuthPage = location.pathname.toLowerCase().startsWith('/auth');

	return (
		<div className="app-shell" style={{ minHeight: '100vh' }}>
			{!isAuthPage && <Header />}

			<main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<AppRoutes />
			</main>

			{/* Global theme toggle (visible on all pages) */}
			<button
				type="button"
				onClick={toggleTheme}
				title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				aria-label="Toggle theme"
				style={{
					position: 'fixed',
					right: 16,
					bottom: 16,
					padding: '10px 14px',
					borderRadius: 999,
					border: '1px solid var(--border, rgba(0,0,0,0.12))',
					background: 'var(--surface, #fff)',
					color: 'var(--text, #111827)',
					fontWeight: 700,
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
					cursor: 'pointer',
					zIndex: 1000,
				}}
			>
				<span aria-hidden>{theme === 'light' ? '🌞' : '🌙'}</span>
				{theme === 'light' ? 'Light' : 'Dark'}
			</button>
		</div>
	);
};

export default App;
