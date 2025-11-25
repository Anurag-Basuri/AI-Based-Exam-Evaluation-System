import React, { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import Sidebar from '../components/Sidebar.jsx';

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
			if (!mobile) setSidebarOpen(true); // open on desktop
			else setSidebarOpen(false); // closed by default on mobile
		};
		onResize();
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	// compact logo used in dashboard headers (match teacher look)
	const Logo = ({ size = 36, compact = false, label = 'Student Portal' }) => (
		<div style={{ display: 'flex', alignItems: 'center', gap: compact ? 8 : 12 }}>
			<div
				aria-hidden="true"
				style={{
					width: size,
					height: size,
					borderRadius: 8,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #3b82f6, #059669)',
					color: '#fff',
					fontSize: Math.max(12, Math.floor(size / 3)),
					flexShrink: 0,
				}}
			>
				{/* simple book icon */}
				<svg
					width={size * 0.6}
					height={size * 0.6}
					viewBox="0 0 24 24"
					fill="none"
					aria-hidden
				>
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
			{!compact && (
				<div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
					<span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 14 }}>
						{label}
					</span>
					<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
						Learn • Practice • Excel
					</span>
				</div>
			)}
		</div>
	);

	const headerEl = React.useMemo(
		() => (
			<div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
				<Logo size={34} compact={isMobile} label="Student Portal" />
			</div>
		),
		[isMobile, user],
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
						collapsible={false} // no collapse arrow
						expanded={sidebarOpen}
						onToggle={setSidebarOpen}
						mobileBreakpoint={MOBILE_BREAKPOINT}
						overlay={true} // show as overlay drawer on mobile
					/>
				</ErrorBoundary>
			)}

			{/* Below header: sidebar (sticky) + content */}
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : `${SIDEBAR_WIDTH}px 1fr`,
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
								collapsible={false}
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
									aria-label="Open menu"
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

export default StudentDash;
