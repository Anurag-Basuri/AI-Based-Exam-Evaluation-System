import React from 'react';
import {
	safeApiCall,
	getTeacherIssues,
	resolveTeacherIssue,
} from '../../services/teacherServices.js';

const statusStyles = {
	open: { label: 'Open', color: '#b45309', bg: 'var(--surface)', border: 'var(--border)' },
	'in-progress': {
		label: 'In Progress',
		color: '#4338ca',
		bg: 'var(--surface)',
		border: 'var(--border)',
	},
	resolved: {
		label: 'Resolved',
		color: '#047857',
		bg: 'var(--surface)',
		border: 'var(--border)',
	},
};

const useIssues = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [issues, setIssues] = React.useState([]);

	const load = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getTeacherIssues);
			setIssues(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load issues');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		load();
	}, [load]);

	return { loading, error, issues, setIssues, reload: load };
};

const TeacherIssues = () => {
	const { loading, error, issues, reload } = useIssues();
	const [status, setStatus] = React.useState('all');
	const [query, setQuery] = React.useState('');
	const [activeReply, setActiveReply] = React.useState({
		id: '',
		message: '',
		submitting: false,
	});
	const [msg, setMsg] = React.useState('');

	const filtered = issues.filter(issue => {
		const st = (issue.status || '').toLowerCase();
		const statusMatch = status === 'all' ? true : st === status;
		const q = query.trim().toLowerCase();
		const text =
			`${issue.studentName || ''} ${issue.examTitle || ''} ${issue.issueType || ''}`.toLowerCase();
		const queryMatch = !q || text.includes(q);
		return statusMatch && queryMatch;
	});

	const handleResolve = async issueId => {
		if (!activeReply.message.trim()) return;
		setActiveReply(prev => ({ ...prev, submitting: true }));
		setMsg('');
		try {
			await safeApiCall(resolveTeacherIssue, issueId, { reply: activeReply.message.trim() });
			await reload();
			setActiveReply({ id: '', message: '', submitting: false });
			setMsg('Issue resolved and reply sent to student.');
		} catch (e) {
			setMsg(e?.message || 'Could not resolve issue');
			setActiveReply(prev => ({ ...prev, submitting: false }));
		}
	};

	return (
		<section style={{ color: 'var(--text)' }}>
			<header
				style={{
					background:
						'linear-gradient(135deg, color-mix(in srgb, #f97316 12%, transparent), color-mix(in srgb, #3b82f6 6%, transparent))',
					padding: 20,
					borderRadius: 18,
					border: '1px solid var(--border)',
					boxShadow: 'var(--shadow-md)',
					marginBottom: 18,
				}}
			>
				<h1 style={{ margin: 0, color: 'var(--text)' }}>Student Issues</h1>
				<p style={{ margin: '8px 0 0', color: 'var(--text-muted)' }}>
					Review, filter, and resolve student-reported issues quickly.
				</p>
			</header>

			{msg && (
				<div
					role="status"
					aria-live="polite"
					style={{
						marginBottom: 12,
						padding: '10px 12px',
						borderRadius: 10,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						fontWeight: 600,
					}}
				>
					{msg}
				</div>
			)}

			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
					marginBottom: 16,
					alignItems: 'center',
				}}
			>
				<div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder="Search by student, exam, or type"
						style={{
							width: '100%',
							padding: '10px 14px 10px 40px',
							borderRadius: 12,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							outline: 'none',
						}}
					/>
					<span
						aria-hidden
						style={{
							position: 'absolute',
							left: 12,
							top: '50%',
							transform: 'translateY(-50%)',
							color: 'var(--text-muted)',
						}}
					>
						🔎
					</span>
				</div>

				<div style={{ display: 'flex', gap: 8 }}>
					{['all', 'open', 'in-progress', 'resolved'].map(st => {
						const active = status === st;
						return (
							<button
								key={st}
								onClick={() => setStatus(st)}
								style={{
									padding: '8px 12px',
									borderRadius: 999,
									border: active
										? '2px solid #f97316'
										: '1px solid var(--border)',
									background: 'var(--surface)',
									color: active ? '#9a3412' : 'var(--text)',
									cursor: 'pointer',
									fontWeight: 700,
								}}
							>
								{st[0].toUpperCase() + st.slice(1)}
							</button>
						);
					})}
				</div>
			</div>

			{loading && (
				<div style={{ color: 'var(--text-muted)' }} aria-live="polite">
					Loading student issues…
				</div>
			)}
			{!loading && error && (
				<div style={{ color: '#ef4444', marginBottom: 12 }} role="alert">
					❌ {error}
				</div>
			)}
			{!loading && !filtered.length && (
				<div
					style={{
						padding: 20,
						borderRadius: 16,
						border: '1px dashed var(--border)',
						textAlign: 'center',
						color: 'var(--text-muted)',
						background: 'var(--surface)',
					}}
				>
					No issues match your filters.
				</div>
			)}

			<div style={{ display: 'grid', gap: 16 }} aria-busy={loading ? 'true' : 'false'}>
				{filtered.map(issue => {
					const chip =
						statusStyles[(issue.status || '').toLowerCase()] ?? statusStyles.open;
					const replying = activeReply.id === issue.id;
					return (
						<article
							key={issue.id}
							style={{
								background: 'var(--surface)',
								borderRadius: 18,
								border: '1px solid var(--border)',
								boxShadow: 'var(--shadow-md)',
								padding: 20,
								display: 'grid',
								gap: 12,
							}}
						>
							<header
								style={{
									display: 'flex',
									flexWrap: 'wrap',
									justifyContent: 'space-between',
									gap: 12,
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
										{issue.examTitle}
									</h2>
									<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
										From {issue.studentName} • {issue.createdAt}
									</div>
								</div>
								<span
									style={{
										alignSelf: 'flex-start',
										fontSize: 12,
										padding: '3px 10px',
										borderRadius: 999,
										border: `1px solid ${chip.border}`,
										background: 'var(--surface)',
										color: chip.color,
										fontWeight: 700,
									}}
								>
									{chip.label}
								</span>
							</header>

							<div
								style={{
									background: 'var(--surface)',
									borderRadius: 14,
									padding: 16,
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
										background: 'var(--surface)',
										borderRadius: 14,
										padding: 16,
										border: '1px solid var(--border)',
										color: 'var(--text)',
									}}
								>
									<strong
										style={{
											display: 'block',
											marginBottom: 6,
											color: 'var(--text)',
										}}
									>
										Your reply
									</strong>
									{issue.reply}
									{issue.resolvedAt && (
										<div
											style={{
												marginTop: 6,
												fontSize: 12,
												color: 'var(--text-muted)',
											}}
										>
											Resolved on {issue.resolvedAt}
										</div>
									)}
								</div>
							) : replying ? (
								<form
									onSubmit={e => {
										e.preventDefault();
										handleResolve(issue.id);
									}}
									style={{
										display: 'grid',
										gap: 10,
										background: 'var(--surface)',
										padding: 16,
										borderRadius: 14,
										border: '1px solid var(--border)',
									}}
								>
									<textarea
										value={activeReply.message}
										onChange={e =>
											setActiveReply(prev => ({
												...prev,
												message: e.target.value,
											}))
										}
										placeholder="Compose a detailed response for the student…"
										rows={3}
										required
										style={{
											borderRadius: 10,
											border: '1px solid var(--border)',
											padding: '10px 12px',
											outline: 'none',
											background: 'var(--bg)',
											color: 'var(--text)',
											resize: 'vertical',
										}}
									/>
									<div
										style={{
											display: 'flex',
											justifyContent: 'flex-end',
											gap: 8,
										}}
									>
										<button
											type="button"
											onClick={() =>
												setActiveReply({
													id: '',
													message: '',
													submitting: false,
												})
											}
											style={{
												padding: '8px 12px',
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
											disabled={activeReply.submitting}
											style={{
												padding: '8px 12px',
												borderRadius: 10,
												border: 'none',
												background:
													'linear-gradient(135deg, #f97316, #ea580c)',
												color: '#ffffff',
												cursor: activeReply.submitting
													? 'not-allowed'
													: 'pointer',
												fontWeight: 700,
												opacity: activeReply.submitting ? 0.7 : 1,
												boxShadow: '0 10px 20px rgba(249,115,22,0.25)',
											}}
										>
											{activeReply.submitting ? 'Submitting…' : 'Send reply'}
										</button>
									</div>
								</form>
							) : (
								<button
									onClick={() =>
										setActiveReply({
											id: issue.id,
											message: '',
											submitting: false,
										})
									}
									style={{
										alignSelf: 'flex-start',
										padding: '8px 12px',
										borderRadius: 10,
										border: '1px solid var(--border)',
										background: 'var(--surface)',
										color: 'var(--text)',
										cursor: 'pointer',
										fontWeight: 700,
									}}
								>
									Reply & resolve
								</button>
							)}
						</article>
					);
				})}
			</div>
		</section>
	);
};

export default TeacherIssues;
