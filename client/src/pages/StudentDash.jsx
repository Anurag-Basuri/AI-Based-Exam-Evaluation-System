import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';

const SIDEBAR_WIDTH = 320;
const SIDEBAR_COLLAPSED = 80;
const MOBILE_BREAKPOINT = 1024;

const StudentDash = () => {
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const [isMobile, setIsMobile] = React.useState(
		typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
	);
	const [sidebarOpen, setSidebarOpen] = React.useState(!isMobile);

	React.useEffect(() => {
		const onResize = () => {
			const mobile = window.innerWidth < MOBILE_BREAKPOINT;
			setIsMobile(mobile);
			setSidebarOpen(!mobile); // default: open on desktop, closed on mobile
		};
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const gutter = isMobile ? 0 : sidebarOpen ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED;

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
						borderRadius: 10,
						objectFit: 'cover',
						border: '2px solid rgba(16,185,129,0.25)',
					}}
				/>
				<div style={{ display: 'grid', lineHeight: 1.2 }}>
					<strong
						style={{
							letterSpacing: 0.3,
							fontSize: 14,
							background: 'linear-gradient(135deg, #059669, #3b82f6)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Student Portal
					</strong>
					<span style={{ fontSize: 11, color: 'var(--text-muted)', opacity: 0.85 }}>
						Learn • Practice • Excel
					</span>
				</div>
			</div>
		),
		[],
	);

	const footerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
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
							background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							fontSize: 16,
							color: '#fff',
						}}
					>
						👤
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
							title={user?.fullname || user?.username || 'Student'}
						>
							{user?.fullname || user?.username || 'Student'}
						</div>
						<div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
							{user?.department || 'Department'}
						</div>
					</div>
				</div>

				<button
					onClick={logout}
					style={{
						width: '100%',
						padding: '10px 14px',
						borderRadius: 10,
						border: 'none',
						background: 'linear-gradient(135deg, #ef4444, #dc2626)',
						color: '#ffffff',
						fontSize: 13,
						fontWeight: 700,
						cursor: 'pointer',
						transition: 'all 0.2s ease',
					}}
					onMouseEnter={e => {
						e.currentTarget.style.transform = 'translateY(-1px)';
					}}
					onMouseLeave={e => {
						e.currentTarget.style.transform = 'translateY(0)';
					}}
				>
					🚪 Logout
				</button>
			</div>
		),
		[user, logout],
	);

	const items = React.useMemo(
		() => [
			{ key: 'home', label: 'Dashboard', icon: '🏠', to: '/student', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/student/exams' },
			{ key: 'results', label: 'Results', icon: '📊', to: '/student/results' },
			{ key: 'issues', label: 'Support', icon: '🆘', to: '/student/issues' },
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/student/settings' },
		],
		[],
	);

	return (
		<>
			<style>{`
        @keyframes spin { from { transform: rotate(0deg);} to { transform: rotate(360deg);} }
      `}</style>

			{/* Fixed Sidebar (pure nav) */}
			<ErrorBoundary>
				<Sidebar
					header={headerEl}
					footer={footerEl}
					width={SIDEBAR_WIDTH}
					collapsedWidth={SIDEBAR_COLLAPSED}
					theme={theme}
					items={items}
					collapsible={true}
					expanded={sidebarOpen}
					onToggle={setSidebarOpen}
					mobileBreakpoint={MOBILE_BREAKPOINT}
				/>
			</ErrorBoundary>

			{/* App Bar (prevents overlap, provides mobile toggle) */}
			<header
				style={{
					position: 'sticky',
					top: 0,
					zIndex: 5,
					marginLeft: gutter,
					transition: 'margin-left 0.25s ease',
					background: 'var(--bg)',
					borderBottom: '1px solid var(--border)',
					padding: '10px 16px',
					display: 'flex',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<button
					onClick={() => setSidebarOpen(v => !v)}
					aria-label="Toggle navigation"
					style={{
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						padding: '8px 10px',
						borderRadius: 10,
						fontWeight: 700,
						cursor: 'pointer',
					}}
				>
					☰
				</button>
				<div style={{ fontWeight: 800, color: 'var(--text)' }}>Student Portal</div>
				<div style={{ marginLeft: 'auto', color: 'var(--text-muted)', fontSize: 13 }}>
					{new Date().toLocaleDateString()}
				</div>
			</header>

			{/* Main Content */}
			<main
				style={{
					marginLeft: gutter,
					transition: 'margin-left 0.25s ease',
					minHeight: 'calc(100vh - 56px)',
					padding: 24,
					background:
						theme === 'dark'
							? 'radial-gradient(ellipse at top left, rgba(59,130,246,0.05) 0%, transparent 50%), var(--bg)'
							: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.06) 0%, transparent 50%), var(--bg)',
				}}
			>
				<ErrorBoundary>
					<Suspense fallback={<RouteFallback message="Loading page" />}>
						<Outlet />
					</Suspense>
				</ErrorBoundary>
			</main>
		</>
	);
};

export default StudentDash;
