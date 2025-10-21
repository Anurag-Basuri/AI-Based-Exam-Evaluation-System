import React from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header';
import { useTheme } from './hooks/useTheme.js';
import { ToastProvider } from './components/ui/Toaster.jsx';

function App() {
	const { theme } = useTheme();
	const location = useLocation();
	const isAuthPage = location.pathname.toLowerCase().startsWith('/auth');
	const isLanding = location.pathname === '/';
	const isTakingExam = location.pathname.includes('/take'); // <-- Add this check

	return (
		<ToastProvider>
			<div
				className="app-shell"
				style={{
					minHeight: '100vh',
					background: 'var(--bg)',
					color: 'var(--text)',
				}}
			>
				{/* Hide header on auth, landing, and during an exam */}
				{!isAuthPage && !isTakingExam && <Header transparent={isLanding} />}
				<main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
					<AppRoutes />
				</main>
			</div>
		</ToastProvider>
	);
}

export default App;
