import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import { safeApiCall, getTeacherIssues } from '../services/teacherServices.js';
import { API_BASE_URL } from '../services/api.js';

const TeacherDash = () => {
	const { theme } = useTheme();
	const { user, logout } = useAuth();
	const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
	const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
	const [loggingOutFooter, setLoggingOutFooter] = useState(false);
	const [openIssuesCount, setOpenIssuesCount] = useState(0);

	// Responsive state management
	useEffect(() => {
		const handleResize = () => {
			const mobile = window.innerWidth < 1024;
			setIsMobile(mobile);
			setSidebarOpen(!mobile); // Automatically open on desktop, close on mobile
		};
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// EFFICIENT Real-time count updates
	useEffect(() => {
		if (!user?.id) return;

		// Fetch initial count
		const fetchOpenIssues = async () => {
			try {
				// NOTE: StudentDash doesn't have this, but it's a good practice for robustness.
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
				<div style={styles.portalIcon}>
					<span style={{ fontSize: 16 }}>👨‍🏫</span>
				</div>
				<div style={{ display: 'grid', lineHeight: 1.15, minWidth: 0 }}>
					<strong style={styles.portalTitle}>Teacher Portal</strong>
					<span style={styles.portalSubtitle}>Create • Manage • Evaluate</span>
				</div>
			</div>
		),
		[],
	);

	const footerEl = useMemo(
		() => (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
				<div style={styles.userCard}>
					<div style={styles.userAvatar}>
						{user?.fullname?.charAt(0) || user?.username?.charAt(0) || 'T'}
					</div>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={styles.userName}
							title={user?.fullname || user?.username || 'Teacher'}
						>
							{user?.fullname || user?.username || 'Teacher'}
						</div>
						<div style={styles.userDept}>{user?.department || 'Department'}</div>
					</div>
				</div>
				<button onClick={handleLogout} style={styles.logoutButton(loggingOutFooter)}>
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
			{isMobile && sidebarOpen && (
				<div style={styles.backdrop} onClick={() => setSidebarOpen(false)} />
			)}

			<div style={styles.layout(theme)}>
				<aside style={styles.sidebarContainer(isMobile, sidebarOpen)}>
					<ErrorBoundary>
						<Sidebar
							header={headerEl}
							footer={footerEl}
							items={items}
							expanded={sidebarOpen}
							onToggle={setSidebarOpen}
							isMobile={isMobile}
						/>
					</ErrorBoundary>
				</aside>

				<main style={styles.mainContent(isMobile)}>
					<section style={styles.contentSection}>
						{isMobile && (
							<header style={styles.mobileHeader}>
								<button
									onClick={() => setSidebarOpen(true)}
									style={styles.menuButton}
								>
									☰ Menu
								</button>
								<div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
									{new Date().toLocaleDateString()}
								</div>
							</header>
						)}
						<div style={styles.outletContainer(isMobile)}>
							<ErrorBoundary>
								<Suspense fallback={<RouteFallback message="Loading page" />}>
									<Outlet />
								</Suspense>
							</ErrorBoundary>
						</div>
					</section>
				</main>
			</div>
		</>
	);
};

// --- Styles ---
const styles = {
	layout: theme => ({
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		minHeight: '100dvh',
		background:
			theme === 'dark'
				? 'radial-gradient(ellipse at top left, rgba(59,130,246,0.05) 0%, transparent 50%), var(--bg)'
				: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.06) 0%, transparent 50%), var(--bg)',
	}),
	sidebarContainer: (isMobile, isOpen) => ({
		position: isMobile ? 'fixed' : 'sticky',
		top: 0,
		left: 0,
		height: '100dvh',
		zIndex: 100,
		transform: isMobile ? (isOpen ? 'translateX(0)' : 'translateX(-100%)') : 'none',
		transition: 'transform 0.3s ease-in-out',
		padding: isMobile ? 0 : 16,
		paddingRight: isMobile ? 0 : 8,
	}),
	mainContent: isMobile => ({
		padding: isMobile ? 16 : '16px 16px 16px 8px',
		minWidth: 0,
	}),
	contentSection: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 14,
		minHeight: 'calc(100vh - 32px)',
		boxShadow: 'var(--shadow-md)',
		display: 'flex',
		flexDirection: 'column',
	},
	mobileHeader: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		padding: '10px 16px',
		borderBottom: '1px solid var(--border)',
		flexShrink: 0,
	},
	outletContainer: isMobile => ({
		padding: 16,
		flexGrow: 1,
		overflowY: 'auto',
		minHeight: isMobile ? '0' : 'auto',
	}),
	menuButton: {
		padding: '8px 12px',
		borderRadius: 10,
		background: 'var(--bg)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		fontWeight: 800,
	},
	backdrop: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.5)',
		backdropFilter: 'blur(4px)',
		zIndex: 99,
	},
	portalIcon: {
		width: 32,
		height: 32,
		borderRadius: 10,
		background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		border: '2px solid rgba(59,130,246,0.25)',
		boxShadow: '0 4px 10px rgba(59,130,246,0.25)',
	},
	portalTitle: {
		letterSpacing: 0.3,
		fontSize: 13,
		background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
		WebkitBackgroundClip: 'text',
		WebkitTextFillColor: 'transparent',
		backgroundClip: 'text',
	},
	portalSubtitle: {
		fontSize: 11,
		color: 'var(--text-muted)',
		opacity: 0.9,
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
	userCard: {
		padding: '10px 12px',
		borderRadius: 12,
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		display: 'flex',
		alignItems: 'center',
		gap: 10,
	},
	userAvatar: {
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
	},
	userName: {
		fontWeight: 700,
		fontSize: 12,
		color: 'var(--text)',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	userDept: { fontSize: 11, color: 'var(--text-muted)' },
	logoutButton: loggingOut => ({
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
		opacity: loggingOut ? 0.8 : 1,
	}),
};

export default TeacherDash;
