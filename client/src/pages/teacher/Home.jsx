import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	getTeacherExams,
	getTeacherIssues,
	getTeacherSubmissions,
} from '../../services/teacherServices.js';

const StatCard = ({ icon, label, value, loading, color = '#6366f1' }) => (
	<div
		style={{
			background: 'var(--surface)',
			borderRadius: 16,
			padding: '24px 20px',
			border: '1px solid var(--border)',
			boxShadow: 'var(--shadow-md)',
			display: 'flex',
			alignItems: 'center',
			gap: 16,
		}}
	>
		<div
			style={{
				width: 48,
				height: 48,
				borderRadius: 12,
				background: `${color}20`,
				color: color,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: '20px',
			}}
		>
			{icon}
		</div>
		<div>
			<div
				style={{
					fontSize: '14px',
					color: 'var(--text-muted)',
					fontWeight: 500,
					marginBottom: 4,
				}}
			>
				{label}
			</div>
			<div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>
				{loading ? '⋯' : value}
			</div>
		</div>
	</div>
);

const ActionButton = ({ icon, label, onClick, variant = 'primary' }) => {
	const styles = {
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
			style={{
				flex: '1 1 200px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 12,
				padding: '16px 20px',
				borderRadius: 12,
				cursor: 'pointer',
				fontWeight: 700,
				fontSize: '14px',
				...styles[variant],
			}}
		>
			<span style={{ fontSize: '18px' }}>{icon}</span>
			{label}
		</button>
	);
};

const TeacherHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const name = user?.fullname || user?.username || 'Teacher';

	const [stats, setStats] = React.useState({
		live: 0,
		scheduled: 0,
		draft: 0,
		pendingSubs: 0,
		openIssues: 0,
	});
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			// FIX: Corrected API calls to fetch all necessary data
			const [examsResponse, issues, subsResponse] = await Promise.all([
				safeApiCall(getTeacherExams), // No params needed to get all exams for counts
				safeApiCall(getTeacherIssues, { status: 'open' }), // Fetch only open issues
				safeApiCall(getTeacherSubmissions), // No examId to get all submissions
			]);

			const exams = examsResponse?.items || [];
			const subs = subsResponse || [];

			setStats({
				live: exams.filter(e => e.derivedStatus === 'live').length,
				scheduled: exams.filter(e => e.derivedStatus === 'scheduled').length,
				draft: exams.filter(e => e.derivedStatus === 'draft').length,
				pendingSubs: subs.filter(s => ['submitted', 'evaluated'].includes(s.status)).length,
				openIssues: Array.isArray(issues) ? issues.length : 0,
			});
		} catch (e) {
			setError(e.message || 'Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	}, []);
	React.useEffect(() => {
		loadData();
	}, [loadData]);

	const quickActions = [
		{ label: 'Create Exam', icon: '➕', onClick: () => navigate('exams'), variant: 'primary' },
		{
			label: 'Review Submissions',
			icon: '📋',
			onClick: () => navigate('results'),
			variant: 'secondary',
		},
		{
			label: 'Handle Issues',
			icon: '🛠️',
			onClick: () => navigate('issues'),
			variant: 'secondary',
		},
	];

	const statCards = [
		{
			icon: '🟢',
			label: 'Live Exams',
			value: stats.live,
			color: '#10b981',
		},
		{
			icon: '🗓️',
			label: 'Scheduled',
			value: stats.scheduled,
			color: '#3b82f6',
		},
		{
			icon: '📄',
			label: 'Drafts',
			value: stats.draft,
			color: 'var(--text-muted)',
		},
		{
			icon: '⏳',
			label: 'Pending Reviews',
			value: stats.pendingSubs,
			color: '#f59e0b',
		},
		{
			icon: '🚨',
			label: 'Open Issues',
			value: stats.openIssues,
			color: '#ef4444',
		},
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			<header style={{ padding: '20px 0', marginBottom: 24 }}>
				<h1
					style={{
						margin: '0 0 8px 0',
						fontSize: '32px',
						fontWeight: 800,
						color: 'var(--text)',
					}}
				>
					Welcome back, {name}! 👋
				</h1>
				<p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>
					Review, evaluate, and provide feedback on student submissions.
				</p>
			</header>

			{error && <div style={{ color: '#ef4444', marginBottom: 16 }}>Error: {error}</div>}

			<div
				style={{
					display: 'grid',
					gap: 20,
					gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
					marginBottom: 32,
				}}
			>
				{statCards.map(card => (
					<StatCard key={card.label} {...card} loading={loading} />
				))}
			</div>

			<div
				style={{
					background: 'var(--surface)',
					borderRadius: 16,
					padding: 28,
					border: '1px solid var(--border)',
					boxShadow: 'var(--shadow-md)',
				}}
			>
				<h2
					style={{
						margin: '0 0 20px 0',
						fontSize: '20px',
						fontWeight: 700,
						color: 'var(--text)',
					}}
				>
					Quick Actions
				</h2>
				<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
					{quickActions.map(action => (
						<ActionButton key={action.label} {...action} />
					))}
				</div>
			</div>
		</div>
	);
};

export default TeacherHome;
