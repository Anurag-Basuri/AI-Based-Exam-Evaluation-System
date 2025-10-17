import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';

// Local assets (fallbacks)
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

// Curated external images (Unsplash) for richer visuals (attribution via URL)
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

	// Refs for smooth scroll
	const roleSelectionRef = useRef(null);
	const detailsRef = useRef(null); // "How it works" anchor

	// Resize listener
	useEffect(() => {
		if (typeof window === 'undefined') return;
		const handleResize = () => setWindowWidth(window.innerWidth || 1024);
		window.addEventListener('resize', handleResize, { passive: true });
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const scrollToSection = ref =>
		ref?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	// Breakpoints
	const isMobile = windowWidth < 640;
	const isTablet = windowWidth >= 640 && windowWidth < 1024;

	// Personalization
	const role = user?.role || user?.type || '';
	const displayName = user?.fullname || user?.username || 'there';

	// Feature highlights
	const features = [
		{
			title: 'Consistent, explainable scoring',
			description:
				'Free‑form answers are evaluated with rule checks and similarity signals for repeatable, fair results.',
			icon: image1,
		},
		{
			title: 'Create & schedule fast',
			description:
				'Build exams from your question bank, mix MCQ and subjective, set time windows, and publish when ready.',
			icon: image2,
		},
		{
			title: 'Real‑time progress',
			description:
				'Track live sessions, see who’s in, and spot issues quickly with clear dashboards.',
			icon: image3,
		},
		{
			title: 'Submissions & results',
			description:
				'Submissions are centralized; results are easy to review, export, and revisit anytime.',
			icon: image4,
		},
	];

	// Floating background circles
	const backgroundImages = useMemo(
		() => [
			{ src: image5, top: '10%', left: '5%', size: 80, delay: 0 },
			{ src: image6, top: '15%', right: '8%', size: 70, delay: 2 },
			{ src: image7, bottom: '25%', left: '8%', size: 65, delay: 1 },
			{ src: image8, bottom: '10%', right: '5%', size: 75, delay: 3 },
		],
		[],
	);

	const goToAuth = (role, mode = 'login') => {
		try {
			localStorage.setItem('preferredRole', role);
		} catch {}
		try {
			navigate(`/auth?mode=${encodeURIComponent(mode)}&role=${encodeURIComponent(role)}`);
		} catch {}
	};

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

	// Stats (purely illustrative; replace with real metrics if available)
	const stats = [
		{ label: 'Exams delivered', value: '2.3k+' },
		{ label: 'Questions banked', value: '18k+' },
		{ label: 'Avg. grading time saved', value: '62%' },
		{ label: 'Uptime', value: '99.9%' },
	];

	const testimonials = [
		{
			name: 'Priya Sharma',
			role: 'Assistant Professor',
			quote: 'Publishing and evaluating mid‑terms took hours before; now it’s minutes with clear, consistent scoring.',
			img: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop',
		},
		{
			name: 'Aditya Singh',
			role: 'Student',
			quote: 'The exam experience was smooth and the feedback was detailed. I knew exactly where I lost marks.',
			img: 'https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=400&auto=format&fit=crop',
		},
		{
			name: 'Zara Ali',
			role: 'Program Coordinator',
			quote: 'Scheduling, invigilation, and results all in one place simplified our entire assessment workflow.',
			img: 'https://images.unsplash.com/photo-1544006659-f0b21884ce1d?q=80&w=400&auto=format&fit=crop',
		},
	];

	const faq = [
		{
			q: 'How are subjective answers evaluated?',
			a: 'Subjective responses are checked against teacher-provided criteria and similarity signals. Teachers can review and override any score.',
		},
		{
			q: 'Can I mix MCQ and subjective in one exam?',
			a: 'Yes. Add any combination of MCQ and subjective questions, arrange them, and assign marks per item.',
		},
		{
			q: 'Do students need an account?',
			a: 'Yes. Students sign in and join with a share code. This ensures secure identity and attempt tracking.',
		},
		{
			q: 'Can I reschedule or unpublish an exam?',
			a: 'Draft exams can be edited freely. Published exams can be scheduled for a future window or closed early if needed.',
		},
	];

	return (
		<div
			style={{
				fontFamily: "Inter,'Segoe UI',Roboto,system-ui,-apple-system,sans-serif",
				overflowX: 'hidden',
				color: 'var(--text)',
				background: 'var(--bg)',
			}}
		>
			{/* Hero (no internal header; App.jsx already renders Header) */}
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
									? 'Create and schedule exams, manage your question bank, and review submissions with consistent, explainable scoring.'
									: 'Join exams, submit answers with confidence, and review detailed results — all in one place.'
								: 'Plan, deliver, and evaluate exams end‑to‑end. Build question banks, run secure exams, and get consistent scoring with an AI‑assisted evaluation workflow.'}
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

					{/* Images grid */}
					<div
						style={{
							flex: isMobile || isTablet ? '1' : '0.9',
							display: 'flex',
							justifyContent: 'center',
							marginTop: isMobile ? '1.6rem' : 0,
							animation: 'fadeInRight 0.8s ease-out',
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
								perspective: '1000px',
							}}
						>
							{heroImages.map((src, i) => (
								<div
									key={i}
									style={{
										transform:
											i === 0
												? 'rotateY(-5deg) rotateX(5deg)'
												: i === 1
													? 'rotateY(5deg) rotateX(-5deg)'
													: i === 2
														? 'rotateY(5deg) rotateX(5deg)'
														: 'rotateY(-5deg) rotateX(-5deg)',
										transition: 'transform 0.5s',
										boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
										borderRadius: '1rem',
										overflow: 'hidden',
									}}
								>
									<img
										src={src}
										alt={`Platform illustration ${i + 1}`}
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

			{/* Stats strip */}
			<section
				aria-label="Platform stats"
				style={{
					background: 'var(--surface)',
					borderTop: '1px solid var(--border)',
					borderBottom: '1px solid var(--border)',
					padding: isMobile ? '1.6rem 1rem' : '2rem 2rem',
				}}
			>
				<div
					style={{
						maxWidth: 1200,
						margin: '0 auto',
						display: 'grid',
						gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
						gap: 12,
					}}
				>
					{stats.map((s, i) => (
						<div
							key={i}
							style={{
								textAlign: 'center',
								padding: isMobile ? '0.8rem' : '1rem',
								borderRadius: 12,
								background: 'var(--bg)',
								border: '1px solid var(--border)',
							}}
						>
							<div
								style={{
									fontSize: '1.35rem',
									fontWeight: 900,
									color: 'var(--text)',
								}}
							>
								{s.value}
							</div>
							<div
								style={{
									color: 'var(--text-muted)',
									fontWeight: 700,
									fontSize: 12,
								}}
							>
								{s.label}
							</div>
						</div>
					))}
				</div>
			</section>

			{/* If logged in: personalized quick actions; else: Features grid */}
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
									? 'Create an exam, manage existing ones, or review submissions.'
									: 'Join a scheduled exam, review your results, or explore upcoming sessions.'}
							</p>

							<div style={{ display: 'grid', gap: 14 }}>
								{role === 'teacher' ? (
									<>
										<QuickAction
											title="Create a new exam"
											subtitle="Build a new exam from your question bank and schedule it."
											cta="Open exam manager"
											onClick={() => navigate('/teacher/exams')}
											tone="emerald"
											photo={cardPhotos[0]}
										/>
										<QuickAction
											title="Review submissions"
											subtitle="Track student submissions and evaluate subjective answers."
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
											subtitle="Join using a share code provided by your teacher."
											cta="Open student exams"
											onClick={() => navigate('/student/exams')}
											tone="amber"
											photo={cardPhotos[2]}
										/>
										<QuickAction
											title="View your results"
											subtitle="Revisit previous submissions and check detailed scoring."
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
								ref={detailsRef}
								style={{
									fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
									fontWeight: 800,
									color: 'var(--text)',
									textAlign: 'center',
									marginBottom: '1.2rem',
									letterSpacing: 0.2,
								}}
							>
								How the Platform Works
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
								Teachers create and schedule exams from a question bank. Students
								join with a share code and submit answers. An AI‑assisted service
								standardizes scoring, while teachers retain full control and
								oversight.
							</p>

							{/* Two tracks: Teacher and Student */}
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
									gap: 16,
								}}
							>
								<div
									style={{
										background: 'var(--surface)',
										border: '1px solid var(--border)',
										borderRadius: 16,
										padding: 16,
									}}
								>
									<h3 style={{ marginTop: 0, color: 'var(--text)' }}>
										For Teachers
									</h3>
									<ol
										style={{
											margin: '0 0 0 1rem',
											padding: 0,
											color: 'var(--text-muted)',
											lineHeight: 1.7,
										}}
									>
										<li>
											Create an exam with title, duration, and time window.
										</li>
										<li>
											Pick questions (MCQ or subjective) from your bank or
											create new.
										</li>
										<li>
											Publish when ready; the system handles live tracking and
											submissions.
										</li>
										<li>
											Review results, see auto‑scoring rationale, and adjust
											grades if needed.
										</li>
									</ol>
								</div>

								<div
									style={{
										background: 'var(--surface)',
										border: '1px solid var(--border)',
										borderRadius: 16,
										padding: 16,
									}}
								>
									<h3 style={{ marginTop: 0, color: 'var(--text)' }}>
										For Students
									</h3>
									<ol
										style={{
											margin: '0 0 0 1rem',
											padding: 0,
											color: 'var(--text-muted)',
											lineHeight: 1.7,
										}}
									>
										<li>Sign in and join an exam using a share code.</li>
										<li>
											Answer MCQs and write subjective responses confidently.
										</li>
										<li>
											Submit once; you’ll see status and, when released,
											detailed results.
										</li>
									</ol>
								</div>
							</div>

							{/* Features grid */}
							<div
								style={{
									marginTop: 20,
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

			{/* Role Selection – only when not authenticated */}
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
							Choose Your Role
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
							Sign in with your role. Your institution may provision accounts or
							invite you.
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
									position: 'relative',
									overflow: 'hidden',
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
									Take exams with a share code and get clear, timely results.
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
									position: 'relative',
									overflow: 'hidden',
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
									Create and schedule exams, manage questions, and review
									submissions.
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

			{/* Testimonials */}
			<section
				aria-label="User testimonials"
				style={{
					padding: isMobile ? '2.6rem 1rem' : '3.2rem',
					background: 'var(--surface)',
					borderTop: '1px solid var(--border)',
					borderBottom: '1px solid var(--border)',
				}}
			>
				<div
					style={{
						maxWidth: 1200,
						margin: '0 auto',
						display: 'grid',
						gridTemplateColumns: isMobile
							? '1fr'
							: isTablet
								? 'repeat(2,1fr)'
								: 'repeat(3,1fr)',
						gap: 14,
					}}
				>
					{testimonials.map((t, i) => (
						<figure
							key={i}
							style={{
								margin: 0,
								padding: 16,
								border: '1px solid var(--border)',
								borderRadius: 16,
								background: 'var(--bg)',
								boxShadow: '0 10px 24px rgba(0,0,0,0.05)',
								display: 'grid',
								gap: 10,
							}}
						>
							<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
								<img
									src={t.img}
									alt={`${t.name} avatar`}
									loading="lazy"
									decoding="async"
									referrerPolicy="no-referrer"
									style={{
										width: 42,
										height: 42,
										borderRadius: '50%',
										objectFit: 'cover',
									}}
								/>
								<figcaption>
									<div style={{ fontWeight: 800, color: 'var(--text)' }}>
										{t.name}
									</div>
									<div
										style={{
											fontSize: 12,
											color: 'var(--text-muted)',
											fontWeight: 700,
										}}
									>
										{t.role}
									</div>
								</figcaption>
							</div>
							<blockquote
								style={{ margin: 0, color: 'var(--text)', lineHeight: 1.6 }}
							>
								“{t.quote}”
							</blockquote>
						</figure>
					))}
				</div>
			</section>

			{/* Gallery / credibility strip */}
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

			{/* FAQ */}
			<section
				aria-label="Frequently asked questions"
				style={{ padding: isMobile ? '3rem 1rem' : '4rem 2rem', background: 'var(--bg)' }}
			>
				<div style={{ maxWidth: 900, margin: '0 auto' }}>
					<h2
						style={{
							fontSize: 'clamp(1.4rem, 2.2vw, 2rem)',
							fontWeight: 900,
							color: 'var(--text)',
							textAlign: 'center',
							marginBottom: '1rem',
						}}
					>
						Frequently asked questions
					</h2>
					<div style={{ display: 'grid', gap: 10 }}>
						{faq.map((item, idx) => (
							<details
								key={idx}
								style={{
									border: '1px solid var(--border)',
									borderRadius: 12,
									background: 'var(--surface)',
									padding: '12px 14px',
								}}
							>
								<summary
									style={{
										cursor: 'pointer',
										color: 'var(--text)',
										fontWeight: 800,
										outline: 'none',
									}}
								>
									{item.q}
								</summary>
								<p style={{ color: 'var(--text-muted)', marginTop: 8 }}>{item.a}</p>
							</details>
						))}
					</div>
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
							Ready to modernize your assessments?
						</h3>
						<p style={{ margin: 0, color: 'var(--text-muted)' }}>
							Whether you run small quizzes or full terms, our workflow helps you
							publish fast and evaluate fairly.
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

			{/* Footer */}
			<footer
				style={{
					backgroundColor: 'var(--surface)',
					color: 'var(--text)',
					padding: isMobile ? '2rem 1rem' : '3rem',
					textAlign: 'center',
					position: 'relative',
					overflow: 'hidden',
					borderTop: '1px solid var(--border)',
				}}
			>
				<div
					aria-hidden
					style={{
						position: 'absolute',
						inset: 0,
						background: `url(${image7})`,
						backgroundSize: 'cover',
						opacity: 0.02,
						zIndex: 0,
					}}
				/>
				<div
					style={{
						position: 'relative',
						zIndex: 1,
						display: 'flex',
						flexDirection: isMobile ? 'column' : 'row',
						justifyContent: 'space-between',
						alignItems: isMobile ? 'center' : 'flex-start',
						maxWidth: 1200,
						margin: '0 auto',
						gap: isMobile ? '1.6rem' : '1rem',
					}}
				>
					<div
						style={{
							textAlign: isMobile ? 'center' : 'left',
							maxWidth: isMobile ? '100%' : 360,
						}}
					>
						<h3 style={{ fontSize: '1.25rem', marginBottom: '0.8rem' }}>
							AI Exam System
						</h3>
						<p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>
							Assessments made simple—powered by an evaluation service, robust APIs,
							and a clean, responsive UI.
						</p>
					</div>
					<div>
						<h4 style={{ fontSize: '1.05rem', marginBottom: '0.8rem' }}>Contact</h4>
						<p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>
							Email: support@aiexamsystem.com
							<br />
							Phone: (123) 456-7890
						</p>
					</div>
				</div>
				<div
					style={{
						borderTop: '1px solid #475569',
						marginTop: '1.6rem',
						paddingTop: '1.6rem',
						fontSize: '0.9rem',
						color: '#94a3b8',
						position: 'relative',
						zIndex: 1,
					}}
				>
					© {new Date().getFullYear()} AI Exam System. All rights reserved.
				</div>
			</footer>

			{/* Animations and reduced motion support */}
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
