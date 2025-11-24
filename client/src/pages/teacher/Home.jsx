import React from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth.js';
import { getTeacherDashboardStats, safeApiCall } from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';

// --- Utilities & defaults ---
const DEFAULT_DASH = {
	exams: { live: 0, scheduled: 0, draft: 0 },
	issues: { open: 0 },
	submissions: { pending: 0 },
	examsToReview: [],
	recentSubmissions: [],
};

const safePercent = (num, den) => {
	const n = Number(num || 0);
	const d = Number(den || 0);
	if (!d || d <= 0) return 0;
	return Math.round((n / d) * 100);
};

// --- Reusable Components ---
const ProfileSection = ({ user }) => {
	const getInitials = name =>
		name
			?.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2) || 'T';

	return (
		<div style={styles.profileCard.container}>
			<div style={styles.profileCard.header}>
				<div style={styles.profileCard.avatar}>
					{getInitials(user?.fullname || user?.username)}
				</div>
				<div style={styles.profileCard.info}>
					<h2 style={styles.profileCard.name}>{user?.fullname || 'Teacher'}</h2>
					<p style={styles.profileCard.role}>
						{user?.role
							? user.role.charAt(0).toUpperCase() + user.role.slice(1)
							: 'Educator'}
					</p>
					<div style={styles.profileCard.details}>
						{user?.email && (
							<span style={styles.profileCard.detailItem}>📧 {user.email}</span>
						)}
						{user?.department && (
							<span style={styles.profileCard.detailItem}>🏢 {user.department}</span>
						)}
					</div>
				</div>
				<button
					style={styles.profileCard.editButton}
					onClick={() => (window.location.href = '/teacher/settings')}
				>
					Edit Profile
				</button>
			</div>
		</div>
	);
};

const StatCard = ({ icon, label, value, loading, color = '#6366f1', trend }) => (
	<div style={styles.statCard.container} aria-live="polite">
		<div style={{ ...styles.statCard.iconContainer, background: `${color}15`, color }}>
			{icon}
		</div>
		<div style={styles.statCard.content}>
			<div style={styles.statCard.label}>{label}</div>
			<div style={styles.statCard.valueWrapper}>
				<div style={styles.statCard.value}>{loading ? '…' : value}</div>
				{trend !== undefined && (
					<div
						style={{
							...styles.statCard.trend,
							color: trend > 0 ? '#10b981' : '#ef4444',
							background: trend > 0 ? '#10b98115' : '#ef444415',
						}}
					>
						{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
					</div>
				)}
			</div>
		</div>
	</div>
);

const ActionButton = ({ icon, label, description, onClick }) => (
	<button
		onClick={onClick}
		style={styles.actionButton.container}
		className="hover-scale"
		type="button"
	>
		<div style={{ ...styles.actionButton.icon, background: 'var(--primary-light)' }}>
			{icon}
		</div>
		<div style={styles.actionButton.text}>
			<span style={styles.actionButton.label}>{label}</span>
			<span style={styles.actionButton.description}>{description}</span>
		</div>
		<div style={styles.actionButton.arrow}>→</div>
	</button>
);

const Skeleton = ({ height = '100%', width = '100%', borderRadius = 8 }) => (
	<div style={{ ...styles.skeleton, height, width, borderRadius }} />
);

// --- UI Components (defensive) ---
const ExamsToReview = ({ exams = [], loading, navigate }) => (
	<div style={styles.listCard.container}>
		<div style={styles.listCard.header}>
			<h3 style={styles.listCard.title}>Needs Review</h3>
			<span style={styles.listCard.badge}>{(exams && exams.length) || 0}</span>
		</div>
		<div style={styles.listCard.list}>
			{loading &&
				[...Array(3)].map((_, i) => (
					<div key={i} style={{ padding: '10px 0' }}>
						<Skeleton height={50} />
					</div>
				))}
			{!loading && (!exams || exams.length === 0) && (
				<div style={styles.emptyState.container}>
					<span style={styles.emptyState.icon}>🎉</span>
					<p style={styles.emptyState.text}>All caught up! No pending reviews.</p>
				</div>
			)}
			{(exams || []).map(exam => {
				const id = exam._id || exam.id || '';
				const submissionsCount = Number(exam.submissionsCount || exam.submissions || 0);
				const evaluatedCount = Number(exam.evaluatedCount || 0);
				const pct = safePercent(evaluatedCount, submissionsCount);
				return (
					<div
						key={id || Math.random()}
						style={styles.reviewItem.container}
						className="hover-effect"
						onClick={() => id && navigate(`/teacher/results/${id}`)}
					>
						<div style={styles.reviewItem.content}>
							<span style={styles.reviewItem.title}>
								{exam.title || 'Untitled Exam'}
							</span>
							<div style={styles.reviewItem.meta}>
								<span>👥 {submissionsCount}</span>
								<span>•</span>
								<span style={{ color: 'var(--primary)' }}>
									{Math.max(0, submissionsCount - evaluatedCount)} Pending
								</span>
							</div>
						</div>
						<div style={styles.reviewItem.progress}>
							<div style={styles.reviewItem.progressText}>{pct}%</div>
							<div style={styles.reviewItem.progressBarBg}>
								<div
									style={{ ...styles.reviewItem.progressBarFg, width: `${pct}%` }}
								/>
							</div>
						</div>
					</div>
				);
			})}
		</div>
	</div>
);

const RecentSubmissions = ({ submissions = [], loading, navigate }) => (
	<div style={styles.listCard.container}>
		<h3 style={styles.listCard.title}>Recent Activity</h3>
		<div style={styles.listCard.list}>
			{loading &&
				[...Array(4)].map((_, i) => (
					<div key={i} style={{ padding: '10px 0' }}>
						<Skeleton height={40} />
					</div>
				))}
			{!loading && (!submissions || submissions.length === 0) && (
				<div style={styles.emptyState.container}>
					<span style={styles.emptyState.icon}>📂</span>
					<p style={styles.emptyState.text}>No recent submissions.</p>
				</div>
			)}
			{(submissions || []).map(sub => {
				const id = sub._id || sub.id || '';
				const studentName = sub.student?.fullname || sub.student?.username || 'Student';
				const examTitle = sub.exam?.title || sub.examTitle || 'Exam';
				const createdAt = sub.createdAt || sub.submittedAt || sub.startedAt || '';
				let timeLabel = '';
				try {
					timeLabel = createdAt ? new Date(createdAt).toLocaleString() : '';
				} catch {
					timeLabel = '';
				}
				return (
					<div
						key={id || Math.random()}
						style={styles.activityItem.container}
						className="hover-effect"
						onClick={() => id && navigate(`/teacher/grade/${id}`)}
					>
						<div style={styles.activityItem.avatar}>{(studentName || 'S')[0]}</div>
						<div style={styles.activityItem.details}>
							<div style={styles.activityItem.header}>
								<span style={styles.activityItem.name}>{studentName}</span>
								<span style={styles.activityItem.time}>{timeLabel}</span>
							</div>
							<div style={styles.activityItem.action}>
								Submitted <strong>{examTitle}</strong>
							</div>
						</div>
					</div>
				);
			})}
		</div>
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
			// safeApiCall wrapper returns normalized or throws ApiError
			const response = await safeApiCall(getTeacherDashboardStats);
			// defensive merge with defaults so UI always has shape
			if (!response || typeof response !== 'object') {
				console.warn('Unexpected dashboard payload', response);
				setData(DEFAULT_DASH);
			} else {
				setData({ ...DEFAULT_DASH, ...response });
			}
		} catch (e) {
			console.warn('Failed to load dashboard stats', e);
			setError(e?.message || 'Failed to load dashboard data');
			setData(DEFAULT_DASH);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	// --- REAL-TIME UPDATES ---
	React.useEffect(() => {
		if (!user?.id) return undefined;

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});

		const onNewSubmission = newSubmission => {
			setData(currentData => {
				const recent = [newSubmission, ...(currentData.recentSubmissions || [])].slice(
					0,
					5,
				);
				const pending = (currentData.submissions?.pending || 0) + 1;

				const examId = newSubmission.exam?._id || newSubmission.exam?.id;
				let updatedExamsToReview = Array.isArray(currentData.examsToReview)
					? [...currentData.examsToReview]
					: [];
				let found = false;
				updatedExamsToReview = updatedExamsToReview.map(ex => {
					if ((ex._id || ex.id) === examId) {
						found = true;
						return { ...ex, submissionsCount: (ex.submissionsCount || 0) + 1 };
					}
					return ex;
				});
				if (!found && examId) {
					updatedExamsToReview.unshift({
						_id: examId,
						title: newSubmission.exam?.title || 'New Exam',
						submissionsCount: 1,
						evaluatedCount: 0,
					});
				}
				return {
					...currentData,
					recentSubmissions: recent,
					submissions: { ...(currentData.submissions || {}), pending },
					examsToReview: updatedExamsToReview.slice(0, 5),
				};
			});
		};

		socket.on('new-submission', onNewSubmission);
		socket.on('submission-updated', () => loadData()); // refresh on other updates

		return () => {
			socket.off('new-submission', onNewSubmission);
			socket.disconnect();
		};
	}, [user, loadData]);

	const quickActions = [
		{
			label: 'Create New Exam',
			description: 'Set up a new test',
			icon: '➕',
			onClick: () => navigate('/teacher/exams/create'),
		},
		{
			label: 'Question Bank',
			description: 'Manage questions',
			icon: '📚',
			onClick: () => navigate('/teacher/questions'),
		},
		{
			label: 'Student Issues',
			description: 'View reported problems',
			icon: '🚩',
			onClick: () => navigate('/teacher/issues'),
		},
	];

	const statCards = [
		{ icon: '🟢', label: 'Live Exams', value: data?.exams?.live ?? 0, color: '#10b981' },
		{ icon: '🗓️', label: 'Scheduled', value: data?.exams?.scheduled ?? 0, color: '#3b82f6' },
		{
			icon: '⏳',
			label: 'Pending Reviews',
			value: data?.submissions?.pending ?? 0,
			color: '#f59e0b',
		},
		{ icon: '🚩', label: 'Open Issues', value: data?.issues?.open ?? 0, color: '#ef4444' },
	];

	return (
		<div style={styles.pageContainer}>
			<style>{`
                .hover-effect:hover { background: var(--bg-hover, #f8fafc); }
                .hover-scale:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
                @keyframes pulse { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
            `}</style>

			{/* Top Section: Profile & Stats */}
			<div style={styles.topSection(isMobile)}>
				<div style={{ flex: isMobile ? '1 1 100%' : '0 0 350px' }}>
					<ProfileSection user={user} />
				</div>

				<div style={styles.statsGrid}>
					{statCards.map(card => (
						<StatCard key={card.label} {...card} loading={loading} />
					))}
				</div>
			</div>

			{error && <div style={styles.errorBanner}>⚠️ {error}</div>}

			{/* Main Content Grid */}
			<div style={styles.mainGrid.container(isMobile)}>
				{/* Left Column */}
				<div style={styles.mainGrid.column}>
					<RecentSubmissions
						submissions={data?.recentSubmissions ?? []}
						loading={loading}
						navigate={navigate}
					/>
					<ExamsToReview
						exams={data?.examsToReview ?? []}
						loading={loading}
						navigate={navigate}
					/>
				</div>

				{/* Right Column */}
				<div style={styles.mainGrid.column}>
					<div style={styles.listCard.container}>
						<h3 style={styles.listCard.title}>Quick Actions</h3>
						<div style={styles.actionsGrid}>
							{quickActions.map(action => (
								<ActionButton key={action.label} {...action} />
							))}
						</div>
					</div>

					<div
						style={{
							...styles.listCard.container,
							background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
							color: 'white',
							border: 'none',
						}}
					>
						<h3 style={{ ...styles.listCard.title, color: 'white' }}>💡 Pro Tip</h3>
						<p style={{ opacity: 0.9, lineHeight: '1.5' }}>
							You can now bulk upload questions from the Question Bank tab. Try it out
							to save time!
						</p>
					</div>
				</div>
			</div>
		</div>
	);
};

// --- Styles ---
const styles = {
	pageContainer: {
		maxWidth: 1400,
		margin: '0 auto',
		padding: '24px',
		animation: 'fadeIn 0.5s ease-out',
	},
	topSection: isMobile => ({
		display: 'flex',
		flexDirection: isMobile ? 'column' : 'row',
		gap: 24,
		marginBottom: 32,
	}),
	statsGrid: {
		display: 'grid',
		gap: 20,
		gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
		flex: 1,
	},
	mainGrid: {
		container: isMobile => ({
			display: 'grid',
			gap: 24,
			gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
		}),
		column: { display: 'flex', flexDirection: 'column', gap: 24 },
	},

	// Profile Card
	profileCard: {
		container: {
			background: 'var(--surface, #ffffff)',
			borderRadius: 20,
			padding: 24,
			border: '1px solid var(--border, #e2e8f0)',
			boxShadow: 'var(--shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
			height: '100%',
			display: 'flex',
			flexDirection: 'column',
			justifyContent: 'center',
		},
		header: {
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center',
			textAlign: 'center',
			gap: 16,
		},
		avatar: {
			width: 80,
			height: 80,
			borderRadius: '50%',
			background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
			color: 'white',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 32,
			fontWeight: 700,
			boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
		},
		info: { display: 'flex', flexDirection: 'column', gap: 4 },
		name: { margin: 0, fontSize: 24, fontWeight: 700, color: 'var(--text, #1e293b)' },
		role: { margin: 0, color: 'var(--text-muted, #64748b)', fontSize: 14, fontWeight: 500 },
		details: {
			display: 'flex',
			flexDirection: 'column',
			gap: 8,
			marginTop: 12,
			paddingTop: 16,
			borderTop: '1px solid var(--border, #e2e8f0)',
			width: '100%',
		},
		detailItem: {
			fontSize: 13,
			color: 'var(--text-muted, #64748b)',
			display: 'flex',
			alignItems: 'center',
			gap: 8,
			justifyContent: 'center',
		},
		editButton: {
			marginTop: 16,
			padding: '8px 16px',
			borderRadius: 20,
			border: '1px solid var(--border, #e2e8f0)',
			background: 'transparent',
			color: 'var(--text, #1e293b)',
			fontSize: 13,
			fontWeight: 600,
			cursor: 'pointer',
			transition: 'all 0.2s',
		},
	},

	// Stat Card
	statCard: {
		container: {
			background: 'var(--surface, #ffffff)',
			borderRadius: 16,
			padding: 20,
			border: '1px solid var(--border, #e2e8f0)',
			boxShadow: 'var(--shadow-sm)',
			display: 'flex',
			alignItems: 'flex-start',
			gap: 16,
			transition: 'transform 0.2s',
		},
		iconContainer: {
			width: 48,
			height: 48,
			borderRadius: 12,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 24,
			flexShrink: 0,
		},
		content: { flex: 1 },
		label: {
			fontSize: 13,
			color: 'var(--text-muted, #64748b)',
			fontWeight: 600,
			marginBottom: 4,
			textTransform: 'uppercase',
			letterSpacing: '0.5px',
		},
		valueWrapper: { display: 'flex', alignItems: 'baseline', gap: 8 },
		value: { fontSize: 28, fontWeight: 800, color: 'var(--text, #1e293b)', lineHeight: 1 },
		trend: { fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 4 },
	},

	// Action Button
	actionButton: {
		container: {
			display: 'flex',
			alignItems: 'center',
			gap: 16,
			padding: 16,
			borderRadius: 12,
			border: '1px solid var(--border, #e2e8f0)',
			background: 'var(--surface, #ffffff)',
			cursor: 'pointer',
			transition: 'all 0.2s',
			textAlign: 'left',
			width: '100%',
		},
		icon: {
			width: 40,
			height: 40,
			borderRadius: 10,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 20,
		},
		text: { flex: 1 },
		label: { display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text, #1e293b)' },
		description: {
			display: 'block',
			fontSize: 12,
			color: 'var(--text-muted, #64748b)',
			marginTop: 2,
		},
		arrow: { color: 'var(--text-muted, #64748b)', fontSize: 18 },
	},

	// List/Card Generic
	listCard: {
		container: {
			background: 'var(--surface, #ffffff)',
			borderRadius: 16,
			padding: 24,
			border: '1px solid var(--border, #e2e8f0)',
			boxShadow: 'var(--shadow-sm)',
			display: 'flex',
			flexDirection: 'column',
			height: '100%',
		},
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'center',
			marginBottom: 20,
		},
		title: { margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text, #1e293b)' },
		badge: {
			background: '#ef4444',
			color: 'white',
			padding: '2px 8px',
			borderRadius: 12,
			fontSize: 12,
			fontWeight: 700,
		},
		list: { display: 'flex', flexDirection: 'column', gap: 12 },
	},

	actionsGrid: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
	},

	// Review Item
	reviewItem: {
		container: {
			padding: 16,
			borderRadius: 12,
			border: '1px solid var(--border, #e2e8f0)',
			cursor: 'pointer',
			transition: 'all 0.2s',
			background: 'var(--bg-subtle, #f8fafc)',
		},
		content: { marginBottom: 12 },
		title: {
			display: 'block',
			fontWeight: 600,
			color: 'var(--text, #1e293b)',
			fontSize: 15,
			marginBottom: 4,
		},
		meta: { display: 'flex', gap: 8, fontSize: 12, color: 'var(--text-muted, #64748b)' },
		progress: { display: 'flex', alignItems: 'center', gap: 12 },
		progressText: { fontSize: 12, fontWeight: 700, color: 'var(--text, #1e293b)', width: 32 },
		progressBarBg: {
			flex: 1,
			height: 6,
			background: 'var(--border, #e2e8f0)',
			borderRadius: 3,
			overflow: 'hidden',
		},
		progressBarFg: {
			height: '100%',
			background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
			borderRadius: 3,
		},
	},

	// Activity Item
	activityItem: {
		container: {
			display: 'flex',
			alignItems: 'center',
			gap: 16,
			padding: '12px 0',
			borderBottom: '1px solid var(--border, #f1f5f9)',
			cursor: 'pointer',
		},
		avatar: {
			width: 40,
			height: 40,
			borderRadius: '50%',
			background: '#e0e7ff',
			color: '#4338ca',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 16,
			fontWeight: 700,
		},
		details: { flex: 1 },
		header: { display: 'flex', justifyContent: 'space-between', marginBottom: 4 },
		name: { fontSize: 14, fontWeight: 600, color: 'var(--text, #1e293b)' },
		time: { fontSize: 12, color: 'var(--text-muted, #94a3b8)' },
		action: { fontSize: 13, color: 'var(--text-muted, #64748b)' },
	},

	emptyState: {
		container: { padding: '32px 0', textAlign: 'center', color: 'var(--text-muted, #94a3b8)' },
		icon: { fontSize: 32, display: 'block', marginBottom: 8 },
		text: { fontSize: 14 },
	},

	errorBanner: {
		background: '#fef2f2',
		color: '#991b1b',
		padding: '12px 16px',
		borderRadius: 8,
		marginBottom: 24,
		fontSize: 14,
		border: '1px solid #fecaca',
	},

	skeleton: {
		background: 'var(--skeleton-bg, #e2e8f0)',
		animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
	},
};

export default TeacherHome;
