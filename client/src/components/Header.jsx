import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';

const LAST_ROLE_KEY = 'aies:lastRole';

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

	// Simplified, unified auth flow
	const [authOpen, setAuthOpen] = useState(false);
	const [mode, setMode] = useState('login'); // 'login' | 'signup'
	const [selectedRole, setSelectedRole] = useState(
		localStorage.getItem(LAST_ROLE_KEY) || 'student',
	);
	const [rememberRole, setRememberRole] = useState(true);

	const authRef = useRef(null);
	const userDdRef = useRef(null);
	const [showUserDropdown, setShowUserDropdown] = useState(false);

	const closeAuth = () => setAuthOpen(false);
	const toggleAuth = m => {
		setMode(m);
		setAuthOpen(true);
		setShowUserDropdown(false);
	};

	// Lock body scroll when modal open
	useEffect(() => {
		if (authOpen) {
			const prev = document.body.style.overflow;
			document.body.style.overflow = 'hidden';
			return () => (document.body.style.overflow = prev);
		}
	}, [authOpen]);

	// Close modal on outside click or ESC
	useEffect(() => {
		const onDown = e => {
			if (authRef.current && !authRef.current.contains(e.target)) closeAuth();
		};
		const onEsc = e => e.key === 'Escape' && closeAuth();
		if (authOpen) {
			document.addEventListener('mousedown', onDown);
			document.addEventListener('keydown', onEsc);
		}
		return () => {
			document.removeEventListener('mousedown', onDown);
			document.removeEventListener('keydown', onEsc);
		};
	}, [authOpen]);

	// Actions
	const handleLogout = async () => {
		if (role === 'student') await logoutStudent();
		else if (role === 'teacher') await logoutTeacher();
		setShowUserDropdown(false);
	};

	const navigateToHome = () => {
		setShowUserDropdown(false);
		navigate('/');
	};

	const goAuth = m => {
		// If we know last role and on desktop, fast-path direct navigation.
		const lastRole = localStorage.getItem(LAST_ROLE_KEY);
		if (!isMobile && lastRole) {
			navigate(`/${lastRole}/${m === 'login' ? 'login' : 'signup'}`);
			return;
		}
		toggleAuth(m);
	};

	const continueAuth = () => {
		if (rememberRole) localStorage.setItem(LAST_ROLE_KEY, selectedRole);
		navigate(`/${selectedRole}/${mode === 'login' ? 'login' : 'signup'}`);
		closeAuth();
	};

	const switchRole = () => setSelectedRole(r => (r === 'student' ? 'teacher' : 'student'));

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
		<>
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
					style={{
						display: 'flex',
						alignItems: 'center',
						cursor: 'pointer',
						gap: '0.65rem',
					}}
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
							{/* Desktop: direct Sign in / Sign up (fast-path if role known) */}
							{!isMobile ? (
								<>
									<button onClick={() => goAuth('login')} style={outlineBtnStyle}>
										Sign in
									</button>
									<button onClick={() => goAuth('signup')} style={solidBtnStyle}>
										Create account
									</button>
								</>
							) : (
								// Mobile: a single compact button -> modal with role + mode picker
								<button
									onClick={() => toggleAuth('login')}
									aria-label="Open account options"
									style={{
										padding: 10,
										background: '#6366f1',
										color: '#fff',
										border: 'none',
										borderRadius: 10,
										display: 'flex',
										alignItems: 'center',
										gap: 8,
									}}
								>
									<svg
										width="18"
										height="18"
										viewBox="0 0 24 24"
										fill="none"
										stroke="#fff"
										strokeWidth="2"
										strokeLinecap="round"
										strokeLinejoin="round"
									>
										<circle cx="12" cy="8" r="4"></circle>
										<path d="M6 20c0-3.3137 2.6863-6 6-6s6 2.6863 6 6"></path>
									</svg>
									Get started
								</button>
							)}
						</>
					)}
				</div>
			</header>

			{/* Unified Auth Modal */}
			{authOpen && (
				<div
					aria-modal="true"
					role="dialog"
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(15,23,42,0.45)',
						backdropFilter: 'blur(2px)',
						zIndex: 1100,
						display: 'grid',
						placeItems: isMobile ? 'end center' : 'center',
					}}
				>
					<div
						ref={authRef}
						style={{
							width: 'min(92vw, 560px)',
							background: '#fff',
							borderRadius: isMobile ? '16px 16px 0 0' : 16,
							boxShadow: '0 40px 80px rgba(0,0,0,0.2)',
							overflow: 'hidden',
							transform: isMobile ? 'translateY(0)' : 'scale(1)',
							animation: isMobile ? 'slideUp 220ms ease' : 'popIn 160ms ease',
						}}
					>
						<div
							style={{
								padding: '1rem 1.25rem',
								borderBottom: '1px solid #eef2f7',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
							}}
						>
							<div style={{ fontWeight: 700, color: '#0f172a' }}>
								Choose your role
							</div>
							<button
								onClick={closeAuth}
								aria-label="Close"
								style={{
									border: 'none',
									background: 'transparent',
									cursor: 'pointer',
									padding: 6,
								}}
							>
								<svg
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="#334155"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						</div>

						{/* Mode toggle */}
						<div
							style={{
								padding: '1rem 1.25rem',
								display: 'flex',
								justifyContent: 'center',
							}}
						>
							<div
								style={{
									background: '#f1f5f9',
									borderRadius: 999,
									padding: 4,
									display: 'inline-flex',
									gap: 4,
								}}
							>
								<button
									onClick={() => setMode('login')}
									style={{
										padding: '0.45rem 0.9rem',
										borderRadius: 999,
										border: 'none',
										cursor: 'pointer',
										background: mode === 'login' ? '#fff' : 'transparent',
										color: mode === 'login' ? '#0f172a' : '#475569',
										boxShadow:
											mode === 'login'
												? '0 1px 2px rgba(0,0,0,0.06)'
												: 'none',
										fontWeight: 600,
									}}
								>
									Sign in
								</button>
								<button
									onClick={() => setMode('signup')}
									style={{
										padding: '0.45rem 0.9rem',
										borderRadius: 999,
										border: 'none',
										cursor: 'pointer',
										background: mode === 'signup' ? '#fff' : 'transparent',
										color: mode === 'signup' ? '#0f172a' : '#475569',
										boxShadow:
											mode === 'signup'
												? '0 1px 2px rgba(0,0,0,0.06)'
												: 'none',
										fontWeight: 600,
									}}
								>
									Sign up
								</button>
							</div>
						</div>

						{/* Role cards */}
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
								gap: '1rem',
								padding: '0 1.25rem 1rem',
							}}
						>
							<RoleCard
								title="Student"
								img={studentImg}
								active={selectedRole === 'student'}
								onClick={() => setSelectedRole('student')}
								accent="#6366f1"
							/>
							<RoleCard
								title="Teacher"
								img={teacherImg}
								active={selectedRole === 'teacher'}
								onClick={() => setSelectedRole('teacher')}
								accent="#f59e42"
							/>
						</div>

						{/* Footer */}
						<div
							style={{
								padding: '0 1.25rem 1.25rem',
								display: 'flex',
								flexDirection: isMobile ? 'column' : 'row',
								gap: '0.75rem',
								alignItems: isMobile ? 'flex-start' : 'center',
								justifyContent: 'space-between',
							}}
						>
							<label
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									color: '#475569',
									fontSize: '0.95rem',
									userSelect: 'none',
								}}
							>
								<input
									type="checkbox"
									checked={rememberRole}
									onChange={e => setRememberRole(e.target.checked)}
								/>
								Remember my role
							</label>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: '0.5rem',
									width: isMobile ? '100%' : 'auto',
									justifyContent: isMobile ? 'space-between' : 'flex-end',
								}}
							>
								<button
									onClick={switchRole}
									style={{
										background: 'transparent',
										color: '#6366f1',
										border: '1px solid #c7d2fe',
										padding: '0.6rem 0.9rem',
										borderRadius: 10,
										cursor: 'pointer',
										fontWeight: 600,
									}}
								>
									I am a {selectedRole === 'student' ? 'Teacher' : 'Student'}
								</button>
								<button
									onClick={continueAuth}
									style={{
										background: '#6366f1',
										color: '#fff',
										border: 'none',
										padding: '0.6rem 1.1rem',
										borderRadius: 10,
										cursor: 'pointer',
										fontWeight: 700,
										minWidth: 180,
										boxShadow: '0 6px 18px rgba(99,102,241,0.25)',
									}}
								>
									Continue to {mode === 'login' ? 'Sign in' : 'Sign up'}
								</button>
							</div>
						</div>
					</div>

					{/* Animations */}
					<style>
						{`
              @keyframes slideUp {
                from { transform: translateY(12%); opacity: 0.9; }
                to { transform: translateY(0); opacity: 1; }
              }
              @keyframes popIn {
                from { transform: scale(0.98); opacity: 0.9; }
                to { transform: scale(1); opacity: 1; }
              }
            `}
					</style>
				</div>
			)}
		</>
	);
};

const RoleCard = ({ title, img, active, onClick, accent }) => (
	<button
		onClick={onClick}
		style={{
			display: 'flex',
			alignItems: 'center',
			gap: '0.9rem',
			border: active ? `2px solid ${accent}` : '1px solid #e5e7eb',
			background: active ? 'rgba(99,102,241,0.05)' : '#fff',
			borderRadius: 14,
			padding: '0.75rem',
			cursor: 'pointer',
			boxShadow: active ? '0 6px 16px rgba(99,102,241,0.12)' : '0 2px 10px rgba(0,0,0,0.04)',
		}}
	>
		<img
			src={img}
			alt={title}
			style={{
				width: 52,
				height: 52,
				borderRadius: '50%',
				objectFit: 'cover',
				border: `2px solid ${accent}33`,
			}}
		/>
		<div style={{ textAlign: 'left' }}>
			<div style={{ fontWeight: 700, color: '#0f172a' }}>{title}</div>
			<div style={{ fontSize: '0.9rem', color: '#64748b' }}>
				{title === 'Student'
					? 'Take exams & get instant feedback'
					: 'Create, manage, and evaluate exams'}
			</div>
		</div>
		<span
			style={{
				marginLeft: 'auto',
				width: 18,
				height: 18,
				borderRadius: '50%',
				border: `2px solid ${active ? accent : '#cbd5e1'}`,
				background: active ? accent : 'transparent',
				display: 'inline-block',
			}}
			aria-hidden
		/>
	</button>
);

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
