import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';

const StudentDash = () => {
	const { theme } = useTheme();

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<img
					src="/logo192.png"
					alt="Student Portal"
					onError={e => {
						e.currentTarget.onerror = null;
						e.currentTarget.src = '/logo512.png';
					}}
					style={{
						width: 36,
						height: 36,
						borderRadius: 12,
						objectFit: 'cover',
						border: '2px solid rgba(59,130,246,0.2)',
					}}
				/>
				<div style={{ display: 'grid', lineHeight: 1.2 }}>
					<div
						style={{
							fontWeight: 800,
							letterSpacing: 0.2,
							fontSize: '0.95rem',
							color: 'var(--text)',
						}}
					>
						Student Portal
					</div>
					<span
						style={{
							fontSize: 11,
							color: 'var(--text-muted)',
							opacity: 0.8,
						}}
					>
						Your exams and results
					</span>
				</div>
			</div>
		),
		[],
	);

	const items = React.useMemo(
		() => [
			{ key: 'home', label: 'Overview', icon: '📊', to: '/student', end: true },
			{ key: 'exams', label: 'Available Exams', icon: '📝', to: '/student/exams' },
			{ key: 'results', label: 'Results', icon: '📋', to: '/student/results' },
			{ key: 'issues', label: 'Support', icon: '🛠️', to: '/student/issues' },
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/student/settings' },
		],
		[],
	);

	return (
		<div
			style={{
				background:
					theme === 'dark'
						? 'radial-gradient(1200px 400px at 50% -5%, rgba(59,130,246,0.08), transparent 40%), var(--bg)'
						: 'radial-gradient(1200px 400px at 50% -5%, rgba(16,185,129,0.10), transparent 40%), var(--bg)',
				color: 'var(--text)',
				minHeight: '100vh',
				display: 'flex',
			}}
		>
			<Sidebar
				header={headerEl}
				width={280}
				collapsedWidth={72}
				theme={theme}
				items={items}
				aria-label="Student navigation"
			/>
			<main
				style={{
					flex: 1,
					padding: '24px 32px',
					marginLeft: '280px',
					minHeight: '100vh',
					transition: 'margin-left 0.3s ease',
				}}
			>
				<ErrorBoundary>
					<Suspense fallback={<RouteFallback />}>
						<Outlet />
					</Suspense>
				</ErrorBoundary>
			</main>
		</div>
	);
};

export default StudentDash;
