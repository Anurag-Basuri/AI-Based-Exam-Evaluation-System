import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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

const LandingPage = () => {
	const navigate = useNavigate();
	const initialWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
	const [windowWidth, setWindowWidth] = useState(initialWidth);

	// Refs for smooth scroll
	const roleSelectionRef = useRef(null);
	const detailsRef = useRef(null);

	// Resize listener
	useEffect(() => {
		const handleResize = () => setWindowWidth(window.innerWidth);
		window.addEventListener('resize', handleResize, { passive: true });
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const scrollToSection = ref =>
		ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

	// Breakpoints
	const isMobile = windowWidth < 640;
	const isTablet = windowWidth >= 640 && windowWidth < 1024;

	// Feature cards (aligned with server/controllers/services)
	const features = [
		{
			title: 'Consistent, Explainable Scoring',
			description:
				'Free‑form answers are graded by the evaluation service with rule checks and similarity signals for repeatable results.',
			icon: image1,
		},
		{
			title: 'Exam & Question Management',
			description:
				'Create exams, maintain a question bank, and organize assessments through dedicated routes and controllers.',
			icon: image2,
		},
		{
			title: 'Submissions & Results',
			description:
				'Students submit once and get timely results. Results are easy to review and revisit.',
			icon: image3,
		},
		{
			title: 'Issue Reporting',
			description:
				'Students and teachers can report issues in‑app and track them to resolution.',
			icon: image4,
		},
	];

	// Floating background images (decor)
	const backgroundImages = [
		{ src: image5, top: '10%', left: '5%', size: 80, delay: 0 },
		{ src: image6, top: '15%', right: '8%', size: 70, delay: 2 },
		{ src: image7, bottom: '25%', left: '8%', size: 65, delay: 1 },
		{ src: image8, bottom: '10%', right: '5%', size: 75, delay: 3 },
	];

	return (
		<div
			style={{
				fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif",
				overflowX: 'hidden',
				color: '#0f172a',
			}}
		>
			{/* Hero */}
			<section
				aria-label="Hero"
				style={{
					background: 'linear-gradient(135deg, #eef2ff 0%, #f8fafc 100%)',
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
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
								opacity: 0.12,
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
							maxWidth: isMobile || isTablet ? '100%' : '48%',
							animation: 'fadeInLeft 0.8s ease-out',
						}}
					>
						<h1
							style={{
								fontSize: 'clamp(1.85rem, 4.2vw, 3.05rem)',
								fontWeight: 800,
								marginBottom: '1.1rem',
								lineHeight: 1.15,
								letterSpacing: 0.2,
								background: 'linear-gradient(to right, #0f172a, #334155)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}
						>
							AI‑Based Exam Evaluation System
						</h1>
						<p
							style={{
								fontSize: 'clamp(1rem, 1.15vw, 1.1rem)',
								color: '#475569',
								marginBottom: '1.6rem',
								lineHeight: 1.7,
								maxWidth: 720,
							}}
						>
							Plan, deliver, and evaluate exams end‑to‑end. Build question banks, run
							secure exams, and get consistent scoring. Client: React + Vite. API:
							Node.js/Express. Data: MongoDB.
						</p>
						<div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
							<button
								onClick={() => scrollToSection(roleSelectionRef)}
								aria-label="Get Started"
								style={{
									padding: '0.75rem 1.5rem',
									backgroundColor: '#6366f1',
									color: 'white',
									border: 'none',
									borderRadius: '0.55rem',
									cursor: 'pointer',
									fontSize: '1rem',
									fontWeight: 700,
									boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
									transition: 'transform 0.2s, box-shadow 0.2s',
								}}
								onMouseOver={e => {
									e.currentTarget.style.transform = 'translateY(-2px)';
									e.currentTarget.style.boxShadow =
										'0 6px 20px rgba(99,102,241,0.3)';
								}}
								onMouseOut={e => {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow =
										'0 4px 14px rgba(99,102,241,0.25)';
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
									color: '#6366f1',
									border: '1px solid #6366f1',
									borderRadius: '0.55rem',
									cursor: 'pointer',
									fontSize: '1rem',
									fontWeight: 700,
									transition: 'background-color 0.2s',
								}}
								onMouseOver={e => {
									e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)';
								}}
								onMouseOut={e => {
									e.currentTarget.style.backgroundColor = 'transparent';
								}}
							>
								How it works
							</button>
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
							{[image1, image2, image3, image4].map((src, i) => (
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

			{/* Features */}
			<section
				aria-label="Features"
				style={{
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
					backgroundColor: '#ffffff',
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					aria-hidden
					style={{
						position: 'absolute',
						width: 300,
						height: 300,
						borderRadius: '50%',
						background:
							'radial-gradient(circle, rgba(224,231,255,0.5) 0%, rgba(248,250,252,0) 70%)',
						top: -100,
						left: -100,
						zIndex: 0,
					}}
				/>
				<div
					aria-hidden
					style={{
						position: 'absolute',
						width: 400,
						height: 400,
						borderRadius: '50%',
						background:
							'radial-gradient(circle, rgba(224,231,255,0.5) 0%, rgba(248,250,252,0) 70%)',
						bottom: -200,
						right: -150,
						zIndex: 0,
					}}
				/>

				<div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
					<h2
						style={{
							fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
							fontWeight: 800,
							color: '#0f172a',
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
							color: '#5b6472',
							textAlign: 'center',
							maxWidth: 820,
							margin: '0 auto 2.2rem',
							lineHeight: 1.7,
						}}
					>
						Teachers manage questions and exams. Students submit answers and receive
						results. The evaluation service keeps scoring consistent and explainable.
						Issues can be raised and tracked in‑product.
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
							margin: '0 auto',
						}}
					>
						{features.map((feature, index) => (
							<div
								key={index}
								style={{
									padding: '1.75rem',
									backgroundColor: '#f8fafc',
									borderRadius: '1rem',
									boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
									textAlign: 'center',
									transition: 'transform 0.25s, box-shadow 0.25s',
									position: 'relative',
									overflow: 'hidden',
								}}
								onMouseOver={e => {
									if (!isMobile) {
										e.currentTarget.style.transform = 'translateY(-5px)';
										e.currentTarget.style.boxShadow =
											'0 10px 25px rgba(0,0,0,0.08)';
									}
								}}
								onMouseOut={e => {
									if (!isMobile) {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow =
											'0 4px 14px rgba(0,0,0,0.05)';
									}
								}}
							>
								<div
									style={{
										width: 80,
										height: 80,
										margin: '0 auto 1.3rem',
										position: 'relative',
									}}
								>
									<div
										aria-hidden
										style={{
											width: '100%',
											height: '100%',
											borderRadius: '1rem',
											background: 'rgba(99,102,241,0.1)',
											position: 'absolute',
											transform: 'rotate(10deg)',
										}}
									/>
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
											position: 'relative',
											border: '2px solid rgba(99,102,241,0.3)',
										}}
									/>
								</div>
								<h3
									style={{
										fontSize: '1.2rem',
										fontWeight: 700,
										color: '#1e293b',
										marginBottom: '0.6rem',
									}}
								>
									{feature.title}
								</h3>
								<p
									style={{
										color: '#64748b',
										fontSize: '0.98rem',
										lineHeight: 1.6,
									}}
								>
									{feature.description}
								</p>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Details (grid) */}
			<section
				ref={detailsRef}
				aria-label="Details"
				style={{
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
					backgroundColor: '#f8fafc',
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
						background: `url(${image7})`,
						backgroundSize: 'cover',
						opacity: 0.03,
						zIndex: 0,
					}}
				/>
				<div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
					<h2
						style={{
							fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
							fontWeight: 800,
							color: '#0f172a',
							textAlign: 'center',
							marginBottom: '1.8rem',
							letterSpacing: 0.2,
						}}
					>
						Built for Real Classrooms
					</h2>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: isMobile
								? '1fr'
								: isTablet
									? 'repeat(2, 1fr)'
									: 'repeat(4, 1fr)',
							gap: isMobile ? '1rem' : '1.2rem',
							alignItems: 'stretch',
						}}
					>
						{[
							{
								num: 1,
								title: 'Roles & Modules',
								content: (
									<ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
										<li>Student and Teacher roles</li>
										<li>Exams, Questions, Submissions, Issues modules</li>
										<li>Client protected routes and server auth middleware</li>
									</ul>
								),
							},
							{
								num: 2,
								title: 'Security & APIs',
								content: (
									<ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
										<li>JWT‑based authentication, role‑aware access</li>
										<li>CORS middleware and structured error responses</li>
										<li>
											REST endpoints for exams, questions, submissions, issues
										</li>
									</ul>
								),
							},
							{
								num: 3,
								title: 'Evaluation Service',
								content: (
									<p style={{ margin: 0 }}>
										Scores free‑form answers with rules and similarity checks
										for reliable grading.
									</p>
								),
							},
							{
								num: 4,
								title: 'Tech Stack',
								content: (
									<ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
										<li>Frontend: React + Vite</li>
										<li>Backend: Node.js + Express</li>
										<li>Database: MongoDB</li>
									</ul>
								),
							},
						].map((card, idx) => (
							<div
								key={idx}
								style={{
									background: 'white',
									borderRadius: '1rem',
									padding: isMobile ? '1.1rem' : '1.4rem',
									boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
									display: 'flex',
									flexDirection: 'column',
									gap: '0.75rem',
									minHeight: isMobile ? 0 : 260,
									height: '100%',
									transition: 'transform 0.25s, box-shadow 0.25s',
								}}
								onMouseOver={e => {
									if (!isMobile) {
										e.currentTarget.style.transform = 'translateY(-4px)';
										e.currentTarget.style.boxShadow =
											'0 10px 24px rgba(0,0,0,0.08)';
									}
								}}
								onMouseOut={e => {
									if (!isMobile) {
										e.currentTarget.style.transform = 'translateY(0)';
										e.currentTarget.style.boxShadow =
											'0 4px 20px rgba(0,0,0,0.05)';
									}
								}}
							>
								<div
									style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}
								>
									<span
										aria-hidden
										style={{
											width: 28,
											height: 28,
											borderRadius: '50%',
											backgroundColor: '#6366f1',
											color: 'white',
											display: 'inline-flex',
											justifyContent: 'center',
											alignItems: 'center',
											fontWeight: 700,
											fontSize: '0.95rem',
										}}
									>
										{card.num}
									</span>
									<h3
										style={{
											fontSize: '1.15rem',
											fontWeight: 700,
											color: '#1e293b',
											margin: 0,
										}}
									>
										{card.title}
									</h3>
								</div>
								<div
									style={{
										color: '#64748b',
										fontSize: '0.98rem',
										lineHeight: 1.65,
									}}
								>
									{card.content}
								</div>
							</div>
						))}
					</div>

					<div
						style={{
							marginTop: isMobile ? '1.6rem' : '2rem',
							background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
							borderRadius: '1rem',
							padding: isMobile ? '1.2rem' : '2rem',
							color: 'white',
							textAlign: 'center',
							boxShadow: '0 10px 30px rgba(79,70,229,0.3)',
						}}
					>
						<h3
							style={{
								fontSize: 'clamp(1.2rem, 1.8vw, 1.6rem)',
								fontWeight: 800,
								marginBottom: '0.9rem',
							}}
						>
							Ready to modernize your assessments?
						</h3>
						<p
							style={{
								fontSize: 'clamp(0.95rem, 1vw, 1.05rem)',
								opacity: 0.95,
								maxWidth: 720,
								margin: '0 auto 1.4rem',
							}}
						>
							Choose your role to continue. Students can take exams and view results.
							Teachers can build question banks, run exams, and review outcomes.
						</p>
						<button
							onClick={() => scrollToSection(roleSelectionRef)}
							style={{
								padding: '0.7rem 1.6rem',
								backgroundColor: 'white',
								color: '#6366f1',
								border: 'none',
								borderRadius: '0.55rem',
								cursor: 'pointer',
								fontSize: '1rem',
								fontWeight: 700,
								boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
								transition: 'transform 0.2s, box-shadow 0.2s',
							}}
							onMouseOver={e => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
							}}
							onMouseOut={e => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)';
							}}
						>
							Get Started Now
						</button>
					</div>
				</div>
			</section>

			{/* Role Selection */}
			<section
				ref={roleSelectionRef}
				aria-label="Choose Your Role"
				style={{
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
					background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
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
							color: '#0f172a',
							marginBottom: '0.9rem',
							letterSpacing: 0.2,
						}}
					>
						Choose Your Role
					</h2>
					<p
						style={{
							fontSize: 'clamp(0.95rem, 1vw, 1.05rem)',
							color: '#475569',
							margin: '0 auto 2.2rem',
							maxWidth: 720,
							lineHeight: 1.6,
						}}
					>
						Sign in with your role. Account creation may be handled by your institution
						or an administrator.
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
								background: 'white',
								borderRadius: '1.25rem',
								border: '1px solid #e2e8f0',
								boxShadow: '0 10px 28px rgba(2,6,23,0.06)',
								padding: isMobile ? '1.2rem' : 'clamp(1.4rem, 2.2vw, 2rem)',
								textAlign: 'center',
								flex: isMobile ? '1 1 100%' : isTablet ? '1 1 46%' : '1 1 360px',
								maxWidth: isMobile ? '100%' : isTablet ? '520px' : '380px',
								minWidth: isMobile ? 'auto' : 280,
								position: 'relative',
								overflow: 'hidden',
								transition: 'transform 0.25s, box-shadow 0.25s',
							}}
							onMouseOver={e => {
								if (!isMobile) {
									e.currentTarget.style.transform = 'translateY(-4px)';
									e.currentTarget.style.boxShadow =
										'0 18px 36px rgba(2,6,23,0.10)';
								}
							}}
							onMouseOut={e => {
								if (!isMobile) {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow =
										'0 10px 28px rgba(2,6,23,0.06)';
								}
							}}
						>
							<div
								aria-hidden
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '28%',
									background:
										'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(199,210,254,0.12) 100%)',
									zIndex: 0,
								}}
							/>
							<div
								style={{
									position: 'relative',
									zIndex: 1,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
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
									}}
								>
									Sign in to take exams, write answers, and review results.
								</p>
								<div
									style={{
										display: 'flex',
										gap: '0.75rem',
										justifyContent: 'center',
										flexWrap: 'wrap',
										width: '100%',
									}}
								>
									<button
										aria-label="Student Sign in"
										onClick={() => navigate('/student/login')}
										style={{
											padding: '0.65rem 1.15rem',
											background:
												'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
											color: 'white',
											border: 'none',
											borderRadius: '0.6rem',
											cursor: 'pointer',
											fontWeight: 800,
											letterSpacing: 0.2,
											boxShadow: '0 8px 22px rgba(79,70,229,0.28)',
											transition: 'transform 0.2s, box-shadow 0.2s',
										}}
										onMouseOver={e => {
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow =
												'0 12px 28px rgba(79,70,229,0.36)';
										}}
										onMouseOut={e => {
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow =
												'0 8px 22px rgba(79,70,229,0.28)';
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
											transition: 'background-color 0.2s',
										}}
										onMouseOver={e => {
											e.currentTarget.style.backgroundColor =
												'rgba(199,210,254,0.25)';
										}}
										onMouseOut={e => {
											e.currentTarget.style.backgroundColor = 'transparent';
										}}
									>
										How it works
									</button>
								</div>
							</div>
						</div>

						{/* Teacher */}
						<div
							style={{
								background: 'white',
								borderRadius: '1.25rem',
								border: '1px solid #e2e8f0',
								boxShadow: '0 10px 28px rgba(2,6,23,0.06)',
								padding: isMobile ? '1.2rem' : 'clamp(1.4rem, 2.2vw, 2rem)',
								textAlign: 'center',
								flex: isMobile ? '1 1 100%' : isTablet ? '1 1 46%' : '1 1 360px',
								maxWidth: isMobile ? '100%' : isTablet ? '520px' : '380px',
								minWidth: isMobile ? 'auto' : 280,
								position: 'relative',
								overflow: 'hidden',
								transition: 'transform 0.25s, box-shadow 0.25s',
							}}
							onMouseOver={e => {
								if (!isMobile) {
									e.currentTarget.style.transform = 'translateY(-4px)';
									e.currentTarget.style.boxShadow =
										'0 18px 36px rgba(2,6,23,0.10)';
								}
							}}
							onMouseOut={e => {
								if (!isMobile) {
									e.currentTarget.style.transform = 'translateY(0)';
									e.currentTarget.style.boxShadow =
										'0 10px 28px rgba(2,6,23,0.06)';
								}
							}}
						>
							<div
								aria-hidden
								style={{
									position: 'absolute',
									top: 0,
									left: 0,
									width: '100%',
									height: '28%',
									background:
										'linear-gradient(135deg, rgba(249,115,22,0.08) 0%, rgba(254,215,170,0.12) 100%)',
									zIndex: 0,
								}}
							/>
							<div
								style={{
									position: 'relative',
									zIndex: 1,
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
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
									}}
								>
									Sign in to create exams, manage questions, and review
									submissions.
								</p>
								<div
									style={{
										display: 'flex',
										gap: '0.75rem',
										justifyContent: 'center',
										flexWrap: 'wrap',
										width: '100%',
									}}
								>
									<button
										aria-label="Teacher Sign in"
										onClick={() => navigate('/teacher/login')}
										style={{
											padding: '0.65rem 1.15rem',
											background:
												'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
											color: 'white',
											border: 'none',
											borderRadius: '0.6rem',
											cursor: 'pointer',
											fontWeight: 800,
											letterSpacing: 0.2,
											boxShadow: '0 8px 22px rgba(249,115,22,0.28)',
											transition: 'transform 0.2s, box-shadow 0.2s',
										}}
										onMouseOver={e => {
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow =
												'0 12px 28px rgba(249,115,22,0.36)';
										}}
										onMouseOut={e => {
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow =
												'0 8px 22px rgba(249,115,22,0.28)';
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
											transition: 'background-color 0.2s',
										}}
										onMouseOver={e => {
											e.currentTarget.style.backgroundColor =
												'rgba(254,215,170,0.28)';
										}}
										onMouseOut={e => {
											e.currentTarget.style.backgroundColor = 'transparent';
										}}
									>
										How it works
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer
				style={{
					backgroundColor: '#0f172a',
					color: 'white',
					padding: isMobile ? '2rem 1rem' : '3rem',
					textAlign: 'center',
					position: 'relative',
					overflow: 'hidden',
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
            * {
              animation: none !important;
              transition: none !important;
              scroll-behavior: auto !important;
            }
          }
        `}
			</style>
		</div>
	);
};

export default LandingPage;
