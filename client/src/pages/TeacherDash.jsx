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
import VerificationBanner from '../components/ui/VerificationBanner.jsx';
import './Dashboard.css';

const SIDEBAR_WIDTH = 280;
const MOBILE_BREAKPOINT = 1024;

const TeacherDash = () => {
	const location = useLocation();
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const isClient = typeof window !== 'undefined';
	const initialIsMobile = isClient ? window.innerWidth < MOBILE_BREAKPOINT : false;

	const [isMobile, setIsMobile] = useState(initialIsMobile);
	const [sidebarOpen, setSidebarOpen] = useState(!initialIsMobile);
	const [loggingOut, setLoggingOut] = useState(false);
	const [openIssuesCount, setOpenIssuesCount] = useState(0);

	// Throttled resize handler
	useEffect(() => {
		if (!isClient) return;
		let raf;
		const onResize = () => {
			raf && cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => {
				const mobile = window.innerWidth < MOBILE_BREAKPOINT;
				setIsMobile(mobile);
				setSidebarOpen(!mobile);
			});
		};
		window.addEventListener('resize', onResize);
		return () => {
			window.removeEventListener('resize', onResize);
			raf && cancelAnimationFrame(raf);
		};
	}, [isClient]);

	// Close mobile sidebar on route change
	useEffect(() => {
		if (isMobile) setSidebarOpen(false);
	}, [location.pathname]); // eslint-disable-line react-hooks/exhaustive-deps

	// Fetch open issues + real-time socket updates
	useEffect(() => {
		let mounted = true;
		const fetchOpenIssues = async () => {
			try {
				const issues = await safeApiCall(getTeacherIssues, { status: 'open' });
				if (!mounted) return;
				setOpenIssuesCount(Array.isArray(issues) ? issues.length : 0);
			} catch {
				// silent — UI will show zero
			}
		};
		fetchOpenIssues();

		if (!user?.id) return () => (mounted = false);

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});

		socket.on('new-issue', i => {
			if (i?.status === 'open') setOpenIssuesCount(c => c + 1);
		});
		socket.on('issue-update', ({ issue, oldStatus }) => {
			if (!issue) return;
			if (issue.status === 'open' && oldStatus !== 'open') setOpenIssuesCount(c => c + 1);
			if (issue.status !== 'open' && oldStatus === 'open') setOpenIssuesCount(c => Math.max(0, c - 1));
		});
		socket.on('issue-deleted', () => fetchOpenIssues());

		return () => {
			mounted = false;
			socket.disconnect();
		};
	}, [user]);

	const handleLogout = useCallback(async () => {
		if (loggingOut) return;
		setLoggingOut(true);
		try {
			await Promise.resolve(logout?.());
		} catch (err) {
			console.error('Logout failed', err);
		} finally {
			setLoggingOut(false);
		}
	}, [logout, loggingOut]);

	// ── Sidebar Header ──
	const headerEl = useMemo(
		() => (
			<div className="dash-sidebar-header">
				<div className="dash-sidebar-header-logo teacher">👨‍🏫</div>
				<div className="dash-sidebar-header-text">
					<strong>Teacher Portal</strong>
					<small>Create • Manage • Evaluate</small>
				</div>
			</div>
		),
		[],
	);

	// ── Sidebar Footer ──
	const footerEl = useMemo(
		() => (
			<div className="dash-sidebar-footer">
				<div className="dash-profile-row">
					<div className="dash-profile-avatar teacher">
						{user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'T'}
					</div>
					<div className="dash-profile-info">
						<div className="dash-profile-name" title={user?.fullname || user?.username}>
							{user?.fullname || user?.username || 'Teacher'}
						</div>
						<div className="dash-profile-dept">{user?.department || '—'}</div>
					</div>
				</div>
				<button
					className="dash-logout-btn"
					onClick={handleLogout}
					aria-busy={loggingOut}
					disabled={loggingOut}
				>
					{loggingOut ? (
						<><div className="dash-logout-spinner" /><span>Logging out…</span></>
					) : (
						<span>🚪 Logout</span>
					)}
				</button>
			</div>
		),
		[user, handleLogout, loggingOut],
	);

	// ── Navigation Items ──
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
			{/* Mobile sidebar overlay */}
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

			<div className="dash-shell">
				{/* Desktop sticky sidebar */}
				{!isMobile && (
					<ErrorBoundary>
						<aside className="dash-sidebar-col">
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
				<div className="dash-main-col">
					<section className="dash-content-card">
						{/* Mobile toolbar with menu button */}
						<div className="dash-mobile-toolbar">
							<button
								className="dash-menu-btn"
								onClick={() => setSidebarOpen(true)}
								aria-label="Open menu"
							>
								☰ Menu
							</button>
							<div className="dash-toolbar-date">
								{new Date().toLocaleDateString()}
							</div>
						</div>

						<div className="dash-page-content">
							<VerificationBanner />
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

export default TeacherDash;
