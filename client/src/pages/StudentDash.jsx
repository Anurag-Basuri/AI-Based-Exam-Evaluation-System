import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom'; // Import useLocation
import Sidebar from '../components/Sidebar.jsx';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';

const SIDEBAR_WIDTH = 280;
const MOBILE_BREAKPOINT = 1024;

const StudentDash = () => {
	const location = useLocation(); // Get current location
	const { theme } = useTheme();
	const { user, logout } = useAuth();

	const [isMobile, setIsMobile] = React.useState(
		typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
	);
	const [sidebarOpen, setSidebarOpen] = React.useState(false);
	const [loggingOutFooter, setLoggingOutFooter] = React.useState(false);

	React.useEffect(() => {
		const onResize = () => {
			const mobile = window.innerWidth < MOBILE_BREAKPOINT;
			setIsMobile(mobile);
			if (!mobile)
				setSidebarOpen(true); // open on desktop
			else setSidebarOpen(false); // closed by default on mobile
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
				<img
					src="/logo192.png"
					alt="Student Portal"
					onError={e => {
						e.currentTarget.onerror = null;
						e.currentTarget.src = '/logo512.png';
					}}
					style={{
						width: 32,
						height: 32,
						borderRadius: 10,
						objectFit: 'cover',
						border: '2px solid rgba(16,185,129,0.25)',
					}}
				/>
				<div style={{ display: 'grid', lineHeight: 1.15, minWidth: 0 }}>
					<strong
						style={{
							letterSpacing: 0.3,
							fontSize: 13,
							background: 'linear-gradient(135deg, #059669, #3b82f6)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Student Portal
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
						Learn • Practice • Excel
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
			{ key: 'home', label: 'Dashboard', icon: '🏠', to: '/student', end: true },
			{ key: 'exams', label: 'Exams', icon: '📝', to: '/student/exams' },
			{ key: 'results', label: 'Results', icon: '📊', to: '/student/results' },
			{ key: 'issues', label: 'Support', icon: '🆘', to: '/student/issues' },
			{ key: 'settings', label: 'Settings', icon: '⚙️', to: '/student/settings' },
		],
		[],
	);

	// Check if the current route is the exam page
	const isTakingExam = location.pathname.includes('/take');

	// If taking an exam, render only the Outlet to allow for a clean fullscreen view
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
			{/* Mobile Drawer Sidebar (under header) */}
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

			{/* Below header: sidebar (sticky) + content */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : `${SIDEBAR_WIDTH}px 1fr`,
					// gap: 16, // Gap is handled by padding now
					// padding: 16,
					alignItems: 'start',
					minHeight: '100vh', // Ensure it takes full height
					background:
						theme === 'dark'
							? 'radial-gradient(ellipse at top left, rgba(59,130,246,0.05) 0%, transparent 50%), var(--bg)'
							: 'radial-gradient(ellipse at top left, rgba(59,130,246,0.06) 0%, transparent 50%), var(--bg)',
				}}
			>
				{/* Desktop Sidebar (sticky under header) */}
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
								collapsible={true}
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
							minHeight: 'calc(100vh - 32px)', // Adjust for padding
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
									gap: 10,
									borderBottom: '1px solid var(--border)',
									padding: '10px 16px',
									flexShrink: 0, // Prevent toolbar from shrinking
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

						<div style={{ padding: 16, flexGrow: 1, overflowY: 'auto' }}>
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

export default StudentDash;
