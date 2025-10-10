import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';

const StudentDash = () => {
	const { theme } = useTheme();
	const { user, logout } = useAuth();
	const [sidebarError, setSidebarError] = React.useState(null);

	const handleSidebarError = React.useCallback(error => {
		console.error('Sidebar error:', error);
		setSidebarError(error);
	}, []);

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
				<div
					style={{
						width: 48,
						height: 48,
						borderRadius: 16,
						background: 'linear-gradient(135deg, #10b981, #059669)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					<div
						style={{
							position: 'absolute',
							top: '-50%',
							left: '-50%',
							width: '200%',
							height: '200%',
							background:
								'conic-gradient(from 0deg, transparent, rgba(255,255,255,0.2), transparent)',
							animation: 'spin 3s linear infinite',
						}}
					/>
					<span style={{ fontSize: '20px', zIndex: 1 }}>🎓</span>
				</div>
				<div style={{ display: 'grid', lineHeight: 1.3 }}>
					<div
						style={{
							fontWeight: 800,
							letterSpacing: 0.3,
							fontSize: '16px',
							background: 'linear-gradient(135deg, #059669, #3b82f6)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Student Portal
					</div>
					<span
						style={{
							fontSize: 12,
							color: 'var(--text-muted)',
							opacity: 0.8,
							fontWeight: 500,
						}}
					>
						Learn • Practice • Excel
					</span>
				</div>
			</div>
		),
		[],
	);

	const footerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
				<div
					style={{
						padding: '12px 16px',
						borderRadius: 12,
						background:
							theme === 'dark'
								? 'linear-gradient(135deg, rgba(30,41,59,0.8), rgba(51,65,85,0.6))'
								: 'linear-gradient(135deg, rgba(248,250,252,0.9), rgba(241,245,249,0.8))',
						border: `1px solid ${theme === 'dark' ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.1)'}`,
						display: 'flex',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<div
						style={{
							width: 36,
							height: 36,
							borderRadius: 10,
							background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: '16px',
						}}
					>
						👤
					</div>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								fontWeight: 700,
								fontSize: '13px',
								color: 'var(--text)',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
						>
							{user?.fullname || user?.username || 'Student'}
						</div>
						<div
							style={{
								fontSize: '11px',
								color: 'var(--text-muted)',
								opacity: 0.8,
							}}
						>
							{user?.department || 'Department'}
						</div>
					</div>
				</div>

				<button
					onClick={logout}
					style={{
						width: '100%',
						padding: '10px 16px',
						borderRadius: 10,
						border: 'none',
						background: 'linear-gradient(135deg, #ef4444, #dc2626)',
						color: '#ffffff',
						fontSize: '13px',
						fontWeight: 600,
						cursor: 'pointer',
						transition: 'all 0.2s ease',
						boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
					}}
					onMouseEnter={e => {
						e.target.style.transform = 'translateY(-1px)';
						e.target.style.boxShadow = '0 6px 16px rgba(239,68,68,0.4)';
					}}
					onMouseLeave={e => {
						e.target.style.transform = 'translateY(0)';
						e.target.style.boxShadow = '0 4px 12px rgba(239,68,68,0.3)';
					}}
				>
					🚪 Logout
				</button>
			</div>
		),
		[user, logout, theme],
	);

	const items = React.useMemo(
		() => [
			{ key: 'home', label: 'Dashboard', icon: '🏠', to: '/student', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/student/exams', badge: 2 },
			{ key: 'results', label: 'Results', icon: '📊', to: '/student/results' },
			{ key: 'issues', label: 'Support', icon: '🆘', to: '/student/issues' },
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/student/settings' },
		],
		[],
	);

	// Custom error fallback for sidebar
	const sidebarErrorFallback = React.useCallback(
		(error, reset) => (
			<div
				style={{
					width: 320,
					height: '100vh',
					background: 'var(--bg-secondary)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '20px',
					borderRight: '1px solid var(--border)',
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<div style={{ fontSize: '32px', marginBottom: '16px' }}>⚠️</div>
					<h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 700 }}>
						Navigation Error
					</h3>
					<p
						style={{
							margin: '0 0 16px 0',
							fontSize: '14px',
							color: 'var(--text-muted)',
						}}
					>
						Failed to load sidebar
					</p>
					<button
						onClick={reset}
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							border: '1px solid var(--border)',
							background: 'var(--bg)',
							color: 'var(--text)',
							cursor: 'pointer',
							fontSize: '12px',
							fontWeight: 600,
						}}
					>
						Try Again
					</button>
				</div>
			</div>
		),
		[],
	);

	return (
		<>
			{/* CSS animations */}
			<style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                
                @keyframes slideIn {
                    from { transform: translateX(-20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>

			{/* Wrap entire dashboard in error boundary */}
			<ErrorBoundary>
				{/* Sidebar with its own error handling */}
				<ErrorBoundary fallback={sidebarErrorFallback}>
					<Sidebar
						header={headerEl}
						footer={footerEl}
						width={320}
						collapsedWidth={80}
						theme={theme}
						items={items}
						useOutlet={true}
						style={{
							fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
						}}
						contentStyle={{
							background:
								theme === 'dark'
									? 'radial-gradient(ellipse at top left, rgba(16,185,129,0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(59,130,246,0.05) 0%, transparent 50%), #0f172a'
									: 'radial-gradient(ellipse at top left, rgba(16,185,129,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom right, rgba(59,130,246,0.08) 0%, transparent 50%), #ffffff',
						}}
					/>
				</ErrorBoundary>

				{/* Main content with error boundary and suspense */}
				<div
					style={{
						marginLeft: 320,
						minHeight: '100vh',
						padding: '32px',
						position: 'relative',
						animation: 'fadeIn 0.3s ease-in-out',
					}}
				>
					<ErrorBoundary>
						<Suspense
							fallback={
								<RouteFallback message="Loading page content" fullscreen={false} />
							}
						>
							<Outlet />
						</Suspense>
					</ErrorBoundary>
				</div>
			</ErrorBoundary>
		</>
	);
};

export default StudentDash;
