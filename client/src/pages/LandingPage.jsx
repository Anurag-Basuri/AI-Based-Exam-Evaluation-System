import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';

// Local assets
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

// Curated visuals
const heroImages = [
	'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=1400&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1518081461904-9acb9846e1b9?q=80&w=1400&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1513258496099-48168024aec0?q=80&w=1400&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1400&auto=format&fit=crop',
];

const cardPhotos = [
	'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=800&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1498079022511-d15614cb1c02?q=80&w=800&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1509062522246-3755977927d7?q=80&w=800&auto=format&fit=crop',
	'https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=800&auto=format&fit=crop',
];

const LandingPage = () => {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const { user, isAuthenticated } = useAuth();
	const isDark = theme === 'dark';

	const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
	const [windowWidth, setWindowWidth] = useState(initialWidth);

	// Refs for smooth scroll and parallax
	const roleSelectionRef = useRef(null);
	const detailsRef = useRef(null);
	const heroParallaxRef = useRef(null);

	// Reduced motion
	const prefersReduced =
		typeof window !== 'undefined' &&
		window.matchMedia &&
		window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// Breakpoints
	const isMobile = windowWidth < 640;
	const isTablet = windowWidth >= 640 && windowWidth < 1024;

	// Personalization
	const role = user?.role || user?.type || '';
	const displayName = user?.fullname || user?.username || 'there';

	// Resize listener
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const handleResize = () => setWindowWidth(window.innerWidth || 1024);
		window.addEventListener('resize', handleResize, { passive: true });
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	// Floating background images
	const backgroundImages = useMemo(
		() => [
			{ src: image5, top: '10%', left: '5%', size: 80, delay: 0 },
			{ src: image6, top: '15%', right: '8%', size: 70, delay: 2 },
			{ src: image7, bottom: '25%', left: '8%', size: 65, delay: 1 },
			{ src: image8, bottom: '10%', right: '5%', size: 75, delay: 3 },
		],
		[],
	);

	const scrollToSection = ref =>
		ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	const goToAuth = (role, mode = 'login') => {
		try {
			localStorage.setItem('preferredRole', role);
		} catch {}
		navigate(`/auth?mode=${encodeURIComponent(mode)}&role=${encodeURIComponent(role)}`);
	};

	// Subtle 3D parallax for hero images
	const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
	useEffect(() => {
		if (prefersReduced) return;
		const el = heroParallaxRef.current;
		if (!el) return;

		const onMove = e => {
			const rect = el.getBoundingClientRect();
			const cx = rect.left + rect.width / 2;
			const cy = rect.top + rect.height / 2;
			const dx = (e.clientX - cx) / (rect.width / 2);
			const dy = (e.clientY - cy) / (rect.height / 2);
			const clamp = v => Math.max(-1, Math.min(1, v));
			const ry = clamp(dx) * 6; // rotateY
			const rx = clamp(-dy) * 6; // rotateX
			setTilt({ rx, ry });
		};

		const onLeave = () => setTilt({ rx: 0, ry: 0 });

		el.addEventListener('mousemove', onMove);
		el.addEventListener('mouseleave', onLeave);
		return () => {
			el.removeEventListener('mousemove', onMove);
			el.removeEventListener('mouseleave', onLeave);
		};
	}, [prefersReduced]);

	// Real features (no fake numbers)
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

	const QuickAction = ({ title, subtitle, cta, onClick, tone = 'indigo', photo }) => {
		const tones = {
			indigo: { b: '#4f46e5', g1: '#6366f1', g2: '#a5b4fc' },
			emerald: { b: '#059669', g1: '#10b981', g2: '#6ee7b7' },
			amber: { b: '#d97706', g1: '#f59e0b', g2: '#fcd34d' },
			rose: { b: '#e11d48', g1: '#f43f5e', g2: '#fb7185' },
		};
		const t = tones[tone] || tones.indigo;
		return (
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
					gap: 12,
					border: '1px solid var(--border)',
					borderRadius: 16,
					background: 'var(--surface)',
					boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
					overflow: 'hidden',
				}}
			>
				<div style={{ padding: '16px 16px 18px 16px' }}>
					<span
						style={{
							display: 'inline-block',
							padding: '6px 10px',
							borderRadius: 999,
							background: `linear-gradient(135deg, ${t.g1}20, ${t.g2}26)`,
							border: `1px solid ${t.g1}40`,
							color: t.b,
							fontWeight: 800,
							fontSize: 12,
							marginBottom: 8,
						}}
					>
						{title}
					</span>
					<p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
						{subtitle}
					</p>
					<div style={{ marginTop: 12 }}>
						<button
							onClick={onClick}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: 'none',
								background: `linear-gradient(135deg, ${t.g1}, ${t.b})`,
								color: '#fff',
								fontWeight: 800,
								cursor: 'pointer',
								boxShadow: `0 8px 20px ${t.b}30`,
							}}
						>
							{cta}
						</button>
					</div>
				</div>
				<div style={{ position: 'relative', minHeight: 150 }}>
					<img
						src={photo}
						alt={title}
						loading="lazy"
						decoding="async"
						referrerPolicy="no-referrer"
						style={{ width: '100%', height: '100%', objectFit: 'cover' }}
					/>
				</div>
			</div>
		);
	};

	return (
		<div
			style={{
				fontFamily: "Inter,'Segoe UI',Roboto,system-ui,-apple-system,sans-serif",
				overflowX: 'hidden',
				color: 'var(--text)',
				background: 'var(--bg)',
			}}
		>
			{/* Hero */}
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
				}}
			>
				{/* Floating decor */}
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
					}}
				>
					<div
						style={{
							flex: '1',
							maxWidth: isMobile || isTablet ? '100%' : '50%',
							animation: 'fadeInLeft 0.8s ease-out',
						}}
					>
						<h1
							style={{
								fontSize: 'clamp(1.9rem, 4.2vw, 3.15rem)',
								fontWeight: 900,
								marginBottom: '1rem',
								lineHeight: 1.12,
								letterSpacing: 0.2,
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
											WebkitTextFillColor: 'transparent',
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
										WebkitTextFillColor: 'transparent',
										color: 'transparent',
										display: 'inline-block',
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
							}}
						>
							{isAuthenticated
								? role === 'teacher'
									? 'Create and schedule exams, manage questions, and review submissions with explainable scoring.'
									: 'Join exams with a share code, sync responses while writing, and review detailed results.'
								: 'Plan, deliver, and evaluate exams end‑to‑end. Teachers publish live windows; students join with a code; submissions sync and are evaluated with a clear workflow.'}
						</p>

						<div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
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
										style={{
											padding: '0.75rem 1.5rem',
											backgroundColor: 'var(--primary-strong)',
											color: 'white',
											border: 'none',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontSize: '1rem',
											fontWeight: 800,
											boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
										}}
									>
										Open Exams
									</button>
									<button
										onClick={() =>
											navigate(role === 'teacher' ? '/teacher' : '/student')
										}
										aria-label="Open Dashboard"
										style={{
											padding: '0.75rem 1.5rem',
											backgroundColor: 'transparent',
											color: 'var(--primary)',
											border: '1px solid var(--primary)',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontSize: '1rem',
											fontWeight: 800,
										}}
									>
										Open Dashboard
									</button>
								</>
							) : (
								<>
									<button
										onClick={() => scrollToSection(roleSelectionRef)}
										aria-label="Get Started"
										style={{
											padding: '0.75rem 1.5rem',
											backgroundColor: 'var(--primary-strong)',
											color: 'white',
											border: 'none',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontSize: '1rem',
											fontWeight: 800,
											boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
										}}
									>
										Get Started
									</button>
									<button
										onClick={() => scrollToSection(detailsRef)}
										aria-label="Learn More"
										style={{
											padding: '0.75rem 1.5rem',
											backgroundColor: 'transparent',
											color: 'var(--primary)',
											border: '1px solid var(--primary)',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontSize: '1rem',
											fontWeight: 800,
										}}
									>
										How it works
									</button>
								</>
							)}
						</div>
					</div>

					{/* Parallax images */}
					<div
						ref={heroParallaxRef}
						style={{
							flex: isMobile || isTablet ? '1' : '0.9',
							display: 'flex',
							justifyContent: 'center',
							marginTop: isMobile ? '1.6rem' : 0,
							animation: 'fadeInRight 0.8s ease-out',
							perspective: '1000px',
						}}
					>
						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(2, 1fr)',
								gridTemplateRows: 'repeat(2, 1fr)',
								gap: isMobile ? '0.75rem' : '1.1rem',
								maxWidth: isMobile ? '300px' : isTablet ? '420px' : '520px',
								width: '100%',
								transform: prefersReduced
									? 'none'
									: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
								transformStyle: 'preserve-3d',
								transition: 'transform 200ms ease-out',
							}}
						>
							{heroImages.map((src, i) => (
								<div
									key={i}
									style={{
										transform:
											i === 0
												? 'translateZ(20px)'
												: i === 1
													? 'translateZ(10px)'
													: i === 2
														? 'translateZ(8px)'
														: 'translateZ(16px)',
										transition: 'transform 0.2s',
										boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
										borderRadius: '1rem',
										overflow: 'hidden',
										border: '1px solid var(--border)',
										background: 'var(--surface)',
									}}
								>
									<img
										src={src}
										alt={`Platform visual ${i + 1}`}
										loading="lazy"
										decoding="async"
										referrerPolicy="no-referrer"
										style={{
											width: '100%',
											height: '100%',
											objectFit: 'cover',
										}}
									/>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* How it works */}
			<section
				ref={detailsRef}
				aria-label="How it works"
				style={{
					padding: isMobile ? '2.4rem 1rem' : isTablet ? '3rem 2rem' : '3.6rem 3rem',
					background: 'var(--surface)',
					borderTop: '1px solid var(--border)',
					borderBottom: '1px solid var(--border)',
				}}
			>
				<div style={{ maxWidth: 1100, margin: '0 auto' }}>
					<h2
						style={{
							fontSize: 'clamp(1.5rem, 2.2vw, 2rem)',
							fontWeight: 900,
							color: 'var(--text)',
							marginBottom: '0.8rem',
							textAlign: 'center',
						}}
					>
						How the platform works
					</h2>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
							gap: 14,
							marginTop: 10,
						}}
					>
						<div
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 14,
								padding: 16,
							}}
						>
							<h3 style={{ margin: 0, color: 'var(--text)' }}>Teachers</h3>
							<ol
								style={{
									margin: '0.5rem 0 0 1rem',
									padding: 0,
									color: 'var(--text-muted)',
									lineHeight: 1.7,
								}}
							>
								<li>Create exams and add MCQ/subjective questions.</li>
								<li>Set duration and a start/end window, then publish.</li>
								<li>Share the 8‑character exam code with students.</li>
								<li>Review submissions and adjust marks when needed.</li>
							</ol>
							<div style={{ marginTop: 12 }}>
								<button
									onClick={() => navigate('/teacher/exams')}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: '1px solid var(--border)',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Open exam manager
								</button>
							</div>
						</div>

						<div
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 14,
								padding: 16,
							}}
						>
							<h3 style={{ margin: 0, color: 'var(--text)' }}>Students</h3>
							<ol
								style={{
									margin: '0.5rem 0 0 1rem',
									padding: 0,
									color: 'var(--text-muted)',
									lineHeight: 1.7,
								}}
							>
								<li>Sign in to your account.</li>
								<li>Go to Exams and search using the 8‑character code.</li>
								<li>Start the exam; answers sync while you write.</li>
								<li>Submit once and view results when released.</li>
							</ol>
							<div style={{ marginTop: 12 }}>
								<button
									onClick={() => navigate('/student/exams')}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: '1px solid var(--border)',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Open student exams
								</button>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Authenticated quick actions or public features */}
			<section
				aria-label={isAuthenticated ? 'Quick actions' : 'Features'}
				style={{
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
					backgroundColor: 'var(--bg)',
					position: 'relative',
				}}
			>
				<div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
					{isAuthenticated ? (
						<>
							<h2
								style={{
									fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
									fontWeight: 900,
									color: 'var(--text)',
									marginBottom: '1rem',
								}}
							>
								{role === 'teacher' ? 'Your next steps' : 'Jump back in'}
							</h2>
							<p
								style={{
									color: 'var(--text-muted)',
									marginTop: 0,
									marginBottom: '1.4rem',
								}}
							>
								{role === 'teacher'
									? 'Create a new exam, manage existing ones, or review submissions.'
									: 'Join a scheduled exam or review your previous submissions.'}
							</p>

							<div style={{ display: 'grid', gap: 14 }}>
								{role === 'teacher' ? (
									<>
										<QuickAction
											title="Create a new exam"
											subtitle="Build from your question bank and schedule a live window."
											cta="Open exam manager"
											onClick={() => navigate('/teacher/exams')}
											tone="emerald"
											photo={cardPhotos[0]}
										/>
										<QuickAction
											title="Review submissions"
											subtitle="Track student work and evaluate subjective answers."
											cta="Open dashboard"
											onClick={() => navigate('/teacher')}
											tone="indigo"
											photo={cardPhotos[1]}
										/>
									</>
								) : (
									<>
										<QuickAction
											title="Find your exam"
											subtitle="Join using the share code provided by your teacher."
											cta="Open student exams"
											onClick={() => navigate('/student/exams')}
											tone="amber"
											photo={cardPhotos[2]}
										/>
										<QuickAction
											title="View your results"
											subtitle="Revisit submissions and review detailed scoring."
											cta="Open dashboard"
											onClick={() => navigate('/student')}
											tone="rose"
											photo={cardPhotos[3]}
										/>
									</>
								)}
							</div>
						</>
					) : (
						<>
							<h2
								style={{
									fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
									fontWeight: 800,
									color: 'var(--text)',
									textAlign: 'center',
									marginBottom: '1.2rem',
									letterSpacing: 0.2,
								}}
							>
								Product overview
							</h2>
							<p
								style={{
									fontSize: 'clamp(0.95rem, 1vw, 1.08rem)',
									color: 'var(--text-muted)',
									textAlign: 'center',
									maxWidth: 860,
									margin: '0 auto 2.2rem',
									lineHeight: 1.7,
								}}
							>
								End‑to‑end assessments: compose and publish exams, students join
								with a share code, answers sync during writing, and submissions are
								evaluated with a teacher‑reviewable workflow.
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
									maxWidth: 1200,
									marginInline: 'auto',
								}}
							>
								{features.map((feature, index) => (
									<div
										key={index}
										style={{
											padding: '1.4rem',
											backgroundColor: 'var(--surface)',
											border: '1px solid var(--border)',
											borderRadius: '1rem',
											boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
											textAlign: 'center',
										}}
									>
										<div
											style={{ width: 76, height: 76, margin: '0 auto 1rem' }}
										>
											<img
												src={feature.icon}
												alt={feature.title}
												loading="lazy"
												decoding="async"
												style={{
													width: '100%',
													height: '100%',
													borderRadius: '1rem',
													objectFit: 'cover',
													border: '2px solid rgba(99,102,241,0.3)',
												}}
											/>
										</div>
										<h3
											style={{
												fontSize: '1.05rem',
												fontWeight: 800,
												color: 'var(--text)',
												marginBottom: '0.5rem',
											}}
										>
											{feature.title}
										</h3>
										<p
											style={{
												color: 'var(--text-muted)',
												fontSize: '0.95rem',
												lineHeight: 1.6,
											}}
										>
											{feature.description}
										</p>
									</div>
								))}
							</div>
						</>
					)}
				</div>
			</section>

			{/* Role Selection (no fake data) */}
			{!isAuthenticated && (
				<section
					ref={roleSelectionRef}
					aria-label="Choose Your Role"
					style={{
						padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
						background: isDark
							? 'linear-gradient(135deg, color-mix(in srgb, #1e293b 50%, transparent), color-mix(in srgb, #020617 40%, transparent))'
							: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
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
						<h2
							style={{
								fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
								fontWeight: 800,
								color: 'var(--text)',
								marginBottom: '0.9rem',
								letterSpacing: 0.2,
							}}
						>
							Choose your role
						</h2>
						<p
							style={{
								fontSize: 'clamp(0.95rem, 1vw, 1.05rem)',
								color: 'var(--text-muted)',
								margin: '0 auto 2.2rem',
								maxWidth: 720,
								lineHeight: 1.6,
							}}
						>
							Sign in to continue. Your institution may provision or invite your
							account.
						</p>

						<div
							style={{
								display: 'flex',
								gap: isMobile ? '1.4rem' : '2rem',
								justifyContent: 'center',
								flexWrap: 'wrap',
							}}
						>
							{/* Student */}
							<div
								style={{
									background: 'var(--surface)',
									borderRadius: '1.25rem',
									border: '1px solid var(--border)',
									boxShadow: '0 10px 28px rgba(2,6,23,0.06)',
									padding: isMobile ? '1.2rem' : 'clamp(1.4rem, 2.2vw, 2rem)',
									textAlign: 'center',
									flex: isMobile
										? '1 1 100%'
										: isTablet
											? '1 1 46%'
											: '1 1 360px',
									maxWidth: isMobile ? '100%' : isTablet ? '520px' : '380px',
									minWidth: isMobile ? 'auto' : 280,
								}}
							>
								<img
									src={studentImg}
									alt="Student"
									loading="lazy"
									decoding="async"
									style={{
										width: isMobile ? 96 : 112,
										height: isMobile ? 96 : 112,
										borderRadius: '50%',
										objectFit: 'cover',
										margin: '0 auto 1rem',
										border: '3px solid #6366f1',
										boxShadow: '0 8px 20px rgba(99,102,241,0.25)',
										display: 'block',
									}}
								/>
								<h3
									style={{
										fontSize: 'clamp(1.1rem, 1.6vw, 1.45rem)',
										fontWeight: 800,
										color: '#3730a3',
										marginBottom: '0.55rem',
										letterSpacing: 0.2,
									}}
								>
									Student
								</h3>
								<p
									style={{
										color: '#475569',
										fontSize: 'clamp(0.95rem, 1vw, 1rem)',
										marginBottom: '1.05rem',
										lineHeight: 1.65,
										maxWidth: 440,
										marginInline: 'auto',
									}}
								>
									Join exams with a share code and view your results.
								</p>
								<div
									style={{
										display: 'flex',
										gap: '0.75rem',
										justifyContent: 'center',
									}}
								>
									<button
										aria-label="Student Sign in"
										onClick={() => goToAuth('student', 'login')}
										style={{
											padding: '0.65rem 1.15rem',
											background:
												'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
											color: 'white',
											border: 'none',
											borderRadius: '0.6rem',
											cursor: 'pointer',
											fontWeight: 800,
										}}
									>
										Sign in
									</button>
									<button
										aria-label="Learn how it works for Students"
										onClick={() => scrollToSection(detailsRef)}
										style={{
											padding: '0.65rem 1.15rem',
											backgroundColor: 'transparent',
											color: '#4f46e5',
											border: '1px solid #c7d2fe',
											borderRadius: '0.6rem',
											cursor: 'pointer',
											fontWeight: 700,
										}}
									>
										How it works
									</button>
								</div>
							</div>

							{/* Teacher */}
							<div
								style={{
									background: 'var(--surface)',
									borderRadius: '1.25rem',
									border: '1px solid var(--border)',
									boxShadow: '0 10px 28px rgba(2,6,23,0.06)',
									padding: isMobile ? '1.2rem' : 'clamp(1.4rem, 2.2vw, 2rem)',
									textAlign: 'center',
									flex: isMobile
										? '1 1 100%'
										: isTablet
											? '1 1 46%'
											: '1 1 360px',
									maxWidth: isMobile ? '100%' : isTablet ? '520px' : '380px',
									minWidth: isMobile ? 'auto' : 280,
								}}
							>
								<img
									src={teacherImg}
									alt="Teacher"
									loading="lazy"
									decoding="async"
									style={{
										width: isMobile ? 96 : 112,
										height: isMobile ? 96 : 112,
										borderRadius: '50%',
										objectFit: 'cover',
										margin: '0 auto 1rem',
										border: '3px solid #f97316',
										boxShadow: '0 8px 20px rgba(249,115,22,0.25)',
										display: 'block',
									}}
								/>
								<h3
									style={{
										fontSize: 'clamp(1.1rem, 1.6vw, 1.45rem)',
										fontWeight: 800,
										color: '#9a3412',
										marginBottom: '0.55rem',
										letterSpacing: 0.2,
									}}
								>
									Teacher
								</h3>
								<p
									style={{
										color: '#475569',
										fontSize: 'clamp(0.95rem, 1vw, 1rem)',
										marginBottom: '1.05rem',
										lineHeight: 1.65,
										maxWidth: 440,
										marginInline: 'auto',
									}}
								>
									Create, schedule, publish, and evaluate—end to end.
								</p>
								<div
									style={{
										display: 'flex',
										gap: '0.75rem',
										justifyContent: 'center',
									}}
								>
									<button
										aria-label="Teacher Sign in"
										onClick={() => goToAuth('teacher', 'login')}
										style={{
											padding: '0.65rem 1.15rem',
											background:
												'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
											color: 'white',
											border: 'none',
											borderRadius: '0.6rem',
											cursor: 'pointer',
											fontWeight: 800,
										}}
									>
										Sign in
									</button>
									<button
										aria-label="Learn how it works for Teachers"
										onClick={() => scrollToSection(detailsRef)}
										style={{
											padding: '0.65rem 1.15rem',
											backgroundColor: 'transparent',
											color: '#ea580c',
											border: '1px solid #fed7aa',
											borderRadius: '0.6rem',
											cursor: 'pointer',
											fontWeight: 700,
										}}
									>
										How it works
									</button>
								</div>
							</div>
						</div>
					</div>
				</section>
			)}

			{/* Visual gallery (decorative only) */}
			<section
				aria-label="Gallery"
				style={{
					padding: isMobile ? '2.6rem 1rem' : '3.2rem',
					background: 'var(--elev)',
					borderTop: '1px solid var(--border)',
					borderBottom: '1px solid var(--border)',
				}}
			>
				<div
					style={{
						maxWidth: 1200,
						margin: '0 auto',
						display: 'grid',
						gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
						gap: 12,
					}}
				>
					{cardPhotos.map((src, i) => (
						<div
							key={i}
							style={{
								borderRadius: 12,
								overflow: 'hidden',
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								minHeight: 160,
							}}
						>
							<img
								src={src}
								alt={`Gallery ${i + 1}`}
								loading="lazy"
								decoding="async"
								referrerPolicy="no-referrer"
								style={{ width: '100%', height: '100%', objectFit: 'cover' }}
							/>
						</div>
					))}
				</div>
			</section>

			{/* Bottom CTA */}
			<section
				aria-label="Get started call to action"
				style={{
					padding: isMobile ? '2.4rem 1rem' : '3rem 2rem',
					background: isDark
						? 'linear-gradient(135deg, #0f172a, #111827)'
						: 'linear-gradient(135deg, #eef2ff, #f8fafc)',
					borderTop: '1px solid var(--border)',
				}}
			>
				<div
					style={{
						maxWidth: 1200,
						margin: '0 auto',
						border: '1px solid var(--border)',
						borderRadius: 16,
						padding: isMobile ? 16 : 24,
						background: 'var(--surface)',
						display: 'grid',
						gridTemplateColumns: isMobile ? '1fr' : '1.3fr 1fr',
						gap: 12,
						alignItems: 'center',
					}}
				>
					<div>
						<h3 style={{ margin: '0 0 6px 0', color: 'var(--text)', fontWeight: 900 }}>
							Ready to get started?
						</h3>
						<p style={{ margin: 0, color: 'var(--text-muted)' }}>
							Sign in with your role and head to the exams area.
						</p>
					</div>
					<div
						style={{
							display: 'flex',
							gap: 10,
							justifyContent: isMobile ? 'flex-start' : 'flex-end',
							flexWrap: 'wrap',
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
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: 'none',
										background: 'linear-gradient(135deg, #10b981, #059669)',
										color: '#fff',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Open Exams
								</button>
								<button
									onClick={() =>
										navigate(role === 'teacher' ? '/teacher' : '/student')
									}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: '1px solid var(--border)',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Open Dashboard
								</button>
							</>
						) : (
							<>
								<button
									onClick={() => goToAuth('student', 'register')}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: 'none',
										background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
										color: '#fff',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Create account
								</button>
								<button
									onClick={() => goToAuth('student', 'login')}
									style={{
										padding: '10px 14px',
										borderRadius: 10,
										border: '1px solid var(--border)',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 800,
										cursor: 'pointer',
									}}
								>
									Sign in
								</button>
							</>
						)}
					</div>
				</div>
			</section>

			{/* Footer (no fake contact) */}
			<footer
				style={{
					backgroundColor: 'var(--surface)',
					color: 'var(--text)',
					padding: isMobile ? '1.6rem 1rem' : '2rem',
					textAlign: 'center',
					borderTop: '1px solid var(--border)',
				}}
			>
				<div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
					© {new Date().getFullYear()} AI Exam System
				</div>
			</footer>

			{/* Animations */}
			<style>
				{`
          @keyframes float {
            0% { transform: translateY(0px); }
            100% { transform: translateY(-15px); }
          }
          @keyframes fadeInLeft {
            from { opacity: 0; transform: translateX(-18px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @keyframes fadeInRight {
            from { opacity: 0; transform: translateX(18px); }
            to { opacity: 1; transform: translateX(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
          }
        `}
			</style>
		</div>
	);
};

export default LandingPage;
