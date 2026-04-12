import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme.js';
import { useAuth } from '../hooks/useAuth.js';
import Footer from '../components/ui/Footer.jsx';
import './LandingPage.css'; // Responsive CSS classes

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
	{ title: 'Publish & Share', desc: 'Make the exam live and share the unique 8-character exam code with your students via your preferred channel.', icon: '🚀' },
	{ title: 'Monitor in Real-time', desc: 'Watch submissions arrive live on your dashboard. Track who started, who submitted, and who needs attention.', icon: '📡' },
	{ title: 'AI Evaluation & Review', desc: 'Let AI grade all submissions automatically. Review scores, adjust marks, add comments, and publish results instantly.', icon: '🎯' },
];

const studentSteps = [
	{ title: 'Join with Code', desc: 'Enter the unique 8-character exam code shared by your teacher to instantly access the exam environment.', icon: '🔑' },
	{ title: 'Secure Exam Mode', desc: 'The exam launches in fullscreen with copy/paste blocked. Your answers auto-save so you never lose progress.', icon: '🔒' },
	{ title: 'Submit & Relax', desc: 'Review your question palette, check marked-for-review items, then submit securely. The system syncs your data.', icon: '✅' },
	{ title: 'View AI Feedback', desc: 'Once results are published, view your detailed score breakdown with AI-generated remarks for every single answer.', icon: '📊' },
];

const securityFeatures = [
	{ title: 'Fullscreen Lock', desc: 'Exams run in mandatory fullscreen. Exiting triggers a logged violation against the student.' },
	{ title: 'Tab-switch Detection', desc: 'Switching tabs or minimizing the browser is detected and logged server-side instantly.' },
	{ title: 'Copy/Paste Blocking', desc: 'Clipboard operations (Ctrl+C, Ctrl+V, right-click) are blocked across the entire exam interface.' },
	{ title: 'DevTools Prevention', desc: 'F12, Ctrl+Shift+I, and DevTools panels are detected and blocked to prevent source code inspection.' },
	{ title: 'Screenshot Blocking', desc: 'PrintScreen key is intercepted during the exam session to prevent question leaking.' },
	{ title: 'Auto-submit on Violations', desc: 'After a configurable number of security violations (e.g., 5), the exam automatically submits.' },
	{ title: 'Window Blur Detection', desc: 'Pop-over windows and overlays are detected even when the main tab stays active.' },
	{ title: 'Accidental Close Guard', desc: 'A rigorous browser confirmation dialog prevents accidental page refresh, back navigation, or window close.' },
];

const faqs = [
	{ q: 'How does the AI evaluate subjective answers?', a: 'Our AI engine uses advanced large language models (LLMs) to analyze student responses against reference answers and teacher-provided rubric criteria. It checks for keyword presence, contextual understanding, completeness, and logical structure. It then assigns marks along with detailed feedback explaining exactly why the score was given.' },
	{ q: 'What happens if a student\'s internet drops during an exam?', a: 'All answers are auto-saved roughly every 30 seconds and after every explicit navigation. If the connection drops, the system queues changes locally and silently syncs them when the connection is restored. The timer runs securely server-side, so refreshing or dropping out does not manipulate the actual allowed duration.' },
	{ q: 'Can students cheat during the exams?', a: 'We implement 7+ rigorous security layers including fullscreen enforcement, copy/paste blocking, tab-switch detection, DevTools prevention, and screenshot blocking. All violations are logged with timestamps in the teacher\'s dashboard. While no client-side system is 100% tamper-proof, these combined measures reliably deter the vast majority of cheating attempts.' },
	{ q: 'How do students join an exam?', a: 'Teachers generate a unique 8-character exam code when creating a new exam. Students simply enter this code in their specific student dashboard to instantly access the exam environment. No complex programmatic enrollment is required — it\'s as simple as sharing a Zoom link.' },
	{ q: 'Can teachers override the AI grades?', a: 'Absolutely. AI evaluation acts as a powerful starting point, not the final immutable word. Teachers can view every AI-graded answer, adjust the marks manually, rewrite or add private comments, and then finally publish the results. The system supports full human-in-the-loop oversight.' },
	{ q: 'Is the platform free?', a: 'Yes, the platform was conceived as an open-source academic project to demonstrate the incredible utility of cutting-edge AI-powered exam evaluation at scale.' },
];

// ═══════════════════════════════════════════════════════════════════
// SECTIONS
// ═══════════════════════════════════════════════════════════════════

const HeroSection = ({ isAuthenticated, user }) => {
	const navigate = useNavigate();
	const role = user?.role || user?.type || '';
	const displayName = user?.fullname || user?.username || 'there';

	return (
		<section className="hero-section">
			{/* Background blobs */}
			<div className="hero-blob-1" />
			<div className="hero-blob-2" />

			<div className="hero-container">
				{/* Text content */}
				<div>
					<div className="hero-tag">
						✨ Next-Generation AI-Powered Exam Platform
					</div>

					<h1 className="hero-title">
						{isAuthenticated ? (
							<>Welcome back, <br /><span className="gradient-text">{displayName}</span></>
						) : (
							<>Smart Exams,<br /><span className="gradient-text">Fairer Results.</span></>
						)}
					</h1>

					<p className="hero-desc">
						{isAuthenticated
							? role === 'teacher'
								? 'Manage your exams, track student progress securely, and breeze through grading with advanced AI assistance.'
								: 'Access your scheduled exams efficiently, view your detailed results, and track your performance milestones.'
							: 'A complete, state-of-the-art exam management platform that empowers teachers to create, schedule, and instantly AI-grade exams — while students take them in a rigorously secure, proctored environment with real-time syncing.'}
					</p>

					{/* Trust badges */}
					{!isAuthenticated && (
						<div className="hero-badges-wrapper">
							{['🔒 Proctored Environment', '🤖 LLM Subjective Grading', '⚡ Real-time Synchronization'].map(badge => (
								<span key={badge} className="hero-badge">{badge}</span>
							))}
						</div>
					)}

					<div className="hero-actions">
						{isAuthenticated ? (
							<>
								<button onClick={() => navigate(role === 'teacher' ? '/teacher/exams' : '/student/exams')} className="btn-primary">
									Go to Exams
								</button>
								<button onClick={() => navigate(role === 'teacher' ? '/teacher' : '/student')} className="btn-secondary">
									Dashboard
								</button>
							</>
						) : (
							<>
								<button onClick={() => document.getElementById('roles').scrollIntoView({ behavior: 'smooth' })} className="btn-primary">
									Get Started — It's Free
								</button>
								<button onClick={() => document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' })} className="btn-secondary">
									See How It Works
								</button>
							</>
						)}
					</div>
				</div>

				{/* Floating desktop images */}
				<div className="hero-image-wrap">
					<div className="animate-float" style={{ position: 'absolute', top: 0, right: 0, width: '80%', height: '80%', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-2xl)', border: '1px solid var(--border)', zIndex: 2 }}>
						<img src={hero1} alt="Platform Dashboard" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
					</div>
					<div className="animate-float" style={{ position: 'absolute', bottom: 0, left: 0, width: '60%', height: '60%', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--shadow-xl)', border: '1px solid var(--border)', zIndex: 3, animationDelay: '1s' }}>
						<img src={hero3} alt="Exam Analytics" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
					</div>
				</div>
			</div>
		</section>
	);
};

const StatsBar = () => (
	<section className="stats-bar">
		<div className="stats-grid">
			{platformStats.map((s, i) => (
				<div key={i} className="stat-item">
					<div className="stat-icon">{s.icon}</div>
					<div className="stat-val">{s.value}</div>
					<div className="stat-lbl">{s.label}</div>
				</div>
			))}
		</div>
	</section>
);

const AboutSection = () => (
	<section className="section-pad-bg">
		<div className="about-wrap">
			<h2 className="section-title">
				What is <span className="gradient-text">ExamAI</span>?
			</h2>
			<p className="about-desc">
				ExamAI is an end-to-end exam management system built predominantly on a modern MERN stack. Teachers seamlessly construct exams using a blend of Multiple Choice and highly subjective questions, deploy robust scheduling windows, and disseminate a succinct 8-character exam code to their classroom. 
				<br /><br />
				Students experience the exam within a <strong>rigorously secure, proctored fullscreen shell</strong> designed to combat academic dishonesty utilizing robust environment checks involving copy/paste suppression, blur detection, visibility states, and DevTools prevention. Upon completion, an <strong>advanced AI evaluation engine</strong> steps in, automatically processing sprawling subjective answers using LLM techniques combined with contextual rubric-based analysis, yielding consistent scoring and feedback remarks for the student. Teachers are then enabled to review these grades with full override control right in their dashboard.
			</p>
			<div className="tech-badges">
				{['MERN Stack', 'React 19', 'Socket.IO', 'JWT Auth AuthZ', 'Hugging Face LLMs', 'MongoDB Architecture'].map(tech => (
					<span key={tech} className="tech-badge">{tech}</span>
				))}
			</div>
		</div>
	</section>
);

const FeaturesSection = () => (
	<section id="features" className="section-pad-surface">
		<div className="section-container">
			<div className="section-header-center">
				<h2 className="section-title">Everything You Need for Modern Assessments</h2>
				<p className="section-subtitle">
					From complex exam creation logic right through to detailed analytical grading — every interface is curated for raw efficiency, operational security, and academic fairness.
				</p>
			</div>

			<div className="features-grid">
				{features.map((f, i) => (
					<div key={i} className="feature-card">
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

const HowItWorksSection = () => {
	const [activeTab, setActiveTab] = useState('teacher');
	const steps = activeTab === 'teacher' ? teacherSteps : studentSteps;

	return (
		<section id="how-it-works" className="section-pad-bg">
			<div className="section-container">
				<div className="section-header-center">
					<h2 className="section-title">How It Works</h2>
					<p className="section-subtitle">
						Intuitive and deeply integrated workflows for both teaching staff and students — streamlining everything from prompt setup to result dissipation.
					</p>

					<div style={{ display: 'inline-flex', background: 'var(--surface)', padding: '0.4rem', borderRadius: 12, border: '1px solid var(--border)', gap: 4, marginTop: '2rem' }}>
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

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
					{steps.map((step, i) => (
						<div key={`${activeTab}-${i}`} className="feature-card" style={{ animation: `dashEnter 0.4s both`, animationDelay: `${i * 0.08}s` }}>
							<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
								<div style={{ width: 40, height: 40, background: 'var(--primary-light)', color: 'var(--primary-strong)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 15 }}>
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

const SecuritySection = () => (
	<section className="section-pad-surface">
		<div className="section-container split-grid">
			<div>
				<div style={{
					display: 'inline-block', padding: '0.4rem 1rem', borderRadius: 999,
					background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
					color: '#10b981', fontSize: '0.8rem', fontWeight: 700, marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.06em',
				}}>
					🛡️ Anti-cheating Suite
				</div>
				<h2 className="section-title">7+ Layers of Exam Security</h2>
				<p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
					Our proctoring system actively deters <strong>99%</strong> of casual cheating attempts with embedded browser-level restrictions. Absolutely every violation is logged dynamically server-side. Teachers review a highly granular timestamped audit log.
				</p>

				<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
					{securityFeatures.map((sf, i) => (
						<div key={i} style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
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
	</section>
);

const TechStackSection = () => (
	<section className="section-pad-bg">
		<div className="section-container split-grid">
			<div>
				<h2 className="section-title">Powered by Modern Tech</h2>
				<p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', lineHeight: 1.7, marginBottom: '2rem' }}>
					Built deliberately on high-performance production-grade infrastructure modeled to deliver continuous reliability, responsive real-time data flow, and precise intelligent evaluation scaling.
				</p>

				<div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
					{[
						{ icon: '🤖', color: 'rgba(16,185,129,0.1)', title: 'AI Evaluation Engine', desc: 'Surgically integrated with Hugging Face LLMs capable of contextual rubric-based subjective grading workflows. Supports strictly-enforced teacher-defined evaluation policies.' },
						{ icon: '⚡', color: 'rgba(59,130,246,0.1)', title: 'Real-time Real-world Architecture', desc: 'Socket.IO powers live submission metrics tracking for instructors. Redundant local auto-save mechanics ensure students never lose answers under network duress.' },
						{ icon: '🔐', color: 'rgba(245,158,11,0.1)', title: 'Enterprise-grade Identity', desc: 'Secure JWT stateless authentication protected by strict HTTP-only cookies, combined definitively with role-based functional access control bounds.' },
						{ icon: '📧', color: 'rgba(139,92,246,0.1)', title: 'Extensive Mailing Delivery', desc: 'Robust built-in email verification mechanisms, secure OTP password reset pipelines, supported dynamically via clean custom branded email distribution.' },
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

const FAQSection = () => {
	const [openIndex, setOpenIndex] = useState(null);

	return (
		<section className="section-pad-surface">
			<div className="faq-wrap">
				<div className="section-header-center">
					<h2 className="section-title">Frequently Asked Questions</h2>
					<p className="section-subtitle">Clear answers surrounding grading mechanics and exam conditions.</p>
				</div>

				<div className="faq-list">
					{faqs.map((faq, i) => (
						<div key={i} className="faq-item" style={{ boxShadow: openIndex === i ? 'var(--shadow-md)' : 'none' }}>
							<button onClick={() => setOpenIndex(openIndex === i ? null : i)} className="faq-btn">
								<span className="faq-q">{faq.q}</span>
								<span className="faq-icon" style={{ transform: openIndex === i ? 'rotate(45deg)' : 'rotate(0deg)' }}>+</span>
							</button>
							{openIndex === i && (
								<div className="faq-a">{faq.a}</div>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
};

const RoleSelectionSection = ({ onAuth }) => (
	<section id="roles" className="section-pad-bg">
		<div className="section-container">
			<div className="section-header-center">
				<h2 className="section-title">Ready to Get Started?</h2>
				<p className="section-subtitle">
					Select your respective role to securely sign in or freely create a verified account. Setup completes in under 2 minutes.
				</p>
			</div>

			<div className="roles-grid">
				<div onClick={() => onAuth('student', 'login')} className="role-card">
					<div className="role-img-wrap"><img src={studentImg} alt="Student" className="role-img" /></div>
					<div style={{ padding: '2rem' }}>
						<h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--primary)' }}>Student</h3>
						<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
							Join strict exams actively invoking the code, execute secure objective tests, and review deeply-evaluated AI metric returns.
						</p>
						<button className="btn-primary" style={{ width: '100%' }}>Continue as Student →</button>
					</div>
				</div>

				<div onClick={() => onAuth('teacher', 'login')} className="role-card">
					<div className="role-img-wrap"><img src={teacherImg} alt="Teacher" className="role-img" /></div>
					<div style={{ padding: '2rem' }}>
						<h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--secondary-strong)' }}>Teacher</h3>
						<p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
							Deploy extensive exams, engineer complex rubric checks, harness LLM evaluation automation gracefully, and govern class structures.
						</p>
						<button className="btn-primary" style={{ width: '100%', background: 'var(--secondary-strong)' }}>Continue as Teacher →</button>
					</div>
				</div>
			</div>
		</div>
	</section>
);

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
const LandingPage = () => {
	const navigate = useNavigate();
	const { user, isAuthenticated } = useAuth();
	
	const handleAuth = (role, mode) => navigate(`/auth?mode=${mode}`);

	return (
		<div className="app-shell" style={{ overflowX: 'hidden' }}>
			<HeroSection isAuthenticated={isAuthenticated} user={user} />
			<StatsBar />
			<AboutSection />
			<FeaturesSection />
			<HowItWorksSection />
			<SecuritySection />
			<TechStackSection />
			<FAQSection />
			<RoleSelectionSection onAuth={handleAuth} />
			<Footer />
		</div>
	);
};

export default LandingPage;
