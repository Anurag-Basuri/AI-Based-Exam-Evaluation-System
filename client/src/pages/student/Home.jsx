import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall, getMySubmissions } from '../../services/studentServices.js';

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
			background: 'linear-gradient(135deg, #10b981, #059669)',
			color: '#ffffff',
			border: 'none',
			boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
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
				flex: '1 1 160px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				gap: 10,
				padding: '14px 18px',
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
					e.currentTarget.style.boxShadow = '0 12px 28px rgba(16,185,129,0.4)';
				}
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'translateY(0)';
				if (variant === 'primary') {
					e.currentTarget.style.boxShadow = '0 8px 20px rgba(16,185,129,0.3)';
				}
			}}
		>
			<span style={{ fontSize: '16px' }}>{icon}</span>
			{label}
		</button>
	);
};

const StudentHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const username = user?.fullname || user?.username || 'Student';

	const [stats, setStats] = React.useState({
		inProgress: 0,
		submitted: 0,
		evaluated: 0,
		total: 0,
	});
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [info, setInfo] = React.useState('');

	const loadStats = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const submissions = await safeApiCall(getMySubmissions);
			const counts = Array.isArray(submissions)
				? submissions.reduce(
						(acc, s) => {
							const status = s.status?.toLowerCase() || 'pending';
							if (status === 'in-progress' || status === 'started')
								acc.inProgress += 1;
							else if (status === 'submitted') acc.submitted += 1;
							else if (status === 'evaluated') acc.evaluated += 1;
							acc.total += 1;
							return acc;
						},
						{ inProgress: 0, submitted: 0, evaluated: 0, total: 0 },
					)
				: { inProgress: 0, submitted: 0, evaluated: 0, total: 0 };

			setStats(counts);

			if (counts.total === 0) {
				setInfo('No exam attempts yet. Use an exam search ID to start your first exam!');
			} else if (counts.inProgress > 0) {
				setInfo(
					`You have ${counts.inProgress} exam${counts.inProgress > 1 ? 's' : ''} in progress!`,
				);
			}
		} catch (e) {
			setError(e?.message || 'Failed to load exam statistics');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadStats();
	}, [loadStats]);

	const quickActions = [
		{ label: 'Find Exam', icon: '🔍', onClick: () => navigate('exams'), variant: 'primary' },
		{
			label: 'View Results',
			icon: '📊',
			onClick: () => navigate('results'),
			variant: 'secondary',
		},
		{
			label: 'Report Issue',
			icon: '🛠️',
			onClick: () => navigate('issues'),
			variant: 'secondary',
		},
		{
			label: 'Settings',
			icon: '⚙️',
			onClick: () => navigate('settings'),
			variant: 'secondary',
		},
	];

	const statCards = [
		{ icon: '🟡', label: 'In Progress', value: stats.inProgress, color: '#f59e0b' },
		{ icon: '📋', label: 'Submitted', value: stats.submitted, color: '#3b82f6' },
		{ icon: '✅', label: 'Evaluated', value: stats.evaluated, color: '#10b981' },
		{ icon: '📊', label: 'Total Attempts', value: stats.total, color: '#6366f1' },
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			{/* Welcome Header */}
			<div
				style={{
					background:
						'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid rgba(16,185,129,0.15)',
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
							'radial-gradient(circle, rgba(16,185,129,0.1), transparent 70%)',
					}}
				/>

				<div style={{ position: 'relative', zIndex: 1 }}>
					<h1
						style={{
							margin: '0 0 8px 0',
							fontSize: '32px',
							fontWeight: 800,
							background: 'linear-gradient(135deg, #059669, #3b82f6)',
							WebkitBackgroundClip: 'text',
							WebkitTextFillColor: 'transparent',
							backgroundClip: 'text',
						}}
					>
						Welcome back, {username}! 👋
					</h1>
					<p
						style={{
							margin: '0 0 24px 0',
							color: '#475569',
							fontSize: '16px',
							fontWeight: 500,
						}}
					>
						Use your exam search ID to find and take exams. Track your progress and
						results.
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
						<div
							style={{
								padding: '14px 18px',
								borderRadius: 12,
								border: '1px solid #fca5a5',
								background: '#fef2f2',
								color: '#b91c1c',
								fontWeight: 600,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12,
							}}
							role="alert"
						>
							<span>❌ {error}</span>
							<button
								onClick={() => setError('')}
								style={{
									border: 'none',
									background: 'transparent',
									cursor: 'pointer',
									color: 'inherit',
									fontWeight: 800,
									fontSize: '18px',
									padding: '4px',
								}}
								aria-label="Dismiss error"
							>
								×
							</button>
						</div>
					)}

					{!error && info && (
						<div
							style={{
								padding: '14px 18px',
								borderRadius: 12,
								border: '1px solid #93c5fd',
								background: '#eff6ff',
								color: '#1d4ed8',
								fontWeight: 600,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'space-between',
								gap: 12,
							}}
							role="status"
							aria-live="polite"
						>
							<span>ℹ️ {info}</span>
							<button
								onClick={() => setInfo('')}
								style={{
									border: 'none',
									background: 'transparent',
									cursor: 'pointer',
									color: 'inherit',
									fontWeight: 800,
									fontSize: '18px',
									padding: '4px',
								}}
								aria-label="Dismiss info"
							>
								×
							</button>
						</div>
					)}

					{!error && !info && (
						<button
							onClick={loadStats}
							disabled={loading}
							style={{
								padding: '10px 16px',
								borderRadius: 8,
								border: '1px solid #d1d5db',
								background: '#ffffff',
								cursor: loading ? 'not-allowed' : 'pointer',
								fontWeight: 600,
								color: '#374151',
								fontSize: '14px',
								boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
								opacity: loading ? 0.7 : 1,
							}}
						>
							{loading ? '⏳ Loading...' : '🔄 Refresh Stats'}
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
				aria-busy={loading ? 'true' : 'false'}
			>
				{statCards.map(card => (
					<StatCard key={card.label} {...card} loading={loading} />
				))}
			</div>

			{/* Quick Access */}
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
					How to Take an Exam
				</h2>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
						gap: 16,
					}}
				>
					<div
						style={{
							padding: '20px',
							background: '#f8fafc',
							borderRadius: 12,
							border: '1px solid #e2e8f0',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '24px', marginBottom: 8 }}>🔍</div>
						<div style={{ fontWeight: 600, color: '#374151' }}>1. Get Search ID</div>
						<div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
							Obtain exam search ID from your instructor
						</div>
					</div>

					<div
						style={{
							padding: '20px',
							background: '#f8fafc',
							borderRadius: 12,
							border: '1px solid #e2e8f0',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '24px', marginBottom: 8 }}>📝</div>
						<div style={{ fontWeight: 600, color: '#374151' }}>2. Find & Start</div>
						<div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
							Enter search ID in Exams section to begin
						</div>
					</div>

					<div
						style={{
							padding: '20px',
							background: '#f8fafc',
							borderRadius: 12,
							border: '1px solid #e2e8f0',
							textAlign: 'center',
						}}
					>
						<div style={{ fontSize: '24px', marginBottom: 8 }}>📊</div>
						<div style={{ fontWeight: 600, color: '#374151' }}>3. View Results</div>
						<div style={{ fontSize: '12px', color: '#6b7280', marginTop: 4 }}>
							Check your scores and feedback after evaluation
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default StudentHome;
