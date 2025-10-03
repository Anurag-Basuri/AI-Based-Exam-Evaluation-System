import React from 'react';
import { safeApiCall, getMySubmissions } from '../../services/studentServices.js';

const statusStyles = {
	pending: { bg: '#fff7ed', border: '#fcd34d', color: '#92400e', label: 'Pending', icon: '⏳' },
	evaluated: {
		bg: '#ecfdf5',
		border: '#6ee7b7',
		color: '#047857',
		label: 'Evaluated',
		icon: '✅',
	},
	submitted: {
		bg: '#dbeafe',
		border: '#93c5fd',
		color: '#1d4ed8',
		label: 'Submitted',
		icon: '📋',
	},
	flagged: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', label: 'Flagged', icon: '🚨' },
};

const ResultCard = ({ result }) => {
	const config = statusStyles[result.status] || statusStyles.pending;
	const hasScore = result.score !== null && result.score !== undefined;
	const percentage =
		hasScore && result.maxScore > 0 ? Math.round((result.score / result.maxScore) * 100) : 0;

	return (
		<article
			style={{
				background: '#ffffff',
				borderRadius: 16,
				border: '1px solid #e5e7eb',
				boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
				padding: '24px',
				display: 'grid',
				gridTemplateColumns: '1fr auto',
				gap: 24,
				alignItems: 'start',
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
			<div>
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
							{result.examTitle}
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

					{result.submittedAt && (
						<div
							style={{
								color: '#64748b',
								fontSize: '13px',
							}}
						>
							Submitted: {result.submittedAt}
						</div>
					)}
				</header>

				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: '8px',
						padding: '16px',
						background: '#f8fafc',
						borderRadius: '12px',
						border: '1px solid #e2e8f0',
						marginBottom: '16px',
					}}
				>
					{hasScore ? (
						<>
							<span
								style={{
									fontSize: '32px',
									fontWeight: 800,
									color: '#0f172a',
									lineHeight: 1,
								}}
							>
								{result.score}
							</span>
							<span
								style={{
									fontSize: '18px',
									fontWeight: 600,
									color: '#64748b',
								}}
							>
								/ {result.maxScore || 100}
							</span>
							<span
								style={{
									fontSize: '14px',
									color:
										percentage >= 70
											? '#047857'
											: percentage >= 50
												? '#f59e0b'
												: '#dc2626',
									marginLeft: '8px',
									fontWeight: 600,
								}}
							>
								({percentage}%)
							</span>
						</>
					) : (
						<span
							style={{
								fontSize: '16px',
								fontWeight: 600,
								color: '#f59e0b',
							}}
						>
							📝 Awaiting evaluation
						</span>
					)}
				</div>

				{result.remarks && (
					<div
						style={{
							background: '#f0f9ff',
							borderRadius: 12,
							padding: '14px',
							border: '1px solid #bae6fd',
						}}
					>
						<div
							style={{
								fontWeight: 600,
								color: '#0c4a6e',
								marginBottom: '6px',
								fontSize: '14px',
							}}
						>
							Feedback
						</div>
						<p
							style={{
								margin: 0,
								color: '#1e40af',
								lineHeight: 1.5,
								fontSize: '14px',
							}}
						>
							{result.remarks}
						</p>
					</div>
				)}
			</div>

			<div
				style={{
					background: '#f8fafc',
					borderRadius: 12,
					padding: '20px',
					border: '1px solid #e2e8f0',
					display: 'flex',
					flexDirection: 'column',
					gap: '12px',
					minWidth: '160px',
					textAlign: 'center',
				}}
			>
				<div style={{ fontSize: '14px', fontWeight: 600, color: '#374151' }}>
					Performance
				</div>

				{hasScore && (
					<div
						style={{
							width: '60px',
							height: '60px',
							borderRadius: '50%',
							background: `conic-gradient(${
								percentage >= 70
									? '#10b981'
									: percentage >= 50
										? '#f59e0b'
										: '#ef4444'
							} ${percentage * 3.6}deg, #e5e7eb 0deg)`,
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							margin: '0 auto',
							position: 'relative',
						}}
					>
						<div
							style={{
								width: '44px',
								height: '44px',
								borderRadius: '50%',
								background: '#ffffff',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '12px',
								fontWeight: 800,
								color: '#374151',
							}}
						>
							{percentage}%
						</div>
					</div>
				)}

				<button
					onClick={() => alert('Detailed breakdown coming soon')}
					style={{
						padding: '8px 12px',
						borderRadius: '8px',
						border: '1px solid #d1d5db',
						background: '#ffffff',
						color: '#374151',
						cursor: 'pointer',
						fontWeight: 600,
						fontSize: '12px',
					}}
				>
					View Details
				</button>
			</div>
		</article>
	);
};

const StudentResults = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [results, setResults] = React.useState([]);
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all');

	const loadResults = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getMySubmissions);
			setResults(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load results');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadResults();
	}, [loadResults]);

	const filteredResults = React.useMemo(() => {
		const q = query.toLowerCase();
		return results.filter(result => {
			const matchesStatus = status === 'all' || result.status === status;
			const matchesQuery = !q || result.examTitle.toLowerCase().includes(q);
			return matchesStatus && matchesQuery;
		});
	}, [results, status, query]);

	const statusCounts = React.useMemo(() => {
		const counts = { all: results.length };
		results.forEach(result => {
			counts[result.status] = (counts[result.status] || 0) + 1;
		});
		return counts;
	}, [results]);

	const filterOptions = [
		{ key: 'all', label: 'All Results' },
		{ key: 'evaluated', label: 'Evaluated' },
		{ key: 'submitted', label: 'Submitted' },
		{ key: 'pending', label: 'Pending' },
		{ key: 'flagged', label: 'Flagged' },
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			{/* Header */}
			<header
				style={{
					background:
						'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid rgba(99,102,241,0.2)',
					marginBottom: 32,
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						gap: 20,
					}}
				>
					<div>
						<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800 }}>
							Results & Feedback
						</h1>
						<p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
							Review your exam scores and teacher feedback.
						</p>
					</div>
					<button
						onClick={loadResults}
						disabled={loading}
						style={{
							padding: '12px 16px',
							borderRadius: '10px',
							border: '1px solid #d1d5db',
							background: '#ffffff',
							color: '#374151',
							cursor: loading ? 'not-allowed' : 'pointer',
							fontWeight: 600,
							fontSize: '14px',
							opacity: loading ? 0.7 : 1,
						}}
					>
						{loading ? '⏳' : '🔄'} Refresh
					</button>
				</div>
			</header>

			{/* Search and Filters */}
			<div
				style={{
					background: '#ffffff',
					padding: '24px',
					borderRadius: 16,
					border: '1px solid #e5e7eb',
					marginBottom: 24,
					boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
				}}
			>
				<div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
					<div style={{ position: 'relative', flex: '1 1 300px' }}>
						<input
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="Search by exam title..."
							style={{
								width: '100%',
								padding: '12px 16px 12px 48px',
								borderRadius: 12,
								border: '1px solid #d1d5db',
								background: '#f9fafb',
								outline: 'none',
								fontSize: '14px',
								fontWeight: 500,
							}}
						/>
						<span
							style={{
								position: 'absolute',
								left: 16,
								top: '50%',
								transform: 'translateY(-50%)',
								color: '#9ca3af',
								fontSize: '16px',
							}}
						>
							🔍
						</span>
					</div>

					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						{filterOptions.map(option => (
							<button
								key={option.key}
								onClick={() => setStatus(option.key)}
								style={{
									padding: '10px 16px',
									borderRadius: 25,
									border:
										status === option.key
											? '2px solid #6366f1'
											: '1px solid #d1d5db',
									background: status === option.key ? '#eef2ff' : '#ffffff',
									color: status === option.key ? '#4338ca' : '#374151',
									cursor: 'pointer',
									fontWeight: 600,
									fontSize: '14px',
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									transition: 'all 0.2s ease',
								}}
							>
								{option.label}
								<span
									style={{
										background: status === option.key ? '#6366f1' : '#6b7280',
										color: '#ffffff',
										borderRadius: '12px',
										padding: '2px 8px',
										fontSize: '12px',
										fontWeight: 700,
										minWidth: '20px',
										textAlign: 'center',
									}}
								>
									{statusCounts[option.key] || 0}
								</span>
							</button>
						))}
					</div>
				</div>
			</div>

			{/* Error State */}
			{error && (
				<div
					style={{
						padding: '20px',
						borderRadius: 12,
						background: '#fef2f2',
						border: '1px solid #fca5a5',
						color: '#b91c1c',
						textAlign: 'center',
						marginBottom: 24,
					}}
				>
					❌ {error}
				</div>
			)}

			{/* Loading State */}
			{loading && (
				<div
					style={{
						padding: '60px 20px',
						textAlign: 'center',
						color: '#64748b',
					}}
				>
					<div style={{ fontSize: '32px', marginBottom: 16 }}>⏳</div>
					<p style={{ margin: 0, fontWeight: 600 }}>Loading your results...</p>
				</div>
			)}

			{/* Empty State */}
			{!loading && !error && filteredResults.length === 0 && (
				<div
					style={{
						padding: '60px 20px',
						textAlign: 'center',
						background: '#ffffff',
						borderRadius: 16,
						border: '2px dashed #d1d5db',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: 16 }}>📊</div>
					<h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
						{query || status !== 'all' ? 'No matching results' : 'No results yet'}
					</h3>
					<p style={{ margin: 0, color: '#6b7280' }}>
						{query || status !== 'all'
							? 'Try adjusting your search or filters'
							: 'Complete some exams to see your results here'}
					</p>
				</div>
			)}

			{/* Results List */}
			{!loading && !error && filteredResults.length > 0 && (
				<div style={{ display: 'grid', gap: 20 }}>
					{filteredResults.map(result => (
						<ResultCard key={result.id} result={result} />
					))}
				</div>
			)}
		</div>
	);
};

export default StudentResults;
