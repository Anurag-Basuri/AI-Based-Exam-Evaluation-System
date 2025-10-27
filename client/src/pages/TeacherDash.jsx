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

const TeacherDash = () => {
	const location = useLocation();
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const [isMobile, setIsMobile] = useState(
		typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
	);
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [loggingOutFooter, setLoggingOutFooter] = useState(false);
	const [openIssuesCount, setOpenIssuesCount] = useState(0);

	// Responsive and sidebar state management from StudentDash
	useEffect(() => {
		const onResize = () => {
			const mobile = window.innerWidth < MOBILE_BREAKPOINT;
			setIsMobile(mobile);
			if (!mobile) {
				setSidebarOpen(true); // open on desktop
			} else {
				setSidebarOpen(false); // closed by default on mobile
			}
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	// Close mobile sidebar on route change
	useEffect(() => {
		if (isMobile) {
			setSidebarOpen(false);
		}
	}, [location.pathname, isMobile]);

	// EFFICIENT Real-time count updates (retained from previous TeacherDash)
	useEffect(() => {
		if (!user?.id) return;

		const fetchOpenIssues = async () => {
			try {
				const issues = await safeApiCall(getTeacherIssues, { status: 'open' });
				setOpenIssuesCount(Array.isArray(issues) ? issues.length : 0);
			} catch (error) {
				console.error('Failed to fetch open issues count:', error);
			}
		};
		fetchOpenIssues();

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});

		socket.on('new-issue', newIssue => {
			if (newIssue.status === 'open') {
				setOpenIssuesCount(c => c + 1);
			}
		});

		socket.on('issue-update', ({ issue, oldStatus }) => {
			const newStatus = issue.status;
			if (oldStatus === 'open' && newStatus !== 'open') {
				setOpenIssuesCount(c => Math.max(0, c - 1));
			} else if (oldStatus !== 'open' && newStatus === 'open') {
				setOpenIssuesCount(c => c + 1);
			}
		});

		socket.on('issue-deleted', ({ status }) => {
			if (status === 'open') {
				setOpenIssuesCount(c => Math.max(0, c - 1));
			}
		});

		return () => socket.disconnect();
	}, [user]);

	const handleLogout = useCallback(async () => {
		if (loggingOutFooter) return;
		setLoggingOutFooter(true);
		try {
			await Promise.resolve(logout?.());
		} finally {
			setLoggingOutFooter(false);
		}
	}, [logout, loggingOutFooter]);

	const headerEl = useMemo(
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

	const footerEl = useMemo(
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
					onClick={handleLogout}
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
						transition: 'opacity 0.15s ease',
						opacity: loggingOutFooter ? 0.8 : 1,
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

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : `${SIDEBAR_WIDTH}px 1fr`,
					alignItems: 'start',
					minHeight: '100vh',
					background:
						theme === 'dark'
							? 'radial-gradient(ellipse at top left, rgba(59,130,246,0.05) 0%, transparent 50%), var(--bg)'
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
								paddingRight: 8,
							}}
						>
							<Sidebar
								header={headerEl}
								footer={footerEl}
								width={SIDEBAR_WIDTH}
								collapsedWidth={SIDEBAR_WIDTH}
								theme={theme}
								items={items}
								collapsible={false} // Non-collapsible on desktop
								expanded={true}
								mobileBreakpoint={MOBILE_BREAKPOINT}
							/>
						</aside>
					</ErrorBoundary>
				)}

				{/* Main Content */}
				<div style={{ padding: isMobile ? 16 : '16px 16px 16px 8px', minWidth: 0 }}>
					<section
						style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 14,
							minHeight: 'calc(100vh - 32px)',
							boxShadow: 'var(--shadow-md)',
							display: 'flex',
							flexDirection: 'column',
						}}
					>
						{/* Mobile toolbar */}
						{isMobile && (
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									gap: 10,
									borderBottom: '1px solid var(--border)',
									padding: '10px 16px',
									flexShrink: 0,
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
										color: 'var(--text-muted)',
										fontSize: 12,
									}}
								>
									{new Date().toLocaleDateString()}
								</div>
							</div>
						)}

						<div
							style={{
								padding: 16,
								flexGrow: 1,
								overflowY: 'auto',
								minHeight: isMobile ? '0' : 'auto',
							}}
						>
							<ErrorBoundary>
								<Suspense fallback={<RouteFallback message="Loading page" />}>
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
