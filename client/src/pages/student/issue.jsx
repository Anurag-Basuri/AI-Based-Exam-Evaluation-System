import React from 'react';
import {
	safeApiCall,
	getMyIssues,
	createIssue,
	getMySubmissionsForIssues,
} from '../../services/studentServices.js';

const statusStyles = {
	open: { bg: '#fffbeb', border: '#fde68a', color: '#b45309', label: 'Open', icon: '🔴' },
	'in-progress': {
		bg: '#eef2ff',
		border: '#c7d2fe',
		color: '#3730a3',
		label: 'In Progress',
		icon: '🟡',
	},
	resolved: { bg: '#f0fdf4', border: '#bbf7d0', color: '#15803d', label: 'Resolved', icon: '🟢' },
};

const IssueCard = ({ issue }) => {
	const config = statusStyles[issue.status] || statusStyles.open;

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: '24px',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease',
			}}
		>
			<header style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						marginBottom: '8px',
					}}
				>
					<h3
						style={{
							margin: 0,
							fontSize: '18px',
							fontWeight: 700,
							color: 'var(--text)',
							flex: 1,
						}}
					>
						{issue.examTitle}
					</h3>
					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							fontSize: '12px',
							padding: '6px 12px',
							borderRadius: '20px',
							border: `1px solid ${config.border}`,
							background: config.bg,
							color: config.color,
							fontWeight: 700,
						}}
					>
						<span>{config.icon}</span>
						{config.label}
					</span>
				</div>

				<div
					style={{
						display: 'flex',
						gap: '16px',
						color: 'var(--text-muted)',
						fontSize: '13px',
					}}
				>
					<div>
						<strong style={{ color: 'var(--text)' }}>Type:</strong> {issue.issueType}
					</div>
					{issue.createdAt && (
						<div>
							<strong style={{ color: 'var(--text)' }}>Created:</strong>{' '}
							{issue.createdAt}
						</div>
					)}
				</div>
			</header>

			<div
				style={{
					background: 'var(--bg)',
					borderRadius: 12,
					padding: '16px',
					border: '1px solid var(--border)',
					marginBottom: '16px',
				}}
			>
				<div
					style={{
						fontWeight: 600,
						color: 'var(--text)',
						marginBottom: '8px',
						fontSize: '14px',
					}}
				>
					Issue Description
				</div>
				<p
					style={{
						margin: 0,
						color: 'var(--text-muted)',
						lineHeight: 1.5,
						fontSize: '14px',
					}}
				>
					{issue.description}
				</p>
			</div>

			{issue.reply ? (
				<div
					style={{
						background: statusStyles.resolved.bg,
						borderRadius: 12,
						padding: '16px',
						border: `1px solid ${statusStyles.resolved.border}`,
					}}
				>
					<div
						style={{
							fontWeight: 600,
							color: statusStyles.resolved.color,
							marginBottom: '8px',
							fontSize: '14px',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
						}}
					>
						👨‍🏫 Teacher Response
					</div>
					<p
						style={{
							margin: 0,
							color: statusStyles.resolved.color,
							lineHeight: 1.5,
							fontSize: '14px',
						}}
					>
						{issue.reply}
					</p>
					{issue.resolvedAt && (
						<div
							style={{
								marginTop: '8px',
								fontSize: '12px',
								color: statusStyles.resolved.color,
								fontWeight: 500,
							}}
						>
							Resolved on {issue.resolvedAt}
						</div>
					)}
				</div>
			) : (
				<div
					style={{
						color: config.color,
						fontSize: '14px',
						fontWeight: 500,
						textAlign: 'center',
						padding: '12px',
						background: config.bg,
						borderRadius: 8,
						border: `1px solid ${config.border}`,
					}}
				>
					{issue.status === 'in-progress'
						? '⏳ A teacher is looking into your issue.'
						: '⏳ Awaiting teacher response.'}
				</div>
			)}
		</article>
	);
};

const StudentIssues = () => {
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [issues, setIssues] = React.useState([]);
	const [showForm, setShowForm] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState('');
	const [submissions, setSubmissions] = React.useState([]);
	const [form, setForm] = React.useState({
		submissionId: '',
		issueType: 'evaluation',
		description: '',
	});

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const [issuesData, submissionsData] = await Promise.all([
				safeApiCall(getMyIssues),
				safeApiCall(getMySubmissionsForIssues),
			]);
			setIssues(Array.isArray(issuesData) ? issuesData : []);
			setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
		} catch (e) {
			setError(e?.message || 'Failed to load data');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	const handleSubmit = async e => {
		e.preventDefault();
		if (!form.submissionId || !form.issueType || !form.description) return;

		setSaving(true);
		setError('');
		setMessage('');
		try {
			await safeApiCall(createIssue, form);
			await loadData(); // Reload everything
			setForm({ submissionId: '', issueType: 'evaluation', description: '' });
			setShowForm(false);
			setMessage('Your issue has been submitted successfully!');
		} catch (e) {
			setError(e.message || 'Could not submit issue');
		} finally {
			setSaving(false);
		}
	};

	return (
		<section style={{ color: 'var(--text)' }}>
			<header
				style={{
					background:
						'linear-gradient(135deg, color-mix(in srgb, #f97316 18%, transparent), color-mix(in srgb, #f97316 6%, transparent))',
					padding: '24px',
					borderRadius: 16,
					border: '1px solid color-mix(in srgb, #f97316 20%, transparent)',
					boxShadow: 'var(--shadow-md)',
					marginBottom: '24px',
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: '24px' }}>Support & Issues</h1>
					<p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
						Raise concerns about exam sessions or evaluations.
					</p>
				</div>
				<button
					onClick={() => setShowForm(s => !s)}
					style={{
						padding: '10px 16px',
						borderRadius: 12,
						border: 'none',
						background: 'linear-gradient(135deg, #f97316, #ea580c)',
						color: '#ffffff',
						fontWeight: 700,
						cursor: 'pointer',
						boxShadow: '0 10px 22px rgba(249, 115, 22, 0.25)',
					}}
				>
					{showForm ? 'Close Form' : '➕ Create New Issue'}
				</button>
			</header>

			{message && (
				<div
					style={{
						padding: '14px',
						borderRadius: 12,
						background: statusStyles.resolved.bg,
						border: `1px solid ${statusStyles.resolved.border}`,
						color: statusStyles.resolved.color,
						fontWeight: 600,
						marginBottom: '16px',
					}}
				>
					{message}
				</div>
			)}
			{error && (
				<div
					style={{
						padding: '14px',
						borderRadius: 12,
						background: '#fee2e2',
						border: '1px solid #fca5a5',
						color: '#991b1b',
						fontWeight: 600,
						marginBottom: '16px',
					}}
				>
					❌ {error}
				</div>
			)}

			{showForm && (
				<form
					onSubmit={handleSubmit}
					style={{
						background: 'var(--surface)',
						borderRadius: 16,
						border: '1px solid var(--border)',
						boxShadow: 'var(--shadow-lg)',
						padding: '24px',
						marginBottom: '24px',
						display: 'grid',
						gap: '16px',
					}}
				>
					<div style={{ display: 'grid', gap: 8 }}>
						<label style={{ fontWeight: 700, color: 'var(--text)' }}>
							Related Exam
						</label>
						<select
							value={form.submissionId}
							onChange={e => setForm(s => ({ ...s, submissionId: e.target.value }))}
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								outline: 'none',
							}}
							required
						>
							<option value="">Select an exam submission</option>
							{submissions.map(s => (
								<option key={s.id} value={s.id}>
									{s.label}
								</option>
							))}
						</select>
					</div>

					<div style={{ display: 'grid', gap: 8 }}>
						<label style={{ fontWeight: 700, color: 'var(--text)' }}>Issue Type</label>
						<select
							value={form.issueType}
							onChange={e => setForm(s => ({ ...s, issueType: e.target.value }))}
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								outline: 'none',
							}}
							required
						>
							<option value="evaluation">Evaluation/Grading Issue</option>
							<option value="question">Problem with a Question</option>
							<option value="technical">Technical Problem</option>
							<option value="other">Other</option>
						</select>
					</div>

					<div style={{ display: 'grid', gap: 8 }}>
						<label style={{ fontWeight: 700, color: 'var(--text)' }}>Description</label>
						<textarea
							value={form.description}
							onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
							placeholder="Please describe the problem in detail."
							rows={5}
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								outline: 'none',
								resize: 'vertical',
							}}
							required
						/>
					</div>

					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							gap: 10,
							marginTop: '8px',
						}}
					>
						<button
							type="button"
							onClick={() => setShowForm(false)}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								cursor: 'pointer',
								fontWeight: 700,
							}}
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: 'none',
								background: 'linear-gradient(135deg, #f97316, #ea580c)',
								color: '#ffffff',
								cursor: 'pointer',
								fontWeight: 700,
								boxShadow: '0 10px 20px rgba(249, 115, 22, 0.25)',
								opacity: saving ? 0.7 : 1,
							}}
						>
							{saving ? 'Submitting…' : 'Submit Issue'}
						</button>
					</div>
				</form>
			)}

			{loading && (
				<div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
					Loading your issues…
				</div>
			)}

			{!loading && !issues.length && (
				<div
					style={{
						padding: '40px',
						borderRadius: 16,
						border: '2px dashed var(--border)',
						textAlign: 'center',
						color: 'var(--text-muted)',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
					<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>No Issues Found</h3>
					<p style={{ margin: 0 }}>
						You haven't created any issues yet. Use the button above to create one.
					</p>
				</div>
			)}

			{!loading && issues.length > 0 && (
				<div style={{ display: 'grid', gap: '20px' }}>
					{issues.map(issue => (
						<IssueCard key={issue.id} issue={issue} />
					))}
				</div>
			)}
		</section>
	);
};

export default StudentIssues;
