import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const useIsMobile = () => {
	const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
	React.useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < 768);
		window.addEventListener('resize', handleResize, { passive: true });
		return () => window.removeEventListener('resize', handleResize);
	}, []);
	return isMobile;
};

const Header = ({ transparent = false }) => {
	const navigate = useNavigate();
	const isMobile = useIsMobile();
	const { user, isAuthenticated, role, logoutStudent, logoutTeacher } = useAuth();

	const userDdRef = useRef(null);
	const [showUserDropdown, setShowUserDropdown] = useState(false);

	// Close dropdown on outside click or ESC
	useEffect(() => {
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
		navigate('/');
	};

	const handleLogout = async () => {
		if (role === 'student') await logoutStudent();
		else if (role === 'teacher') await logoutTeacher();
		setShowUserDropdown(false);
	};

	// Always default to student when opening auth
	const goToLogin = () => {
		try {
			localStorage.setItem('preferredRole', 'student');
		} catch {}
		navigate('/auth?mode=login');
	};
	const goToRegister = () => {
		try {
			localStorage.setItem('preferredRole', 'student');
		} catch {}
		navigate('/auth?mode=register');
	};

	const getInitials = name => {
		if (!name) return 'U';
		return name
			.split(' ')
			.map(p => p[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	};

	const headerPadX = isMobile ? '0.75rem' : '2rem';

	return (
		<header
			style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				padding: `0.65rem ${headerPadX}`,
				backgroundColor: transparent ? 'rgba(255,255,255,0.6)' : '#ffffff',
				backdropFilter: transparent ? 'saturate(180%) blur(10px)' : 'none',
				WebkitBackdropFilter: transparent ? 'saturate(180%) blur(10px)' : 'none',
				boxShadow: transparent ? 'none' : '0 2px 10px rgba(0,0,0,0.06)',
				borderBottom: transparent
					? '1px solid rgba(226,232,240,0.5)'
					: '1px solid rgba(226,232,240,0.9)',
				transition:
					'background-color 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
			}}
		>
			{/* Logo */}
			<div
				onClick={navigateToHome}
				style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '0.65rem' }}
			>
				<div
					aria-hidden
					style={{
						width: 36,
						height: 36,
						borderRadius: '50%',
						background: 'linear-gradient(135deg, #6366f1, #a5b4fc)',
					}}
				/>
				<h1
					style={{
						fontSize: 'clamp(1rem, 2vw, 1.25rem)',
						margin: 0,
						fontWeight: 700,
						color: '#1e293b',
						letterSpacing: 0.2,
					}}
				>
					AI Exam System
				</h1>
			</div>

			{/* Right side */}
			<div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
							}}
						>
							{user.profileImage ? (
								<img
									src={user.profileImage}
									alt={user.name}
									style={{
										width: 36,
										height: 36,
										borderRadius: '50%',
										objectFit: 'cover',
										background: '#e5e7eb',
									}}
								/>
							) : (
								<div
									style={{
										width: 36,
										height: 36,
										borderRadius: '50%',
										background: role === 'student' ? '#6366f1' : '#f59e42',
										color: 'white',
										display: 'grid',
										placeItems: 'center',
										fontWeight: 700,
										fontSize: '0.9rem',
									}}
								>
									{getInitials(user.name)}
								</div>
							)}
							{!isMobile && (
								<>
									<span style={{ fontWeight: 500, color: '#374151' }}>
										{user.name}
									</span>
									<Caret open={showUserDropdown} />
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
									background: '#fff',
									borderRadius: '0.5rem',
									boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
									width: 220,
									overflow: 'hidden',
									zIndex: 101,
								}}
							>
								<div
									style={{
										padding: '0.85rem',
										borderBottom: '1px solid #eef2f7',
										textAlign: 'center',
									}}
								>
									<div style={{ fontWeight: 600 }}>{user.name}</div>
									<div
										style={{
											fontSize: '0.85rem',
											color: '#64748b',
											marginTop: 4,
										}}
									>
										{role === 'student' ? 'Student' : 'Teacher'}
									</div>
								</div>
								<button
									onClick={() => {
										if (role === 'student') navigate('/student/dashboard');
										else navigate('/teacher/dashboard');
										setShowUserDropdown(false);
									}}
									style={menuBtnStyle}
									onMouseOver={e =>
										(e.currentTarget.style.backgroundColor = '#f8fafc')
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
										(e.currentTarget.style.backgroundColor = '#f8fafc')
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
						{/* Always route to /auth with default student */}
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
	color: '#6366f1',
	border: '1px solid #6366f1',
	borderRadius: '0.6rem',
	cursor: 'pointer',
	fontSize: '0.95rem',
	fontWeight: 700,
	display: 'flex',
	alignItems: 'center',
};

const solidBtnStyle = {
	padding: '0.5rem 0.9rem',
	backgroundColor: '#6366f1',
	color: '#ffffff',
	border: 'none',
	borderRadius: '0.6rem',
	cursor: 'pointer',
	fontSize: '0.95rem',
	fontWeight: 700,
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
	padding: '0.75rem 0.9rem',
	cursor: 'pointer',
	color: '#1e293b',
};

export default Header;
