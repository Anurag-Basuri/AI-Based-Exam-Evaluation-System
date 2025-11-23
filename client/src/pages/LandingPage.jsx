import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import Footer from '../components/ui/Footer.jsx';

// --- Asset Imports ---
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';

// New Generated Assets
import hero1 from '../assets/hero_1.png';
import hero2 from '../assets/hero_2.png';
import hero3 from '../assets/hero_3.png';
import hero4 from '../assets/hero_4.png';
import card1 from '../assets/card_1.png';
import card2 from '../assets/card_2.png';
import card3 from '../assets/card_3.png';

// --- Data & Constants ---
const heroImages = [hero1, hero2, hero3, hero4];

const features = [
	{
		title: 'Create & Schedule',
		description:
			'Compose exams from a rich question bank. Set precise start/end windows and duration.',
		icon: card2,
	},
	{
		title: 'Secure Access',
		description:
			'Students join via a unique 8-character code. Fullscreen mode ensures integrity.',
		icon: card3,
	},
	{
		title: 'Real-time Sync',
		description:
			'Answers are autosaved instantly. Never lose progress due to connectivity issues.',
		icon: hero1,
	},
	{
		title: 'AI Evaluation',
		description:
			'Instant grading for MCQs. AI-assisted grading for subjective answers with detailed feedback.',
		icon: card1,
	},
];

// --- Reusable Hooks ---
const useResponsive = () => {
	const [windowWidth, setWindowWidth] = useState(
		typeof window !== 'undefined' ? window.innerWidth : 1024,
	);

	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	return {
		isMobile: windowWidth < 640,
		isTablet: windowWidth >= 640 && windowWidth < 1024,
		isDesktop: windowWidth >= 1024,
	};
};

// --- Components ---

const HeroSection = ({ isAuthenticated, user, isDark, isMobile }) => {
	const navigate = useNavigate();
	const role = user?.role || user?.type || '';
	const displayName = user?.fullname || user?.username || 'there';

	return (
		<section
			style={{
				position: 'relative',
				minHeight: '90vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				overflow: 'hidden',
				padding: isMobile ? '6rem 1rem 4rem' : '8rem 2rem 6rem',
				background: isDark
					? 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)'
					: 'radial-gradient(circle at 50% 0%, #eff6ff 0%, #f8fafc 100%)',
			}}
		>
			{/* Background Blobs */}
			<div
				style={{
					position: 'absolute',
					top: '-10%',
					left: '-10%',
					width: '50%',
					height: '50%',
					background: 'var(--primary)',
					filter: 'blur(120px)',
					opacity: 0.1,
					borderRadius: '50%',
					zIndex: 0,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					bottom: '-10%',
					right: '-10%',
					width: '50%',
					height: '50%',
					background: 'var(--secondary)',
					filter: 'blur(120px)',
					opacity: 0.1,
					borderRadius: '50%',
					zIndex: 0,
				}}
			/>

			<div
				style={{
					maxWidth: 1280,
					width: '100%',
					zIndex: 1,
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
					gap: '4rem',
					alignItems: 'center',
				}}
			>
				{/* Text Content */}
				<div style={{ textAlign: isMobile ? 'center' : 'left' }}>
					<div
						style={{
							display: 'inline-block',
							padding: '0.5rem 1rem',
							borderRadius: '9999px',
							background: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.1)',
							border: '1px solid var(--primary-light)',
							color: 'var(--primary)',
							fontSize: '0.875rem',
							fontWeight: 600,
							marginBottom: '1.5rem',
						}}
					>
						✨ The Future of Assessments
					</div>
					<h1
						style={{
							fontSize: isMobile ? '2.5rem' : '4rem',
							fontWeight: 800,
							lineHeight: 1.1,
							marginBottom: '1.5rem',
							letterSpacing: '-0.02em',
						}}
					>
						{isAuthenticated ? (
							<>
								Welcome back, <br />
								<span className="gradient-text">{displayName}</span>
							</>
						) : (
							<>
								Smart Exams, <br />
								<span className="gradient-text">Fairer Results.</span>
							</>
						)}
					</h1>
					<p
						style={{
							fontSize: '1.125rem',
							color: 'var(--text-muted)',
							marginBottom: '2.5rem',
							lineHeight: 1.6,
							maxWidth: isMobile ? '100%' : '90%',
						}}
					>
						{isAuthenticated
							? role === 'teacher'
								? 'Manage your exams, track student progress, and grade with AI assistance.'
								: 'Access your scheduled exams, view your results, and track your performance.'
							: 'Experience the next generation of exam evaluation. AI-powered grading, real-time synchronization, and a secure environment for students and teachers.'}
					</p>

					<div
						style={{
							display: 'flex',
							gap: '1rem',
							justifyContent: isMobile ? 'center' : 'flex-start',
							flexWrap: 'wrap',
						}}
					>
						{isAuthenticated ? (
							<>
								<button
									onClick={() =>
										navigate(
											role === 'teacher' ? '/teacher/exams' : '/student/exams',
										)
									}
									style={{
										padding: '0.875rem 2rem',
										borderRadius: '12px',
										background: 'var(--primary)',
										color: '#fff',
										fontWeight: 600,
										border: 'none',
										cursor: 'pointer',
										fontSize: '1rem',
										boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
									}}
									className="card-hover"
								>
									Go to Exams
								</button>
								<button
									onClick={() =>
										navigate(role === 'teacher' ? '/teacher' : '/student')
									}
									style={{
										padding: '0.875rem 2rem',
										borderRadius: '12px',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 600,
										border: '1px solid var(--border)',
										cursor: 'pointer',
										fontSize: '1rem',
									}}
									className="card-hover"
								>
									Dashboard
								</button>
							</>
						) : (
							<>
								<button
									onClick={() => document.getElementById('roles').scrollIntoView({ behavior: 'smooth' })}
									style={{
										padding: '0.875rem 2rem',
										borderRadius: '12px',
										background: 'var(--primary)',
										color: '#fff',
										fontWeight: 600,
										border: 'none',
										cursor: 'pointer',
										fontSize: '1rem',
										boxShadow: '0 4px 14px 0 rgba(59, 130, 246, 0.39)',
									}}
									className="card-hover"
								>
									Get Started
								</button>
								<button
									onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}
									style={{
										padding: '0.875rem 2rem',
										borderRadius: '12px',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 600,
										border: '1px solid var(--border)',
										cursor: 'pointer',
										fontSize: '1rem',
									}}
									className="card-hover"
								>
									Learn More
								</button>
							</>
						)}
					</div>
				</div>

				{/* Hero Visual */}
				<div
					style={{
						position: 'relative',
						height: isMobile ? '300px' : '500px',
						display: isMobile ? 'none' : 'block', // Hide on mobile for simpler view, or adjust
					}}
				>
					<div
						className="animate-float"
						style={{
							position: 'absolute',
							top: '0',
							right: '0',
							width: '80%',
							height: '80%',
							borderRadius: '24px',
							overflow: 'hidden',
							boxShadow: 'var(--shadow-2xl)',
							border: '1px solid var(--border)',
							zIndex: 2,
						}}
					>
						<img
							src={hero1}
							alt="Dashboard"
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					</div>
					<div
						className="animate-float"
						style={{
							position: 'absolute',
							bottom: '0',
							left: '0',
							width: '60%',
							height: '60%',
							borderRadius: '24px',
							overflow: 'hidden',
							boxShadow: 'var(--shadow-xl)',
							border: '1px solid var(--border)',
							zIndex: 3,
							animationDelay: '1s',
						}}
					>
						<img
							src={hero3}
							alt="Analytics"
							style={{ width: '100%', height: '100%', objectFit: 'cover' }}
						/>
					</div>
				</div>
			</div>
		</section>
	);
};

const FeaturesSection = ({ isMobile }) => (
	<section
		id="features"
		style={{
			padding: isMobile ? '4rem 1rem' : '6rem 2rem',
			background: 'var(--surface)',
		}}
	>
		<div style={{ maxWidth: 1280, margin: '0 auto' }}>
			<div style={{ textAlign: 'center', marginBottom: '4rem' }}>
				<h2
					style={{
						fontSize: isMobile ? '2rem' : '2.5rem',
						fontWeight: 700,
						marginBottom: '1rem',
					}}
				>
					Why choose our platform?
				</h2>
				<p
					style={{
						color: 'var(--text-muted)',
						fontSize: '1.125rem',
						maxWidth: '600px',
						margin: '0 auto',
					}}
				>
					We combine security, reliability, and AI to deliver the best assessment experience.
				</p>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: '2rem',
				}}
			>
				{features.map((feature, index) => (
					<div
						key={index}
						className="card-hover glass-card"
						style={{
							padding: '2rem',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'flex-start',
							background: 'var(--bg)',
						}}
					>
						<div
							style={{
								width: '64px',
								height: '64px',
								borderRadius: '16px',
								overflow: 'hidden',
								marginBottom: '1.5rem',
								boxShadow: 'var(--shadow-md)',
							}}
						>
							<img
								src={feature.icon}
								alt={feature.title}
								style={{ width: '100%', height: '100%', objectFit: 'cover' }}
							/>
						</div>
						<h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.75rem' }}>
							{feature.title}
						</h3>
						<p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>
							{feature.description}
						</p>
					</div>
				))}
			</div>
		</div>
	</section>
);

const RoleCard = ({ role, description, image, color, onClick, isMobile }) => (
	<div
		onClick={onClick}
		className="card-hover"
		style={{
			background: 'var(--surface)',
			borderRadius: '24px',
			border: '1px solid var(--border)',
			overflow: 'hidden',
			cursor: 'pointer',
			position: 'relative',
			boxShadow: 'var(--shadow-lg)',
		}}
	>
		<div style={{ height: '200px', overflow: 'hidden' }}>
			<img
				src={image}
				alt={role}
				style={{
					width: '100%',
					height: '100%',
					objectFit: 'cover',
					transition: 'transform 0.3s ease',
				}}
			/>
		</div>
		<div style={{ padding: '2rem' }}>
			<h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color }}>
				{role}
			</h3>
			<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{description}</p>
			<button
				style={{
					width: '100%',
					padding: '0.75rem',
					borderRadius: '10px',
					background: color,
					color: '#fff',
					border: 'none',
					fontWeight: 600,
					cursor: 'pointer',
				}}
			>
				Login as {role}
			</button>
		</div>
	</div>
);

const RoleSelectionSection = ({ isMobile, onAuth }) => (
	<section
		id="roles"
		style={{
			padding: isMobile ? '4rem 1rem' : '6rem 2rem',
			background: 'var(--bg-secondary)',
		}}
	>
		<div style={{ maxWidth: 1000, margin: '0 auto' }}>
			<div style={{ textAlign: 'center', marginBottom: '4rem' }}>
				<h2
					style={{
						fontSize: isMobile ? '2rem' : '2.5rem',
						fontWeight: 700,
						marginBottom: '1rem',
					}}
				>
					Get Started
				</h2>
				<p
					style={{
						color: 'var(--text-muted)',
						fontSize: '1.125rem',
						maxWidth: '600px',
						margin: '0 auto',
					}}
				>
					Select your role to sign in or create an account.
				</p>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
					gap: '2rem',
				}}
			>
				<RoleCard
					role="Student"
					description="Join exams, track your progress, and view your results instantly."
					image={studentImg}
					color="var(--primary)"
					onClick={() => onAuth('student', 'login')}
					isMobile={isMobile}
				/>
				<RoleCard
					role="Teacher"
					description="Create exams, manage students, and grade submissions with AI."
					image={teacherImg}
					color="var(--warning)"
					onClick={() => onAuth('teacher', 'login')}
					isMobile={isMobile}
				/>
			</div>
		</div>
	</section>
);

const LandingPage = () => {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const { user, isAuthenticated } = useAuth();
	const { isMobile } = useResponsive();
	const isDark = theme === 'dark';

	const handleAuth = (role, mode) => {
		navigate(`/auth?role=${role}&mode=${mode}`);
	};

	return (
		<div className="app-shell">
			<HeroSection
				isAuthenticated={isAuthenticated}
				user={user}
				isDark={isDark}
				isMobile={isMobile}
			/>
			<FeaturesSection isMobile={isMobile} />
			<RoleSelectionSection isMobile={isMobile} onAuth={handleAuth} />
			<Footer />
		</div>
	);
};

export default LandingPage;
