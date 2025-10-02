import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
	safeApiCall,
	getTeacherExams,
	getTeacherIssues,
	getTeacherSubmissions,
} from '../../services/apiServices.js';

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
	const [err, setErr] = React.useState('');

	React.useEffect(() => {
		let alive = true;
		(async () => {
			setLoading(true);
			setErr('');
			try {
				const [exams, issues, subs] = await Promise.all([
					safeApiCall(getTeacherExams),
					safeApiCall(getTeacherIssues),
					safeApiCall(getTeacherSubmissions), // no examId → aggregate if supported
				]);
				const live = exams.filter(e => e.status === 'live').length;
				const scheduled = exams.filter(e => e.status === 'scheduled').length;
				const draft = exams.filter(e => e.status === 'draft').length;
				const pendingSubs = subs.filter(s => s.status === 'pending').length;
				const openIssues = issues.filter(
					i => i.status === 'open' || i.status === 'pending',
				).length;
				if (alive) setStats({ live, scheduled, draft, pendingSubs, openIssues });
			} catch (e) {
				if (alive) setErr(e.message || 'Failed to load overview');
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, []);

	const insightCards = [
		{ label: 'Live exams', value: stats.live, tone: '🟢' },
		{ label: 'Scheduled', value: stats.scheduled, tone: '🟦' },
		{ label: 'Drafts', value: stats.draft, tone: '🟤' },
		{ label: 'Pending submissions', value: stats.pendingSubs, tone: '🟠' },
		{ label: 'Open issues', value: stats.openIssues, tone: '🟥' },
	];

	const quick = [
		{ label: 'Manage exams', icon: '📝', onClick: () => navigate('exams') },
		{ label: 'Review submissions', icon: '📊', onClick: () => navigate('results') },
		{ label: 'Handle issues', icon: '🛠️', onClick: () => navigate('issues') },
		{ label: 'Settings', icon: '⚙️', onClick: () => navigate('settings') },
	];

	return (
		<section>
			<div
				style={{
					display: 'grid',
					gap: 18,
					marginBottom: 20,
					background:
						'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12))',
					padding: 22,
					borderRadius: 18,
					boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
					border: '1px solid rgba(59,130,246,0.15)',
				}}
			>
				<div>
					<h1 style={{ margin: 0 }}>Welcome back, {name}</h1>
					<p style={{ margin: '8px 0 0', color: '#1e293b', fontSize: 15 }}>
						Create, schedule, and evaluate exams from one place.
					</p>
				</div>
				<div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
					{quick.map(link => (
						<button
							key={link.label}
							onClick={link.onClick}
							style={{
								flex: '1 1 180px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: 10,
								padding: '12px 16px',
								borderRadius: 12,
								border: 'none',
								background: '#0ea5e9',
								color: '#ffffff',
								cursor: 'pointer',
								fontWeight: 700,
								boxShadow: '0 14px 28px rgba(14,165,233,0.26)',
							}}
						>
							<span aria-hidden>{link.icon}</span>
							{link.label}
						</button>
					))}
				</div>
				{err && <div style={{ color: '#b91c1c' }}>{err}</div>}
			</div>

			<div
				style={{
					display: 'grid',
					gap: 14,
					gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
				}}
			>
				{insightCards.map(card => (
					<div
						key={card.label}
						style={{
							background: '#ffffff',
							borderRadius: 16,
							padding: 18,
							border: '1px solid #e2e8f0',
							boxShadow: '0 12px 28px rgba(15,23,42,0.06)',
							display: 'grid',
							gap: 10,
						}}
					>
						<div
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 10,
								color: '#64748b',
							}}
						>
							<span aria-hidden>{card.tone}</span>
							{card.label}
						</div>
						<div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a' }}>
							{loading ? '…' : card.value}
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default TeacherHome;
