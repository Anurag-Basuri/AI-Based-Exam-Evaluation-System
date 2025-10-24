import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import { safeApiCall, getTeacherIssues } from '../services/teacherServices.js';

const SIDEBAR_WIDTH = 280;
const MOBILE_BREAKPOINT = 1024;

const TeacherDash = () => {
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const [isMobile, setIsMobile] = React.useState(
		typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
	);
	const [sidebarOpen, setSidebarOpen] = React.useState(false);
	const [loggingOutFooter, setLoggingOutFooter] = React.useState(false);
	const [openIssuesCount, setOpenIssuesCount] = React.useState(0);

	React.useEffect(() => {
		const onResize = () => {
			const mobile = window.innerWidth < MOBILE_BREAKPOINT;
			setIsMobile(mobile);
			if (!mobile) setSidebarOpen(true);
			else setSidebarOpen(false);
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

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
		const interval = setInterval(fetchOpenIssues, 60000);
		return () => clearInterval(interval);
	}, []);

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
				<div
					style={{
						width: 32,
						height: 32,
						borderRadius: 10,
						background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						border: '2px solid rgba(59,130,246,0.25)',
						boxShadow: '0 4px 10px rgba(59,130,246,0.25)',
					}}
				>
					<span style={{ fontSize: 16 }}>👨‍🏫</span>
				</div>
				<div style={{ display: 'grid', lineHeight: 1.15, minWidth: 0 }}>
					<strong
						style={{
							letterSpacing: 0.3,
							fontSize: 13,
							background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Teacher Portal
					</strong>
					<span
						style={{
							fontSize: 11,
							color: 'var(--text-muted)',
							opacity: 0.9,
							whiteSpace: 'nowrap',
							overflow: 'hidden',
							textOverflow: 'ellipsis',
						}}
					>
						Create • Manage • Evaluate
					</span>
				</div>
			</div>
		),
		[],
	);

	const footerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
				<div
					style={{
						padding: '10px 12px',
						borderRadius: 12,
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						display: 'flex',
						alignItems: 'center',
						gap: 10,
					}}
				>
					<div
						style={{
							width: 32,
							height: 32,
							borderRadius: 8,
							background: 'linear-gradient(135deg, #10b981, #059669)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 16,
							color: '#fff',
							fontWeight: 800,
						}}
					>
						{user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'T'}
					</div>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								fontWeight: 700,
								fontSize: 12,
								color: 'var(--text)',
								overflow: 'hidden',
								textOverflow: 'ellipsis',
								whiteSpace: 'nowrap',
							}}
							title={user?.fullname || user?.username || 'Teacher'}
						>
							{user?.fullname || user?.username || 'Teacher'}
						</div>
						<div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
							{user?.department || 'Department'}
						</div>
					</div>
				</div>

				<button
					onClick={async () => {
						if (loggingOutFooter) return;
						setLoggingOutFooter(true);
						try {
							await Promise.resolve(logout?.());
						} finally {
							setLoggingOutFooter(false);
						}
					}}
					style={{
						width: '100%',
						padding: '10px 14px',
						borderRadius: 10,
						border: '1px solid color-mix(in srgb, #dc2626 85%, transparent)',
						background: 'linear-gradient(135deg, #ef4444, #dc2626)',
						color: '#ffffff',
						fontSize: 13,
						fontWeight: 800,
						cursor: 'pointer',
						transition: 'transform 0.15s ease, filter 0.15s ease',
						opacity: loggingOutFooter ? 0.8 : 1,
					}}
					onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
					onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
				>
					{loggingOutFooter ? 'Logging out…' : '🚪 Logout'}
				</button>
			</div>
		),
		[user, logout, loggingOutFooter],
	);

	const items = React.useMemo(
		() => [
			{ key: 'home', label: 'Overview', icon: '📊', to: '/teacher', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/teacher/exams' },
			// The `end` prop is important here to distinguish from the detail view
			{ key: 'results', label: 'Submissions', icon: '📋', to: '/teacher/results', end: true },
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
		<>
			{/* Mobile Drawer Sidebar */}
			{isMobile && (
				<ErrorBoundary>
					<Sidebar
						header={headerEl}
						footer={footerEl}
						width={SIDEBAR_WIDTH}
						collapsedWidth={SIDEBAR_WIDTH}
						theme={theme}
						items={items}
						collapsible={true}
						expanded={sidebarOpen}
						onToggle={setSidebarOpen}
						mobileBreakpoint={MOBILE_BREAKPOINT}
					/>
				</ErrorBoundary>
			)}

			{/* Desktop: sticky sidebar + content */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : `${SIDEBAR_WIDTH}px 1fr`,
					gap: 16,
					padding: 16,
					alignItems: 'start',
					minHeight: `calc(100dvh - var(--header-h, 64px))`,
					background:
						theme === 'dark'
							? 'radial-gradient(ellipse at top left, rgba(59,130,246,0.05) 0%, transparent 50%), var(--bg)'
							: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.06) 0%, transparent 50%), var(--bg)',
				}}
			>
				{!isMobile && (
					<ErrorBoundary>
						<aside style={{ width: SIDEBAR_WIDTH }}>
							<Sidebar
								header={headerEl}
								footer={footerEl}
								width={SIDEBAR_WIDTH}
								collapsedWidth={SIDEBAR_WIDTH}
								theme={theme}
								items={items}
								collapsible={true}
								expanded={true}
								mobileBreakpoint={MOBILE_BREAKPOINT}
							/>
						</aside>
					</ErrorBoundary>
				)}

				<section
					style={{
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						borderRadius: 14,
						padding: 16,
						minHeight: '60vh',
						boxShadow: 'var(--shadow-md)',
					}}
				>
					{/* Mobile toolbar */}
					{isMobile && (
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								marginBottom: 12,
								borderBottom: '1px solid var(--border)',
								paddingBottom: 10,
							}}
						>
							<button
								onClick={() => setSidebarOpen(true)}
								style={{
									padding: '8px 12px',
									borderRadius: 10,
									background: 'var(--bg)',
									color: 'var(--text)',
									border: '1px solid var(--border)',
									fontWeight: 800,
								}}
							>
								☰ Menu
							</button>
							<div
								style={{
									marginLeft: 'auto',
									color: 'var(--text-muted)',
									fontSize: 12,
								}}
							>
								{new Date().toLocaleDateString()}
							</div>
						</div>
					)}

					<ErrorBoundary>
						<Suspense fallback={<RouteFallback message="Loading page" />}>
							<Outlet />
						</Suspense>
					</ErrorBoundary>
				</section>
			</div>
		</>
	);
};

export default TeacherDash;
