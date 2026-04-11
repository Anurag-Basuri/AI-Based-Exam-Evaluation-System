import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall, getMySubmissions, getStudentProfile } from '../../services/studentServices.js';

// ── Utilities ─────────────────────────────────────────────────────
const formatDate = v => {
	if (!v) return '—';
	try {
		const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v;
		if (!d || Number.isNaN(d.getTime())) return '—';
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	} catch {
		return '—';
	}
};

const getInitials = user => {
	const name = (user?.fullname || user?.username || 'S').trim();
	const parts = name.split(/\s+/).filter(Boolean);
	return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'S';
};

const getGreeting = () => {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
};

// ── Skeleton loader ───────────────────────────────────────────────
const Skeleton = ({ h = 14, w = '100%', r = 8 }) => (
	<div style={{
		height: h, width: w, borderRadius: r,
		background: 'linear-gradient(90deg, var(--border-light) 25%, var(--border) 50%, var(--border-light) 75%)',
		backgroundSize: '200% 100%',
		animation: 'pulse 1.5s ease-in-out infinite',
	}} />
);

// ── Status helpers ────────────────────────────────────────────────
const STATUS_MAP = {
	'in-progress': { label: 'In Progress', icon: '⏳', color: '#f59e0b', bg: '#fef3c7' },
	started:       { label: 'In Progress', icon: '⏳', color: '#f59e0b', bg: '#fef3c7' },
	submitted:     { label: 'Submitted',   icon: '📋', color: '#3b82f6', bg: '#dbeafe' },
	evaluated:     { label: 'Evaluated',   icon: '✅', color: '#10b981', bg: '#dcfce7' },
	published:     { label: 'Published',   icon: '🎉', color: '#8b5cf6', bg: '#ede9fe' },
	pending:       { label: 'Pending',     icon: '📝', color: '#64748b', bg: '#f1f5f9' },
};

const StatusBadge = ({ status }) => {
	const s = String(status ?? 'pending').toLowerCase();
	const cfg = STATUS_MAP[s] || STATUS_MAP.pending;
	return (
		<span style={{
			background: cfg.bg, color: cfg.color,
			padding: '4px 10px', borderRadius: 999,
			fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4,
		}}>
			<span>{cfg.icon}</span>{cfg.label}
		</span>
	);
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const StudentHome = () => {
	const navigate = useNavigate();
	const { user, setUser } = useAuth();

	const [profileData, setProfileData] = React.useState(null);
	const [stats, setStats] = React.useState({ inProgress: 0, submitted: 0, evaluated: 0, total: 0 });
	const [recentSubmissions, setRecentSubmissions] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const [profile, submissions] = await Promise.all([
				safeApiCall(getStudentProfile),
				safeApiCall(getMySubmissions),
			]);

			if (profile) {
				setProfileData(profile);
				if (setUser) setUser(prev => ({ ...(prev || {}), ...profile }));
			}

			const counts = Array.isArray(submissions)
				? submissions.reduce((acc, s) => {
						const st = s.status?.toLowerCase() || 'pending';
						if (st === 'in-progress' || st === 'started') acc.inProgress += 1;
						else if (st === 'submitted') acc.submitted += 1;
						else if (st === 'evaluated' || st === 'published') acc.evaluated += 1;
						acc.total += 1;
						return acc;
				  }, { inProgress: 0, submitted: 0, evaluated: 0, total: 0 })
				: { inProgress: 0, submitted: 0, evaluated: 0, total: 0 };

			setStats(counts);
			const sorted = Array.isArray(submissions)
				? [...submissions].sort((a, b) => new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0))
				: [];
			setRecentSubmissions(sorted.slice(0, 5));
		} catch (e) {
			console.error('Dashboard load error:', e);
			setError(e?.message || 'Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	}, [setUser]);

	React.useEffect(() => { loadData(); }, [loadData]);

	const displayUser = profileData || user || {};

	// ── Render ─────────────────────────────────────────────────────
	return (
		<div style={{ maxWidth: 1080, margin: '0 auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>

			{/* ─── Hero Banner ─── */}
			<div
				className="dash-hero dash-enter dash-enter-1"
				style={{ background: 'linear-gradient(135deg, #059669, #10b981, #34d399)' }}
			>
				<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
					<div style={{ flex: 1, minWidth: 200 }}>
						<div style={{ fontSize: 14, fontWeight: 500, opacity: 0.85, marginBottom: 6 }}>
							{getGreeting()},
						</div>
						<h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1.2 }}>
							{loading ? '...' : (displayUser.fullname || displayUser.username || 'Student')} 👋
						</h1>
						<p style={{ margin: '8px 0 0', fontSize: 14, opacity: 0.8, maxWidth: 400 }}>
							Track your exams, view results, and manage your academic progress.
						</p>
					</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						<button
							className="dash-action-primary"
							onClick={() => navigate('/student/exams')}
							style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff', padding: '10px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
						>
							🔍 Find Exam
						</button>
						<button
							onClick={loadData}
							disabled={loading}
							title="Refresh data"
							style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1, fontSize: 14 }}
						>
							🔄
						</button>
					</div>
				</div>

				{/* Mini profile strip inside hero */}
				{!loading && (
					<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
						<div style={{
							width: 40, height: 40, borderRadius: 10,
							background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)',
							display: 'flex', alignItems: 'center', justifyContent: 'center',
							fontWeight: 800, fontSize: 16, flexShrink: 0,
						}}>
							{getInitials(displayUser)}
						</div>
						<div style={{ fontSize: 13, opacity: 0.85, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
							<span>📧 {displayUser.email || '—'}</span>
							{displayUser.phonenumber && <span>📱 {displayUser.phonenumber}</span>}
							<span>📅 Joined {formatDate(displayUser.createdAt)}</span>
						</div>
					</div>
				)}
			</div>

			{/* ─── Error ─── */}
			{error && (
				<div className="dash-enter" style={{
					padding: 14, borderRadius: 12,
					background: 'var(--danger-bg)', color: 'var(--danger-text)',
					border: '1px solid var(--danger-border)',
					display: 'flex', justifyContent: 'space-between', alignItems: 'center',
				}}>
					<span>⚠️ {error}</span>
					<button onClick={() => setError('')} style={{ background: 'transparent', border: 'none', color: 'var(--danger-text)', cursor: 'pointer', fontWeight: 800, fontSize: 18 }}>×</button>
				</div>
			)}

			{/* ─── KPI Grid ─── */}
			<div className="dash-kpi-grid dash-enter dash-enter-2">
				<div className="dash-kpi" style={{ '--kpi-accent': '#f59e0b' }}>
					<div className="dash-kpi-icon" style={{ background: '#fef3c7', color: '#f59e0b' }}>⏳</div>
					<div>
						<div className="dash-kpi-label">In Progress</div>
						<div className="dash-kpi-value">{loading ? '—' : stats.inProgress}</div>
						<div className="dash-kpi-sub">Active exams</div>
					</div>
				</div>
				<div className="dash-kpi" style={{ '--kpi-accent': '#3b82f6' }}>
					<div className="dash-kpi-icon" style={{ background: '#dbeafe', color: '#3b82f6' }}>📋</div>
					<div>
						<div className="dash-kpi-label">Submitted</div>
						<div className="dash-kpi-value">{loading ? '—' : stats.submitted}</div>
						<div className="dash-kpi-sub">Awaiting grading</div>
					</div>
				</div>
				<div className="dash-kpi" style={{ '--kpi-accent': '#10b981' }}>
					<div className="dash-kpi-icon" style={{ background: '#dcfce7', color: '#10b981' }}>✅</div>
					<div>
						<div className="dash-kpi-label">Evaluated</div>
						<div className="dash-kpi-value">{loading ? '—' : stats.evaluated}</div>
						<div className="dash-kpi-sub">Results ready</div>
					</div>
				</div>
				<div className="dash-kpi" style={{ '--kpi-accent': '#6366f1' }}>
					<div className="dash-kpi-icon" style={{ background: '#e0e7ff', color: '#6366f1' }}>📊</div>
					<div>
						<div className="dash-kpi-label">Total Attempts</div>
						<div className="dash-kpi-value">{loading ? '—' : stats.total}</div>
						<div className="dash-kpi-sub">All time</div>
					</div>
				</div>
			</div>

			{/* ─── Quick Actions ─── */}
			<div className="dash-enter dash-enter-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
				<button className="dash-action dash-action-primary" onClick={() => navigate('/student/exams')}>
					🔍 Find Exam
				</button>
				<button className="dash-action" onClick={() => navigate('/student/results')}>
					📊 View Results
				</button>
				<button className="dash-action" onClick={() => navigate('/student/issues')}>
					🛠️ Report Issue
				</button>
				<button className="dash-action" onClick={() => navigate('/student/settings')}>
					⚙️ Settings
				</button>
			</div>

			{/* ─── Content Panels ─── */}
			<div className="dash-panels dash-enter dash-enter-4">
				{/* Recent Activity */}
				<div className="dash-card">
					<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
						<div className="dash-card-title" style={{ '--card-dot': '#10b981', marginBottom: 0 }}>
							Recent Activity
						</div>
						<button
							onClick={() => navigate('/student/results')}
							style={{ background: 'transparent', border: 'none', color: '#10b981', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
						>
							View all →
						</button>
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 380, overflowY: 'auto' }}>
						{loading ? (
							[...Array(3)].map((_, i) => (
								<div key={i} style={{ display: 'flex', gap: 14, padding: 12, alignItems: 'center' }}>
									<Skeleton h={44} w={44} r={10} />
									<div style={{ flex: 1, display: 'grid', gap: 8 }}>
										<Skeleton h={14} w="65%" />
										<Skeleton h={11} w="40%" />
									</div>
								</div>
							))
						) : recentSubmissions.length === 0 ? (
							<div className="dash-empty">
								<div className="dash-empty-icon">📚</div>
								<div className="dash-empty-title">No exams yet</div>
								<div>Use an exam code to get started!</div>
							</div>
						) : (
							recentSubmissions.map(sub => {
								const examTitle = sub.examTitle || sub.exam?.title || 'Untitled Exam';
								const subDate = sub.submittedAt || sub.startedAt || sub.createdAt;
								const hasScore = sub.score !== null && sub.score !== undefined;

								return (
									<div
										key={sub.id}
										className="dash-activity-row"
										onClick={() => {
											const s = sub.status?.toLowerCase();
											if (s === 'in-progress' || s === 'started') navigate(`/student/take-exam/${sub.id}`);
											else navigate('/student/results');
										}}
									>
										<div style={{
											width: 44, height: 44, borderRadius: 10,
											background: '#e0e7ff', display: 'flex',
											alignItems: 'center', justifyContent: 'center',
											fontWeight: 800, color: '#4338ca', fontSize: 18, flexShrink: 0,
										}}>
											📝
										</div>
										<div style={{ flex: 1, minWidth: 0 }}>
											<div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
												{examTitle}
											</div>
											<div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 3 }}>
												{formatDate(subDate)}
											</div>
										</div>
										<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
											<StatusBadge status={sub.status} />
											{hasScore && (
												<div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
													{sub.score}/{sub.maxScore || '?'}
												</div>
											)}
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Profile Summary Card */}
				<div className="dash-card" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
					<div className="dash-card-title" style={{ '--card-dot': '#6366f1' }}>
						Profile Summary
					</div>

					{loading ? (
						<div style={{ display: 'grid', gap: 16 }}>
							<Skeleton h={64} w={64} r={14} />
							<Skeleton h={16} w="70%" />
							<Skeleton h={12} w="50%" />
							<Skeleton h={12} w="80%" />
						</div>
					) : (
						<>
							<div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
								<div style={{
									width: 56, height: 56, borderRadius: 14,
									background: 'linear-gradient(135deg, #10b981, #059669)',
									color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
									fontWeight: 800, fontSize: 22, flexShrink: 0,
									boxShadow: '0 4px 14px rgba(16,185,129,0.25)',
								}}>
									{getInitials(displayUser)}
								</div>
								<div style={{ minWidth: 0 }}>
									<div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
										{displayUser.fullname || displayUser.username || 'Student'}
									</div>
									<div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
										@{displayUser.username || '—'}
									</div>
								</div>
							</div>

							<div style={{ display: 'grid', gap: 12 }}>
								{[
									['Email', displayUser.email],
									['Phone', displayUser.phonenumber],
									['Gender', displayUser.gender],
									['Member Since', formatDate(displayUser.createdAt)],
								].filter(([, v]) => v).map(([label, val]) => (
									<div key={label}>
										<div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 2 }}>{label}</div>
										<div style={{ fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{val}</div>
									</div>
								))}
							</div>

							<button
								className="dash-action"
								onClick={() => navigate('/student/settings')}
								style={{ width: '100%', justifyContent: 'center' }}
							>
								⚙️ Edit Profile
							</button>
						</>
					)}
				</div>
			</div>
		</div>
	);
};

export default StudentHome;
