import React from 'react';
// import { Outlet } from 'react-router-dom'; // removed unused import
import Sidebar from '../components/Sidebar.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import { safeApiCall, getTeacherIssues } from '../services/teacherServices.js';

const SidebarHeader = () => (
	<div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
		<div
			style={{
				width: 48,
				height: 48,
				borderRadius: 16,
				background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				boxShadow: '0 8px 20px rgba(59,130,246,0.3)',
			}}
		>
			<span style={{ fontSize: '20px' }}>👨‍🏫</span>
		</div>
		<div style={{ display: 'grid', lineHeight: 1.3 }}>
			<div
				style={{
					fontWeight: 800,
					letterSpacing: 0.3,
					fontSize: '16px',
					color: 'var(--text)',
				}}
			>
				Teacher Portal
			</div>
			<span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
				Create • Manage • Evaluate
			</span>
		</div>
	</div>
);

const SidebarFooter = ({ user, onLogout /* theme not used */ }) => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
		<div
			style={{
				padding: '12px 16px',
				borderRadius: 12,
				background: 'var(--surface)',
				border: '1px solid var(--border)',
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
					background: 'linear-gradient(135deg, #10b981, #059669)',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					fontSize: '16px',
					color: '#fff',
				}}
			>
				{user?.fullname?.charAt(0) || 'T'}
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
					{user?.fullname || user?.username || 'Teacher'}
				</div>
				<div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
					{user?.department || 'Department'}
				</div>
			</div>
		</div>
		<button
			onClick={onLogout}
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
				boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
			}}
		>
			🚪 Logout
		</button>
	</div>
);

const TeacherDash = () => {
	const { theme } = useTheme();
	const { user, logout } = useAuth();
	const [openIssuesCount, setOpenIssuesCount] = React.useState(0);

	React.useEffect(() => {
		const fetchOpenIssues = async () => {
			try {
				const issues = await safeApiCall(getTeacherIssues, { status: 'open' });
				setOpenIssuesCount(Array.isArray(issues) ? issues.length : 0);
			} catch (error) {
				console.error('Failed to fetch open issues count:', error);
			}
		};
		fetchOpenIssues();
		const interval = setInterval(fetchOpenIssues, 60000); // Refresh every minute
		return () => clearInterval(interval);
	}, []);

	const items = React.useMemo(
		() => [
			{ key: 'home', label: 'Overview', icon: '📊', to: '/teacher', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/teacher/exams' },
			{ key: 'results', label: 'Submissions', icon: '📋', to: '/teacher/results' },
			{
				key: 'issues',
				label: 'Issues',
				icon: '🛠️',
				to: '/teacher/issues',
				badge: openIssuesCount > 0 ? openIssuesCount : undefined,
			},
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/teacher/settings' },
		],
		[openIssuesCount],
	);

	return (
		<Sidebar
			header={<SidebarHeader />}
			footer={<SidebarFooter user={user} onLogout={logout} theme={theme} />}
			width={280}
			collapsedWidth={80}
			theme={theme}
			items={items}
			useOutlet={true}
			contentStyle={{ background: 'var(--bg)' }}
		/>
	);
};

export default TeacherDash;
