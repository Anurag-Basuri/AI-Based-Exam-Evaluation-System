import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall, getMySubmissions } from '../../services/studentServices.js';

// --- Utilities ---
const formatDate = v => {
	if (!v) return '—';
	try {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleDateString();
	} catch {
		return String(v);
	}
};

const getInitials = user => {
	const name = (user?.fullname || user?.username || 'S').trim();
	const parts = name.split(/\s+/).filter(Boolean);
	if (parts.length === 0) return 'S';
	return parts
		.map(p => p[0])
		.slice(0, 2)
		.join('')
		.toUpperCase();
};

// --- Reusable Components ---
const Skeleton = ({ height = 12, width = '100%', radius = 8 }) => (
	<div
		style={{
			background: 'linear-gradient(90deg, var(--bg-secondary), var(--bg))',
			height,
			width,
			borderRadius: radius,
			animation: 'pulse 1.5s ease-in-out infinite',
		}}
	/>
);

const KPI = ({ label, value, color = '#6366f1', subtitle, loading }) => (
	<div
		style={{
			padding: 16,
			borderRadius: 12,
			background: 'var(--surface)',
			display: 'flex',
			alignItems: 'center',
			gap: 14,
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
			flex: '1 1 200px',
			minWidth: 160,
		}}
	>
		<div
			style={{
				width: 48,
				height: 48,
				borderRadius: 10,
				background: `${color}15`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				flexShrink: 0,
			}}
		>
			<div
				style={{
					width: 20,
					height: 20,
					borderRadius: 4,
					background: color,
				}}
			/>
		</div>
		<div style={{ flex: 1 }}>
			<div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>
				{label}
			</div>
			<div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
				<div style={{ fontSize: 24, fontWeight: 800, color }}>
					{loading ? '...' : value}
				</div>
				{subtitle && !loading && (
					<div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{subtitle}</div>
				)}
			</div>
		</div>
	</div>
);

const StatusBadge = ({ status }) => {
	const s = String(status ?? 'pending').toLowerCase();
	const map = {
		'in-progress': { bg: '#fff7ed', color: '#c2410c', text: 'In Progress' },
		started: { bg: '#fff7ed', color: '#c2410c', text: 'In Progress' },
		submitted: { bg: '#eef2ff', color: '#4338ca', text: 'Submitted' },
		evaluated: { bg: '#ecfdf5', color: '#065f46', text: 'Evaluated' },
		pending: { bg: '#f3f4f6', color: '#374151', text: 'Pending' },
	};
	const style = map[s] || map.pending;
	return (
		<span
			style={{
				background: style.bg,
				color: style.color,
				padding: '4px 10px',
				borderRadius: 999,
				fontSize: 11,
				fontWeight: 700,
				textTransform: 'capitalize',
			}}
		>
			{style.text}
		</span>
	);
};

const StudentHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [stats, setStats] = React.useState({
		inProgress: 0,
		submitted: 0,
		evaluated: 0,
		total: 0,
	});
	const [recentSubmissions, setRecentSubmissions] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [isMobile, setIsMobile] = React.useState(
		typeof window !== 'undefined' ? window.innerWidth < 880 : false
	);

	React.useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth < 880);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const submissions = await safeApiCall(getMySubmissions);
			const counts = Array.isArray(submissions)
				? submissions.reduce(
						(acc, s) => {
							const status = s.status?.toLowerCase() || 'pending';
							if (status === 'in-progress' || status === 'started') acc.inProgress += 1;
							else if (status === 'submitted') acc.submitted += 1;
							else if (status === 'evaluated') acc.evaluated += 1;
							acc.total += 1;
							return acc;
						},
						{ inProgress: 0, submitted: 0, evaluated: 0, total: 0 }
				  )
				: { inProgress: 0, submitted: 0, evaluated: 0, total: 0 };

			setStats(counts);
			setRecentSubmissions(Array.isArray(submissions) ? submissions.slice(0, 5) : []);
		} catch (e) {
			setError(e?.message || 'Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	return (
		<div
			style={{
				maxWidth: 1100,
				margin: '0 auto',
				padding: isMobile ? 12 : 20,
				minHeight: '100vh',
			}}
		>
			<style>{`
				@keyframes pulse {
					0%, 100% { opacity: 1; }
					50% { opacity: 0.5; }
				}
			`}</style>

			{/* Header */}
			<header
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 12,
					marginBottom: 20,
					flexWrap: 'wrap',
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
						Welcome back, {user?.fullname || user?.username || 'Student'}! 👋
					</h1>
					<div style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
						Track your exams, view results, and manage your progress
					</div>
				</div>
				<button
					onClick={() => navigate('exams')}
					style={{
						padding: '10px 18px',
						borderRadius: 10,
						background: 'linear-gradient(135deg, #10b981, #059669)',
						color: '#fff',
						border: 'none',
						fontWeight: 700,
						fontSize: 14,
						cursor: 'pointer',
						boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
					}}
				>
					Find Exam
				</button>
			</header>

			{error && (
				<div
					style={{
						padding: 14,
						borderRadius: 12,
						background: '#fef2f2',
						color: '#991b1b',
						marginBottom: 20,
						border: '1px solid #fecaca',
					}}
				>
					{error}
				</div>
			)}

			{/* Two-column layout */}
			<section
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '320px 1fr',
					gap: 20,
				}}
			>
				{/* Left sidebar: Profile */}
				<aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					{/* Profile Card */}
					<div
						style={{
							padding: 20,
							borderRadius: 14,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							boxShadow: 'var(--shadow-sm)',
						}}
					>
						<div style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 16 }}>
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: 12,
									background: 'linear-gradient(135deg, #10b981, #059669)',
									color: '#fff',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 800,
									fontSize: 24,
									boxShadow: '0 4px 16px rgba(16,185,129,0.2)',
									flexShrink: 0,
								}}
							>
								{getInitials(user)}
							</div>
							<div style={{ flex: 1, minWidth: 0 }}>
								<div
									style={{
										fontSize: 16,
										fontWeight: 800,
										color: 'var(--text)',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									{user?.fullname || user?.username || 'Student'}
								</div>
								<div
									style={{
										fontSize: 13,
										color: 'var(--text-muted)',
										marginTop: 4,
										overflow: 'hidden',
										textOverflow: 'ellipsis',
										whiteSpace: 'nowrap',
									}}
								>
									@{user?.username || '—'}
								</div>
							</div>
						</div>

						<div style={{ display: 'grid', gap: 12 }}>
							<div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
								EMAIL
							</div>
							<div
								style={{
									fontSize: 13,
									color: 'var(--text)',
									overflow: 'hidden',
									textOverflow: 'ellipsis',
									whiteSpace: 'nowrap',
								}}
							>
								{user?.email || '—'}
							</div>

							{user?.phonenumber && (
								<>
									<div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
										PHONE
									</div>
									<div style={{ fontSize: 13, color: 'var(--text)' }}>{user.phonenumber}</div>
								</>
							)}

							<div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>
								MEMBER SINCE
							</div>
							<div style={{ fontSize: 13, color: 'var(--text)' }}>
								{formatDate(user?.createdAt)}
							</div>
						</div>

						<div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
							<button
								onClick={() => navigate('results')}
								style={{
									flex: 1,
									padding: '10px',
									borderRadius: 10,
									border: '1px solid var(--border)',
									background: 'transparent',
									color: 'var(--text)',
									fontWeight: 700,
									fontSize: 13,
									cursor: 'pointer',
								}}
							>
								Results
							</button>
							<button
								onClick={() => navigate('settings')}
								style={{
									padding: '10px 14px',
									borderRadius: 10,
									border: 'none',
									background: 'var(--bg-secondary)',
									color: 'var(--text)',
									fontWeight: 700,
									fontSize: 13,
									cursor: 'pointer',
								}}
							>
								Settings
							</button>
						</div>
					</div>

					{/* Quick Actions */}
					<div
						style={{
							padding: 16,
							borderRadius: 14,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							boxShadow: 'var(--shadow-sm)',
						}}
					>
						<div style={{ fontWeight: 800, marginBottom: 12, fontSize: 14 }}>Quick Actions</div>
						<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
							<button
								onClick={() => navigate('exams')}
								style={{
									padding: '10px 12px',
									borderRadius: 10,
									border: '1px solid var(--border)',
									background: 'transparent',
									color: 'var(--text)',
									fontWeight: 600,
									fontSize: 13,
									cursor: 'pointer',
									textAlign: 'left',
									display: 'flex',
									alignItems: 'center',
									gap: 10,
								}}
							>
								<span>🔍</span> Find Exam
							</button>
							<button
								onClick={() => navigate('issues')}
								style={{
									padding: '10px 12px',
									borderRadius: 10,
									border: '1px solid var(--border)',
									background: 'transparent',
									color: 'var(--text)',
									fontWeight: 600,
									fontSize: 13,
									cursor: 'pointer',
									textAlign: 'left',
									display: 'flex',
									alignItems: 'center',
									gap: 10,
								}}
							>
								<span>🛠️</span> Report Issue
							</button>
						</div>
					</div>
				</aside>

				{/* Right column: Stats + Activity */}
				<main style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
					{/* KPI Cards */}
					<div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
						<KPI
							label="In Progress"
							value={stats.inProgress}
							color="#f59e0b"
							subtitle="Active exams"
							loading={loading}
						/>
						<KPI
							label="Submitted"
							value={stats.submitted}
							color="#3b82f6"
							subtitle="Awaiting grading"
							loading={loading}
						/>
						<KPI
							label="Evaluated"
							value={stats.evaluated}
							color="#10b981"
							subtitle="Graded"
							loading={loading}
						/>
						<KPI
							label="Total Attempts"
							value={stats.total}
							color="#6366f1"
							subtitle="All time"
							loading={loading}
						/>
					</div>

					{/* Recent Activity */}
					<div
						style={{
							padding: 18,
							borderRadius: 14,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							boxShadow: 'var(--shadow-sm)',
						}}
					>
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 14,
							}}
						>
							<div style={{ fontWeight: 800, fontSize: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
								<div
									style={{
										width: 8,
										height: 8,
										borderRadius: 999,
										background: '#10b981',
									}}
								/>
								Recent Activity
							</div>
							<button
								onClick={() => navigate('results')}
								style={{
									background: 'transparent',
									border: 'none',
									color: '#10b981',
									fontWeight: 700,
									fontSize: 13,
									cursor: 'pointer',
								}}
							>
								View all
							</button>
						</div>

						<div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto' }}>
							{loading ? (
								[...Array(3)].map((_, i) => (
									<div
										key={i}
										style={{
											display: 'flex',
											gap: 12,
											padding: 12,
											alignItems: 'center',
										}}
									>
										<Skeleton height={48} width={48} radius={10} />
										<div style={{ flex: 1 }}>
											<Skeleton height={14} width="60%" />
											<div style={{ height: 8 }} />
											<Skeleton height={12} width="40%" />
										</div>
									</div>
								))
							) : recentSubmissions.length === 0 ? (
								<div
									style={{
										textAlign: 'center',
										color: 'var(--text-muted)',
										padding: '40px 20px',
										fontSize: 14,
									}}
								>
									<div style={{ fontSize: 32, marginBottom: 12 }}>📚</div>
									No exam attempts yet. Use an exam search ID to start!
								</div>
							) : (
								recentSubmissions.map(sub => (
									<div
										key={sub.id}
										onClick={() => {
											const status = sub.status?.toLowerCase();
											if (status === 'in-progress' || status === 'started') {
												navigate(`/student/take-exam/${sub.id}`);
											} else if (status === 'evaluated') {
												navigate(`/student/results/${sub.id}`);
											}
										}}
										style={{
											display: 'flex',
											alignItems: 'center',
											gap: 14,
											padding: 12,
											borderRadius: 10,
											cursor: 'pointer',
											transition: 'background 0.2s',
											background: 'transparent',
										}}
										onMouseEnter={e => {
											e.currentTarget.style.background = 'var(--bg-secondary)';
										}}
										onMouseLeave={e => {
											e.currentTarget.style.background = 'transparent';
										}}
									>
										<div
											style={{
												width: 48,
												height: 48,
												borderRadius: 10,
												background: '#eef2ff',
												display: 'flex',
												alignItems: 'center',
												justifyContent: 'center',
												fontWeight: 800,
												color: '#4338ca',
												fontSize: 20,
												flexShrink: 0,
											}}
										>
											📝
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div
												style={{
													fontWeight: 700,
													fontSize: 14,
													color: 'var(--text)',
													overflow: 'hidden',
													textOverflow: 'ellipsis',
													whiteSpace: 'nowrap',
												}}
											>
												{sub.examTitle}
											</div>
											<div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
												{formatDate(sub.startedAt || sub.submittedAt)}
											</div>
										</div>
										<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
											<StatusBadge status={sub.status} />
											{sub.score !== null && sub.score !== undefined && (
												<div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
													{sub.score}/{sub.maxScore}
												</div>
											)}
										</div>
									</div>
								))
							)}
						</div>
					</div>
				</main>
			</section>
		</div>
	);
};

export default StudentHome;
