import React from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth.js';
import { getTeacherDashboardStats } from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';

// ── Defaults & Utils ──────────────────────────────────────────────
const DEFAULT_DASH = {
	exams: { total: 0, live: 0, scheduled: 0, draft: 0, totalEnrolled: 0 },
	issues: { open: 0 },
	submissions: { pending: 0 },
	examsToReview: [],
	recentSubmissions: [],
	teacher: null,
};

const formatDate = v => {
	if (!v) return '—';
	try {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	} catch {
		return String(v);
	}
};

const formatDateTime = v => {
	if (!v) return '—';
	try {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return String(v);
	}
};

const getInitials = t => {
	const name = (t?.fullname || t?.username || 'T').trim();
	const parts = name.split(/\s+/).filter(Boolean);
	return (
		parts
			.map(p => p[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'T'
	);
};

const getGreeting = () => {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
};

// ── Skeleton loader ───────────────────────────────────────────────
const Skeleton = ({ h = 14, w = '100%', r = 8 }) => (
	<div
		style={{
			height: h,
			width: w,
			borderRadius: r,
			background:
				'linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)',
			backgroundSize: '200% 100%',
			animation: 'pulse 1.5s ease-in-out infinite',
		}}
	/>
);

// ── Status badge ──────────────────────────────────────────────────
const STATUS_MAP = {
	pending: { label: 'Pending', icon: '⏳', color: '#f59e0b', bg: '#fef3c7' },
	submitted: { label: 'Submitted', icon: '📥', color: '#3b82f6', bg: '#dbeafe' },
	evaluated: { label: 'Evaluated', icon: '🤖', color: '#10b981', bg: '#dcfce7' },
	published: { label: 'Published', icon: '✅', color: '#8b5cf6', bg: '#ede9fe' },
	'in-progress': { label: 'In Progress', icon: '⏳', color: '#f59e0b', bg: '#fef3c7' },
	graded: { label: 'Graded', icon: '✅', color: '#10b981', bg: '#dcfce7' },
	review: { label: 'Review', icon: '🔍', color: '#ef4444', bg: '#fee2e2' },
};

const StatusBadge = ({ status }) => {
	const s = String(status ?? 'pending').toLowerCase();
	const cfg = STATUS_MAP[s] || STATUS_MAP.pending;
	return (
		<span
			style={{
				background: cfg.bg,
				color: cfg.color,
				padding: '4px 10px',
				borderRadius: 999,
				fontSize: 11,
				fontWeight: 700,
				display: 'inline-flex',
				alignItems: 'center',
				gap: 4,
			}}
		>
			<span>{cfg.icon}</span>
			{cfg.label}
		</span>
	);
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const TeacherHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [data, setData] = React.useState(DEFAULT_DASH);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const resp = await getTeacherDashboardStats();
			setData(resp && typeof resp === 'object' ? { ...DEFAULT_DASH, ...resp } : DEFAULT_DASH);
		} catch (e) {
			console.warn('Dashboard load failed', e);
			setError(e?.message ?? 'Failed to load dashboard');
			setData(DEFAULT_DASH);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	// Real-time socket updates
	React.useEffect(() => {
		if (!user?.id) return undefined;
		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});
		const onNewSubmission = s =>
			setData(curr => ({
				...curr,
				recentSubmissions: [s, ...(curr.recentSubmissions || [])].slice(0, 5),
				submissions: {
					...(curr.submissions || {}),
					pending: (curr.submissions?.pending || 0) + 1,
				},
			}));
		socket.on('new-submission', onNewSubmission);
		socket.on('submission-updated', () => loadData());
		return () => {
			socket.off('new-submission', onNewSubmission);
			socket.disconnect();
		};
	}, [user, loadData]);

	const teacher =
		(data.teacher && Object.keys(data.teacher).length ? data.teacher : null) ||
		(user
			? {
					id: user.id,
					fullname: user.fullname,
					username: user.username,
					email: user.email,
					phonenumber: user.phonenumber,
					department: user.department,
					createdAt: user.createdAt,
				}
			: null);

	// ── Render ─────────────────────────────────────────────────────
	return (
		<div
			style={{
				maxWidth: 1080,
				margin: '0 auto',
				padding: 16,
				display: 'flex',
				flexDirection: 'column',
				gap: 16,
			}}
		>
			{/* ─── Hero Banner ─── */}
			<div
				className="dash-hero dash-enter dash-enter-1"
				style={{ background: 'linear-gradient(135deg, #4338ca, #6366f1, #818cf8)' }}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						flexWrap: 'wrap',
						gap: 16,
					}}
				>
					<div style={{ flex: 1, minWidth: 200 }}>
						<div
							style={{
								fontSize: 14,
								fontWeight: 500,
								opacity: 0.85,
								marginBottom: 6,
							}}
						>
							{getGreeting()},
						</div>
						<h1
							style={{
								margin: 0,
								fontSize: 26,
								fontWeight: 800,
								letterSpacing: -0.5,
								lineHeight: 1.2,
							}}
						>
							{loading ? '...' : (teacher?.fullname ?? 'Teacher')} 🎓
						</h1>
						<p style={{ margin: '6px 0 0', fontSize: 14, opacity: 0.8 }}>
							{loading
								? ''
								: teacher?.department ||
									'Manage your exams, review submissions, and track performance.'}
						</p>
					</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button
							onClick={() => navigate('/teacher/exams/create')}
							style={{
								background: 'rgba(255,255,255,0.2)',
								backdropFilter: 'blur(8px)',
								border: '1px solid rgba(255,255,255,0.25)',
								color: '#fff',
								padding: '10px 20px',
								borderRadius: 12,
								fontWeight: 700,
								fontSize: 14,
								cursor: 'pointer',
							}}
						>
							✨ New Exam
						</button>
						<button
							onClick={loadData}
							disabled={loading}
							title="Refresh"
							style={{
								padding: '10px 12px',
								borderRadius: 12,
								background: 'rgba(255,255,255,0.15)',
								border: '1px solid rgba(255,255,255,0.2)',
								color: '#fff',
								cursor: loading ? 'not-allowed' : 'pointer',
								opacity: loading ? 0.6 : 1,
								fontSize: 14,
							}}
						>
							🔄
						</button>
					</div>
				</div>

				{/* Teacher info strip */}
				{!loading && teacher && (
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 12,
							marginTop: 20,
							paddingTop: 16,
							borderTop: '1px solid rgba(255,255,255,0.15)',
						}}
					>
						<div
							style={{
								width: 40,
								height: 40,
								borderRadius: 10,
								background: 'rgba(255,255,255,0.2)',
								backdropFilter: 'blur(4px)',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontWeight: 800,
								fontSize: 16,
								flexShrink: 0,
							}}
						>
							{getInitials(teacher)}
						</div>
						<div
							style={{
								fontSize: 13,
								opacity: 0.85,
								display: 'flex',
								gap: 16,
								flexWrap: 'wrap',
							}}
						>
							<span>@{teacher?.username || '—'}</span>
							<span>📧 {teacher?.email || '—'}</span>
							{teacher?.phonenumber && <span>📱 {teacher.phonenumber}</span>}
							<span>📅 Joined {formatDate(teacher?.createdAt)}</span>
						</div>
					</div>
				)}
			</div>

			{/* ─── Error ─── */}
			{error && (
				<div
					className="dash-enter"
					style={{
						padding: 14,
						borderRadius: 12,
						background: 'var(--danger-bg)',
						color: 'var(--danger-text)',
						border: '1px solid var(--danger-border)',
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span>⚠️ {error}</span>
					<button
						onClick={() => setError('')}
						style={{
							background: 'transparent',
							border: 'none',
							color: 'var(--danger-text)',
							cursor: 'pointer',
							fontWeight: 800,
							fontSize: 18,
						}}
					>
						×
					</button>
				</div>
			)}

			{/* ─── KPI Grid ─── */}
			<div className="dash-kpi-grid dash-enter dash-enter-2">
				<div className="dash-kpi" style={{ '--kpi-accent': '#6366f1' }}>
					<div
						className="dash-kpi-icon"
						style={{ background: '#e0e7ff', color: '#6366f1' }}
					>
						📝
					</div>
					<div>
						<div className="dash-kpi-label">Total Exams</div>
						<div className="dash-kpi-value">
							{loading ? '—' : (data.exams?.total ?? 0)}
						</div>
						<div className="dash-kpi-sub">
							{data.exams?.totalEnrolled ?? 0} students enrolled
						</div>
					</div>
				</div>
				<div className="dash-kpi" style={{ '--kpi-accent': '#10b981' }}>
					<div
						className="dash-kpi-icon"
						style={{ background: '#dcfce7', color: '#10b981' }}
					>
						🟢
					</div>
					<div>
						<div className="dash-kpi-label">Live Exams</div>
						<div className="dash-kpi-value">
							{loading ? '—' : (data.exams?.live ?? 0)}
						</div>
						<div className="dash-kpi-sub">Currently running</div>
					</div>
				</div>
				<div className="dash-kpi" style={{ '--kpi-accent': '#f59e0b' }}>
					<div
						className="dash-kpi-icon"
						style={{ background: '#fef3c7', color: '#f59e0b' }}
					>
						📋
					</div>
					<div>
						<div className="dash-kpi-label">Pending Reviews</div>
						<div className="dash-kpi-value">
							{loading ? '—' : (data.submissions?.pending ?? 0)}
						</div>
						<div className="dash-kpi-sub">Needs attention</div>
					</div>
				</div>
				<div className="dash-kpi" style={{ '--kpi-accent': '#ef4444' }}>
					<div
						className="dash-kpi-icon"
						style={{ background: '#fee2e2', color: '#ef4444' }}
					>
						🚨
					</div>
					<div>
						<div className="dash-kpi-label">Open Issues</div>
						<div className="dash-kpi-value">
							{loading ? '—' : (data.issues?.open ?? 0)}
						</div>
						<div className="dash-kpi-sub">Reported by students</div>
					</div>
				</div>
			</div>

			{/* ─── Quick Actions ─── */}
			<div
				className="dash-enter dash-enter-3"
				style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
			>
				<button
					className="dash-action dash-action-primary"
					onClick={() => navigate('/teacher/exams/create')}
				>
					✨ Create Exam
				</button>
				<button className="dash-action" onClick={() => navigate('/teacher/questions')}>
					📚 Question Bank
				</button>
				<button className="dash-action" onClick={() => navigate('/teacher/results')}>
					📊 Results
				</button>
				<button className="dash-action" onClick={() => navigate('/teacher/issues')}>
					🛠️ Issues
				</button>
				<button className="dash-action" onClick={() => navigate('/teacher/settings')}>
					⚙️ Settings
				</button>
			</div>

			{/* ─── Content Panels ─── */}
			<div className="dash-panels dash-enter dash-enter-4">
				{/* Recent Submissions */}
				<div className="dash-card">
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 16,
						}}
					>
						<div
							className="dash-card-title"
							style={{ '--card-dot': '#6366f1', marginBottom: 0 }}
						>
							Recent Submissions
						</div>
						<button
							onClick={() => navigate('/teacher/results')}
							style={{
								background: 'transparent',
								border: 'none',
								color: '#6366f1',
								fontWeight: 700,
								fontSize: 13,
								cursor: 'pointer',
							}}
						>
							View all →
						</button>
					</div>

					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: 4,
							maxHeight: 380,
							overflowY: 'auto',
						}}
					>
						{loading ? (
							[...Array(3)].map((_, i) => (
								<div
									key={i}
									style={{
										display: 'flex',
										gap: 14,
										padding: 12,
										alignItems: 'center',
									}}
								>
									<Skeleton h={44} w={44} r={10} />
									<div style={{ flex: 1, display: 'grid', gap: 8 }}>
										<Skeleton h={14} w="60%" />
										<Skeleton h={11} w="45%" />
									</div>
								</div>
							))
						) : (data.recentSubmissions || []).length === 0 ? (
							<div className="dash-empty">
								<div className="dash-empty-icon">📭</div>
								<div className="dash-empty-title">No submissions yet</div>
								<div>Publish an exam to start receiving submissions.</div>
							</div>
						) : (
							(data.recentSubmissions || []).map(s => (
								<div
									key={s._id || s.id}
									className="dash-activity-row"
									onClick={() => navigate(`/teacher/grade/${s._id || s.id}`)}
								>
									<div
										style={{
											width: 44,
											height: 44,
											borderRadius: 10,
											background: '#e0e7ff',
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											fontWeight: 800,
											color: '#4338ca',
											fontSize: 17,
											flexShrink: 0,
										}}
									>
										{(s.student?.fullname ||
											s.student?.username ||
											'S')[0].toUpperCase()}
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
											{s.student?.fullname ??
												s.student?.username ??
												'Student'}
										</div>
										<div
											style={{
												fontSize: 12,
												color: 'var(--text-muted)',
												marginTop: 3,
											}}
										>
											{s.exam?.title ?? s.examTitle ?? 'Exam'} •{' '}
											{formatDateTime(s.createdAt)}
										</div>
									</div>
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											alignItems: 'flex-end',
											gap: 4,
										}}
									>
										<StatusBadge status={s.status ?? s.grade ?? 'pending'} />
										<div
											style={{
												fontWeight: 800,
												fontSize: 13,
												color: 'var(--text)',
											}}
										>
											{s.grade ??
												(s.score !== undefined ? String(s.score) : '—')}
										</div>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Exams Needing Review */}
				<div className="dash-card" style={{ display: 'flex', flexDirection: 'column' }}>
					<div
						style={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 16,
						}}
					>
						<div
							className="dash-card-title"
							style={{ '--card-dot': '#f59e0b', marginBottom: 0 }}
						>
							Exams Needing Review
						</div>
						<button
							onClick={() => navigate('/teacher/exams')}
							style={{
								background: 'transparent',
								border: 'none',
								color: '#f59e0b',
								fontWeight: 700,
								fontSize: 13,
								cursor: 'pointer',
							}}
						>
							Manage →
						</button>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
						{loading ? (
							<div style={{ display: 'grid', gap: 12 }}>
								<Skeleton h={56} w="100%" r={12} />
								<Skeleton h={56} w="100%" r={12} />
							</div>
						) : (data.examsToReview || []).length === 0 ? (
							<div className="dash-empty">
								<div className="dash-empty-icon">🎉</div>
								<div className="dash-empty-title">All caught up!</div>
								<div>No pending reviews right now.</div>
							</div>
						) : (
							(data.examsToReview || []).map(e => {
								const pending =
									e.pendingCount ??
									Math.max(
										0,
										(e.submissionsCount || 0) - (e.evaluatedCount || 0),
									);
								return (
									<div
										key={e._id || e.id}
										className="dash-activity-row"
										onClick={() =>
											navigate(`/teacher/results/${e._id || e.id}`)
										}
										style={{
											border: '1px dashed var(--border)',
											borderRadius: 12,
										}}
									>
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
												{e.title}
											</div>
											<div
												style={{
													fontSize: 12,
													color: 'var(--text-muted)',
													marginTop: 3,
												}}
											>
												{e.submissionsCount ?? 0} submissions total
											</div>
										</div>
										<div
											style={{
												background:
													'linear-gradient(135deg, #eef2ff, #e0e7ff)',
												color: '#4338ca',
												fontWeight: 800,
												padding: '6px 12px',
												borderRadius: 999,
												fontSize: 13,
												flexShrink: 0,
											}}
										>
											{pending} pending
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>
		</div>
	);
};

export default TeacherHome;
