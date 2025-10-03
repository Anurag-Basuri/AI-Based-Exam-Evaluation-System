import React from 'react';
import {
    // safeApiCall,
    // getTeacherSubmissions,
    // evaluateTeacherSubmission,
} from '../../services/apiServices.js';
import {
  safeApiCall,
  getTeacherSubmissions,
  evaluateTeacherSubmission,
} from '../../services/teacherServices.js';

const statusMap = {
	pending: { bg: '#fff7ed', border: '#fcd34d', color: '#92400e', label: 'Pending' },
	evaluated: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', label: 'Evaluated' },
	flagged: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', label: 'Flagged' },
};

const useSubmissions = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [submissions, setSubmissions] = React.useState([]);

	const load = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getTeacherSubmissions);
			setSubmissions(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load submissions');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		load();
	}, [load]);

	return { loading, error, submissions, setSubmissions, reload: load };
};

const TeacherResults = () => {
	const { loading, error, submissions, setSubmissions, reload } = useSubmissions();
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all');
	const [msg, setMsg] = React.useState('');
	const [evaluatingId, setEvaluatingId] = React.useState('');

	const q = query.toLowerCase();
	const filtered = submissions.filter(sub => {
		const statusMatch = status === 'all' ? true : sub.status === status;
		const queryMatch =
			!q ||
			sub.examTitle.toLowerCase().includes(q) ||
			sub.studentName.toLowerCase().includes(q);
		return statusMatch && queryMatch;
	});

	const handleEvaluate = async submission => {
		const { id, examTitle, studentName } = submission;
		setEvaluatingId(id);
		setMsg('');
		try {
			await safeApiCall(evaluateTeacherSubmission, id);
			setSubmissions(prev =>
				prev.map(item =>
					item.id === id
						? {
								...item,
								status: 'evaluated',
								score: item.score ?? Math.round((item.maxScore || 100) * 0.75),
							}
						: item,
				),
			);
			setMsg(`Auto-evaluation triggered for ${studentName} (${examTitle}).`);
		} catch (e) {
			setMsg(e?.message || 'Failed to trigger evaluation');
		} finally {
			setEvaluatingId('');
		}
	};

	const handleGrade = submission => {
		setMsg(
			`Open grading panel for ${submission.studentName} – ${submission.examTitle} (to be implemented).`,
		);
	};

	return (
		<section>
			<header
				style={{
					background:
						'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.05))',
					padding: 20,
					borderRadius: 18,
					border: '1px solid rgba(99,102,241,0.2)',
					boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
					marginBottom: 18,
				}}
			>
				<h1 style={{ margin: 0 }}>Exam Submissions</h1>
				<p style={{ margin: '8px 0 0', color: '#475569' }}>
					Manage grading, trigger auto-evaluation, and monitor flagged submissions.
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
						border: '1px solid #c7d2fe',
						background: '#eef2ff',
						color: '#3730a3',
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
				<div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder="Search by student or exam"
						style={{
							width: '100%',
							padding: '10px 14px 10px 40px',
							borderRadius: 12,
							border: '1px solid #cbd5e1',
							background: '#ffffff',
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
							color: '#94a3b8',
						}}
					>
						🔎
					</span>
				</div>

				<div style={{ display: 'flex', gap: 8 }}>
					{['all', 'evaluated', 'pending', 'flagged'].map(st => {
						const active = status === st;
						return (
							<button
								key={st}
								onClick={() => setStatus(st)}
								style={{
									padding: '8px 12px',
									borderRadius: 999,
									border: active ? '1px solid #6366f1' : '1px solid #cbd5e1',
									background: active ? '#eef2ff' : '#ffffff',
									color: active ? '#4338ca' : '#334155',
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

			{loading && <div style={{ color: '#475569' }} aria-live="polite">Loading submissions…</div>}
            {!loading && error && <div style={{ color: '#b91c1c', marginBottom: 12 }} role="alert">{error}</div>}
			{!loading && !filtered.length && (
				<div
					style={{
						padding: 20,
						borderRadius: 16,
						border: '1px dashed #cbd5e1',
						textAlign: 'center',
						color: '#64748b',
					}}
				>
					No submissions match your filters.
				</div>
			)}

			<div style={{ display: 'grid', gap: 16 }} aria-busy={loading ? 'true' : 'false'}>
				{filtered.map(sub => {
					const chip = statusMap[sub.status] ?? statusMap.pending;
					const isEvaluating = evaluatingId === sub.id;
					return (
						<article
							key={sub.id}
							style={{
								background: '#ffffff',
								borderRadius: 18,
								border: '1px solid #e2e8f0',
								boxShadow: '0 12px 26px rgba(15,23,42,0.07)',
								padding: 20,
								display: 'grid',
								gridTemplateColumns: '1fr minmax(160px, 220px)',
								gap: 18,
								alignItems: 'start',
							}}
						>
							<div>
								<header
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 10,
										marginBottom: 10,
									}}
								>
									<h2 style={{ margin: 0, fontSize: '1.05rem' }}>
										{sub.examTitle}
									</h2>
									<span
										style={{
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
								<div style={{ color: '#475569', fontSize: 14, marginBottom: 6 }}>
									Student: <strong>{sub.studentName}</strong>
								</div>
								<div style={{ color: '#475569', fontSize: 13, marginBottom: 12 }}>
									Submitted at {sub.submittedAt}
								</div>
								<div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
									{sub.score != null ? (
										<>
											<span
												style={{
													fontSize: 28,
													fontWeight: 800,
													color: '#0f172a',
												}}
											>
												{sub.score}
											</span>
											<span
												style={{
													fontSize: 16,
													fontWeight: 600,
													color: '#64748b',
												}}
											>
												/{sub.maxScore}
											</span>
										</>
									) : (
										<span
											style={{
												fontSize: 16,
												fontWeight: 600,
												color: '#9a3412',
											}}
										>
											Pending grading
										</span>
									)}
								</div>
							</div>

							<div
								style={{
									background: '#f8fafc',
									borderRadius: 14,
									padding: 16,
									border: '1px solid #e2e8f0',
									display: 'grid',
									gap: 10,
								}}
							>
								<button
									onClick={() => handleGrade(sub)}
									style={{
										padding: '10px 12px',
										borderRadius: 10,
										border: 'none',
										background: '#6366f1',
										color: '#ffffff',
										cursor: 'pointer',
										fontWeight: 700,
										boxShadow: '0 12px 22px rgba(99,102,241,0.25)',
									}}
								>
									Open grading
								</button>
								<button
									onClick={() => handleEvaluate(sub)}
									disabled={isEvaluating}
									style={{
										padding: '10px 12px',
										borderRadius: 10,
										border: '1px solid #cbd5e1',
										background: '#ffffff',
										color: '#4338ca',
										cursor: isEvaluating ? 'not-allowed' : 'pointer',
										fontWeight: 700,
										opacity: isEvaluating ? 0.7 : 1,
									}}
								>
									{isEvaluating ? 'Evaluating…' : 'Auto evaluate'}
								</button>
								<button
									onClick={reload}
									style={{
										padding: '10px 12px',
										borderRadius: 10,
										border: '1px solid #e2e8f0',
										background: '#f1f5f9',
										color: '#1e293b',
										cursor: 'pointer',
										fontWeight: 700,
									}}
								>
									Refresh list
								</button>
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
};

export default TeacherResults;
