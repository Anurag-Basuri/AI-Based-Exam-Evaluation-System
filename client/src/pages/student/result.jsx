import React from 'react';
import { safeApiCall, getStudentResults } from '../../services/apiServices.js';

const statusMap = {
	pending: { bg: '#fff7ed', border: '#fcd34d', color: '#92400e', label: 'Pending' },
	evaluated: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', label: 'Evaluated' },
	flagged: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', label: 'Flagged' },
};

const useResults = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [results, setResults] = React.useState([]);

	React.useEffect(() => {
		let alive = true;
		(async () => {
			setLoading(true);
			setError('');
			try {
				const data = await safeApiCall(getStudentResults);
				if (alive) setResults(Array.isArray(data) ? data : []);
			} catch (e) {
				if (alive) setError(e.message || 'Failed to load results');
			} finally {
				if (alive) setLoading(false);
			}
		})();
		return () => {
			alive = false;
		};
	}, []);

	return { loading, error, results };
};

const StudentResults = () => {
	const { loading, error, results } = useResults();
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all');

	const filtered = results
		.map(r => ({ ...r, chip: statusMap[r.status] || statusMap.pending }))
		.filter(r => {
			const matchesStatus = status === 'all' ? true : r.status === status;
			const matchesQuery = r.examTitle.toLowerCase().includes(query.toLowerCase());
			return matchesStatus && matchesQuery;
		});

	return (
		<section style={{ color: 'var(--text)' }}>
			<header
				style={{
					background:
						'linear-gradient(135deg, color-mix(in srgb, var(--primary) 18%, transparent), color-mix(in srgb, var(--primary) 6%, transparent))',
					padding: 18,
					borderRadius: 16,
					border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
					boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
					marginBottom: 18,
				}}
			>
				<h1 style={{ margin: 0 }}>Results & Feedback</h1>
				<p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
					Review your recent scores and teacher feedback.
				</p>
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
				<div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder="Search exams"
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
					{['all', 'evaluated', 'pending', 'flagged'].map(st => {
						const active = status === st;
						return (
							<button
								key={st}
								onClick={() => setStatus(st)}
								style={{
									padding: '8px 12px',
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
								{st[0].toUpperCase() + st.slice(1)}
							</button>
						);
					})}
				</div>
			</div>

			{loading && <div style={{ color: 'var(--text-muted)' }}>Loading recent results…</div>}
			{!loading && error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
			{!loading && !filtered.length && (
				<div
					style={{
						border: '1px dashed var(--border)',
						borderRadius: 16,
						padding: 20,
						textAlign: 'center',
						color: 'var(--text-muted)',
					}}
				>
					No results match your filters.
				</div>
			)}

			<div style={{ display: 'grid', gap: 14 }}>
				{filtered.map(res => (
					<article
						key={res.id}
						style={{
							background: 'var(--surface)',
							borderRadius: 16,
							border: '1px solid var(--border)',
							boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
							padding: 18,
							display: 'grid',
							gridTemplateColumns: '1fr minmax(120px, 200px)',
							gap: 16,
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
								<h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>
									{res.examTitle}
								</h2>
								<span
									style={{
										fontSize: 12,
										padding: '2px 10px',
										borderRadius: 999,
										border: `1px solid ${res.chip.border}`,
										background: res.chip.bg,
										color: res.chip.color,
										fontWeight: 700,
									}}
								>
									{res.chip.label}
								</span>
							</header>
							<div style={{ color: 'var(--text-muted)', marginBottom: 10 }}>
								{res.score != null ? (
									<span
										style={{
											fontSize: 24,
											fontWeight: 800,
											color: 'var(--text)',
										}}
									>
										{res.score}
										<span
											style={{
												fontSize: 16,
												fontWeight: 600,
												color: 'var(--text-muted)',
											}}
										>
											/{res.maxScore}
										</span>
									</span>
								) : (
									<span style={{ fontSize: 16, fontWeight: 600 }}>
										Awaiting score
									</span>
								)}
							</div>
							<p style={{ margin: 0, color: 'var(--text-muted)', lineHeight: 1.6 }}>
								{res.remarks}
							</p>
						</div>

						<div
							style={{
								background: 'var(--elev)',
								borderRadius: 12,
								padding: 14,
								border: '1px solid var(--border)',
								display: 'grid',
								gap: 6,
								alignContent: 'start',
							}}
						>
							<div style={{ fontWeight: 700, color: 'var(--text)' }}>Evaluation</div>
							<div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
								{res.evaluatedAt
									? `Evaluated on ${res.evaluatedAt}`
									: 'Pending review'}
							</div>
							<button
								style={{
									marginTop: 6,
									padding: '8px 10px',
									borderRadius: 10,
									border: '1px solid var(--border)',
									background: 'var(--surface)',
									cursor: 'pointer',
									fontWeight: 700,
									color: 'var(--primary-strong)',
								}}
								onClick={() => alert('Detailed view coming soon')}
							>
								View details
							</button>
						</div>
					</article>
				))}
			</div>
		</section>
	);
};

export default StudentResults;
