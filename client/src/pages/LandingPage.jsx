import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import Footer from '../components/ui/Footer.jsx';

// --- Asset Imports ---
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';
import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.jpg';
import image4 from '../assets/image4.jpg';
import image5 from '../assets/image5.jpg';
import image6 from '../assets/image6.jpg';
import image7 from '../assets/image7.jpg';
import image8 from '../assets/image8.jpg';

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
const cardPhotos = [card1, card2, card3, card1];
const features = [
	{
		title: 'Create, schedule, publish',
		description:
			'Authors compose exams from a question bank, set duration, start and end times, and publish when ready.',
		icon: image2,
	},
	{
		title: 'Students join with a code',
		description:
			'Learners sign in and search by the 8‑character share code to join the correct live exam.',
		icon: image3,
	},
	{
		title: 'Sync while writing',
		description:
			'Answers are synced during the attempt; students can submit once to finalize their submission.',
		icon: image1,
	},
	{
		title: 'Evaluate and review',
		description:
			'Submissions are auto‑evaluated where possible, with teachers able to review and adjust marks.',
		icon: image4,
	},
];

// --- Reusable Hooks ---
const useResponsive = () => {
	const isBrowser = typeof window !== 'undefined';
	const [windowWidth, setWindowWidth] = useState(isBrowser ? window.innerWidth : 1024);

	useEffect(() => {
		if (!isBrowser) return;
		let raf = 0;
		const handleResize = () => {
			cancelAnimationFrame(raf);
			raf = requestAnimationFrame(() => setWindowWidth(window.innerWidth));
		};
		window.addEventListener('resize', handleResize, { passive: true });
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', handleResize);
		};
	}, [isBrowser]);

	return {
		isMobile: windowWidth < 640,
		isTablet: windowWidth >= 640 && windowWidth < 1024,
	};
};

const useParallax = ref => {
	const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
	const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	useEffect(() => {
		if (prefersReduced || !ref.current) return;
		const el = ref.current;
		const onMove = e => {
			const rect = el.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = (e.clientX - cx) / (rect.width / 2);
			const dy = (e.clientY - cy) / (rect.height / 2);
			const clamp = v => Math.max(-1, Math.min(1, v));
			setTilt({ rx: clamp(-dy) * 6, ry: clamp(dx) * 6 });
		};
		const onLeave = () => setTilt({ rx: 0, ry: 0 });

		el.addEventListener('mousemove', onMove);
		el.addEventListener('mouseleave', onLeave);
		return () => {
			el.removeEventListener('mousemove', onMove);
			el.removeEventListener('mouseleave', onLeave);
		};
	}, [ref, prefersReduced]);

	return prefersReduced ? {} : { transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` };
};

// --- Section Components ---

const HeroSection = ({
	isAuthenticated,
	user,
	isDark,
	isMobile,
	isTablet,
	onGetStarted,
	onLearnMore,
}) => {
	const navigate = useNavigate();
	const heroParallaxRef = useRef(null);
	const parallaxStyle = useParallax(heroParallaxRef);
	const role = user?.role || user?.type || '';
	const displayName = user?.fullname || user?.username || 'there';

	const backgroundImages = useMemo(
		() => [
			{ src: image5, top: '10%', left: '5%', size: 80, delay: 0 },
			{ src: image6, top: '15%', right: '8%', size: 70, delay: 2 },
			{ src: image7, bottom: '25%', left: '8%', size: 65, delay: 1 },
			{ src: image8, bottom: '10%', right: '5%', size: 75, delay: 3 },
		],
		[],
	);

	return (
		<section
			aria-label="Hero"
			style={{
				background: isDark
					? 'linear-gradient(135deg, #0b1220 0%, #0f172a 100%)'
					: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)',
				padding: isMobile ? '3.2rem 1rem' : isTablet ? '4.2rem 2rem' : '5rem 3rem',
				position: 'relative',
				overflow: 'hidden',
				minHeight: isMobile ? 'auto' : '78vh',
				display: 'flex',
				alignItems: 'center',
			}}
		>
			{backgroundImages.map((img, index) => (
				<div
					key={index}
					aria-hidden
					style={{
						position: 'absolute',
						top: img.top,
						left: img.left,
						right: img.right,
						bottom: img.bottom,
						width: img.size,
						height: img.size,
						zIndex: 0,
						animation: `float ${3 + index * 0.5}s ease-in-out infinite alternate`,
						animationDelay: `${img.delay}s`,
						display: isMobile && index > 1 ? 'none' : 'block',
					}}
				>
					<img
						src={img.src}
						alt=""
						loading="lazy"
						decoding="async"
						style={{
							width: '100%',
							height: '100%',
							borderRadius: '50%',
							opacity: isDark ? 0.08 : 0.12,
							objectFit: 'cover',
							boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
						}}
					/>
				</div>
			))}
			<div
				style={{
					maxWidth: 1200,
					margin: '0 auto',
					display: 'flex',
					flexDirection: isMobile || isTablet ? 'column' : 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '2.2rem',
					position: 'relative',
					zIndex: 1,
					width: '100%',
				}}
			>
				<div
					style={{
						flex: '1',
						maxWidth: isMobile || isTablet ? '100%' : '50%',
						animation: 'fadeInLeft 0.8s ease-out',
						textAlign: isMobile || isTablet ? 'center' : 'left',
					}}
				>
					<h1
						style={{
							fontSize: 'clamp(1.9rem, 4.2vw, 3.15rem)',
							fontWeight: 900,
							marginBottom: '1rem',
							lineHeight: 1.12,
							color: 'var(--text)',
						}}
					>
						{isAuthenticated ? (
							<>
								Welcome back,{' '}
								<span
									style={{
										backgroundImage: isDark
											? 'linear-gradient(to right, #e5e7eb, #cbd5e1)'
											: 'linear-gradient(to right, #0f172a, #334155)',
										WebkitBackgroundClip: 'text',
										backgroundClip: 'text',
										color: 'transparent',
									}}
								>
									{displayName}
								</span>
							</>
						) : (
							<span
								style={{
									backgroundImage: isDark
										? 'linear-gradient(to right, #e5e7eb, #cbd5e1)'
										: 'linear-gradient(to right, #0f172a, #334155)',
									WebkitBackgroundClip: 'text',
									backgroundClip: 'text',
									color: 'transparent',
								}}
							>
								AI‑Based Exam Evaluation System
							</span>
						)}
					</h1>
					<p
						style={{
							fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
							color: 'var(--text-muted)',
							marginBottom: '1.4rem',
							lineHeight: 1.7,
							maxWidth: 720,
							marginInline: isMobile || isTablet ? 'auto' : 0,
						}}
					>
						{isAuthenticated
							? role === 'teacher'
								? 'Create and schedule exams, manage questions, and review submissions with explainable scoring.'
								: 'Join exams with a share code, sync responses while writing, and review detailed results.'
							: 'Plan, deliver, and evaluate exams end‑to‑end. Teachers publish live windows; students join with a code; submissions sync and are evaluated with a clear workflow.'}
					</p>
					<div
						style={{
							display: 'flex',
							gap: '0.8rem',
							flexWrap: 'wrap',
							justifyContent: isMobile || isTablet ? 'center' : 'flex-start',
						}}
					>
						{isAuthenticated ? (
							<>
								<button
									onClick={() =>
										navigate(
											role === 'teacher'
												? '/teacher/exams'
												: '/student/exams',
										)
									}
									aria-label="Open Exams"
									style={styles.buttonPrimary}
								>
									Open Exams
								</button>
								<button
									onClick={() =>
										navigate(role === 'teacher' ? '/teacher' : '/student')
									}
									aria-label="Open Dashboard"
									style={styles.buttonSecondary}
								>
									Open Dashboard
								</button>
							</>
						) : (
							<>
								<button
									onClick={onGetStarted}
									aria-label="Get Started"
									style={styles.buttonPrimary}
								>
									Get Started
								</button>
								<button
									onClick={onLearnMore}
									aria-label="Learn More"
									style={styles.buttonSecondary}
								>
									How it works
								</button>
							</>
						)}
					</div>
				</div>
				<div
					ref={heroParallaxRef}
					style={{
						flex: isMobile || isTablet ? '1' : '0.9',
						display: 'flex',
						justifyContent: 'center',
						marginTop: isMobile ? '2.5rem' : 0,
						animation: 'fadeInRight 0.8s ease-out',
						perspective: '1000px',
					}}
				>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(2, 1fr)',
							gap: isMobile ? '0.75rem' : '1.1rem',
							maxWidth: isMobile ? '300px' : isTablet ? '420px' : '520px',
							width: '100%',
							transformStyle: 'preserve-3d',
							transition: 'transform 200ms ease-out',
							...parallaxStyle,
						}}
					>
						{heroImages.map((src, i) => (
							<div
								key={i}
								style={{
									transform: `translateZ(${[20, 10, 8, 16][i]}px)`,
									boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
									borderRadius: '1rem',
									overflow: 'hidden',
									border: '1px solid var(--border)',
								}}
							>
								<img
									src={src}
									alt={`Platform visual ${i + 1}`}
									loading="lazy"
									decoding="async"
									referrerPolicy="no-referrer"
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
};

const HowItWorksSection = React.forwardRef(({ isMobile, isTablet }, ref) => {
	const navigate = useNavigate();
	return (
		<section
			ref={ref}
			aria-label="How it works"
			style={{
				padding: isMobile ? '2.4rem 1rem' : isTablet ? '3rem 2rem' : '3.6rem 3rem',
				background: 'var(--surface)',
				borderTop: '1px solid var(--border)',
				borderBottom: '1px solid var(--border)',
				scrollMarginTop: '20px',
			}}
		>
			<div style={{ maxWidth: 1100, margin: '0 auto' }}>
				<h2 style={styles.sectionTitle}>How the platform works</h2>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
						gap: 14,
						marginTop: 24,
					}}
				>
					<div style={styles.infoCard}>
						<h3 style={styles.infoCardTitle}>Teachers</h3>
						<ol style={styles.infoCardList}>
							<li>Create exams and add MCQ/subjective questions.</li>
							<li>Set duration and a start/end window, then publish.</li>
							<li>Share the 8‑character exam code with students.</li>
							<li>Review submissions and adjust marks when needed.</li>
						</ol>
						<div style={{ marginTop: 12 }}>
							<button
								onClick={() => navigate('/teacher/exams')}
								style={styles.buttonTertiary}
							>
								Open exam manager
							</button>
						</div>
					</div>
					<div style={styles.infoCard}>
						<h3 style={styles.infoCardTitle}>Students</h3>
						<ol style={styles.infoCardList}>
							<li>Sign in to your account.</li>
							<li>Go to Exams and search using the 8‑character code.</li>
							<li>Start the exam; answers sync while you write.</li>
							<li>Submit once and view results when released.</li>
						</ol>
						<div style={{ marginTop: 12 }}>
							<button
								onClick={() => navigate('/student/exams')}
								style={styles.buttonTertiary}
							>
								Open student exams
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
});

const FeaturesSection = ({ isMobile, isTablet }) => (
	<section
		aria-label="Features"
		style={{
			padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
			backgroundColor: 'var(--bg)',
		}}
	>
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
			<h2 style={styles.sectionTitle}>Product overview</h2>
			<p style={styles.sectionSubtitle}>
				End‑to‑end assessments: compose and publish exams, students join with a share code,
				answers sync during writing, and submissions are evaluated with a teacher‑reviewable
				workflow.
			</p>
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile
						? '1fr'
						: isTablet
							? 'repeat(2, 1fr)'
							: 'repeat(4, 1fr)',
					gap: isMobile ? '1.2rem' : '1.6rem',
					marginInline: 'auto',
				}}
			>
				{features.map((feature, index) => (
					<div key={index} style={styles.featureCard}>
						<div style={{ width: 76, height: 76, margin: '0 auto 1rem' }}>
							<img
								src={feature.icon}
								alt={feature.title}
								loading="lazy"
								decoding="async"
								style={styles.featureIcon}
							/>
						</div>
						<h3 style={styles.featureTitle}>{feature.title}</h3>
						<p style={styles.featureDescription}>{feature.description}</p>
					</div>
				))}
			</div>
		</div>
	</section>
);

const RoleSelectionSection = React.forwardRef(
	({ isMobile, isTablet, isDark, onGoToAuth, onHowItWorks }, ref) => (
		<section
			ref={ref}
			aria-label="Choose Your Role"
			style={{
				padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
				background: isDark
					? 'linear-gradient(135deg, #1e293b, #020617)'
					: 'linear-gradient(135deg, #f8fafc, #eef2ff)',
				textAlign: 'center',
				position: 'relative',
				overflow: 'hidden',
				scrollMarginTop: 20,
			}}
		>
			<div
				aria-hidden
				style={{
					position: 'absolute',
					width: '100%',
					height: '100%',
					top: 0,
					left: 0,
					background: `url(${image8})`,
					backgroundSize: 'cover',
					opacity: 0.03,
					zIndex: 0,
				}}
			/>
			<div style={{ position: 'relative', zIndex: 1 }}>
				<h2 style={styles.sectionTitle}>Choose your role</h2>
				<p style={styles.sectionSubtitle}>
					Sign in to continue. Your institution may provision or invite your account.
				</p>
				<div
					style={{
						display: 'flex',
						gap: isMobile ? '1.4rem' : '2rem',
						justifyContent: 'center',
						flexWrap: 'wrap',
					}}
				>
					<RoleCard
						role="Student"
						description="Join exams with a share code and view your results."
						image={studentImg}
						color="#6366f1"
						gradient="linear-gradient(135deg, #4f46e5, #6366f1)"
						borderColor="#c7d2fe"
						textColor="#3730a3"
						onAuth={() => onGoToAuth('student', 'login')}
						onHowItWorks={onHowItWorks}
						isMobile={isMobile}
						isTablet={isTablet}
					/>
					<RoleCard
						role="Teacher"
						description="Create, schedule, publish, and evaluate—end to end."
						image={teacherImg}
						color="#f97316"
						gradient="linear-gradient(135deg, #f97316, #fb923c)"
						borderColor="#fed7aa"
						textColor="#9a3412"
						onAuth={() => onGoToAuth('teacher', 'login')}
						onHowItWorks={onHowItWorks}
						isMobile={isMobile}
						isTablet={isTablet}
					/>
				</div>
			</div>
		</section>
	),
);

const RoleCard = ({
	role,
	description,
	image,
	color,
	gradient,
	borderColor,
	textColor,
	onAuth,
	onHowItWorks,
	isMobile,
	isTablet,
}) => (
	<div
		className="card-hover"
		style={{
			background: 'var(--surface)',
			borderRadius: '1.25rem',
			border: '1px solid var(--border)',
			boxShadow: '0 10px 28px rgba(2,6,23,0.06)',
			padding: isMobile ? '1.2rem' : 'clamp(1.4rem, 2.2vw, 2rem)',
			textAlign: 'center',
			flex: isMobile ? '1 1 100%' : isTablet ? '1 1 46%' : '1 1 360px',
			maxWidth: isMobile ? '100%' : isTablet ? '520px' : '380px',
			minWidth: isMobile ? 'auto' : 280,
		}}
	>
		<img
			src={image}
			alt={role}
			loading="lazy"
			decoding="async"
			width={112}
			height={112}
			style={{
				width: isMobile ? 96 : 112,
				height: isMobile ? 96 : 112,
				borderRadius: '50%',
				objectFit: 'cover',
				margin: '0 auto 1rem',
				border: `3px solid ${color}`,
				boxShadow: `0 8px 20px ${color}40`,
				display: 'block',
			}}
		/>
		<h3 style={{ ...styles.roleTitle, color: textColor }}>{role}</h3>
		<p style={styles.roleDescription}>{description}</p>
		<div
			style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}
		>
			<button
				aria-label={`${role} Sign in`}
				onClick={onAuth}
				className="focus-ring"
				style={{ ...styles.roleButtonPrimary, background: gradient }}
			>
				Sign in
			</button>
			<button
				aria-label={`Learn how it works for ${role}s`}
				onClick={onHowItWorks}
				className="focus-ring"
				style={{ ...styles.roleButtonSecondary, color, borderColor }}
			>
				How it works
			</button>
		</div>
	</div>
);

const WhatWeDoSection = ({ isMobile, isTablet, isDark }) => (
	<section
		aria-label="What we do"
		style={{
			padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
			background: isDark ? 'var(--bg)' : 'var(--surface)',
			borderTop: '1px solid var(--border)',
			borderBottom: '1px solid var(--border)',
		}}
	>
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
			<h2 style={styles.sectionTitle}>What we do</h2>
			<p style={styles.sectionSubtitle}>
				We streamline assessment—from creation to grading—to save time, improve consistency,
				and deliver clear insights.
			</p>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile
						? '1fr'
						: isTablet
							? 'repeat(2, 1fr)'
							: 'repeat(4, 1fr)',
					gap: isMobile ? '1rem' : '1.4rem',
				}}
			>
				<div className="card-hover" style={styles.featureCard}>
					<img
						src={image2}
						alt="Exam building"
						style={styles.featureIcon}
						loading="lazy"
						width={320}
						height={240}
					/>
					<h3 style={styles.featureTitle}>End‑to‑end exam management</h3>
					<p style={styles.featureDescription}>
						Create, schedule, and publish exams with MCQ and subjective questions, all
						in one place.
					</p>
				</div>
				<div className="card-hover" style={styles.featureCard}>
					<img
						src={image3}
						alt="Students join"
						style={styles.featureIcon}
						loading="lazy"
						width={320}
						height={240}
					/>
					<h3 style={styles.featureTitle}>Frictionless student access</h3>
					<p style={styles.featureDescription}>
						Students join with a share code and get a focused, responsive writing
						experience.
					</p>
				</div>
				<div className="card-hover" style={styles.featureCard}>
					<img
						src={image1}
						alt="Sync answers"
						style={styles.featureIcon}
						loading="lazy"
						width={320}
						height={240}
					/>
					<h3 style={styles.featureTitle}>Autosave and sync</h3>
					<p style={styles.featureDescription}>
						Answers are synced during the attempt to prevent data loss and reduce
						anxiety.
					</p>
				</div>
				<div className="card-hover" style={styles.featureCard}>
					<img
						src={image4}
						alt="Evaluate and review"
						style={styles.featureIcon}
						loading="lazy"
						width={320}
						height={240}
					/>
					<h3 style={styles.featureTitle}>AI‑assisted evaluation</h3>
					<p style={styles.featureDescription}>
						Objective answers are auto‑graded; teachers review subjective responses with
						clear rubrics.
					</p>
				</div>
			</div>
		</div>
	</section>
);

const HowWeDoSection = ({ isMobile, isTablet }) => (
	<section
		aria-label="How we do it"
		style={{
			padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
			background: 'var(--bg)',
		}}
	>
		<div style={{ maxWidth: 1100, margin: '0 auto' }}>
			<h2 style={styles.sectionTitle}>How we do it</h2>
			<p style={styles.sectionSubtitle}>
				A modern MERN stack with real‑time sync, robust APIs, and role‑based security.
			</p>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
					gap: isMobile ? '1rem' : '2rem',
					alignItems: 'stretch',
				}}
			>
				<div style={styles.infoCard}>
					<ul style={{ ...styles.infoCardList, margin: 0, listStyle: 'disc' }}>
						<li>
							Reliable autosave and WebSocket updates for live progress and
							notifications.
						</li>
						<li>
							Clean REST API with validation and layered services for exam logic and
							evaluation.
						</li>
						<li>
							Role‑based access control for students and teachers with JWT
							authentication.
						</li>
						<li>Explainable scoring for transparency and easier moderation.</li>
						<li>
							Scalable data model on MongoDB optimized for exam, question, and
							submission flows.
						</li>
					</ul>
				</div>

				<div
					style={{
						...styles.infoCard,
						display: 'flex',
						flexDirection: 'column',
						justifyContent: 'center',
					}}
				>
					<h3 style={{ ...styles.infoCardTitle, marginBottom: 8 }}>Under the hood</h3>
					<ol style={styles.infoCardList}>
						<li>React + Vite frontend with responsive UI and accessibility in mind.</li>
						<li>
							Express backend with modular controllers, services, and middlewares.
						</li>
						<li>Socket.IO channels for submissions, issues, and status changes.</li>
						<li>
							Evaluation service to score objective items and assist subjective
							review.
						</li>
						<li>Environment‑driven config for local and cloud deployments.</li>
					</ol>
				</div>
			</div>
		</div>
	</section>
);

const MoreAboutSection = ({ isMobile, isTablet }) => (
	<section
		aria-label="More about our application"
		style={{
			padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
			background: 'var(--surface)',
			borderTop: '1px solid var(--border)',
			borderBottom: '1px solid var(--border)',
		}}
	>
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
			<h2 style={styles.sectionTitle}>More about our application</h2>
			<p style={styles.sectionSubtitle}>
				Built for reliability, clarity, and scale—so teachers can focus on teaching and
				students on learning.
			</p>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile
						? '1fr'
						: isTablet
							? 'repeat(2, 1fr)'
							: 'repeat(3, 1fr)',
					gap: isMobile ? '1rem' : '1.4rem',
				}}
			>
				<div style={styles.featureCard}>
					<h3 style={styles.featureTitle}>Security‑first</h3>
					<p style={styles.featureDescription}>
						JWT auth, scoped endpoints, and defensive validations protect user data and
						exam integrity.
					</p>
				</div>
				<div style={styles.featureCard}>
					<h3 style={styles.featureTitle}>Teacher‑friendly workflows</h3>
					<p style={styles.featureDescription}>
						Question banks, publish windows, and clear review tools reduce manual
						effort.
					</p>
				</div>
				<div style={styles.featureCard}>
					<h3 style={styles.featureTitle}>Student‑centric UX</h3>
					<p style={styles.featureDescription}>
						Distraction‑free exam UI with autosave and clear submission status at every
						step.
					</p>
				</div>
			</div>
		</div>
	</section>
);

// --- Main Component ---

const LandingPage = () => {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const { user, isAuthenticated } = useAuth();
	const { isMobile, isTablet } = useResponsive();

	const roleSelectionRef = useRef(null);
	const detailsRef = useRef(null);

	const scrollToSection = ref =>
		ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	const goToAuth = (role, mode = 'login') => {
		localStorage.setItem('preferredRole', role);
		navigate(`/auth?mode=${encodeURIComponent(mode)}&role=${encodeURIComponent(role)}`);
	};

	return (
		<div style={styles.pageContainer}>
			<HeroSection
				isAuthenticated={isAuthenticated}
				user={user}
				isDark={theme === 'dark'}
				isMobile={isMobile}
				isTablet={isTablet}
				onGetStarted={() => scrollToSection(roleSelectionRef)}
				onLearnMore={() => scrollToSection(detailsRef)}
			/>

			<WhatWeDoSection isMobile={isMobile} isTablet={isTablet} isDark={theme === 'dark'} />

			<HowItWorksSection ref={detailsRef} isMobile={isMobile} isTablet={isTablet} />

			{!isAuthenticated && <FeaturesSection isMobile={isMobile} isTablet={isTablet} />}

			<HowWeDoSection isMobile={isMobile} isTablet={isTablet} />

			{!isAuthenticated && (
				<RoleSelectionSection
					ref={roleSelectionRef}
					isMobile={isMobile}
					isTablet={isTablet}
					isDark={theme === 'dark'}
					onGoToAuth={goToAuth}
					onHowItWorks={() => scrollToSection(detailsRef)}
				/>
			)}

			<MoreAboutSection isMobile={isMobile} isTablet={isTablet} />

			<Footer />

			<style>
				{`
          @keyframes float { 0% { transform: translateY(0px); } 100% { transform: translateY(-15px); } }
          @keyframes fadeInLeft { from { opacity: 0; transform: translateX(-18px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes fadeInRight { from { opacity: 0; transform: translateX(18px); } to { opacity: 1; transform: translateX(0); } }
          @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
        `}
			</style>
		</div>
	);
};

// --- Styles ---
const styles = {
	pageContainer: {
		fontFamily: "Inter,'Segoe UI',Roboto,system-ui,-apple-system,sans-serif",
		overflowX: 'hidden',
		color: 'var(--text)',
		background: 'var(--bg)',
	},
	buttonPrimary: {
		padding: '0.75rem 1.5rem',
		backgroundColor: 'var(--primary-strong)',
		color: 'white',
		border: 'none',
		borderRadius: '0.55rem',
		cursor: 'pointer',
		fontSize: '1rem',
		fontWeight: 800,
		boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
	},
	buttonSecondary: {
		padding: '0.75rem 1.5rem',
		backgroundColor: 'transparent',
		color: 'var(--primary)',
		border: '1px solid var(--primary)',
		borderRadius: '0.55rem',
		cursor: 'pointer',
		fontSize: '1rem',
		fontWeight: 800,
	},
	buttonTertiary: {
		padding: '10px 14px',
		borderRadius: 10,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		fontWeight: 800,
		cursor: 'pointer',
	},
	sectionTitle: {
		fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
		fontWeight: 800,
		color: 'var(--text)',
		textAlign: 'center',
		marginBottom: '1.2rem',
	},
	sectionSubtitle: {
		fontSize: 'clamp(0.95rem, 1vw, 1.08rem)',
		color: 'var(--text-muted)',
		textAlign: 'center',
		maxWidth: 860,
		margin: '0 auto 2.2rem',
		lineHeight: 1.7,
	},
	infoCard: {
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: 14,
		padding: 16,
	},
	infoCardTitle: { margin: 0, color: 'var(--text)' },
	infoCardList: {
		margin: '0.5rem 0 0 1rem',
		padding: 0,
		color: 'var(--text-muted)',
		lineHeight: 1.7,
	},
	featureCard: {
		padding: '1.4rem',
		backgroundColor: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: '1rem',
		boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
		textAlign: 'center',
	},
	featureIcon: {
		width: '100%',
		height: '100%',
		borderRadius: '1rem',
		objectFit: 'cover',
		border: '2px solid rgba(99,102,241,0.3)',
	},
	featureTitle: {
		fontSize: '1.05rem',
		fontWeight: 800,
		color: 'var(--text)',
		marginBottom: '0.5rem',
	},
	featureDescription: {
		color: 'var(--text-muted)',
		fontSize: '0.95rem',
		lineHeight: 1.6,
	},
	roleTitle: {
		fontSize: 'clamp(1.1rem, 1.6vw, 1.45rem)',
		fontWeight: 800,
		marginBottom: '0.55rem',
	},
	roleDescription: {
		color: '#475569',
		fontSize: 'clamp(0.95rem, 1vw, 1rem)',
		marginBottom: '1.05rem',
		lineHeight: 1.65,
		maxWidth: 440,
		marginInline: 'auto',
	},
	roleButtonPrimary: {
		padding: '0.65rem 1.15rem',
		color: 'white',
		border: 'none',
		borderRadius: '0.6rem',
		cursor: 'pointer',
		fontWeight: 800,
	},
	roleButtonSecondary: {
		padding: '0.65rem 1.15rem',
		backgroundColor: 'transparent',
		borderRadius: '0.6rem',
		cursor: 'pointer',
		fontWeight: 700,
		border: '1px solid',
	},
	footer: {
		backgroundColor: 'var(--surface)',
		color: 'var(--text)',
		padding: '2rem',
		textAlign: 'center',
		borderTop: '1px solid var(--border)',
	},
};

export default LandingPage;
