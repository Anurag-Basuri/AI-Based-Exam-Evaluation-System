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

	const scrollToSection = ref => ref.current?.scrollIntoView({ behavior: 'smooth' });

	// Breakpoints
	const isMobile = windowWidth < 640;
	const isTablet = windowWidth >= 640 && windowWidth < 1024;

	// Feature cards (aligned with your codebase)
	const features = [
		{
			title: 'AI-Powered Evaluation',
			description:
				'Answers are analyzed with an evaluation service for fair, consistent scoring.',
			icon: image1,
		},
		{
			title: 'Question & Exam Management',
			description:
				'Create and manage questions and exams with dedicated APIs and controllers.',
			icon: image2,
		},
		{
			title: 'Real-time Results',
			description: 'Students submit, get results and feedback without long delays.',
			icon: image3,
		},
		{
			title: 'Issue Reporting',
			description:
				'Built-in issue module so students and teachers can report and track problems.',
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
				fontFamily: "'Segoe UI','Roboto',sans-serif",
				overflowX: 'hidden',
			}}
		>
			{/* Hero */}
			<section
				aria-label="Hero"
				style={{
					background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
					display: 'flex',
					flexDirection: isMobile || isTablet ? 'column' : 'row',
					alignItems: 'center',
					justifyContent: 'space-between',
					gap: '2.2rem',
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
							style={{
								width: '100%',
								height: '100%',
								borderRadius: '50%',
								opacity: 0.15,
								objectFit: 'cover',
								boxShadow: '0 10px 30px rgba(0,0,0,0.05)',
							}}
						/>
					</div>
				))}

				<div
					style={{
						flex: '1',
						zIndex: 1,
						maxWidth: isMobile || isTablet ? '100%' : '48%',
						animation: 'fadeInLeft 0.8s ease-out',
					}}
				>
					<h1
						style={{
							fontSize: 'clamp(1.8rem, 4.2vw, 3.2rem)',
							fontWeight: 800,
							color: '#1e293b',
							marginBottom: '1.15rem',
							lineHeight: 1.2,
							background: 'linear-gradient(to right, #1e293b, #334155)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
						}}
					>
						AI-Based Exam Evaluation System
					</h1>
					<p
						style={{
							fontSize: 'clamp(1rem, 1.2vw, 1.15rem)',
							color: '#475569',
							marginBottom: '1.6rem',
							lineHeight: 1.65,
						}}
					>
						Streamline assessments for teachers and students. Create exams, manage
						questions, submit answers, and get results quickly — powered by React + Vite
						on the client and Node.js + Express with MongoDB on the server.
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
								fontWeight: 600,
								boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
								transition: 'transform 0.2s, box-shadow 0.2s',
							}}
							onMouseOver={e => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.3)';
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
								fontWeight: 600,
								transition: 'background-color 0.2s, color 0.2s',
							}}
							onMouseOver={e => {
								e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.08)';
							}}
							onMouseOut={e => {
								e.currentTarget.style.backgroundColor = 'transparent';
							}}
						>
							Learn More
						</button>
					</div>
				</div>

				{/* Images grid */}
				<div
					style={{
						flex: isMobile || isTablet ? '1' : '0.9',
						display: 'flex',
						justifyContent: 'center',
						zIndex: 1,
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
									style={{ width: '100%', height: '100%', objectFit: 'cover' }}
								/>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Features */}
			<section
				aria-label="Features"
				style={{
					padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
					backgroundColor: 'white',
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

				<div style={{ position: 'relative', zIndex: 1 }}>
					<h2
						style={{
							fontSize: 'clamp(1.6rem, 2.5vw, 2.2rem)',
							fontWeight: 700,
							color: '#1e293b',
							textAlign: 'center',
							marginBottom: '1.2rem',
						}}
					>
						How Our Platform Works
					</h2>
					<p
						style={{
							fontSize: 'clamp(0.95rem, 1vw, 1.1rem)',
							color: '#64748b',
							textAlign: 'center',
							maxWidth: 760,
							margin: '0 auto 2.4rem',
							lineHeight: 1.65,
						}}
					>
						Teachers create exams and manage questions. Students submit answers, and the
						evaluation service scores them with consistent, explainable results. Issues
						can be raised and tracked in-product.
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

			{/* Details (accurate to repo) */}
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
							fontWeight: 700,
							color: '#1e293b',
							textAlign: 'center',
							marginBottom: '1.8rem',
						}}
					>
						Built For Real Classrooms
					</h2>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: isMobile
								? '1fr'
								: isTablet
									? '1fr'
									: 'repeat(2, 1fr)',
							gap: '2.1rem',
							marginBottom: '2.6rem',
						}}
					>
						{/* Left */}
						<div>
							<div
								style={{
									background: 'white',
									borderRadius: '1rem',
									padding: isMobile ? '1.3rem' : '1.75rem',
									boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
									marginBottom: '1.6rem',
								}}
							>
								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: 700,
										color: '#1e293b',
										marginBottom: '0.8rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.6rem',
									}}
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
										}}
									>
										1
									</span>
									Roles & Modules
								</h3>
								<ul
									style={{
										paddingLeft: '1.2rem',
										color: '#64748b',
										fontSize: '0.98rem',
										lineHeight: 1.7,
									}}
								>
									<li>Student and Teacher roles</li>
									<li>Exams, Questions, Submissions, and Issues modules</li>
									<li>
										Protected routes on the client; auth middleware on the
										server
									</li>
								</ul>
							</div>

							<div
								style={{
									background: 'white',
									borderRadius: '1rem',
									padding: isMobile ? '1.3rem' : '1.75rem',
									boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
								}}
							>
								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: 700,
										color: '#1e293b',
										marginBottom: '0.8rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.6rem',
									}}
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
										}}
									>
										2
									</span>
									Security & APIs
								</h3>
								<ul
									style={{
										paddingLeft: '1.2rem',
										color: '#64748b',
										fontSize: '0.98rem',
										lineHeight: 1.7,
									}}
								>
									<li>JWT-based authentication (auth middleware)</li>
									<li>CORS middleware and structured error responses</li>
									<li>
										RESTful routes for students, teachers, exams, questions,
										submissions, issues
									</li>
								</ul>
							</div>
						</div>

						{/* Right */}
						<div>
							<div
								style={{
									background: 'white',
									borderRadius: '1rem',
									padding: isMobile ? '1.3rem' : '1.75rem',
									boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
									marginBottom: '1.6rem',
								}}
							>
								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: 700,
										color: '#1e293b',
										marginBottom: '0.8rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.6rem',
									}}
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
										}}
									>
										3
									</span>
									Evaluation Service
								</h3>
								<p
									style={{
										color: '#64748b',
										fontSize: '0.98rem',
										lineHeight: 1.65,
									}}
								>
									The server’s evaluation service scores free-form answers using
									rule-based checks and similarity signals, ensuring reliable,
									consistent grading.
								</p>
							</div>

							<div
								style={{
									background: 'white',
									borderRadius: '1rem',
									padding: isMobile ? '1.3rem' : '1.75rem',
									boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
								}}
							>
								<h3
									style={{
										fontSize: '1.25rem',
										fontWeight: 700,
										color: '#1e293b',
										marginBottom: '0.8rem',
										display: 'flex',
										alignItems: 'center',
										gap: '0.6rem',
									}}
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
										}}
									>
										4
									</span>
									Tech Stack
								</h3>
								<ul
									style={{
										paddingLeft: '1.2rem',
										color: '#64748b',
										fontSize: '0.98rem',
										lineHeight: 1.7,
									}}
								>
									<li>Frontend: React + Vite, responsive UI</li>
									<li>Backend: Node.js + Express</li>
									<li>Database: MongoDB</li>
								</ul>
							</div>
						</div>
					</div>

					<div
						style={{
							background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
							borderRadius: '1rem',
							padding: isMobile ? '1.3rem' : '2.2rem',
							color: 'white',
							textAlign: 'center',
							boxShadow: '0 10px 30px rgba(99,102,241,0.3)',
						}}
					>
						<h3
							style={{
								fontSize: 'clamp(1.2rem, 1.8vw, 1.6rem)',
								fontWeight: 700,
								marginBottom: '1rem',
							}}
						>
							Ready to modernize your assessments?
						</h3>
						<p
							style={{
								fontSize: 'clamp(0.95rem, 1vw, 1.05rem)',
								marginBottom: '1.6rem',
								opacity: 0.95,
								maxWidth: 720,
								margin: '0 auto 1.6rem',
							}}
						>
							Start by choosing your role below. Students can take exams and see
							results fast. Teachers can build question banks, run exams, and review
							outcomes.
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
					background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
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
							fontWeight: 700,
							color: '#1e293b',
							marginBottom: '0.9rem',
						}}
					>
						Choose Your Role
					</h2>
					<p
						style={{
							fontSize: 'clamp(0.95rem, 1vw, 1.05rem)',
							color: '#64748b',
							margin: '0 auto 2.4rem',
							maxWidth: 720,
							lineHeight: 1.6,
						}}
					>
						Sign in using your role. Don’t see “Sign Up”? Account creation may be
						handled by your institution or via admin.
					</p>

					<div
						style={{
							display: 'flex',
							gap: isMobile ? '1.6rem' : '2.2rem',
							justifyContent: 'center',
							flexWrap: 'wrap',
						}}
					>
						{/* Student */}
						<div
							style={{
								background: 'white',
								borderRadius: '1.5rem',
								boxShadow: '0 10px 30px rgba(30,41,59,0.08)',
								padding: isMobile ? '1.4rem' : '2rem',
								textAlign: 'center',
								width: isMobile ? '100%' : isTablet ? '46%' : '340px',
								maxWidth: '100%',
								position: 'relative',
								overflow: 'hidden',
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
										'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(224,231,255,0.1) 100%)',
									zIndex: 0,
								}}
							/>
							<div style={{ position: 'relative', zIndex: 1 }}>
								<img
									src={studentImg}
									alt="Student"
									style={{
										width: isMobile ? 90 : 110,
										height: isMobile ? 90 : 110,
										borderRadius: '50%',
										objectFit: 'cover',
										marginBottom: '1.2rem',
										border: '3px solid #6366f1',
										boxShadow: '0 5px 15px rgba(99,102,241,0.2)',
									}}
								/>
								<h3
									style={{
										fontSize: isMobile ? '1.3rem' : '1.45rem',
										fontWeight: 700,
										color: '#6366f1',
										marginBottom: '0.8rem',
									}}
								>
									Student
								</h3>
								<p
									style={{
										color: '#64748b',
										fontSize: '0.98rem',
										marginBottom: '1.2rem',
										lineHeight: 1.6,
									}}
								>
									Take exams, submit answers, and see results quickly.
								</p>
								<div
									style={{
										display: 'flex',
										gap: '0.8rem',
										justifyContent: 'center',
									}}
								>
									<button
										onClick={() => navigate('/student/login')}
										style={{
											padding: '0.6rem 1.2rem',
											backgroundColor: '#6366f1',
											color: 'white',
											border: 'none',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontWeight: 600,
											boxShadow: '0 4px 14px rgba(99,102,241,0.2)',
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
												'0 4px 14px rgba(99,102,241,0.2)';
										}}
									>
										Login
									</button>
									<button
										onClick={() => scrollToSection(detailsRef)}
										style={{
											padding: '0.6rem 1.2rem',
											backgroundColor: 'transparent',
											color: '#6366f1',
											border: '1px solid #6366f1',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontWeight: 600,
										}}
									>
										Explore
									</button>
								</div>
							</div>
						</div>

						{/* Teacher */}
						<div
							style={{
								background: 'white',
								borderRadius: '1.5rem',
								boxShadow: '0 10px 30px rgba(30,41,59,0.08)',
								padding: isMobile ? '1.4rem' : '2rem',
								textAlign: 'center',
								width: isMobile ? '100%' : isTablet ? '46%' : '340px',
								maxWidth: '100%',
								position: 'relative',
								overflow: 'hidden',
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
										'linear-gradient(135deg, rgba(245,158,66,0.1) 0%, rgba(254,240,221,0.1) 100%)',
									zIndex: 0,
								}}
							/>
							<div style={{ position: 'relative', zIndex: 1 }}>
								<img
									src={teacherImg}
									alt="Teacher"
									style={{
										width: isMobile ? 90 : 110,
										height: isMobile ? 90 : 110,
										borderRadius: '50%',
										objectFit: 'cover',
										marginBottom: '1.2rem',
										border: '3px solid #f59e42',
										boxShadow: '0 5px 15px rgba(245,158,66,0.2)',
									}}
								/>
								<h3
									style={{
										fontSize: isMobile ? '1.3rem' : '1.45rem',
										fontWeight: 700,
										color: '#f59e42',
										marginBottom: '0.8rem',
									}}
								>
									Teacher
								</h3>
								<p
									style={{
										color: '#64748b',
										fontSize: '0.98rem',
										marginBottom: '1.2rem',
										lineHeight: 1.6,
									}}
								>
									Build exams, manage questions, and review evaluations.
								</p>
								<div
									style={{
										display: 'flex',
										gap: '0.8rem',
										justifyContent: 'center',
									}}
								>
									<button
										onClick={() => navigate('/teacher/login')}
										style={{
											padding: '0.6rem 1.2rem',
											backgroundColor: '#f59e42',
											color: 'white',
											border: 'none',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontWeight: 600,
											boxShadow: '0 4px 14px rgba(245,158,66,0.2)',
											transition: 'transform 0.2s, box-shadow 0.2s',
										}}
										onMouseOver={e => {
											e.currentTarget.style.transform = 'translateY(-2px)';
											e.currentTarget.style.boxShadow =
												'0 6px 20px rgba(245,158,66,0.3)';
										}}
										onMouseOut={e => {
											e.currentTarget.style.transform = 'translateY(0)';
											e.currentTarget.style.boxShadow =
												'0 4px 14px rgba(245,158,66,0.2)';
										}}
									>
										Login
									</button>
									<button
										onClick={() => scrollToSection(detailsRef)}
										style={{
											padding: '0.6rem 1.2rem',
											backgroundColor: 'transparent',
											color: '#f59e42',
											border: '1px solid #f59e42',
											borderRadius: '0.55rem',
											cursor: 'pointer',
											fontWeight: 600,
										}}
									>
										Explore
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
					backgroundColor: '#1e293b',
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
							maxWidth: isMobile ? '100%' : 320,
						}}
					>
						<h3 style={{ fontSize: '1.25rem', marginBottom: '0.8rem' }}>
							AI Exam System
						</h3>
						<p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>
							Assessments, made simple—powered by an evaluation service, robust APIs,
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
