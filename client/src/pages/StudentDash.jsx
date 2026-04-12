import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import Sidebar from '../components/Sidebar.jsx';
import VerificationBanner from '../components/ui/VerificationBanner.jsx';
import './Dashboard.css';

const SIDEBAR_WIDTH = 280;
const MOBILE_BREAKPOINT = 1024;

const StudentDash = () => {
	const location = useLocation();
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const isClient = typeof window !== 'undefined';
	const initialIsMobile = isClient ? window.innerWidth < MOBILE_BREAKPOINT : false;

	const [isMobile, setIsMobile] = useState(initialIsMobile);
	const [sidebarOpen, setSidebarOpen] = useState(!initialIsMobile);
	const [loggingOut, setLoggingOut] = useState(false);

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
				<div className="dash-sidebar-header-logo student">
					<svg width={24} height={24} viewBox="0 0 24 24" fill="none" aria-hidden>
						<path
							d="M3 5.5A2.5 2.5 0 015.5 3h11A2.5 2.5 0 0119 5.5V19a1 1 0 01-1 1H5.5A2.5 2.5 0 013 17.5v-12z"
							fill="rgba(255,255,255,0.12)"
						/>
						<path
							d="M7 7h10M7 10h10M7 13h6"
							stroke="#fff"
							strokeWidth="1.2"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
					</svg>
				</div>
				<div className="dash-sidebar-header-text">
					<strong>Student Portal</strong>
					<small>Learn • Practice • Excel</small>
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
					<div className="dash-profile-avatar student">
						{user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'S'}
					</div>
					<div className="dash-profile-info">
						<div className="dash-profile-name" title={user?.fullname || user?.username}>
							{user?.fullname || user?.username || 'Student'}
						</div>
						<div className="dash-profile-dept">{user?.department || 'Department'}</div>
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
			{ key: 'home', label: 'Dashboard', icon: '🏠', to: '/student', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/student/exams' },
			{ key: 'results', label: 'Results', icon: '📊', to: '/student/results' },
			{ key: 'issues', label: 'Support', icon: '🆘', to: '/student/issues' },
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/student/settings' },
		],
		[],
	);

	// If taking an exam, render only the Outlet for a clean fullscreen view
	const isTakingExam = location.pathname.includes('/take');
	if (isTakingExam) {
		return (
			<ErrorBoundary>
				<Suspense fallback={<RouteFallback message="Loading Exam..." />}>
					<Outlet />
				</Suspense>
			</ErrorBoundary>
		);
	}

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
						{/* Mobile toolbar */}
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

export default StudentDash;
