import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import { safeApiCall, getTeacherIssues } from '../services/teacherServices.js';
import { API_BASE_URL } from '../services/api.js';

const SIDEBAR_WIDTH = 280;
const MOBILE_BREAKPOINT = 1024;

// Improved, robust Teacher dashboard shell with accessible responsive sidebar and safer window checks
const TeacherDash = () => {
	const location = useLocation();
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const isClient = typeof window !== 'undefined';
	const initialIsMobile = isClient ? window.innerWidth < MOBILE_BREAKPOINT : false;

	const [isMobile, setIsMobile] = useState(initialIsMobile);
	const [sidebarOpen, setSidebarOpen] = useState(!initialIsMobile); // open on desktop, closed on mobile
	const [loggingOutFooter, setLoggingOutFooter] = useState(false);
	const [openIssuesCount, setOpenIssuesCount] = useState(0);

	// Keep sidebar state reasonable on resize but avoid forcing close on every route change
	useEffect(() => {
		if (!isClient) return;
		let raf;
		const onResize = () => {
			raf && cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const mobile = window.innerWidth < MOBILE_BREAKPOINT;
				setIsMobile(mobile);
				// auto-open on desktop, auto-close on mobile only if user hasn't explicitly toggled
				setSidebarOpen(prev => (mobile ? false : true));
			});
		};
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			raf && cancelAnimationFrame(raf);
		};
	}, [isClient]);

	// Close mobile sidebar on route change to avoid covering content
	useEffect(() => {
		if (isMobile) setSidebarOpen(false);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [location.pathname]);

	// Fetch open issues count and subscribe to real-time updates
	useEffect(() => {
		let mounted = true;
		const fetchOpenIssues = async () => {
			try {
				const issues = await safeApiCall(getTeacherIssues, { status: 'open' });
				if (!mounted) return;
				setOpenIssuesCount(Array.isArray(issues) ? issues.length : 0);
			} catch (err) {
				// keep silent; UI will show zero
				console.error('Failed to fetch open issues count:', err);
			}
		};
		fetchOpenIssues();

		if (!user?.id) return () => (mounted = false);

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});

		socket.on('new-issue', newIssue => {
			if (newIssue?.status === 'open') setOpenIssuesCount(c => c + 1);
		});

		socket.on('issue-update', ({ issue, oldStatus }) => {
			if (!issue) return;
			if (issue.status === 'open' && oldStatus !== 'open') setOpenIssuesCount(c => c + 1);
			if (issue.status !== 'open' && oldStatus === 'open')
				setOpenIssuesCount(c => Math.max(0, c - 1));
		});

		socket.on('issue-deleted', () => {
			// safe fallback: refetch
			fetchOpenIssues();
		});

		return () => {
			mounted = false;
			socket.disconnect();
		};
	}, [user]);

	const handleLogout = useCallback(async () => {
		if (loggingOutFooter) return;
		setLoggingOutFooter(true);
		try {
			await Promise.resolve(logout?.());
		} catch (err) {
			console.error('Logout failed', err);
		} finally {
			setLoggingOutFooter(false);
		}
	}, [logout, loggingOutFooter]);

	// header and footer moved to useMemo for performance
	const headerEl = useMemo(
		() => (
			<div style={headerStyles.container}>
				<div style={headerStyles.logo}>👨‍🏫</div>
				<div style={headerStyles.titleArea}>
					<strong style={headerStyles.title}>Teacher Portal</strong>
					<small style={headerStyles.subtitle}>Create • Manage • Evaluate</small>
				</div>
			</div>
		),
		[],
	);

	const footerEl = useMemo(
		() => (
			<div style={footerStyles.container}>
				<div style={footerStyles.profileRow}>
					<div style={footerStyles.avatar}>
						{user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'T'}
					</div>
					<div style={footerStyles.profileInfo}>
						<div
							style={footerStyles.profileName}
							title={user?.fullname || user?.username}
						>
							{user?.fullname || user?.username || 'Teacher'}
						</div>
						<div style={footerStyles.profileDept}>{user?.department || '—'}</div>
					</div>
				</div>
				<button
					onClick={handleLogout}
					aria-busy={loggingOutFooter}
					disabled={loggingOutFooter}
					style={{
						...footerStyles.logoutBtn,
						opacity: loggingOutFooter ? 0.7 : 1,
						cursor: loggingOutFooter ? 'wait' : 'pointer',
					}}
				>
					{loggingOutFooter ? 'Logging out…' : '🚪 Logout'}
				</button>
			</div>
		),
		[user, handleLogout, loggingOutFooter],
	);

	const items = useMemo(
		() => [
			{ key: 'home', label: 'Overview', icon: '📊', to: '/teacher', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/teacher/exams' },
			{ key: 'results', label: 'Submissions', icon: '📋', to: '/teacher/results' },
			{
				key: 'issues',
				label: 'Issues',
				icon: '🛠️',
				to: '/teacher/issues',
				badge: openIssuesCount || undefined,
			},
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/teacher/settings' },
		],
		[openIssuesCount],
	);

	return (
		<>
			{/* Mobile sidebar as overlay */}
			{isMobile && (
				<ErrorBoundary>
					<Sidebar
						header={headerEl}
						footer={footerEl}
						width={SIDEBAR_WIDTH}
						theme={theme}
						items={items}
						collapsible={false}
						expanded={sidebarOpen}
						onToggle={setSidebarOpen}
						mobileBreakpoint={MOBILE_BREAKPOINT}
						overlay={true}
					/>
				</ErrorBoundary>
			)}

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : `${SIDEBAR_WIDTH}px 1fr`,
					minHeight: '100vh',
					background:
						theme === 'dark'
							? 'radial-gradient(ellipse at top left, rgba(59,130,246,0.04) 0%, transparent 50%), var(--bg)'
							: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.06) 0%, transparent 50%), var(--bg)',
				}}
			>
				{/* Desktop Sidebar */}
				{!isMobile && (
					<ErrorBoundary>
						<aside
							style={{
								width: SIDEBAR_WIDTH,
								position: 'sticky',
								top: 0,
								height: '100vh',
								padding: 16,
							}}
						>
							<Sidebar
								header={headerEl}
								footer={footerEl}
								width={SIDEBAR_WIDTH}
								theme={theme}
								items={items}
								collapsible={false}
								expanded={true}
							/>
						</aside>
					</ErrorBoundary>
				)}

				{/* Main Content */}
				<div style={{ padding: isMobile ? 12 : 18, minWidth: 0 }}>
					<section
						style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 12,
							minHeight: 'calc(100vh - 32px)',
							boxShadow: 'var(--shadow-sm)',
							display: 'flex',
							flexDirection: 'column',
						}}
					>
						{/* Mobile toolbar */}
						{isMobile && (
							<div style={mobileToolbarStyles.container}>
								<button
									onClick={() => setSidebarOpen(true)}
									aria-label="Open menu"
									style={mobileToolbarStyles.menuBtn}
								>
									☰ Menu
								</button>
								<div style={mobileToolbarStyles.date}>
									{new Date().toLocaleDateString()}
								</div>
							</div>
						)}

						<div
							style={{
								padding: isMobile ? 12 : 18,
								flexGrow: 1,
								overflowY: 'auto',
								minHeight: 0,
							}}
						>
							<ErrorBoundary>
								<Suspense fallback={<RouteFallback message="Loading page…" />}>
									<Outlet />
								</Suspense>
							</ErrorBoundary>
						</div>
					</section>
				</div>
			</div>
		</>
	);
};

/* Styles (kept local and simple for maintainability) */
const headerStyles = {
	container: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
	},
	logo: {
		width: 40,
		height: 40,
		borderRadius: 10,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
		color: '#fff',
		fontSize: 18,
	},
	titleArea: { display: 'flex', flexDirection: 'column', lineHeight: 1.05, minWidth: 0 },
	title: {
		fontSize: 13,
		fontWeight: 800,
		background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
	},
	subtitle: { fontSize: 11, color: 'var(--text-muted)' },
};

const footerStyles = {
	container: { display: 'flex', flexDirection: 'column', gap: 12, width: '100%' },
	profileRow: { display: 'flex', gap: 12, alignItems: 'center' },
	avatar: {
		width: 36,
		height: 36,
		borderRadius: 8,
		background: 'linear-gradient(135deg,#10b981,#059669)',
		color: '#fff',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 800,
	},
	profileInfo: { minWidth: 0 },
	profileName: {
		fontWeight: 700,
		fontSize: 12,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	profileDept: { fontSize: 11, color: 'var(--text-muted)' },
	logoutBtn: {
		width: '100%',
		padding: '8px 12px',
		borderRadius: 10,
		border: 'none',
		background: 'linear-gradient(135deg,#ef4444,#dc2626)',
		color: '#fff',
		fontSize: 13,
		fontWeight: 700,
	},
};

const mobileToolbarStyles = {
	container: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '10px 12px',
		borderBottom: '1px solid var(--border)',
	},
	menuBtn: {
		padding: '8px 12px',
		borderRadius: 10,
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		cursor: 'pointer',
	},
	date: { color: 'var(--text-muted)', fontSize: 12 },
};

export default TeacherDash;
