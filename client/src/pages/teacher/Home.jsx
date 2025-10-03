import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	getTeacherExams,
	getTeacherIssues,
	getTeacherSubmissions,
} from '../../services/teacherServices.js';

const StatusBanner = ({ type = 'info', children, onClose }) => (
	<div
		role="status"
		aria-live="polite"
		style={{
			padding: '14px 18px',
			borderRadius: 12,
			border: `1px solid ${type === 'error' ? '#fca5a5' : type === 'success' ? '#86efac' : '#93c5fd'}`,
			background: type === 'error' ? '#fef2f2' : type === 'success' ? '#ecfdf5' : '#eff6ff',
			color: type === 'error' ? '#b91c1c' : type === 'success' ? '#047857' : '#1d4ed8',
			fontWeight: 600,
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'space-between',
			gap: 12,
			boxShadow: '0 4px 12px rgba(15,23,42,0.05)',
		}}
	>
		<span>{children}</span>
		{onClose && (
			<button
				onClick={onClose}
				style={{
					border: 'none',
					background: 'transparent',
					cursor: 'pointer',
					color: 'inherit',
					fontWeight: 800,
					fontSize: '18px',
					padding: '4px',
					borderRadius: '4px',
				}}
				aria-label="Dismiss message"
			>
				×
			</button>
		)}
	</div>
);

const StatCard = ({ icon, label, value, loading, color = '#6366f1' }) => (
	<div
		style={{
			background: '#ffffff',
			borderRadius: 16,
			padding: '24px 20px',
			border: '1px solid #e2e8f0',
			boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
			display: 'flex',
			alignItems: 'center',
			gap: 16,
			transition: 'transform 0.2s ease, box-shadow 0.2s ease',
		}}
		onMouseEnter={e => {
			e.currentTarget.style.transform = 'translateY(-2px)';
			e.currentTarget.style.boxShadow = '0 12px 32px rgba(15,23,42,0.12)';
		}}
		onMouseLeave={e => {
			e.currentTarget.style.transform = 'translateY(0)';
			e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)';
		}}
	>
		<div
			style={{
				width: 48,
				height: 48,
				borderRadius: 12,
				background: `${color}15`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: '20px',
			}}
		>
			{icon}
		</div>
		<div style={{ flex: 1 }}>
			<div
				style={{
					fontSize: '14px',
					color: '#64748b',
					fontWeight: 500,
					marginBottom: 4,
				}}
			>
				{label}
			</div>
			<div
				style={{
					fontSize: '28px',
					fontWeight: 800,
					color: '#0f172a',
					lineHeight: 1,
				}}
			>
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
			background: '#ffffff',
			color: '#374151',
			border: '1px solid #d1d5db',
			boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
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
				transition: 'all 0.2s ease',
				...styles[variant],
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'translateY(-1px)';
				if (variant === 'primary') {
					e.currentTarget.style.boxShadow = '0 12px 28px rgba(59,130,246,0.4)';
				}
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'translateY(0)';
				if (variant === 'primary') {
					e.currentTarget.style.boxShadow = '0 8px 20px rgba(59,130,246,0.3)';
				}
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
	const teacherId = user?._id || user?.id;
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
	const [info, setInfo] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		setInfo('');
		try {
			const [exams, issues, subs] = await Promise.all([
				safeApiCall(getTeacherExams, { teacher: teacherId }),
				safeApiCall(getTeacherIssues),
				safeApiCall(getTeacherSubmissions, undefined, { teacher: teacherId }),
			]);

			const live = exams.filter(e => e.status === 'active' || e.status === 'live').length;
			const scheduled = exams.filter(e => e.status === 'scheduled').length;
			const draft = exams.filter(e => e.status === 'draft').length;
			const pendingSubs = subs.filter(
				s => s.status === 'pending' || s.status === 'submitted',
			).length;
			const openIssues = issues.filter(
				i => (i.status || '').toLowerCase() !== 'resolved',
			).length;

			setStats({ live, scheduled, draft, pendingSubs, openIssues });

			if (!exams.length) {
				setInfo('Welcome! Create your first exam to get started with the platform.');
			}
		} catch (e) {
			setError(e.message || 'Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	}, [teacherId]);

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
		{
			label: 'Account Settings',
			icon: '⚙️',
			onClick: () => navigate('settings'),
			variant: 'secondary',
		},
	];

	const statCards = [
		{ icon: '🟢', label: 'Live Exams', value: stats.live, color: '#10b981' },
		{ icon: '🗓️', label: 'Scheduled', value: stats.scheduled, color: '#3b82f6' },
		{ icon: '📄', label: 'Drafts', value: stats.draft, color: '#64748b' },
		{ icon: '⏳', label: 'Pending Reviews', value: stats.pendingSubs, color: '#f59e0b' },
		{ icon: '🚨', label: 'Open Issues', value: stats.openIssues, color: '#ef4444' },
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			{/* Header Section */}
			<div
				style={{
					background:
						'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(147,51,234,0.05))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid rgba(59,130,246,0.15)',
					marginBottom: 32,
					position: 'relative',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						position: 'absolute',
						top: -50,
						right: -50,
						width: 200,
						height: 200,
						borderRadius: '50%',
						background:
							'radial-gradient(circle, rgba(59,130,246,0.1), transparent 70%)',
					}}
				/>

				<div style={{ position: 'relative', zIndex: 1 }}>
					<h1
						style={{
							margin: '0 0 8px 0',
							fontSize: '32px',
							fontWeight: 800,
							background: 'linear-gradient(135deg, #1e40af, #7c3aed)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Welcome back, {name}! 👋
					</h1>
					<p
						style={{
							margin: '0 0 24px 0',
							color: '#475569',
							fontSize: '16px',
							fontWeight: 500,
						}}
					>
						Manage your exams, track submissions, and engage with students all in one
						place.
					</p>

					<div
						style={{
							display: 'flex',
							gap: 16,
							flexWrap: 'wrap',
							marginBottom: 20,
						}}
					>
						{quickActions.map(action => (
							<ActionButton key={action.label} {...action} />
						))}
					</div>

					{/* Status Messages */}
					{error && (
						<StatusBanner type="error" onClose={() => setError('')}>
							{error}
						</StatusBanner>
					)}
					{!error && info && (
						<StatusBanner type="info" onClose={() => setInfo('')}>
							{info}
						</StatusBanner>
					)}

					{!error && !info && !loading && (
						<button
							onClick={loadData}
							style={{
								padding: '10px 16px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#ffffff',
								cursor: 'pointer',
								fontWeight: 600,
								color: '#374151',
								fontSize: '14px',
								boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
							}}
						>
							🔄 Refresh Dashboard
						</button>
					)}
				</div>
			</div>

			{/* Stats Grid */}
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

			{/* Recent Activity Placeholder */}
			<div
				style={{
					background: '#ffffff',
					borderRadius: 16,
					padding: 28,
					border: '1px solid #e2e8f0',
					boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
				}}
			>
				<h2
					style={{
						margin: '0 0 16px 0',
						fontSize: '20px',
						fontWeight: 700,
						color: '#0f172a',
					}}
				>
					Recent Activity
				</h2>
				<div
					style={{
						padding: '40px 20px',
						textAlign: 'center',
						color: '#64748b',
						background: '#f8fafc',
						borderRadius: 12,
						border: '2px dashed #cbd5e1',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: 12 }}>📊</div>
					<p style={{ margin: 0, fontWeight: 600 }}>Activity feed coming soon</p>
					<p style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
						Track recent submissions, student interactions, and system updates
					</p>
				</div>
			</div>
		</div>
	);
};

export default TeacherHome;
