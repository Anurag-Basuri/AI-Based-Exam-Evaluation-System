import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import { useTheme } from '../hooks/useTheme.js';

const StudentDash = () => {
	const { theme } = useTheme();

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
				<img
					src="/logo192.png"
					alt="Student"
					onError={e => {
						e.currentTarget.onerror = null;
						e.currentTarget.src = '/logo512.png';
					}}
					style={{ width: 34, height: 34, borderRadius: 10 }}
				/>
				<div style={{ display: 'grid', lineHeight: 1 }}>
					<div style={{ fontWeight: 900, letterSpacing: 0.3 }}>Student Portal</div>
					<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
						Your exams and results
					</span>
				</div>
			</div>
		),
		[],
	);

	return (
		<div
			style={{
				background:
					theme === 'dark'
						? 'radial-gradient(900px 300px at 80% -10%, rgba(2,132,199,0.08), transparent 45%), var(--bg)'
						: 'radial-gradient(900px 300px at 80% -10%, rgba(99,102,241,0.12), transparent 45%), var(--bg)',
				color: 'var(--text)',
				minHeight: '100vh',
			}}
		>
			<Sidebar
				useOutlet
				header={headerEl}
				width={268}
				collapsedWidth={80}
				theme={theme}
				items={[
					{ key: 'home', label: 'Overview', icon: '📋', to: '.' },
					{ key: 'exams', label: 'Exams', icon: '📝', to: 'exams' },
					{ key: 'results', label: 'Results', icon: '📊', to: 'results' },
					{ key: 'issues', label: 'Issues', icon: '🛠️', to: 'issues' },
					{ key: 'settings', label: 'Settings', icon: '⚙️', to: 'settings' },
				]}
			/>
			<div style={{ padding: 16 }}>
				<ErrorBoundary>
					<Outlet />
				</ErrorBoundary>
			</div>
		</div>
	);
};

export default StudentDash;
