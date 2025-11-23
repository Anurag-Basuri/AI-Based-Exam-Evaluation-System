import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { useTheme } from '../hooks/useTheme.js';
import logo from '../assets/logo.svg';

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
	const { user, isAuthenticated, role, logoutStudent, logoutTeacher } = useAuth();

	const userDdRef = useRef(null);
	const [showUserDropdown, setShowUserDropdown] = useState(false);
	const rootRef = useRef(null);

	// Sync --header-h to real header height for perfect sticky offsets
	useEffect(() => {
		if (!rootRef.current) return;
		const setVar = () => {
			// Guard against the ref being null if the component unmounts
			if (rootRef.current) {
				const h = rootRef.current.getBoundingClientRect().height;
				document.documentElement.style.setProperty('--header-h', `${Math.round(h)}px`);
			}
		};
		setVar();
		const ro = new ResizeObserver(setVar);
		ro.observe(rootRef.current);
		window.addEventListener('resize', setVar);
		return () => {
			// Add a guard here as well for safety during unmount
			if (rootRef.current) {
				ro.unobserve(rootRef.current);
			}
			ro.disconnect();
			window.removeEventListener('resize', setVar);
		};
	}, []);

	// Close dropdown on outside click or Escape
	useEffect(() => {
		if (typeof document === 'undefined') return;
		const onDown = e => {
			if (userDdRef.current && !userDdRef.current.contains(e.target))
				setShowUserDropdown(false);
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
		} catch (e) {
			console.error('Failed to navigate home', e);
		}
	};

	const goToLogin = () => {
		try {
			localStorage.setItem('preferredRole', 'student');
		} catch (e) {
			console.error('Failed to persist preferred role', e);
		}
		try {
			navigate('/auth?mode=login&role=student');
		} catch (e) {
			console.error('Failed to navigate to login', e);
		}
	};

	const goToRegister = () => {
		try {
			localStorage.setItem('preferredRole', 'student');
		} catch (e) {
			console.error('Failed to persist preferred role', e);
		}
		try {
			navigate('/auth?mode=register&role=student');
		} catch (e) {
			console.error('Failed to navigate to register', e);
		}
	};

	const handleLogout = async () => {
		setShowUserDropdown(false);
		try {
			role === 'teacher' ? await logoutTeacher() : await logoutStudent();
		} catch (e) {
			console.error('Logout failed', e);
		}
		try {
			navigate('/', { replace: true });
		} catch (e) {
			console.error('Post-logout navigation failed', e);
		}
	};

	const displayName = user?.username || 'User';
	const headerPadX = isMobile ? '0.75rem' : '2rem';

	return (
		<header
			ref={rootRef}
			style={{
				position: 'sticky',
				top: 0,
				zIndex: 50,
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: `0.65rem ${headerPadX}`,
				backgroundColor: transparent
					? 'color-mix(in srgb, var(--surface), transparent 30%)'
					: 'var(--surface)',
				backdropFilter: transparent ? 'saturate(180%) blur(10px)' : 'none',
				WebkitBackdropFilter: transparent ? 'saturate(180%) blur(10px)' : 'none',
				borderBottom: '1px solid var(--border)',
				boxShadow: transparent
					? '0 8px 26px rgba(0,0,0,0.08)'
					: '0 2px 10px rgba(0,0,0,0.06)',
				transition:
					'background-color 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
			}}
		>
			<div
				onClick={navigateToHome}
				style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.65rem' }}
			>
				<img
					src={logo}
					alt="AI Exam System logo"
					style={{ width: 40, height: 40, borderRadius: '8px' }}
				/>
				<div style={{ display: 'grid', lineHeight: 1 }}>
					<h1
						style={{
							fontSize: 'clamp(1rem, 2vw, 1.2rem)',
							margin: 0,
							fontWeight: 800,
							color: 'var(--text)',
							letterSpacing: 0.2,
						}}
					>
						AI Exam System
					</h1>
					{!isMobile && (
						<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
							Insight‑driven assessment suite
						</span>
					)}
				</div>
			</div>

			<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
						border: '1px solid var(--border)',
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
								color: 'var(--text)',
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
									border: `2px solid ${
										role === 'student' ? 'var(--primary-strong)' : '#f59e42'
									}`,
								}}
							/>
							{!isMobile && (
								<>
									<span style={{ fontWeight: 600 }}>{displayName}</span>
									<Caret open={showUserDropdown} color="var(--text-muted)" />
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
									border: '1px solid var(--border)',
									boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
									width: 240,
									overflow: 'hidden',
									zIndex: 101,
								}}
							>
								<div
									style={{
										padding: '0.9rem',
										borderBottom: '1px solid var(--border)',
										textAlign: 'center',
										color: 'var(--text)',
									}}
								>
									<div style={{ fontWeight: 700 }}>{displayName}</div>
									<div
										style={{
											fontSize: '0.85rem',
											color: 'var(--text-muted)',
											marginTop: 4,
										}}
									>
										{role === 'student' ? 'Student' : 'Teacher'}
									</div>
								</div>
								<button
									onClick={() => {
										try {
											role === 'student'
												? navigate('/student')
												: navigate('/teacher');
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
