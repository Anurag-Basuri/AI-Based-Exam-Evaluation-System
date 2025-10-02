import React from 'react';
import { safeApiCall, getTeacherExams } from '../../services/apiServices.js';

const statusChip = {
	live: { bg: '#dcfce7', border: '#86efac', color: '#15803d', label: 'Live' },
	scheduled: { bg: '#e0f2fe', border: '#bae6fd', color: '#0369a1', label: 'Scheduled' },
	draft: { bg: '#f3f4f6', border: '#e5e7eb', color: '#475569', label: 'Draft' },
	completed: { bg: '#ede9fe', border: '#ddd6fe', color: '#6d28d9', label: 'Completed' },
};

const useTeacherExams = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [exams, setExams] = React.useState([]);

	React.useEffect(() => {
		let mounted = true;
		const load = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await safeApiCall(getTeacherExams);
				if (mounted) setExams(Array.isArray(data) ? data : []);
			} catch (e) {
				if (mounted) setError(e?.message || 'Failed to load exams');
			} finally {
				if (mounted) setLoading(false);
			}
		};
		load();
		return () => {
			mounted = false;
		};
	}, []);

	return { loading, error, exams, setExams };
};

const TeacherExams = () => {
	const { loading, error, exams, setExams } = useTeacherExams();
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all');

	const filtered = exams.filter(exam => {
		const matchesStatus = status === 'all' ? true : exam.status === status;
		const matchesQuery = !query.trim()
			? true
			: exam.title.toLowerCase().includes(query.trim().toLowerCase());
		return matchesStatus && matchesQuery;
	});

	const handlePublish = examId => {
		setExams(prev =>
			prev.map(ex =>
				ex.id === examId
					? { ...ex, status: 'live', startAt: new Date().toLocaleString() }
					: ex,
			),
		);
		alert('Exam published successfully.');
	};

	const handleClone = exam => {
		const clone = {
			...exam,
			id: `${exam.id}-copy-${Date.now()}`,
			title: `${exam.title} (Copy)`,
			status: 'draft',
			submissions: 0,
			enrolled: 0,
			startAt: '—',
		};
		setExams(prev => [clone, ...prev]);
		alert('Exam duplicated. Adjust details before publishing.');
	};

	return (
		<section>
			<header
				style={{
					background:
						'linear-gradient(135deg, rgba(20,184,166,0.16), rgba(99,102,241,0.08))',
					padding: 20,
					borderRadius: 18,
					border: '1px solid rgba(45,212,191,0.18)',
					boxShadow: '0 16px 32px rgba(15,23,42,0.08)',
					marginBottom: 18,
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div>
					<h1 style={{ margin: 0 }}>Manage Exams</h1>
					<p style={{ margin: '6px 0 0', color: '#0f172a', fontSize: 15 }}>
						Create, schedule, and monitor exams across all classes.
					</p>
				</div>
				<button
					onClick={() => alert('Open create-exam drawer')}
					style={{
						padding: '12px 16px',
						borderRadius: 12,
						border: 'none',
						background: '#14b8a6',
						color: '#ffffff',
						fontWeight: 700,
						cursor: 'pointer',
						boxShadow: '0 14px 28px rgba(20,184,166,0.28)',
					}}
				>
					➕ Create exam
				</button>
			</header>

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
						placeholder="Search exams"
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
					{['all', 'live', 'scheduled', 'draft', 'completed'].map(st => {
						const active = status === st;
						return (
							<button
								key={st}
								onClick={() => setStatus(st)}
								style={{
									padding: '8px 12px',
									borderRadius: 999,
									border: active ? '1px solid #14b8a6' : '1px solid #cbd5e1',
									background: active ? '#ccfbf1' : '#ffffff',
									color: active ? '#0f766e' : '#334155',
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

			{loading && <div style={{ color: '#475569' }}>Loading exams…</div>}
			{!loading && error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
			{!loading && !filtered.length && (
				<div
					style={{
						padding: 22,
						borderRadius: 16,
						border: '1px dashed #cbd5e1',
						textAlign: 'center',
						color: '#64748b',
					}}
				>
					No exams match your filters.
				</div>
			)}

			<div style={{ display: 'grid', gap: 16 }}>
				{filtered.map(exam => {
					const chip = statusChip[exam.status] ?? statusChip.draft;
					return (
						<article
							key={exam.id}
							style={{
								background: '#ffffff',
								borderRadius: 18,
								border: '1px solid #e2e8f0',
								boxShadow: '0 12px 26px rgba(15,23,42,0.08)',
								padding: 20,
								display: 'grid',
								gridTemplateColumns: '1fr minmax(180px, 220px)',
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
									<h2 style={{ margin: 0, fontSize: '1.05rem' }}>{exam.title}</h2>
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
								<div style={{ color: '#475569', fontSize: 14 }}>
									Start: <strong>{exam.startAt}</strong>
								</div>
								<div style={{ color: '#64748b', marginTop: 6, fontSize: 13 }}>
									Enrolled: {exam.enrolled} • Submissions: {exam.submissions}
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
									onClick={() => alert('Open exam editor')}
								>
									Edit exam
								</button>
								<button
									style={{
										padding: '10px 12px',
										borderRadius: 10,
										border: '1px solid #cbd5e1',
										background: '#ffffff',
										color: '#4338ca',
										cursor: 'pointer',
										fontWeight: 700,
									}}
									onClick={() => handleClone(exam)}
								>
									Duplicate
								</button>
								{exam.status !== 'live' && (
									<button
										style={{
											padding: '10px 12px',
											borderRadius: 10,
											border: '1px solid #14b8a6',
											background: '#ccfbf1',
											color: '#0f766e',
											cursor: 'pointer',
											fontWeight: 700,
										}}
										onClick={() => handlePublish(exam.id)}
									>
										Publish now
									</button>
								)}
							</div>
						</article>
					);
				})}
			</div>
		</section>
	);
};

export default TeacherExams;
