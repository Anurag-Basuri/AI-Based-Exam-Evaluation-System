import React from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header';
import { useTheme } from './hooks/useTheme.js';

const App = () => {
	const { theme } = useTheme();
	const location = useLocation();
	const isAuthPage = location.pathname.toLowerCase().startsWith('/auth');
	const isLanding = location.pathname === '/';

	return (
		<div
			className="app-shell"
			style={{
				minHeight: '100vh',
				background: 'var(--bg)',
				color: 'var(--text)',
			}}
		>
			{!isAuthPage && <Header transparent={isLanding} />}
			<main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<AppRoutes />
			</main>
		</div>
	);
};

export default App;
