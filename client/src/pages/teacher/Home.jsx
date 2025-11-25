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

// --- Small reusable UI pieces ---
const Field = ({ label, children }) => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
		<div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
		<div style={{ fontSize: 14 }}>{children ?? '—'}</div>
	</div>
);

const KPI = ({ label, value, color }) => (
	<div
		style={{
			padding: 12,
			borderRadius: 12,
			background: 'var(--surface)',
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			border: '1px solid var(--border)',
		}}
	>
		<div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{label}</div>
		<div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
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
		const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, []);

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const resp = await getTeacherDashboardStats();
			if (!resp || typeof resp !== 'object') {
				setData(DEFAULT_DASH);
			} else {
				setData(prev => ({ ...DEFAULT_DASH, ...prev, ...resp }));
			}
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

	// Real-time updates (light)
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

	// Small loading skeleton component
	const Skeleton = ({ height = 12, width = '100%', radius = 8 }) => (
		<div style={{ background: 'var(--skeleton)', height, width, borderRadius: radius }} />
	);

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
			<header
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 12,
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: 22 }}>{teacher?.fullname ?? 'Teacher'}</h1>
					<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
						{teacher?.department ?? 'Department not set'}
					</div>
				</div>
				<div style={{ display: 'flex', gap: 8 }}>
					<button
						onClick={() => navigate('/teacher/exams/create')}
						style={{
							padding: '8px 12px',
							borderRadius: 8,
							background: 'var(--primary)',
							color: '#fff',
							border: 'none',
						}}
					>
						New Exam
					</button>
					<button
						onClick={() => navigate('/teacher/settings')}
						style={{
							padding: '8px 12px',
							borderRadius: 8,
							border: '1px solid var(--border)',
							background: 'transparent',
						}}
					>
						Edit Profile
					</button>
				</div>
			</header>

			{error && (
				<div
					style={{
						marginTop: 12,
						padding: 12,
						borderRadius: 8,
						background: '#fff4f4',
						color: '#9b1c1c',
					}}
				>
					{error}
				</div>
			)}

			<section
				style={{
					display: 'grid',
					gridTemplateColumns: isMobile ? '1fr' : '360px 1fr',
					gap: 20,
					marginTop: 18,
				}}
			>
				{/* Left column: teacher profile */}
				<aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					<div
						style={{
							padding: 16,
							borderRadius: 12,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
						}}
					>
						<div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
							<div
								style={{
									width: 64,
									height: 64,
									borderRadius: 12,
									background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
									color: '#fff',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									fontWeight: 800,
									fontSize: 24,
								}}
							>
								{(teacher?.fullname ?? teacher?.username ?? 'T')
									.split(' ')
									.map(p => p[0])
									.join('')
									.slice(0, 2)
									.toUpperCase()}
							</div>
							<div style={{ flex: 1 }}>
								<div style={{ fontSize: 16, fontWeight: 800 }}>
									{loading ? (
										<Skeleton height={18} width={160} />
									) : (
										teacher?.fullname ?? '—'
									)}
								</div>
								<div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
									{loading ? (
										<Skeleton height={12} width={100} />
									) : (
										teacher?.username ?? '—'
									)}
								</div>
							</div>
						</div>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr',
								gap: 8,
								marginTop: 12,
							}}
						>
							<Field label="Email">
								{loading ? <Skeleton height={14} width={'80%'} /> : teacher?.email}
							</Field>
							<Field label="Phone">
								{loading ? (
									<Skeleton height={14} width={'60%'} />
								) : (
									teacher?.phonenumber
								)}
							</Field>
							<Field label="Joined">
								{loading ? (
									<Skeleton height={14} width={'60%'} />
								) : (
									formatDate(teacher?.createdAt)
								)}
							</Field>
							<Field label="Address">
								{loading ? (
									<Skeleton height={14} width={'100%'} />
								) : (
									teacher?.address ?? '—'
								)}
							</Field>
						</div>

						<div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
							<button
								onClick={() => navigator.clipboard?.writeText(teacher?.email ?? '')}
								style={{
									flex: 1,
									padding: '8px 10px',
									borderRadius: 8,
									boxShadow: 'var(--shadow-sm)',
									border: 'none',
									background: 'white',
								}}
							>
								Copy Email
							</button>
							<button
								onClick={() => navigate('/teacher/settings')}
								style={{
									padding: '8px 10px',
									borderRadius: 8,
									border: '1px solid var(--border)',
									background: 'transparent',
								}}
							>
								Manage
							</button>
						</div>
					</div>

					{/* Contact & settings */}
					<div
						style={{
							padding: 12,
							borderRadius: 12,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
						}}
					>
						<div style={{ fontWeight: 800, marginBottom: 8 }}>Contact & Security</div>
						<Field label="Department">{teacher?.department ?? '—'}</Field>
						<div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
							<button
								onClick={() => navigate('/teacher/change-password')}
								style={{ flex: 1, padding: '8px 10px', borderRadius: 8 }}
							>
								Change Password
							</button>
							<button
								onClick={() => navigate('/teacher/profile/export')}
								style={{
									padding: '8px 10px',
									borderRadius: 8,
									border: '1px solid var(--border)',
									background: 'transparent',
								}}
							>
								Export
							</button>
						</div>
					</div>
				</aside>

				{/* Right column: KPIs + activity */}
				<main style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
					{/* KPIs */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
							gap: 12,
						}}
					>
						<KPI label="Total Exams" value={data.exams?.total ?? 0} color="#6366f1" />
						<KPI label="Live Exams" value={data.exams?.live ?? 0} color="#10b981" />
						<KPI
							label="Pending Reviews"
							value={data.submissions?.pending ?? 0}
							color="#f59e0b"
						/>
						<KPI label="Open Issues" value={data.issues?.open ?? 0} color="#ef4444" />
					</div>

					{/* Recent submissions & exams to review */}
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
							gap: 12,
						}}
					>
						{/* Recent submissions */}
						<div
							style={{
								padding: 12,
								borderRadius: 12,
								background: 'var(--surface)',
								border: '1px solid var(--border)',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<div style={{ fontWeight: 800 }}>Recent Submissions</div>
								<button
									onClick={() => navigate('/teacher/results')}
									style={{
										background: 'transparent',
										border: 'none',
										color: 'var(--primary)',
									}}
								>
									View all
								</button>
							</div>
							<div
								style={{
									marginTop: 8,
									display: 'flex',
									flexDirection: 'column',
									gap: 8,
								}}
							>
								{loading ? (
									[...Array(3)].map((_, i) => (
										<div
											key={i}
											style={{ display: 'flex', gap: 12, padding: 8 }}
										>
											<Skeleton height={40} width={40} />
											<div style={{ flex: 1 }}>
												<Skeleton height={14} width={'60%'} />
												<div style={{ height: 8 }} />
												<Skeleton height={12} width={'40%'} />
											</div>
										</div>
									))
								) : (data.recentSubmissions || []).length === 0 ? (
									<div style={{ color: 'var(--text-muted)' }}>
										No recent submissions
									</div>
								) : (
									(data.recentSubmissions || []).map(s => (
										<div
											key={s._id || s.id}
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: 12,
												padding: 8,
												borderRadius: 8,
												cursor: 'pointer',
												transition: 'background .12s',
											}}
											onClick={() =>
												navigate(`/teacher/grade/${s._id || s.id}`)
											}
										>
											<div
												style={{
													width: 40,
													height: 40,
													borderRadius: 8,
													background: '#eef2ff',
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													fontWeight: 700,
													color: '#4338ca',
												}}
											>
												{(s.student?.fullname || 'S')[0]}
											</div>
											<div style={{ flex: 1 }}>
												<div style={{ fontWeight: 700 }}>
													{s.student?.fullname ??
														s.student?.username ??
														'Student'}
												</div>
												<div
													style={{
														fontSize: 12,
														color: 'var(--text-muted)',
													}}
												>
													{s.exam?.title ?? s.examTitle} •{' '}
													{formatDate(s.createdAt)}
												</div>
											</div>
											<div style={{ fontWeight: 700 }}>
												{s.grade ?? s.status ?? '—'}
											</div>
										</div>
									))
								)}
							</div>
						</div>

						{/* Exams to review */}
						<div
							style={{
								padding: 12,
								borderRadius: 12,
								background: 'var(--surface)',
								border: '1px solid var(--border)',
							}}
						>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
								}}
							>
								<div style={{ fontWeight: 800 }}>Exams Needing Review</div>
								<button
									onClick={() => navigate('/teacher/exams')}
									style={{
										background: 'transparent',
										border: 'none',
										color: 'var(--primary)',
									}}
								>
									Manage
								</button>
							</div>
							<div
								style={{
									marginTop: 8,
									display: 'flex',
									flexDirection: 'column',
									gap: 8,
								}}
							>
								{loading ? (
									<Skeleton height={60} width={'100%'} />
								) : (data.examsToReview || []).length === 0 ? (
									<div style={{ color: 'var(--text-muted)' }}>All caught up</div>
								) : (
									(data.examsToReview || []).map(e => (
										<div
											key={e._id || e.id}
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												padding: 8,
												borderRadius: 8,
												border: '1px dashed var(--border)',
												cursor: 'pointer',
											}}
											onClick={() =>
												navigate(`/teacher/results/${e._id || e.id}`)
											}
										>
											<div style={{ fontWeight: 700 }}>{e.title}</div>
											<div
												style={{ color: 'var(--primary)', fontWeight: 800 }}
											>
												{e.pendingCount ??
													Math.max(
														0,
														(e.submissionsCount || 0) -
															(e.evaluatedCount || 0),
													)}
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>

					{/* Quick actions */}
					<div
						style={{
							display: 'flex',
							gap: 8,
							justifyContent: isMobile ? 'stretch' : 'flex-start',
						}}
					>
						<button
							onClick={() => navigate('/teacher/exams/create')}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								background: 'linear-gradient(90deg,#4f46e5,#3b82f6)',
								color: '#fff',
								border: 'none',
							}}
						>
							Create Exam
						</button>
						<button
							onClick={() => navigate('/teacher/questions')}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'transparent',
							}}
						>
							Question Bank
						</button>
						<button
							onClick={() => navigate('/teacher/issues')}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'transparent',
							}}
						>
							Open Issues
						</button>
					</div>
				</main>
			</section>
		</div>
	);
};

export default TeacherHome;
