import React from 'react';
import { safeApiCall, getStudentIssues, createStudentIssue } from '../../services/apiServices.js';

const statusStyles = {
	open: { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', label: 'Open' },
	pending: { bg: '#eef2ff', border: '#c7d2fe', color: '#3730a3', label: 'Pending' },
	resolved: { bg: '#ecfdf5', border: '#a7f3d0', color: '#065f46', label: 'Resolved' },
};

const useIssues = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [issues, setIssues] = React.useState([]);

	const load = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getStudentIssues);
			setIssues(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e.message || 'Failed to load issues');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		load();
	}, [load]);

	return { loading, error, issues, reload: load };
};

const StudentIssues = () => {
	const { loading, error, issues, reload } = useIssues();
	const [showForm, setShowForm] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [form, setForm] = React.useState({ exam: '', issueType: '', description: '' });

	const handleSubmit = async e => {
		e.preventDefault();
		if (!form.exam || !form.issueType || !form.description) return;

		// If your server expects ObjectId for exam
		const looksLikeId = /^[a-f\d]{24}$/i.test(form.exam);
		if (!looksLikeId) {
			alert('Please enter a valid Exam ID (24-character hex).');
			return;
		}

		setSaving(true);
		try {
			await safeApiCall(createStudentIssue, {
				exam: form.exam,
				issueType: form.issueType, // e.g., 'evaluation' | 'question'
				description: form.description,
			});
			await reload();
			setForm({ exam: '', issueType: '', description: '' });
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
						Raise concerns about exam sessions or evaluations. We respond promptly.
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
							value={form.exam}
							onChange={e => setForm(s => ({ ...s, exam: e.target.value }))}
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
							placeholder="Describe the problem with details so we can assist quickly."
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
			{!loading && error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
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
					No issues yet. Everything looks good!
				</div>
			)}

			<div style={{ display: 'grid', gap: 16 }}>
				{issues.map(issue => {
					const chip = statusStyles[issue.status] ?? statusStyles.open;
					return (
						<article
							key={issue._id || issue.id}
							style={{
								background: 'var(--surface)',
								borderRadius: 16,
								border: '1px solid var(--border)',
								boxShadow: '0 12px 26px rgba(15,23,42,0.07)',
								padding: 18,
								display: 'grid',
								gap: 12,
							}}
						>
							<header
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									gap: 10,
									justifyContent: 'space-between',
								}}
							>
								<div>
									<h2
										style={{
											margin: 0,
											fontSize: '1.05rem',
											color: 'var(--text)',
										}}
									>
										{issue.examTitle || 'Exam'}
									</h2>
									<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
										{issue.createdAt
											? `Submitted on ${new Date(issue.createdAt).toLocaleString()}`
											: ''}
									</div>
								</div>
								<span
									style={{
										alignSelf: 'flex-start',
										fontSize: 12,
										padding: '3px 10px',
										borderRadius: 999,
										border: `1px solid ${chip.border}`,
										background: chip.bg,
										color: chip.color,
										fontWeight: 700,
									}}
								>
									{chip.label}
								</span>
							</header>

							<div
								style={{
									background: 'var(--elev)',
									borderRadius: 12,
									padding: 14,
									border: '1px solid var(--border)',
								}}
							>
								<div
									style={{
										fontWeight: 700,
										marginBottom: 6,
										color: 'var(--text)',
									}}
								>
									{issue.issueType} Issue
								</div>
								<p
									style={{
										margin: 0,
										color: 'var(--text-muted)',
										lineHeight: 1.6,
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
										padding: 14,
										border: '1px solid #6ee7b7',
										color: '#047857',
									}}
								>
									<strong style={{ display: 'block', marginBottom: 6 }}>
										Teacher reply
									</strong>
									{issue.reply}
									{issue.resolvedAt && (
										<div
											style={{ marginTop: 6, fontSize: 12, color: '#0f766e' }}
										>
											Resolved on{' '}
											{new Date(issue.resolvedAt).toLocaleString()}
										</div>
									)}
								</div>
							) : (
								<div style={{ color: '#a16207', fontSize: 13 }}>
									Awaiting teacher response.
								</div>
							)}
						</article>
					);
				})}
			</div>
		</section>
	);
};

export default StudentIssues;
