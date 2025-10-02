import React from 'react';
import {
	safeApiCall,
	getStudentExams,
	startStudentSubmission,
} from '../../services/apiServices.js';

const useExams = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [exams, setExams] = React.useState([]);

	React.useEffect(() => {
		let alive = true;
		(async () => {
			setLoading(true);
			setError('');
			try {
				const data = await safeApiCall(getStudentExams);
				if (alive) setExams(data);
			} catch (e) {
				if (alive) setError(e.message || 'Failed to load exams');
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, []);

	return { loading, error, exams, setExams };
};

const statusPill = status => {
	switch (status) {
		case 'active':
			return { label: 'Active', bg: '#eef2ff', bd: '#c7d2fe', fg: '#3730a3' };
		case 'completed':
			return { label: 'Completed', bg: '#ecfdf5', bd: '#a7f3d0', fg: '#065f46' };
		case 'upcoming':
		default:
			return { label: 'Upcoming', bg: '#fff7ed', bd: '#fed7aa', fg: '#9a3412' };
	}
};

const Exams = () => {
	const { loading, error, exams, setExams } = useExams();
	const [query, setQuery] = React.useState('');
	const [filter, setFilter] = React.useState('all');

	const filtered = exams.filter(e => {
		const text = `${e.title}`.toLowerCase();
		const matchesText = text.includes(query.toLowerCase());
		const matchesFilter = filter === 'all' ? true : e.status === filter;
		return matchesText && matchesFilter;
	});

	const handleStart = async examId => {
		if (!examId) return;
		try {
			await safeApiCall(startStudentSubmission, { examId });
			// Optionally reflect state locally so user can continue immediately
			setExams(list =>
				list.map(e => (String(e.id) === String(examId) ? { ...e, status: 'active' } : e)),
			);
		} catch (e) {
			alert(e.message || 'Failed to start exam');
		}
	};

	return (
		<section style={{ color: 'var(--text)' }}>
			<h1 style={{ marginTop: 0 }}>Exams</h1>

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
							borderRadius: 12,
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

			{loading && <div style={{ color: 'var(--text-muted)' }}>Loading exams…</div>}
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
				<ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 12 }}>
					{filtered.map(exam => {
						const pill = statusPill(exam.status);
						return (
							<li
								key={exam.id}
								style={{
									background: 'var(--surface)',
									border: '1px solid var(--border)',
									borderRadius: 14,
									padding: 14,
									display: 'grid',
									gridTemplateColumns: '1fr auto',
									gap: 10,
									alignItems: 'center',
									boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
								}}
							>
								<div>
									<div style={{ fontWeight: 800, color: 'var(--text)' }}>
										{exam.title}
									</div>
									<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
										{exam.durationMin} min{' '}
										{exam.startAt ? `• ${exam.startAt}` : ''}
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
										<button
											style={{
												padding: '8px 10px',
												borderRadius: 8,
												border: 'none',
												background: 'var(--primary-strong)',
												color: '#fff',
												cursor: 'pointer',
												fontWeight: 700,
											}}
											onClick={() => handleStart(exam.id)}
										>
											Start
										</button>
									)}
									{exam.status === 'active' && (
										<button
											style={{
												padding: '8px 10px',
												borderRadius: 8,
												border: 'none',
												background: 'var(--primary-strong)',
												color: '#fff',
												cursor: 'pointer',
												fontWeight: 700,
											}}
											onClick={() => handleStart(exam.id)}
										>
											Continue
										</button>
									)}
									{exam.status === 'completed' && (
										<button
											style={{
												padding: '8px 10px',
												borderRadius: 8,
												border: '1px solid var(--border)',
												background: 'var(--surface)',
												color: 'var(--text)',
												cursor: 'pointer',
												fontWeight: 700,
											}}
											onClick={() => alert('Result page will show details.')}
										>
											View Result
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

export default Exams;
