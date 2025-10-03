import React from 'react';
import { safeApiCall, getMyIssues, createIssue } from '../../services/studentServices.js';

const statusStyles = {
	open: { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', label: 'Open', icon: '🔴' },
	pending: { bg: '#eef2ff', border: '#c7d2fe', color: '#3730a3', label: 'Pending', icon: '🟡' },
	resolved: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', label: 'Resolved', icon: '🟢' },
};

const IssueCard = ({ issue }) => {
	const config = statusStyles[issue.status] || statusStyles.open;

	return (
		<article
			style={{
				background: '#ffffff',
				borderRadius: 16,
				border: '1px solid #e5e7eb',
				boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
				padding: '24px',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease',
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'translateY(-2px)';
				e.currentTarget.style.boxShadow = '0 8px 28px rgba(15,23,42,0.12)';
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'translateY(0)';
				e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.06)';
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
							color: '#0f172a',
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
						color: '#64748b',
						fontSize: '13px',
					}}
				>
					<div>
						<strong style={{ color: '#374151' }}>Type:</strong> {issue.issueType}
					</div>
					{issue.createdAt && (
						<div>
							<strong style={{ color: '#374151' }}>Created:</strong> {issue.createdAt}
						</div>
					)}
				</div>
			</header>

			<div
				style={{
					background: '#f8fafc',
					borderRadius: 12,
					padding: '16px',
					border: '1px solid #e2e8f0',
					marginBottom: '16px',
				}}
			>
				<div
					style={{
						fontWeight: 600,
						color: '#374151',
						marginBottom: '8px',
						fontSize: '14px',
					}}
				>
					Issue Description
				</div>
				<p
					style={{
						margin: 0,
						color: '#64748b',
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
						background: '#ecfdf5',
						borderRadius: 12,
						padding: '16px',
						border: '1px solid #6ee7b7',
					}}
				>
					<div
						style={{
							fontWeight: 600,
							color: '#047857',
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
							color: '#065f46',
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
								color: '#047857',
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
						color: '#f59e0b',
						fontSize: '14px',
						fontWeight: 500,
						textAlign: 'center',
						padding: '12px',
						background: '#fffbeb',
						borderRadius: 8,
						border: '1px solid #fed7aa',
					}}
				>
					⏳ Awaiting teacher response
				</div>
			)}
		</article>
	);
};

const StudentIssues = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [issues, setIssues] = React.useState([]);
	const [showForm, setShowForm] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState('');
	const [form, setForm] = React.useState({
		examId: '',
		issueType: '',
		description: '',
	});

	const loadIssues = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getMyIssues);
			setIssues(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load issues');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadIssues();
	}, [loadIssues]);

	const handleSubmit = async e => {
		e.preventDefault();
		if (!form.examId || !form.issueType || !form.description) return;

		const looksLikeId = /^[a-f\d]{24}$/i.test(form.examId);
		if (!looksLikeId) {
			alert('Please enter a valid Exam ID (24-character hex).');
			return;
		}

		setSaving(true);
		try {
			await safeApiCall(createIssue, {
				examId: form.examId,
				issueType: form.issueType,
				description: form.description,
			});
			await loadIssues();
			setForm({ examId: '', issueType: '', description: '' });
			setShowForm(false);
		} catch (e) {
			alert(e.message || 'Could not submit issue');
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
					padding: 18,
					borderRadius: 16,
					border: '1px solid color-mix(in srgb, #f97316 20%, transparent)',
					boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
					marginBottom: 18,
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div>
					<h1 style={{ margin: 0 }}>Support & Issues</h1>
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
						background: 'var(--primary-strong)',
						color: '#ffffff',
						fontWeight: 700,
						cursor: 'pointer',
						boxShadow: '0 10px 22px rgba(99,102,241,0.25)',
					}}
				>
					{showForm ? 'Close' : 'Create issue'}
				</button>
			</header>

			{showForm && (
				<form
					onSubmit={handleSubmit}
					style={{
						background: 'var(--surface)',
						borderRadius: 16,
						border: '1px solid var(--border)',
						boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
						padding: 18,
						marginBottom: 20,
						display: 'grid',
						gap: 14,
					}}
				>
					<div style={{ display: 'grid', gap: 10 }}>
						<label style={{ fontWeight: 700, color: 'var(--text)' }}>Exam ID</label>
						<input
							value={form.examId}
							onChange={e => setForm(s => ({ ...s, examId: e.target.value }))}
							placeholder="24-character exam ObjectId"
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								outline: 'none',
							}}
							required
						/>
					</div>

					<div style={{ display: 'grid', gap: 10 }}>
						<label style={{ fontWeight: 700, color: 'var(--text)' }}>Issue type</label>
						<select
							value={form.issueType}
							onChange={e => setForm(s => ({ ...s, issueType: e.target.value }))}
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								outline: 'none',
							}}
							required
						>
							<option value="">Select</option>
							<option value="evaluation">Evaluation issue</option>
							<option value="question">Question issue</option>
						</select>
					</div>

					<div style={{ display: 'grid', gap: 10 }}>
						<label style={{ fontWeight: 700, color: 'var(--text)' }}>Description</label>
						<textarea
							value={form.description}
							onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
							placeholder="Describe the problem"
							rows={4}
							style={{
								padding: '10px 12px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								outline: 'none',
								resize: 'vertical',
							}}
							required
						/>
					</div>

					<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
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
								background: 'var(--primary-strong)',
								color: '#ffffff',
								cursor: 'pointer',
								fontWeight: 700,
								boxShadow: '0 10px 20px rgba(99,102,241,0.25)',
								opacity: saving ? 0.7 : 1,
							}}
						>
							{saving ? 'Submitting…' : 'Submit issue'}
						</button>
					</div>
				</form>
			)}

			{loading && <div style={{ color: 'var(--text-muted)' }}>Loading your issues…</div>}
			{error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
			{!loading && !issues.length && (
				<div
					style={{
						padding: 20,
						borderRadius: 16,
						border: '1px dashed var(--border)',
						textAlign: 'center',
						color: 'var(--text-muted)',
					}}
				>
					No issues yet.
				</div>
			)}

			<div style={{ display: 'grid', gap: 16 }}>
				{issues.map(issue => (
					<IssueCard key={issue._id || issue.id} issue={issue} />
				))}
			</div>
		</section>
	);
};

export default StudentIssues;
