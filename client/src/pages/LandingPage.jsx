import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import Footer from '../components/ui/Footer.jsx';

// --- Asset Imports ---
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';
import hero1 from '../assets/hero_1.png';
import hero2 from '../assets/hero_2.png';
import hero3 from '../assets/hero_3.png';
import hero4 from '../assets/hero_4.png';
import card1 from '../assets/card_1.png';
import card2 from '../assets/card_2.png';
import card3 from '../assets/card_3.png';

// ═══════════════════════════════════════════════════════════════════
// DATA
// ═══════════════════════════════════════════════════════════════════
const features = [
	{ title: 'Create & Schedule', desc: 'Build exams from a rich question bank with MCQ and subjective types. Set precise start/end windows, duration limits, and auto-publish schedules.', icon: '📝', color: '#6366f1', img: card2 },
	{ title: 'Secure Exam Environment', desc: 'Students take exams in a locked fullscreen mode. Copy/paste blocking, tab-switch detection, and DevTools prevention ensure academic integrity.', icon: '🔒', color: '#10b981', img: card3 },
	{ title: 'Real-time Auto-save', desc: 'Every answer is debounced and saved within seconds. Network drops don\'t mean data loss — the system queues saves and retries automatically.', icon: '⚡', color: '#f59e0b', img: hero1 },
	{ title: 'AI-Powered Evaluation', desc: 'MCQs are graded instantly. Subjective answers are evaluated by AI using rubric-based analysis, keyword matching, and contextual understanding.', icon: '🤖', color: '#3b82f6', img: card1 },
	{ title: 'Detailed Analytics', desc: 'Teachers see per-question breakdowns, class averages, and score distributions. Students get AI-generated feedback and improvement suggestions.', icon: '📊', color: '#8b5cf6', img: hero2 },
	{ title: 'Data Export', desc: 'Export student submissions, exam summaries, and grade books as CSV files anytime. Ideal for institutional reporting and academic records.', icon: '📥', color: '#ec4899', img: hero3 },
];

const platformStats = [
	{ label: 'Question Types', value: 'MCQ + Subjective', icon: '📋' },
	{ label: 'AI Grading', value: 'Rubric-based', icon: '🤖' },
	{ label: 'Auto-save', value: 'Every 30s', icon: '💾' },
	{ label: 'Security Layers', value: '7+ Active', icon: '🛡️' },
];

const teacherSteps = [
	{ title: 'Create Exam', desc: 'Set up your exam with MCQs and subjective questions. Define duration, schedule windows, and evaluation policies.', icon: '✏️' },
	{ title: 'Publish & Share', desc: 'Make the exam live and share the unique 8-character exam code with your students via any channel.', icon: '🚀' },
	{ title: 'Monitor in Real-time', desc: 'Watch submissions arrive live on your dashboard. Track who started, who submitted, and who needs attention.', icon: '📡' },
	{ title: 'AI Evaluation & Review', desc: 'Let AI grade all submissions automatically. Review scores, adjust marks, add comments, and publish results.', icon: '🎯' },
];

const studentSteps = [
	{ title: 'Join with Code', desc: 'Enter the unique 8-character exam code shared by your teacher to instantly access the exam environment.', icon: '🔑' },
	{ title: 'Secure Exam Mode', desc: 'The exam launches in fullscreen with copy/paste blocked. Your answers auto-save so you never lose progress.', icon: '🔒' },
	{ title: 'Submit & Relax', desc: 'Review your question palette, check marked-for-review items, then submit. The system syncs your data safely.', icon: '✅' },
	{ title: 'View AI Feedback', desc: 'Once results are published, view your detailed score breakdown with AI-generated remarks for every answer.', icon: '📊' },
];

const securityFeatures = [
	{ title: 'Fullscreen Lock', desc: 'Exams run in mandatory fullscreen. Exiting triggers a logged violation.' },
	{ title: 'Tab-switch Detection', desc: 'Switching tabs or minimizing is detected and logged server-side.' },
	{ title: 'Copy/Paste Blocking', desc: 'Clipboard operations are blocked across the exam interface.' },
	{ title: 'DevTools Prevention', desc: 'F12, Ctrl+Shift+I, and DevTools panels are detected and blocked.' },
	{ title: 'Screenshot Blocking', desc: 'PrintScreen key is intercepted during the exam session.' },
	{ title: 'Auto-submit on Violations', desc: 'After 5 security violations, the exam is automatically submitted.' },
	{ title: 'Window Blur Detection', desc: 'Pop-over windows and overlays are detected even when the tab stays active.' },
	{ title: 'Accidental Close Guard', desc: 'A browser confirmation dialog prevents accidental page refresh or close.' },
];

const faqs = [
	{ q: 'How does the AI evaluate subjective answers?', a: 'Our AI engine uses large language models to analyze student responses against reference answers and rubric criteria. It checks for keyword presence, contextual understanding, completeness, and logical structure — then assigns marks with detailed feedback explaining the score.' },
	{ q: 'What happens if my internet drops during an exam?', a: 'Your answers are auto-saved every 30 seconds and after every navigation. If you lose connection, the system queues your changes locally and syncs them when you\'re back online. The timer is server-side, so it cannot be manipulated.' },
	{ q: 'Can students cheat during exams?', a: 'We implement 7+ security layers including fullscreen enforcement, copy/paste blocking, tab-switch detection, DevTools prevention, and screenshot blocking. All violations are logged with timestamps. After 5 violations, the exam auto-submits. While no client-side system is 100% tamper-proof, these measures deter the vast majority of cheating attempts.' },
	{ q: 'How do students join an exam?', a: 'Teachers generate a unique 8-character exam code when creating an exam. Students simply enter this code in their dashboard to instantly access the exam. No complex enrollment — just share the code.' },
	{ q: 'Can teachers override AI grades?', a: 'Absolutely. AI evaluation is a starting point, not the final word. Teachers can review every AI-graded answer, adjust marks, add comments, and then publish results. The system supports both AI-only and teacher-reviewed workflows.' },
	{ q: 'Is the platform free?', a: 'Yes, the platform is completely free and open-source. It\'s built as an academic project to demonstrate AI-powered exam evaluation at scale.' },
];

// ═══════════════════════════════════════════════════════════════════
// HOOKS
// ═══════════════════════════════════════════════════════════════════
const useResponsive = () => {
	const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
	useEffect(() => {
		const h = () => setW(window.innerWidth);
		window.addEventListener('resize', h);
		return () => window.removeEventListener('resize', h);
	}, []);
	return { isMobile: w < 640, isTablet: w >= 640 && w < 1024 };
};

// ═══════════════════════════════════════════════════════════════════
// SECTION: Hero
// ═══════════════════════════════════════════════════════════════════
const HeroSection = ({ isAuthenticated, user, isDark, isMobile }) => {
	const navigate = useNavigate();
	const role = user?.role || user?.type || '';
	const displayName = user?.fullname || user?.username || 'there';

	return (
		<section style={{
			position: 'relative', minHeight: '92vh', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
			padding: isMobile ? '6rem 1rem 4rem' : '8rem 2rem 6rem',
			background: isDark
				? 'radial-gradient(circle at 50% 0%, #1e293b 0%, #0f172a 100%)'
				: 'radial-gradient(circle at 50% 0%, #eff6ff 0%, #f8fafc 100%)',
		}}>
			{/* Background blobs */}
			<div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'var(--primary)', filter: 'blur(120px)', opacity: 0.08, borderRadius: '50%', zIndex: 0 }} />
			<div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '50%', height: '50%', background: 'var(--secondary)', filter: 'blur(120px)', opacity: 0.08, borderRadius: '50%', zIndex: 0 }} />

			<div style={{ maxWidth: 1280, width: '100%', zIndex: 1, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '2rem' : '4rem', alignItems: 'center' }}>
				{/* Text */}
				<div style={{ textAlign: isMobile ? 'center' : 'left' }}>
					<div style={{
						display: 'inline-block', padding: '0.5rem 1rem', borderRadius: 9999,
						background: isDark ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.08)',
						border: '1px solid var(--primary-light)', color: 'var(--primary)',
						fontSize: '0.875rem', fontWeight: 600, marginBottom: '1.5rem',
					}}>
						✨ AI-Powered Exam Evaluation Platform
					</div>

					<h1 style={{ fontSize: isMobile ? 'clamp(2.5rem,8vw,3rem)' : '3.75rem', fontWeight: 800, lineHeight: 1.08, marginBottom: '1.5rem', letterSpacing: '-0.03em' }}>
						{isAuthenticated ? (
							<>Welcome back, <br /><span className="gradient-text">{displayName}</span></>
						) : (
							<>Smart Exams,<br /><span className="gradient-text">Fairer Results.</span></>
						)}
					</h1>

					<p style={{ fontSize: '1.125rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.7, maxWidth: isMobile ? '100%' : '92%' }}>
						{isAuthenticated
							? role === 'teacher'
								? 'Manage your exams, track student progress, and grade with AI assistance.'
								: 'Access your scheduled exams, view your results, and track your performance.'
							: 'A complete exam management platform that lets teachers create, schedule, and AI-grade exams — while students take them in a secure, proctored environment with real-time auto-save.'}
					</p>

					{/* Trust badges */}
					{!isAuthenticated && (
						<div style={{ display: 'flex', gap: 16, marginBottom: '2rem', flexWrap: 'wrap', justifyContent: isMobile ? 'center' : 'flex-start' }}>
							{['🔒 Secure Proctoring', '🤖 AI Grading', '⚡ Real-time Sync'].map(badge => (
								<span key={badge} style={{
									fontSize: 13, fontWeight: 600, color: 'var(--text-muted)',
									padding: '6px 12px', borderRadius: 8, background: 'var(--surface)',
									border: '1px solid var(--border)',
								}}>{badge}</span>
							))}
						</div>
					)}

					<div style={{ display: 'flex', gap: '1rem', justifyContent: isMobile ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
						{isAuthenticated ? (
							<>
								<button onClick={() => navigate(role === 'teacher' ? '/teacher/exams' : '/student/exams')} className="card-hover" style={{ padding: '0.875rem 2rem', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 14px rgba(59,130,246,0.39)' }}>
									Go to Exams
								</button>
								<button onClick={() => navigate(role === 'teacher' ? '/teacher' : '/student')} className="card-hover" style={{ padding: '0.875rem 2rem', borderRadius: 12, background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', fontSize: '1rem' }}>
									Dashboard
								</button>
							</>
						) : (
							<>
								<button onClick={() => document.getElementById('roles').scrollIntoView({ behavior: 'smooth' })} className="card-hover" style={{ padding: '0.875rem 2rem', borderRadius: 12, background: 'var(--primary)', color: '#fff', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: '1rem', boxShadow: '0 4px 14px rgba(59,130,246,0.39)' }}>
									Get Started — It's Free
								</button>
								<button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="card-hover" style={{ padding: '0.875rem 2rem', borderRadius: 12, background: 'var(--surface)', color: 'var(--text)', fontWeight: 600, border: '1px solid var(--border)', cursor: 'pointer', fontSize: '1rem' }}>
									See How it Works
								</button>
							</>
						)}
					</div>
				</div>

				{/* Hero images */}
				{!isMobile && (
					<div style={{ position: 'relative', height: 500 }}>
						<div className="animate-float" style={{ position: 'absolute', top: 0, right: 0, width: '80%', height: '80%', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)', zIndex: 2 }}>
							<img src={hero1} alt="Platform Dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						</div>
						<div className="animate-float" style={{ position: 'absolute', bottom: 0, left: 0, width: '60%', height: '60%', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', zIndex: 3, animationDelay: '1s' }}>
							<img src={hero3} alt="Exam Analytics" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
						</div>
					</div>
				)}
			</div>
		</section>
	);
};

// ═══════════════════════════════════════════════════════════════════
// SECTION: Platform Stats Bar
// ═══════════════════════════════════════════════════════════════════
const StatsBar = ({ isMobile }) => (
	<section style={{ padding: isMobile ? '2rem 1rem' : '3rem 2rem', background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
		<div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 24 }}>
			{platformStats.map((s, i) => (
				<div key={i} style={{ textAlign: 'center', padding: 16 }}>
					<div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
					<div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>{s.value}</div>
					<div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
				</div>
			))}
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION: What is This Platform?
// ═══════════════════════════════════════════════════════════════════
const AboutSection = ({ isMobile }) => (
	<section style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--bg-secondary)' }}>
		<div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
			<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
				What is <span className="gradient-text">ExamAI</span>?
			</h2>
			<p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', lineHeight: 1.8, marginBottom: '2rem', maxWidth: 780, margin: '0 auto 2rem' }}>
				ExamAI is an end-to-end exam management system built on the MERN stack. Teachers create exams with MCQ and subjective questions, 
				set schedules and durations, then share a simple 8-character code with students. Students take exams in a <strong>secure, proctored fullscreen environment</strong> with 
				anti-cheating measures like copy/paste blocking, tab-switch detection, and DevTools prevention. Once submitted, an <strong>AI evaluation engine</strong> powered by 
				large language models automatically grades subjective answers using rubric-based analysis — providing detailed feedback for every response. 
				Teachers can review AI grades, adjust scores, add comments, and publish results all from their dashboard.
			</p>
			<div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
				{['MERN Stack', 'React 19', 'Socket.IO', 'JWT Auth', 'Hugging Face AI', 'MongoDB'].map(tech => (
					<span key={tech} style={{
						padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
						background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)',
					}}>{tech}</span>
				))}
			</div>
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION: Features
// ═══════════════════════════════════════════════════════════════════
const FeaturesSection = ({ isMobile }) => (
	<section id="features" style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--surface)' }}>
		<div style={{ maxWidth: 1280, margin: '0 auto' }}>
			<div style={{ textAlign: 'center', marginBottom: '4rem' }}>
				<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
					Everything You Need for Modern Assessments
				</h2>
				<p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: 650, margin: '0 auto' }}>
					From exam creation to AI-powered grading — every step is designed for efficiency, security, and fairness.
				</p>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.5rem' }}>
				{features.map((f, i) => (
					<div key={i} className="card-hover" style={{
						background: 'var(--bg)', borderRadius: 18, border: '1px solid var(--border)',
						padding: '2rem', display: 'flex', flexDirection: 'column', gap: 16,
					}}>
						<div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
							<div style={{
								width: 52, height: 52, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
								fontSize: 24, background: `${f.color}12`, flexShrink: 0,
							}}>
								{f.icon}
							</div>
							<h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>{f.title}</h3>
						</div>
						<p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', margin: 0 }}>{f.desc}</p>
					</div>
				))}
			</div>
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION: How it Works
// ═══════════════════════════════════════════════════════════════════
const HowItWorksSection = ({ isMobile }) => {
	const [activeTab, setActiveTab] = useState('teacher');
	const steps = activeTab === 'teacher' ? teacherSteps : studentSteps;

	return (
		<section id="how-it-works" style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--bg-secondary)' }}>
			<div style={{ maxWidth: 1280, margin: '0 auto' }}>
				<div style={{ textAlign: 'center', marginBottom: '3rem' }}>
					<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
						How It Works
					</h2>
					<p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: 600, margin: '0 auto 2rem' }}>
						Simple, intuitive workflows for both teachers and students — from exam creation to results.
					</p>

					<div style={{ display: 'inline-flex', background: 'var(--surface)', padding: '0.4rem', borderRadius: 12, border: '1px solid var(--border)', gap: 4 }}>
						{['teacher', 'student'].map(tab => (
							<button key={tab} onClick={() => setActiveTab(tab)} style={{
								padding: '0.6rem 1.5rem', borderRadius: 8,
								background: activeTab === tab ? 'var(--primary)' : 'transparent',
								color: activeTab === tab ? '#fff' : 'var(--text-muted)',
								border: 'none', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s ease', textTransform: 'capitalize',
							}}>
								For {tab}s
							</button>
						))}
					</div>
				</div>

				<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', gap: '1.5rem' }}>
					{steps.map((step, i) => (
						<div key={`${activeTab}-${i}`} className="card-hover" style={{
							background: 'var(--surface)', padding: '2rem', borderRadius: 16,
							border: '1px solid var(--border)', position: 'relative',
							animation: 'dashEnter 0.4s cubic-bezier(0.22,1,0.36,1) both',
							animationDelay: `${i * 0.08}s`,
						}}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
								<div style={{
									width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary-strong)',
									borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15,
								}}>
									{i + 1}
								</div>
								<span style={{ fontSize: 22 }}>{step.icon}</span>
							</div>
							<h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.75rem' }}>{step.title}</h3>
							<p style={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem' }}>{step.desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

// ═══════════════════════════════════════════════════════════════════
// SECTION: Security Showcase
// ═══════════════════════════════════════════════════════════════════
const SecuritySection = ({ isMobile }) => (
	<section style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
		<div style={{ maxWidth: 1280, margin: '0 auto' }}>
			<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
				<div>
					<div style={{
						display: 'inline-block', padding: '0.4rem 1rem', borderRadius: 999,
						background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
						color: '#10b981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.06em',
					}}>
						🛡️ Anti-cheating Suite
					</div>
					<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
						7+ Layers of Exam Security
					</h2>
					<p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
						Our proctoring system deters <strong>99%</strong> of casual cheating attempts with browser-level restrictions that log every violation server-side with timestamps. Teachers see a complete audit trail in their dashboard.
					</p>

					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
						{securityFeatures.map((sf, i) => (
							<div key={i} style={{
								padding: '14px 16px', borderRadius: 12,
								background: 'var(--bg-secondary)', border: '1px solid var(--border)',
							}}>
								<div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{sf.title}</div>
								<div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{sf.desc}</div>
							</div>
						))}
					</div>
				</div>

				<div style={{ position: 'relative' }}>
					<div className="card-hover" style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
						<img src={hero4} alt="Secure exam environment" style={{ width: '100%', display: 'block' }} />
					</div>
				</div>
			</div>
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION: Tech Stack
// ═══════════════════════════════════════════════════════════════════
const TechStackSection = ({ isMobile }) => (
	<section style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--bg-secondary)' }}>
		<div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
			<div>
				<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1.5rem' }}>
					Powered by Modern Tech
				</h2>
				<p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
					Built on production-grade infrastructure designed for reliability, real-time communication, and intelligent evaluation.
				</p>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
					{[
						{ icon: '🤖', color: 'rgba(16,185,129,0.1)', title: 'AI Evaluation Engine', desc: 'Integrated with Hugging Face LLMs for rubric-based subjective grading. Supports teacher-defined evaluation policies and automated feedback generation.' },
						{ icon: '⚡', color: 'rgba(59,130,246,0.1)', title: 'Real-time Architecture', desc: 'Socket.IO enables live submission tracking for teachers. Auto-save ensures students never lose answers — even during network interruptions.' },
						{ icon: '🔐', color: 'rgba(245,158,11,0.1)', title: 'Enterprise-grade Auth', desc: 'JWT-based authentication with HTTP-only cookies, email verification via Nodemailer, and role-based access control for students and teachers.' },
						{ icon: '📧', color: 'rgba(139,92,246,0.1)', title: 'Email System', desc: 'Built-in email verification, password reset flows, and OTP-based account recovery — all through a clean, branded email template system.' },
					].map((item, i) => (
						<div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
							<div style={{ minWidth: 48, height: 48, borderRadius: 12, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
								{item.icon}
							</div>
							<div>
								<h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 4 }}>{item.title}</h4>
								<p style={{ color: 'var(--text-muted)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>{item.desc}</p>
							</div>
						</div>
					))}
				</div>
			</div>
			<div>
				<div className="card-hover" style={{ borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)' }}>
					<img src={hero2} alt="Technology stack visualization" style={{ width: '100%', display: 'block' }} />
				</div>
			</div>
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// SECTION: FAQ
// ═══════════════════════════════════════════════════════════════════
const FAQSection = ({ isMobile }) => {
	const [openIndex, setOpenIndex] = useState(null);

	return (
		<section style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--surface)' }}>
			<div style={{ maxWidth: 800, margin: '0 auto' }}>
				<div style={{ textAlign: 'center', marginBottom: '3rem' }}>
					<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
						Frequently Asked Questions
					</h2>
					<p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
						Everything you need to know about the platform.
					</p>
				</div>

				<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					{faqs.map((faq, i) => (
						<div key={i} style={{
							background: 'var(--bg)', borderRadius: 14, border: '1px solid var(--border)',
							overflow: 'hidden', transition: 'box-shadow 0.2s ease',
							boxShadow: openIndex === i ? 'var(--shadow-md)' : 'none',
						}}>
							<button
								onClick={() => setOpenIndex(openIndex === i ? null : i)}
								style={{
									width: '100%', padding: '18px 20px', border: 'none', background: 'transparent',
									display: 'flex', justifyContent: 'space-between', alignItems: 'center',
									cursor: 'pointer', textAlign: 'left',
								}}
							>
								<span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', lineHeight: 1.4 }}>{faq.q}</span>
								<span style={{
									fontSize: 18, fontWeight: 700, color: 'var(--text-muted)', transition: 'transform 0.2s ease',
									transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)', flexShrink: 0, marginLeft: 16,
								}}>+</span>
							</button>
							{openIndex === i && (
								<div style={{ padding: '0 20px 18px', color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', animation: 'dashEnter 0.3s ease both' }}>
									{faq.a}
								</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

// ═══════════════════════════════════════════════════════════════════
// SECTION: Role Selection (CTA)
// ═══════════════════════════════════════════════════════════════════
const RoleCard = ({ role, description, image, color, onClick }) => (
	<div onClick={onClick} className="card-hover" style={{
		background: 'var(--surface)', borderRadius: 24, border: '1px solid var(--border)',
		overflow: 'hidden', cursor: 'pointer', boxShadow: 'var(--shadow-lg)',
	}}>
		<div style={{ height: 200, overflow: 'hidden' }}>
			<img src={image} alt={role} style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }} />
		</div>
		<div style={{ padding: '2rem' }}>
			<h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color }}>{role}</h3>
			<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>{description}</p>
			<button style={{
				width: '100%', padding: '0.875rem', borderRadius: 12, background: color,
				color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '1rem',
			}}>
				Continue as {role} →
			</button>
		</div>
	</div>
);

const RoleSelectionSection = ({ isMobile, onAuth }) => (
	<section id="roles" style={{ padding: isMobile ? '4rem 1rem' : '6rem 2rem', background: 'var(--bg-secondary)' }}>
		<div style={{ maxWidth: 1000, margin: '0 auto' }}>
			<div style={{ textAlign: 'center', marginBottom: '3rem' }}>
				<h2 style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>
					Ready to Get Started?
				</h2>
				<p style={{ color: 'var(--text-muted)', fontSize: '1.125rem', maxWidth: 500, margin: '0 auto' }}>
					Select your role to sign in or create a free account. Setup takes less than 2 minutes.
				</p>
			</div>

			<div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem' }}>
				<RoleCard
					role="Student"
					description="Join exams using a simple code, take tests in a secure environment, and view AI-graded results with detailed feedback."
					image={studentImg}
					color="var(--primary)"
					onClick={() => onAuth('student', 'login')}
				/>
				<RoleCard
					role="Teacher"
					description="Create and schedule exams, build question banks, leverage AI grading, and track student performance — all from one dashboard."
					image={teacherImg}
					color="var(--secondary-strong)"
					onClick={() => onAuth('teacher', 'login')}
				/>
			</div>
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
const LandingPage = () => {
	const navigate = useNavigate();
	const { theme } = useTheme();
	const { user, isAuthenticated } = useAuth();
	const { isMobile } = useResponsive();
	const isDark = theme === 'dark';

	const handleAuth = (role, mode) => navigate(`/auth?role=${role}&mode=${mode}`);

	return (
		<div className="app-shell">
			<HeroSection isAuthenticated={isAuthenticated} user={user} isDark={isDark} isMobile={isMobile} />
			<StatsBar isMobile={isMobile} />
			<AboutSection isMobile={isMobile} />
			<FeaturesSection isMobile={isMobile} />
			<HowItWorksSection isMobile={isMobile} />
			<SecuritySection isMobile={isMobile} />
			<TechStackSection isMobile={isMobile} />
			<FAQSection isMobile={isMobile} />
			<RoleSelectionSection isMobile={isMobile} onAuth={handleAuth} />
			<Footer />
		</div>
	);
};

export default LandingPage;
