import React from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth.js';
import { getTeacherDashboardStats, safeApiCall } from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';

// --- Reusable Components ---
const StatCard = ({ icon, label, value, loading, color = '#6366f1' }) => (
	<div style={styles.statCard.container}>
		<div style={{ ...styles.statCard.iconContainer, background: `${color}20`, color }}>
			{icon}
		</div>
		<div>
			<div style={styles.statCard.label}>{label}</div>
			<div style={styles.statCard.value}>{loading ? '⋯' : value}</div>
		</div>
	</div>
);

const ActionButton = ({ icon, label, onClick, variant = 'primary' }) => {
	const variantStyles = {
		primary: {
			background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
			color: '#ffffff',
			border: 'none',
			boxShadow: '0 8px 20px rgba(59,130,246,0.3)',
		},
		secondary: {
			background: 'var(--surface)',
			color: 'var(--text)',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-sm)',
		},
	};
	return (
		<button
			onClick={onClick}
			style={{ ...styles.actionButton.base, ...variantStyles[variant] }}
		>
			<span style={{ fontSize: '18px' }}>{icon}</span>
			{label}
		</button>
	);
};

const Skeleton = ({ height = '100%', width = '100%', borderRadius = 8 }) => (
	<div style={{ ...styles.skeleton, height, width, borderRadius }} />
);

// --- UI Components ---

const ExamsToReview = ({ exams, loading, navigate }) => (
	<div style={styles.listCard.container}>
		<h3 style={styles.listCard.title}>Needs Review</h3>
		<div style={styles.listCard.list}>
			{loading &&
				[...Array(3)].map((_, i) => (
					<div key={i} style={{ padding: '10px 0' }}>
						<Skeleton height={40} />
					</div>
				))}
			{!loading && exams?.length === 0 && (
				<p style={styles.listCard.emptyText}>
					No submissions are pending review. Great job!
				</p>
			)}
			{exams?.map(exam => (
				<div
					key={exam._id}
					style={styles.reviewItem.container}
					className="hover-effect"
					onClick={() => navigate(`/teacher/results/${exam._id}`)}
				>
					<div style={styles.reviewItem.textContainer}>
						<span style={styles.reviewItem.title}>{exam.title}</span>
						<span style={styles.reviewItem.progressText}>
							{exam.evaluatedCount} / {exam.submissionsCount} Evaluated
						</span>
					</div>
					<div style={styles.reviewItem.progressBarBg}>
						<div
							style={{
								...styles.reviewItem.progressBarFg,
								width: `${(exam.evaluatedCount / exam.submissionsCount) * 100}%`,
							}}
						/>
					</div>
				</div>
			))}
		</div>
	</div>
);

const RecentSubmissions = ({ submissions, loading, navigate }) => (
	<div style={styles.listCard.container}>
		<h3 style={styles.listCard.title}>Recent Submissions</h3>
		<div style={styles.listCard.list}>
			{loading &&
				[...Array(4)].map((_, i) => (
					<div key={i} style={{ padding: '10px 0' }}>
						<Skeleton height={30} />
					</div>
				))}
			{!loading && submissions?.length === 0 && (
				<p style={styles.listCard.emptyText}>No recent submissions found.</p>
			)}
			{submissions?.map(sub => (
				<div
					key={sub._id}
					style={styles.activityItem.container}
					className="hover-effect"
					onClick={() => navigate(`/teacher/grade/${sub._id}`)}
				>
					<div style={styles.activityItem.icon}>📝</div>
					<div style={styles.activityItem.details}>
						<span style={styles.activityItem.mainText}>
							<strong>{sub.student?.fullname || 'A student'}</strong> submitted to{' '}
							<strong>{sub.exam?.title || 'an exam'}</strong>.
						</span>
						<span style={styles.activityItem.subText}>
							{new Date(sub.createdAt).toLocaleString()}
						</span>
					</div>
					<div style={styles.activityItem.cta}>&rarr;</div>
				</div>
			))}
		</div>
	</div>
);

// --- Main TeacherHome Component ---

const TeacherHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const name = user?.fullname || user?.username || 'Teacher';

	const [data, setData] = React.useState(null);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const response = await safeApiCall(getTeacherDashboardStats);
			setData(response);
		} catch (e) {
			setError(e.message || 'Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	// --- REAL-TIME UPDATES ---
	React.useEffect(() => {
		if (!user?.id) return;

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});

		socket.on('new-submission', newSubmission => {
			setData(currentData => {
				if (!currentData) return null;

				// 1. Add to recent submissions
				const updatedSubmissions = [newSubmission, ...currentData.recentSubmissions].slice(
					0,
					5,
				);

				// 2. Update pending count
				const updatedPending = (currentData.submissions.pending || 0) + 1;

				// 3. Update or add to examsToReview
				const examId = newSubmission.exam?._id;
				let needsReviewUpdated = false;
				const updatedExamsToReview = currentData.examsToReview.map(exam => {
					if (exam._id === examId) {
						needsReviewUpdated = true;
						return { ...exam, submissionsCount: (exam.submissionsCount || 0) + 1 };
					}
					return exam;
				});

				if (!needsReviewUpdated) {
					updatedExamsToReview.unshift({
						_id: examId,
						title: newSubmission.exam?.title || 'New Exam',
						submissionsCount: 1,
						evaluatedCount: 0,
					});
				}

				return {
					...currentData,
					recentSubmissions: updatedSubmissions,
					submissions: { ...currentData.submissions, pending: updatedPending },
					examsToReview: updatedExamsToReview.slice(0, 5),
				};
			});
		});

		return () => socket.disconnect();
	}, [user]);

	const quickActions = [
		{
			label: 'Create Exam',
			icon: '➕',
			onClick: () => navigate('exams/create'),
			variant: 'primary',
		},
		{
			label: 'View All Submissions',
			icon: '📋',
			onClick: () => navigate('results'),
			variant: 'secondary',
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
		{ icon: '🚨', label: 'Open Issues', value: data?.issues?.open ?? 0, color: '#ef4444' },
	];

	return (
		<div style={styles.pageContainer}>
			<style>{`.hover-effect:hover { background: var(--bg); }`}</style>
			<header style={styles.header.container}>
				<h1 style={styles.header.title}>Welcome back, {name}! 👋</h1>
				<p style={styles.header.subtitle}>
					Here's a summary of your teaching activities. Let's get to work.
				</p>
			</header>

			{error && <div style={{ color: '#ef4444', marginBottom: 16 }}>Error: {error}</div>}

			<div style={styles.statsGrid}>
				{statCards.map(card => (
					<StatCard key={card.label} {...card} loading={loading} />
				))}
			</div>

			<div style={styles.mainGrid.container}>
				<div style={styles.mainGrid.column}>
					<div style={styles.listCard.container}>
						<h2 style={styles.listCard.title}>Quick Actions</h2>
						<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
							{quickActions.map(action => (
								<ActionButton key={action.label} {...action} />
							))}
						</div>
					</div>
					<RecentSubmissions
						submissions={data?.recentSubmissions}
						loading={loading}
						navigate={navigate}
					/>
				</div>
				<div style={styles.mainGrid.column}>
					<ExamsToReview
						exams={data?.examsToReview}
						loading={loading}
						navigate={navigate}
					/>
				</div>
			</div>
		</div>
	);
};

// --- Styles ---
const styles = {
	pageContainer: { maxWidth: 1200, margin: '0 auto' },
	header: {
		container: { padding: '20px 0', marginBottom: 24 },
		title: { margin: '0 0 8px 0', fontSize: 32, fontWeight: 800, color: 'var(--text)' },
		subtitle: { margin: 0, color: 'var(--text-muted)', fontSize: 16 },
	},
	statsGrid: {
		display: 'grid',
		gap: 20,
		gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
		marginBottom: 32,
	},
	mainGrid: {
		container: {
			display: 'grid',
			gap: 32,
			gridTemplateColumns: '1fr', // Mobile-first: single column
			'@media (min-width: 1024px)': {
				gridTemplateColumns: '2fr 1fr', // Desktop: two columns
			},
		},
		column: { display: 'flex', flexDirection: 'column', gap: 32 },
	},
	statCard: {
		container: {
			background: 'var(--surface)',
			borderRadius: 16,
			padding: '24px 20px',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-md)',
			display: 'flex',
			alignItems: 'center',
			gap: 16,
		},
		iconContainer: {
			width: 48,
			height: 48,
			borderRadius: 12,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 20,
			flexShrink: 0,
		},
		label: { fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, marginBottom: 4 },
		value: { fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 1 },
	},
	actionButton: {
		base: {
			flex: '1 1 200px',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			gap: 12,
			padding: '16px 20px',
			borderRadius: 12,
			cursor: 'pointer',
			fontWeight: 700,
			fontSize: 14,
		},
	},
	listCard: {
		container: {
			background: 'var(--surface)',
			borderRadius: 16,
			padding: 28,
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-md)',
			display: 'flex',
			flexDirection: 'column',
		},
		title: { margin: '0 0 20px 0', fontSize: 20, fontWeight: 700, color: 'var(--text)' },
		list: { display: 'flex', flexDirection: 'column', gap: 8 },
		emptyText: {
			fontSize: 14,
			color: 'var(--text-muted)',
			textAlign: 'center',
			padding: '20px 0',
		},
	},
	reviewItem: {
		container: {
			padding: '12px 16px',
			borderRadius: 10,
			border: '1px solid var(--border)',
			cursor: 'pointer',
			transition: 'background 0.2s, border-color 0.2s',
		},
		textContainer: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'baseline',
			marginBottom: 8,
		},
		title: { fontWeight: 600, color: 'var(--text)', fontSize: 14 },
		progressText: { fontSize: 12, color: 'var(--text-muted)' },
		progressBarBg: { height: 6, background: 'var(--bg)', borderRadius: 3, overflow: 'hidden' },
		progressBarFg: { height: '100%', background: 'var(--primary-gradient)', borderRadius: 3 },
	},
	activityItem: {
		container: {
			display: 'flex',
			alignItems: 'center',
			gap: 16,
			padding: '12px',
			borderRadius: 10,
			cursor: 'pointer',
			transition: 'background 0.2s',
		},
		icon: {
			width: 36,
			height: 36,
			borderRadius: '50%',
			background: 'var(--bg)',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			fontSize: 16,
		},
		details: { flex: 1, display: 'grid', gap: 2 },
		mainText: { fontSize: 14, color: 'var(--text)' },
		subText: { fontSize: 12, color: 'var(--text-muted)' },
		cta: { fontSize: 20, color: 'var(--text-muted)', transition: 'transform 0.2s' },
	},
	skeleton: {
		background: 'var(--skeleton-bg)',
		animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
	},
};

export default TeacherHome;
