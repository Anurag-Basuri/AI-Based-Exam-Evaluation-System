import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';

const TeacherDash = () => {
	const { theme } = useTheme();

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<img
					src="/logo192.png"
					alt="Teacher Portal"
					onError={e => {
						e.currentTarget.onerror = null;
						e.currentTarget.src = '/logo512.png';
					}}
					style={{
						width: 36,
						height: 36,
						borderRadius: 12,
						objectFit: 'cover',
						border: '2px solid rgba(255,255,255,0.2)',
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
						Teacher Portal
					</div>
					<span
						style={{
							fontSize: 11,
							color: 'var(--text-muted)',
							opacity: 0.8,
						}}
					>
						Create, manage, evaluate
					</span>
				</div>
			</div>
		),
		[],
	);

	const items = React.useMemo(
		() => [
			{ key: 'home', label: 'Overview', icon: '📊', to: '/teacher', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/teacher/exams' },
			{ key: 'results', label: 'Submissions', icon: '📋', to: '/teacher/results' },
			{ key: 'issues', label: 'Issues', icon: '🛠️', to: '/teacher/issues' },
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/teacher/settings' },
		],
		[],
	);

	return (
		<div
			style={{
				background:
					theme === 'dark'
						? 'radial-gradient(1200px 400px at 50% -5%, rgba(20,184,166,0.08), transparent 40%), var(--bg)'
						: 'radial-gradient(1200px 400px at 50% -5%, rgba(14,165,233,0.10), transparent 40%), var(--bg)',
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
				aria-label="Teacher navigation"
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

export default TeacherDash;
