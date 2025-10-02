import React from 'react';
import { safeApiCall } from '../../services/apiServices.js';

const useExams = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [exams, setExams] = React.useState([]);

	React.useEffect(() => {
		let mounted = true;
		const load = async () => {
			setLoading(true);
			setError('');
			try {
				// Try API if implemented; fallback to sample data
				const { getStudentExams } = await import('../../services/apiServices.js');
				let data = [];
				if (typeof getStudentExams === 'function') {
					const res = await safeApiCall(getStudentExams);
					data = res?.data || res || [];
				}
				if (!data.length) {
					data = [
						{
							id: '1',
							title: 'Algebra Midterm',
							status: 'active',
							durationMin: 60,
							startAt: '2025-10-01 10:00',
						},
						{
							id: '2',
							title: 'Physics Quiz',
							status: 'upcoming',
							durationMin: 30,
							startAt: '2025-10-05 09:00',
						},
						{
							id: '3',
							title: 'History Final',
							status: 'completed',
							durationMin: 90,
							startAt: '2025-09-20 11:00',
						},
					];
				}
				if (mounted) setExams(data);
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

const Exams = () => {
	const { loading, error, exams, setExams } = useExams();
	const [query, setQuery] = React.useState('');
	const [filter, setFilter] = React.useState('all'); // all | active | upcoming | completed
	const q = query.toLowerCase();

	const filtered = exams.filter(e => {
		const okFilter = filter === 'all' ? true : e.status === filter;
		const okQuery = !q || e.title.toLowerCase().includes(q);
		return okFilter && okQuery;
	});

	const handleStart = async examId => {
		try {
			const { startStudentSubmission } = await import('../../services/apiServices.js');
			await safeApiCall(startStudentSubmission, { examId });
			alert('Exam session started. Open the exam player to continue.');
			// Optionally update status locally
			setExams(prev => prev.map(x => (x.id === examId ? { ...x, status: 'active' } : x)));
		} catch (e) {
			alert(e?.message || 'Failed to start exam');
		}
	};

	const statusPill = status => {
		const map = {
			active: { bg: '#eef2ff', bd: '#c7d2fe', fg: '#3730a3', label: 'Active' },
			upcoming: { bg: '#fffbeb', bd: '#fde68a', fg: '#92400e', label: 'Upcoming' },
			completed: { bg: '#ecfeff', bd: '#a5f3fc', fg: '#155e75', label: 'Completed' },
		};
		return map[status] || { bg: '#f1f5f9', bd: '#e2e8f0', fg: '#334155', label: status || '—' };
	};

	const SkeletonCard = () => (
		<li
			style={{
				background: '#fff',
				border: '1px solid #e2e8f0',
				borderRadius: 12,
				padding: 12,
				display: 'grid',
				gridTemplateColumns: '1fr auto',
				gap: 8,
				alignItems: 'center',
			}}
		>
			<div>
				<div
					style={{
						width: 160,
						height: 16,
						background: '#e5e7eb',
						borderRadius: 6,
						marginBottom: 8,
					}}
				/>
				<div style={{ width: 220, height: 12, background: '#e5e7eb', borderRadius: 6 }} />
			</div>
			<div style={{ width: 120, height: 36, background: '#e5e7eb', borderRadius: 8 }} />
		</li>
	);

	return (
		<section style={{ color: 'var(--text)' }}>
			<h1 style={{ marginTop: 0 }}>Exams</h1>

			{/* Toolbar */}
			<div
				style={{
					display: 'flex',
					flexWrap: 'wrap',
					gap: 10,
					margin: '10px 0',
					alignItems: 'center',
				}}
			>
				<div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
					<input
						placeholder="Search exams"
						value={query}
						onChange={e => setQuery(e.target.value)}
						style={{
							width: '100%',
							border: '1px solid var(--border)',
							borderRadius: 10,
							padding: '10px 34px 10px 36px',
							outline: 'none',
							background: 'var(--surface)',
							color: 'var(--text)',
						}}
					/>
					<span
						aria-hidden
						style={{
							position: 'absolute',
							left: 10,
							top: '50%',
							transform: 'translateY(-50%)',
							color: 'var(--text-muted)',
						}}
					>
						🔎
					</span>
				</div>

				{/* Filter pills */}
				<div style={{ display: 'flex', gap: 8 }}>
					{['all', 'active', 'upcoming', 'completed'].map(f => {
						const active = filter === f;
						return (
							<button
								key={f}
								onClick={() => setFilter(f)}
								style={{
									padding: '8px 10px',
									borderRadius: 999,
									border: active
										? '1px solid var(--primary)'
										: '1px solid var(--border)',
									background: active
										? 'color-mix(in srgb, var(--primary) 10%, var(--surface))'
										: 'var(--surface)',
									color: active ? 'var(--primary-strong)' : 'var(--text)',
									cursor: 'pointer',
									fontWeight: 700,
								}}
							>
								{f[0].toUpperCase() + f.slice(1)}
							</button>
						);
					})}
				</div>
			</div>

			{loading && (
				<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
					<SkeletonCard />
					<SkeletonCard />
					<SkeletonCard />
				</ul>
			)}
			{!loading && error && <div style={{ color: '#ef4444' }}>{error}</div>}
			{!loading && !error && filtered.length === 0 && (
				<div
					style={{
						background: 'var(--surface)',
						border: '1px dashed var(--border)',
						borderRadius: 12,
						padding: 20,
						color: 'var(--text-muted)',
					}}
				>
					No exams found. Try a different filter or search term.
				</div>
			)}

			{!loading && filtered.length > 0 && (
				<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
					{filtered.map(exam => {
						const pill = statusPill(exam.status);
						return (
							<li
								key={exam.id}
								style={{
									background: 'var(--surface)',
									border: '1px solid var(--border)',
									borderRadius: 12,
									padding: 12,
									display: 'grid',
									gridTemplateColumns: '1fr auto',
									gap: 8,
									alignItems: 'center',
								}}
							>
								<div>
									<div style={{ fontWeight: 800, color: 'var(--text)' }}>
										{exam.title}
									</div>
									<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
										{exam.durationMin} min • {exam.startAt}
									</div>
									<div style={{ marginTop: 6 }}>
										<span
											style={{
												fontSize: 12,
												padding: '2px 8px',
												borderRadius: 999,
												border: `1px solid ${pill.bd}`,
												background: pill.bg,
												color: pill.fg,
												fontWeight: 700,
											}}
										>
											{pill.label}
										</span>
									</div>
								</div>
								<div style={{ display: 'flex', gap: 8 }}>
									{exam.status === 'upcoming' && (
										<button disabled style={btnMuted}>
											Not started
										</button>
									)}
									{exam.status === 'active' && (
										<button
											style={btnPrimary}
											onClick={() => handleStart(exam.id)}
										>
											Continue
										</button>
									)}
									{exam.status === 'completed' && (
										<button
											style={btnOutline}
											onClick={() => alert('Results page TBD')}
										>
											View Result
										</button>
									)}
									{exam.status === 'upcoming' && (
										<button
											style={btnPrimary}
											onClick={() => handleStart(exam.id)}
										>
											Start
										</button>
									)}
								</div>
							</li>
						);
					})}
				</ul>
			)}
		</section>
	);
};

const btnPrimary = {
	padding: '8px 10px',
	borderRadius: 8,
	border: 'none',
	background: 'var(--primary-strong)',
	color: '#fff',
	cursor: 'pointer',
	fontWeight: 700,
};
const btnOutline = {
	padding: '8px 10px',
	borderRadius: 8,
	border: '1px solid var(--border)',
	background: 'var(--surface)',
	color: 'var(--text)',
	cursor: 'pointer',
	fontWeight: 700,
};
const btnMuted = {
	padding: '8px 10px',
	borderRadius: 8,
	border: '1px dashed var(--border)',
	background: 'var(--surface)',
	color: 'var(--text-muted)',
	cursor: 'not-allowed',
	fontWeight: 700,
};

export default Exams;
