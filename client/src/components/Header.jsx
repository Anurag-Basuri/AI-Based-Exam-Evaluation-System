import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';

const useIsMobile = () => {
	const isBrowser = typeof window !== 'undefined';
	const [isMobile, setIsMobile] = React.useState(isBrowser ? window.innerWidth < 768 : false);
	React.useEffect(() => {
		if (!isBrowser) return;
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener('resize', handleResize, { passive: true });
		return () => window.removeEventListener('resize', handleResize);
	}, [isBrowser]);
	return isMobile;
};

const Header = ({ transparent = false }) => {
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const { theme, toggleTheme } = useTheme();
	const isDark = theme === 'dark';

	const { user, isAuthenticated, role, logoutStudent, logoutTeacher } = useAuth();
	const userDdRef = useRef(null);
	const [showUserDropdown, setShowUserDropdown] = useState(false);

	// Close dropdown on outside click or ESC
	useEffect(() => {
		if (typeof document === 'undefined') return;
		const onDown = e => {
			if (userDdRef.current && !userDdRef.current.contains(e.target)) {
				setShowUserDropdown(false);
			}
		};
		const onEsc = e => e.key === 'Escape' && setShowUserDropdown(false);
		document.addEventListener('mousedown', onDown);
		document.addEventListener('keydown', onEsc);
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onEsc);
		};
	}, []);

	const navigateToHome = () => {
		setShowUserDropdown(false);
		try {
			navigate('/');
		} catch {}
	};

	const goToLogin = () => {
		try {
			localStorage.setItem('preferredRole', 'student');
		} catch {}
		try {
			navigate('/auth?mode=login&role=student');
		} catch {}
	};
	const goToRegister = () => {
		try {
			localStorage.setItem('preferredRole', 'student');
		} catch {}
		try {
			navigate('/auth?mode=register&role=student');
		} catch {}
	};

	const handleLogout = async () => {
		setShowUserDropdown(false);
		try {
			if (role === 'teacher') await logoutTeacher();
			else await logoutStudent();
		} catch {}
		try {
			navigate('/', { replace: true });
		} catch {}
	};

	const displayName = user?.username || 'User';
	const headerPadX = isMobile ? '0.75rem' : '2rem';

	const bg = transparent
		? isDark
			? 'rgba(2,6,23,0.5)'
			: 'rgba(255,255,255,0.6)'
		: isDark
			? '#0b1220'
			: '#ffffff';

	const border = transparent
		? isDark
			? '1px solid rgba(148,163,184,0.18)'
			: '1px solid rgba(226,232,240,0.7)'
		: isDark
			? '1px solid rgba(148,163,184,0.16)'
			: '1px solid rgba(226,232,240,0.9)';

	const titleColor = isDark ? '#e5e7eb' : '#1e293b';
	const textColor = isDark ? '#cbd5e1' : '#374151';
	const muted = isDark ? '#94a3b8' : '#64748b';

	return (
		<header
			style={{
				position: 'sticky',
				top: 0,
				zIndex: 50,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: `0.65rem ${headerPadX}`,
				backgroundColor: bg,
				backdropFilter: transparent ? 'saturate(180%) blur(10px)' : 'none',
				WebkitBackdropFilter: transparent ? 'saturate(180%) blur(10px)' : 'none',
				boxShadow: transparent
					? '0 6px 20px rgba(0,0,0,0.06)'
					: '0 2px 10px rgba(0,0,0,0.06)',
				borderBottom: border,
				transition:
					'background-color 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
			}}
		>
			<div
				onClick={navigateToHome}
				style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.65rem' }}
			>
				<img
					src="/logo512.png"
					alt="AI Exam System logo"
					style={{ width: 36, height: 36, borderRadius: '8px' }}
				/>
				<div style={{ display: 'grid', lineHeight: 1 }}>
					<h1
						style={{
							fontSize: 'clamp(1rem, 2vw, 1.2rem)',
							margin: 0,
							fontWeight: 800,
							color: titleColor,
							letterSpacing: 0.2,
						}}
					>
						AI Exam System
					</h1>
					{!isMobile && (
						<span style={{ fontSize: 12, color: muted }}>
							Insight‑driven assessment suite
						</span>
					)}
				</div>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
				{/* Theme toggle */}
				<button
					type="button"
					onClick={toggleTheme}
					title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
					aria-label="Toggle theme"
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 8,
						padding: '8px 12px',
						borderRadius: 999,
						border: `1px solid ${isDark ? 'rgba(148,163,184,0.25)' : 'rgba(226,232,240,0.9)'}`,
						background: isDark ? '#0b1220' : '#ffffff',
						color: isDark ? '#e2e8f0' : '#111827',
						fontWeight: 700,
						cursor: 'pointer',
						boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
					}}
				>
					<span aria-hidden>{theme === 'light' ? '🌞' : '🌙'}</span>
					{!isMobile && (theme === 'light' ? 'Light' : 'Dark')}
				</button>

				{isAuthenticated && user ? (
					<div ref={userDdRef} style={{ position: 'relative' }}>
						<button
							onClick={() => setShowUserDropdown(s => !s)}
							aria-haspopup="menu"
							aria-expanded={showUserDropdown}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: '0.5rem',
								background: 'transparent',
								border: 'none',
								cursor: 'pointer',
								padding: '0.25rem',
								color: textColor,
							}}
						>
							<img
								src="/logo192.png"
								alt="User avatar"
								style={{
									width: 36,
									height: 36,
									borderRadius: '50%',
									objectFit: 'cover',
									border: `2px solid ${role === 'student' ? '#6366f1' : '#f59e42'}`,
								}}
							/>
							{!isMobile && (
								<>
									<span style={{ fontWeight: 600 }}>{displayName}</span>
									<Caret open={showUserDropdown} color={muted} />
								</>
							)}
						</button>

						{showUserDropdown && (
							<div
								role="menu"
								style={{
									position: 'absolute',
									top: 'calc(100% + 8px)',
									right: 0,
									background: isDark ? '#0f172a' : '#fff',
									borderRadius: '0.6rem',
									border: `1px solid ${isDark ? '#1f2937' : '#eef2f7'}`,
									boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
									width: 240,
									overflow: 'hidden',
									zIndex: 101,
								}}
							>
								<div
									style={{
										padding: '0.9rem',
										borderBottom: `1px solid ${isDark ? '#1f2937' : '#eef2f7'}`,
										textAlign: 'center',
										color: textColor,
									}}
								>
									<div style={{ fontWeight: 700 }}>{displayName}</div>
									<div
										style={{ fontSize: '0.85rem', color: muted, marginTop: 4 }}
									>
										{role === 'student' ? 'Student' : 'Teacher'}
									</div>
								</div>
								<button
									onClick={() => {
										try {
											if (role === 'student') navigate('/student');
											else navigate('/teacher');
										} finally {
											setShowUserDropdown(false);
										}
									}}
									style={getMenuBtnStyle(isDark)}
									onMouseOver={e =>
										(e.currentTarget.style.backgroundColor = isDark
											? '#0b1220'
											: '#f8fafc')
									}
									onMouseOut={e =>
										(e.currentTarget.style.backgroundColor = 'transparent')
									}
								>
									Dashboard
								</button>
								<button
									onClick={handleLogout}
									style={{ ...getMenuBtnStyle(isDark), color: '#ef4444' }}
									onMouseOver={e =>
										(e.currentTarget.style.backgroundColor = isDark
											? '#0b1220'
											: '#f8fafc')
									}
									onMouseOut={e =>
										(e.currentTarget.style.backgroundColor = 'transparent')
									}
								>
									Logout
								</button>
							</div>
						)}
					</div>
				) : (
					<>
						<button onClick={goToLogin} style={getOutlineBtnStyle(isDark)}>
							Sign in
						</button>
						<button onClick={goToRegister} style={getSolidBtnStyle()}>
							Create account
						</button>
					</>
				)}
			</div>
		</header>
	);
};

const Caret = ({ open, color = '#64748b' }) => (
	<svg
		width="14"
		height="14"
		viewBox="0 0 24 24"
		fill="none"
		stroke={color}
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		style={{ transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
	>
		<polyline points="6 9 12 15 18 9"></polyline>
	</svg>
);

const getOutlineBtnStyle = isDark => ({
	padding: '0.5rem 0.9rem',
	backgroundColor: 'transparent',
	color: isDark ? '#c7d2fe' : '#6366f1',
	border: `1px solid ${isDark ? '#334155' : '#6366f1'}`,
	borderRadius: '0.6rem',
	cursor: 'pointer',
	fontSize: '0.95rem',
	fontWeight: 800,
	display: 'flex',
	alignItems: 'center',
});

const getSolidBtnStyle = () => ({
	padding: '0.5rem 0.9rem',
	backgroundColor: '#6366f1',
	color: '#ffffff',
	border: 'none',
	borderRadius: '0.6rem',
	cursor: 'pointer',
	fontSize: '0.95rem',
	fontWeight: 800,
	display: 'flex',
	alignItems: 'center',
	boxShadow: '0 6px 18px rgba(99,102,241,0.25)',
});

const getMenuBtnStyle = isDark => ({
	display: 'block',
	width: '100%',
	textAlign: 'left',
	background: 'transparent',
	border: 'none',
	padding: '0.8rem 0.95rem',
	cursor: 'pointer',
	color: isDark ? '#e2e8f0' : '#1e293b',
});

export default Header;
