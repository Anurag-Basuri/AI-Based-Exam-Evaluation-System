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
			? 'rgba(2,6,23,0.55)'
			: 'rgba(255,255,255,0.7)'
		: 'var(--surface)';

	const border = `1px solid var(--border)`;
	const titleColor = 'var(--text)';
	const textColor = 'var(--text)';
	const muted = 'var(--text-muted)';

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
					? '0 8px 26px rgba(0,0,0,0.08)'
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
				{/* Theme toggle (single global toggle lives here) */}
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
						border: `1px solid var(--border)`,
						background: 'var(--surface)',
						color: 'var(--text)',
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
									border: `2px solid ${role === 'student' ? 'var(--primary-strong)' : '#f59e42'}`,
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
									background: 'var(--surface)',
									borderRadius: '0.6rem',
									border,
									boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
									width: 240,
									overflow: 'hidden',
									zIndex: 101,
								}}
							>
								<div
									style={{
										padding: '0.9rem',
										borderBottom: border,
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
									style={menuBtnStyle}
									onMouseOver={e =>
										(e.currentTarget.style.backgroundColor = 'var(--elev)')
									}
									onMouseOut={e =>
										(e.currentTarget.style.backgroundColor = 'transparent')
									}
								>
									Dashboard
								</button>
								<button
									onClick={handleLogout}
									style={{ ...menuBtnStyle, color: '#ef4444' }}
									onMouseOver={e =>
										(e.currentTarget.style.backgroundColor = 'var(--elev)')
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
						<button onClick={goToLogin} style={outlineBtnStyle}>
							Sign in
						</button>
						<button onClick={goToRegister} style={solidBtnStyle}>
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

const outlineBtnStyle = {
	padding: '0.5rem 0.9rem',
	backgroundColor: 'transparent',
	color: 'var(--primary)',
	border: '1px solid var(--primary)',
	borderRadius: '0.6rem',
	cursor: 'pointer',
	fontSize: '0.95rem',
	fontWeight: 800,
	display: 'flex',
	alignItems: 'center',
};

const solidBtnStyle = {
	padding: '0.5rem 0.9rem',
	backgroundColor: 'var(--primary-strong)',
	color: '#ffffff',
	border: 'none',
	borderRadius: '0.6rem',
	cursor: 'pointer',
	fontSize: '0.95rem',
	fontWeight: 800,
	display: 'flex',
	alignItems: 'center',
	boxShadow: '0 6px 18px rgba(99,102,241,0.25)',
};

const menuBtnStyle = {
	display: 'block',
	width: '100%',
	textAlign: 'left',
	background: 'transparent',
	border: 'none',
	padding: '0.8rem 0.95rem',
	cursor: 'pointer',
	color: 'var(--text)',
};

export default Header;
