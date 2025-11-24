import React from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth.js';
import { getTeacherDashboardStats } from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';

// --- Utilities & defaults ---
const DEFAULT_DASH = {
	exams: { total: 0, live: 0, scheduled: 0, draft: 0, totalEnrolled: 0 },
	issues: { open: 0 },
	submissions: { pending: 0 },
	examsToReview: [],
	recentSubmissions: [],
	teacher: null,
};

const safePercent = (num, den) => {
	const n = Number(num || 0);
	const d = Number(den || 0);
	if (!d || d <= 0) return 0;
	return Math.round((n / d) * 100);
};

const formatDate = v => {
	if (!v) return '—';
	try {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleString();
	} catch {
		return String(v);
	}
};

// --- Reusable Components ---
const ProfileField = ({ label, value }) => (
	<div style={styles.profileField}>
		<div style={styles.profileFieldLabel}>{label}</div>
		<div style={styles.profileFieldValue}>{value ?? '—'}</div>
	</div>
);

const StatPill = ({ label, value, color = '#6366f1' }) => (
	<div style={{ ...styles.statPill.container, borderColor: `${color}20` }}>
		<div style={{ ...styles.statPill.value, color }}>{value}</div>
		<div style={styles.statPill.label}>{label}</div>
	</div>
);

// --- Main Component ---
const MOBILE_BREAKPOINT = 1024;

const TeacherHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [data, setData] = React.useState(DEFAULT_DASH);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [isMobile, setIsMobile] = React.useState(
		typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
	);

	React.useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const response = await getTeacherDashboardStats();
			if (!response || typeof response !== 'object') {
				setData(DEFAULT_DASH);
			} else {
				// normalize teacher info: prefer server teacher, then auth user
				const teacher = response.teacher ?? {
					id: user?.id,
					username: user?.username,
					fullname: user?.fullname,
					email: user?.email,
					phonenumber: user?.phonenumber,
					department: user?.department,
					createdAt: user?.createdAt,
				};
				setData(prev => ({ ...DEFAULT_DASH, ...prev, ...response, teacher }));
			}
		} catch (e) {
			console.warn('Failed to load dashboard stats', e);
			setError(e?.message || 'Failed to load dashboard data');
			setData(DEFAULT_DASH);
		} finally {
			setLoading(false);
		}
	}, [user]);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	// --- REAL-TIME UPDATES (light) ---
	React.useEffect(() => {
		if (!user?.id) return undefined;
		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});
		const onNewSubmission = s => {
			setData(current => {
				const recent = [s, ...(current.recentSubmissions || [])].slice(0, 5);
				const pending = (current.submissions?.pending || 0) + 1;
				return {
					...current,
					recentSubmissions: recent,
					submissions: { ...(current.submissions || {}), pending },
				};
			});
		};
		socket.on('new-submission', onNewSubmission);
		socket.on('submission-updated', () => loadData());
		return () => {
			socket.off('new-submission', onNewSubmission);
			socket.disconnect();
		};
	}, [user, loadData]);

	// --- Derived display values ---
	const teacher = data.teacher ?? {};
	const kpis = [
		{ label: 'Total Exams', value: data.exams?.total ?? 0, color: '#6366f1' },
		{ label: 'Live Exams', value: data.exams?.live ?? 0, color: '#10b981' },
		{ label: 'Pending Reviews', value: data.submissions?.pending ?? 0, color: '#f59e0b' },
		{ label: 'Open Issues', value: data.issues?.open ?? 0, color: '#ef4444' },
	];

	return (
		<div style={styles.pageContainer}>
			<div style={styles.headerRow}>
				<h1 style={styles.title}>
					Welcome, {teacher?.fullname ?? user?.fullname ?? 'Teacher'}
				</h1>
				<div style={styles.headerActions}>
					<button
						style={styles.headerBtn}
						onClick={() => navigate('/teacher/exams/create')}
					>
						➕ New Exam
					</button>
					<button
						style={styles.headerBtnOutline}
						onClick={() => navigate('/teacher/settings')}
					>
						⚙️ Settings
					</button>
				</div>
			</div>

			{error && <div style={styles.errorBanner}>⚠️ {error}</div>}

			<div style={styles.topSection(isMobile)}>
				{/* Left: Profile / Contact */}
				<div style={styles.profileColumn}>
					<div style={styles.profileCard}>
						<div style={styles.profileHeader}>
							<div style={styles.avatar}>
								{(teacher?.fullname || user?.fullname || 'T')
									.split(' ')
									.map(p => p[0])
									.join('')
									.slice(0, 2)
									.toUpperCase()}
							</div>
							<div style={styles.profileMain}>
								<div style={styles.profileName}>
									{teacher?.fullname ?? user?.fullname}
								</div>
								<div style={styles.profileSub}>
									{teacher?.username ?? user?.username}
								</div>
								<div style={styles.profileMeta}>
									<span style={styles.metaItem}>
										Joined {formatDate(teacher?.createdAt ?? user?.createdAt)}
									</span>
									<span style={styles.metaSep}>•</span>
									<span style={styles.metaItem}>
										{teacher?.department ?? user?.department ?? '—'}
									</span>
								</div>
							</div>
						</div>

						<div style={styles.profileBody}>
							<ProfileField label="Email" value={teacher?.email ?? user?.email} />
							<ProfileField
								label="Phone"
								value={teacher?.phonenumber ?? user?.phonenumber}
							/>
							<ProfileField
								label="Username"
								value={teacher?.username ?? user?.username}
							/>
							<ProfileField label="Address" value={teacher?.address ?? '—'} />
						</div>

						<div style={styles.profileFooter}>
							<button
								style={styles.ctaPrimary}
								onClick={() => navigate('/teacher/settings')}
							>
								Edit Profile
							</button>
							<button
								style={styles.ctaGhost}
								onClick={() => navigate('/teacher/change-password')}
							>
								Change Password
							</button>
						</div>
					</div>

					{/* Compact KPI row for mobile */}
					<div
						style={{
							marginTop: 16,
							display: isMobile ? 'grid' : 'none',
							gridTemplateColumns: 'repeat(2,1fr)',
							gap: 12,
						}}
					>
						{kpis.map(k => (
							<div
								key={k.label}
								style={{
									background: 'var(--surface)',
									padding: 12,
									borderRadius: 12,
									textAlign: 'center',
									border: '1px solid var(--border)',
								}}
							>
								<div style={{ fontSize: 14, color: 'var(--text-muted)' }}>
									{k.label}
								</div>
								<div style={{ fontSize: 20, fontWeight: 800, color: k.color }}>
									{k.value}
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Right: KPIs + Activity */}
				<div style={styles.kpiColumn}>
					<div style={styles.kpiGrid}>
						{kpis.map(k => (
							<StatPill key={k.label} {...k} />
						))}
					</div>

					<div style={styles.cardsRow}>
						<div style={styles.card}>
							<div style={styles.cardHeader}>
								<h3 style={styles.cardTitle}>Recent Submissions</h3>
								<button
									style={styles.linkBtn}
									onClick={() => navigate('/teacher/results')}
								>
									View all
								</button>
							</div>
							<div style={styles.cardBody}>
								{loading ? (
									<div style={styles.emptyState}>Loading…</div>
								) : (data.recentSubmissions || []).length === 0 ? (
									<div style={styles.emptyState}>No recent submissions</div>
								) : (
									(data.recentSubmissions || []).map(s => (
										<div
											key={s._id || s.id}
											style={styles.activityRow}
											onClick={() =>
												navigate(`/teacher/grade/${s._id || s.id}`)
											}
										>
											<div style={styles.activityAvatar}>
												{(s.student?.fullname || 'S')[0]}
											</div>
											<div style={styles.activityText}>
												<div style={styles.activityTitle}>
													{s.student?.fullname ??
														s.student?.username ??
														'Student'}
												</div>
												<div style={styles.activityMeta}>
													{s.exam?.title ?? s.examTitle} •{' '}
													{formatDate(s.createdAt)}
												</div>
											</div>
											<div style={styles.activityRight}>
												{s.grade ?? s.status ?? '—'}
											</div>
										</div>
									))
								)}
							</div>
						</div>

						<div style={{ ...styles.card, minHeight: 160 }}>
							<div style={styles.cardHeader}>
								<h3 style={styles.cardTitle}>Exams Needing Review</h3>
								<button
									style={styles.linkBtn}
									onClick={() => navigate('/teacher/exams')}
								>
									Manage
								</button>
							</div>
							<div style={styles.cardBody}>
								{loading ? (
									<div style={styles.emptyState}>Loading…</div>
								) : (data.examsToReview || []).length === 0 ? (
									<div style={styles.emptyState}>All caught up</div>
								) : (
									(data.examsToReview || []).map(e => (
										<div
											key={e._id || e.id}
											style={styles.reviewRow}
											onClick={() =>
												navigate(`/teacher/results/${e._id || e.id}`)
											}
										>
											<div style={styles.reviewTitle}>{e.title}</div>
											<div style={styles.reviewMeta}>
												<strong style={{ color: 'var(--primary)' }}>
													{e.pendingCount ??
														Math.max(
															0,
															(e.submissionsCount || 0) -
																(e.evaluatedCount || 0),
														)}
												</strong>{' '}
												pending
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>

					{/* Footer quick actions */}
					<div style={styles.quickActions}>
						<button
							style={styles.actionPrimary}
							onClick={() => navigate('/teacher/exams/create')}
						>
							Create Exam
						</button>
						<button
							style={styles.actionGhost}
							onClick={() => navigate('/teacher/questions')}
						>
							Question Bank
						</button>
						<button
							style={styles.actionGhost}
							onClick={() => navigate('/teacher/issues')}
						>
							Open Issues
						</button>
					</div>
				</div>
			</div>
		</div>
	);
};

// --- Styles ---
const styles = {
	pageContainer: { maxWidth: 1400, margin: '0 auto', padding: 24 },
	headerRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 18,
	},
	title: { margin: 0, fontSize: 22, fontWeight: 800 },
	headerActions: { display: 'flex', gap: 12 },
	headerBtn: {
		padding: '8px 12px',
		borderRadius: 10,
		background: 'linear-gradient(90deg,#4f46e5,#3b82f6)',
		color: '#fff',
		border: 'none',
		cursor: 'pointer',
	},
	headerBtnOutline: {
		padding: '8px 12px',
		borderRadius: 10,
		background: 'transparent',
		border: '1px solid var(--border)',
		cursor: 'pointer',
	},

	topSection: isMobile => ({
		display: 'flex',
		gap: 24,
		flexDirection: isMobile ? 'column' : 'row',
	}),
	profileColumn: { flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: 16 },
	kpiColumn: { flex: 1, display: 'flex', flexDirection: 'column', gap: 16 },

	profileCard: {
		background: 'var(--surface)',
		borderRadius: 12,
		padding: 18,
		border: '1px solid var(--border)',
	},
	profileHeader: { display: 'flex', gap: 12, alignItems: 'center' },
	avatar: {
		width: 72,
		height: 72,
		borderRadius: 12,
		background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
		color: '#fff',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 28,
		fontWeight: 800,
	},
	profileMain: { display: 'flex', flexDirection: 'column' },
	profileName: { fontSize: 18, fontWeight: 800 },
	profileSub: { color: 'var(--text-muted)', fontSize: 13 },
	profileMeta: {
		display: 'flex',
		gap: 8,
		marginTop: 6,
		color: 'var(--text-muted)',
		fontSize: 13,
	},
	metaItem: {},
	metaSep: { opacity: 0.4 },

	profileBody: { marginTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
	profileField: {
		display: 'flex',
		flexDirection: 'column',
		gap: 4,
		padding: 8,
		borderRadius: 8,
		background: 'var(--bg-subtle)',
	},
	profileFieldLabel: { fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 },
	profileFieldValue: { fontSize: 14, fontWeight: 700 },

	profileFooter: { display: 'flex', gap: 8, marginTop: 12 },
	ctaPrimary: {
		flex: 1,
		padding: '10px 12px',
		borderRadius: 10,
		background: 'linear-gradient(90deg,#10b981,#059669)',
		color: '#fff',
		border: 'none',
		cursor: 'pointer',
	},
	ctaGhost: {
		padding: '10px 12px',
		borderRadius: 10,
		background: 'transparent',
		border: '1px solid var(--border)',
		cursor: 'pointer',
	},

	kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
	statPill: {
		container: {
			padding: 16,
			borderRadius: 12,
			border: '1px solid #e6e9f2',
			background: 'var(--surface)',
		},
		value: { fontSize: 22, fontWeight: 800 },
		label: { fontSize: 12, color: 'var(--text-muted)', marginTop: 6 },
	},

	cardsRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 },
	card: {
		background: 'var(--surface)',
		borderRadius: 12,
		border: '1px solid var(--border)',
		padding: 12,
		display: 'flex',
		flexDirection: 'column',
	},
	cardHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 8,
	},
	cardTitle: { margin: 0, fontSize: 15, fontWeight: 800 },
	linkBtn: {
		background: 'transparent',
		border: 'none',
		color: 'var(--primary)',
		cursor: 'pointer',
		fontWeight: 700,
	},

	cardBody: { display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' },
	emptyState: { padding: 20, color: 'var(--text-muted)' },

	activityRow: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		padding: '8px 6px',
		borderRadius: 8,
		cursor: 'pointer',
	},
	activityAvatar: {
		width: 40,
		height: 40,
		borderRadius: 8,
		background: '#eef2ff',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 700,
		color: '#4338ca',
	},
	activityText: { flex: 1, display: 'flex', flexDirection: 'column' },
	activityTitle: { fontWeight: 700 },
	activityMeta: { fontSize: 12, color: 'var(--text-muted)' },
	activityRight: { fontWeight: 700, color: 'var(--text-muted)' },

	reviewRow: {
		display: 'flex',
		justifyContent: 'space-between',
		padding: 10,
		borderRadius: 8,
		alignItems: 'center',
		cursor: 'pointer',
		border: '1px dashed var(--border)',
	},
	reviewTitle: { fontWeight: 700 },
	reviewMeta: { fontSize: 13, color: 'var(--text-muted)' },

	quickActions: { display: 'flex', gap: 8, marginTop: 12 },
	actionPrimary: {
		padding: '10px 14px',
		borderRadius: 10,
		background: 'linear-gradient(90deg,#4f46e5,#3b82f6)',
		color: '#fff',
		border: 'none',
		cursor: 'pointer',
	},
	actionGhost: {
		padding: '10px 14px',
		borderRadius: 10,
		background: 'transparent',
		border: '1px solid var(--border)',
		cursor: 'pointer',
	},

	errorBanner: {
		background: '#fef2f2',
		color: '#991b1b',
		padding: 12,
		borderRadius: 8,
		marginBottom: 12,
	},
};

export default TeacherHome;
