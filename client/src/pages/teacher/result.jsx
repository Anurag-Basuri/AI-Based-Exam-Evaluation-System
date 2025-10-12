import React from 'react';
import {
	safeApiCall,
	getTeacherSubmissions,
	evaluateTeacherSubmission,
} from '../../services/teacherServices.js';

// Guard helper for rendering any possibly-object text
const safeText = (v, fallback = '') => {
	if (v == null) return fallback;
	if (typeof v === 'string') return v;
	if (typeof v === 'number' || typeof v === 'boolean') return String(v);
	if (typeof v === 'object') return v.fullname || v.username || v.title || v.name || fallback;
	return fallback;
};

const statusConfig = {
    pending: { bg: 'var(--surface)', border: 'var(--border)', color: 'var(--text-muted)', label: 'Pending', icon: '⏳' },
    evaluated: { bg: 'var(--surface)', border: 'var(--border)', color: '#10b981', label: 'Evaluated', icon: '✅' },
    submitted: { bg: 'var(--surface)', border: 'var(--border)', color: '#3b82f6', label: 'Submitted', icon: '📋' },
    flagged: { bg: 'var(--surface)', border: 'var(--border)', color: '#dc2626', label: 'Flagged', icon: '🚨' },
};

const SubmissionCard = ({ submission, onEvaluate, onGrade, isEvaluating }) => {
	const config = statusConfig[submission.status] || statusConfig.pending;
	const studentName = safeText(submission.studentName, 'Student');
	const examTitle = safeText(submission.examTitle, 'Exam');

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: '24px',
				display: 'grid',
				gridTemplateColumns: '1fr auto',
				gap: 24,
				alignItems: 'start',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease',
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
								color: 'var(--text)',
								flex: 1,
							}}
						>
							{examTitle}
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
							color: 'var(--text-muted)',
							fontSize: '14px',
							marginBottom: '8px',
						}}
					>
						<strong style={{ color: 'var(--text)' }}>Student:</strong> {studentName}
					</div>

					{submission.submittedAt && (
						<div
							style={{
								color: '#64748b',
								fontSize: '13px',
							}}
						>
							Submitted: {submission.submittedAt}
						</div>
					)}
				</header>

				<div
					style={{
						display: 'flex',
						alignItems: 'baseline',
						gap: 8,
						padding: 16,
						background: 'var(--surface)',
						borderRadius: 12,
						border: '1px solid var(--border)',
					}}
				>
					{submission.score !== null && submission.score !== undefined ? (
						<>
							<span
								style={{
									fontSize: '32px',
									fontWeight: 800,
									color: 'var(--text)',
									lineHeight: 1,
								}}
							>
								{submission.score}
							</span>
							<span
								style={{
									fontSize: '18px',
									fontWeight: 600,
									color: 'var(--text-muted)',
								}}
							>
								/ {submission.maxScore || 100}
							</span>
							<span
								style={{
									fontSize: '14px',
									color: 'var(--text-muted)',
									marginLeft: '8px',
								}}
							>
								(
								{Math.round(
									(submission.score / (submission.maxScore || 100)) * 100,
								)}
								%)
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
			</div>

			<div
				style={{
					background: 'var(--surface)',
					borderRadius: 12,
					padding: 20,
					border: '1px solid var(--border)',
					display: 'flex',
					flexDirection: 'column',
					gap: 12,
					minWidth: 180,
				}}
			>
				<button
					onClick={() => onGrade(submission)}
					style={{
						padding: '12px 16px',
						borderRadius: '8px',
						border: 'none',
						background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
						color: '#ffffff',
						cursor: 'pointer',
						fontWeight: 600,
						fontSize: '14px',
						boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '8px',
					}}
				>
					✏️ Grade Manually
				</button>

				<button
					onClick={() => onEvaluate(submission)}
					disabled={isEvaluating}
					style={{
						padding: '12px 16px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						cursor: isEvaluating ? 'not-allowed' : 'pointer',
						fontWeight: 600,
						fontSize: 14,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 8,
						opacity: isEvaluating ? 0.7 : 1,
					}}
				>
					{isEvaluating ? '⏳ Evaluating...' : '🤖 Auto Evaluate'}
				</button>
			</div>
		</article>
	);
};

const TeacherResults = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [submissions, setSubmissions] = React.useState([]);
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all');
	const [message, setMessage] = React.useState('');
	const [evaluatingId, setEvaluatingId] = React.useState('');

	const loadSubmissions = React.useCallback(async () => {
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
		loadSubmissions();
	}, [loadSubmissions]);

	const filteredSubmissions = React.useMemo(() => {
		const q = query.toLowerCase();
		return submissions.filter(sub => {
			const statusMatch = status === 'all' || sub.status === status;
			const name = safeText(sub.studentName, '').toLowerCase();
			const title = safeText(sub.examTitle, '').toLowerCase();
			const queryMatch = !q || title.includes(q) || name.includes(q);
			return statusMatch && queryMatch;
		});
	}, [submissions, status, query]);

	const statusCounts = React.useMemo(() => {
		const counts = { all: submissions.length };
		submissions.forEach(sub => {
			counts[sub.status] = (counts[sub.status] || 0) + 1;
		});
		return counts;
	}, [submissions]);

	const handleEvaluate = async submission => {
		const id = submission.id;
		const examTitle = safeText(submission.examTitle, 'Exam');
		const studentName = safeText(submission.studentName, 'Student');

		setEvaluatingId(id);
		setMessage('');
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
			setMessage(`✅ Auto-evaluation completed for ${studentName} - ${examTitle}`);
		} catch (e) {
			setMessage(`❌ ${e?.message || 'Failed to trigger evaluation'}`);
		} finally {
			setEvaluatingId('');
		}
	};

	const handleGrade = submission => {
		const examTitle = safeText(submission.examTitle, 'Exam');
		const studentName = safeText(submission.studentName, 'Student');
		setMessage(
			`📝 Opening manual grading interface for ${studentName} - ${examTitle} (coming soon)`,
		);
	};

	const filterOptions = [
		{ key: 'all', label: 'All Submissions' },
		{ key: 'pending', label: 'Pending' },
		{ key: 'submitted', label: 'Submitted' },
		{ key: 'evaluated', label: 'Evaluated' },
		{ key: 'flagged', label: 'Flagged' },
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			{/* Header */}
			<header
				style={{
					background:
						'linear-gradient(135deg, color-mix(in srgb, #6366f1 10%, transparent), color-mix(in srgb, #8b5cf6 5%, transparent))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid var(--border)',
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
							Exam Submissions
						</h1>
						<p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>
							Review, evaluate, and provide feedback on student submissions.
						</p>
					</div>
					<button
						onClick={loadSubmissions}
						disabled={loading}
						style={{
							padding: '12px 16px',
							borderRadius: '10px',
							border: '1px solid var(--border)',
							background: 'var(--surface)',
						 color: 'var(--text)',
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

			{/* Status Message */}
			{message && (
				<div
					style={{
						marginBottom: 24,
						padding: '14px 18px',
						borderRadius: 12,
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						color: 'var(--text)',
						fontWeight: 600,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<span>{message}</span>
					<button
						onClick={() => setMessage('')}
						style={{
							border: 'none',
							background: 'transparent',
							cursor: 'pointer',
							color: 'inherit',
							fontWeight: 800,
							fontSize: '16px',
							padding: '4px',
						}}
					>
						×
					</button>
				</div>
			)}

			{/* Search and Filters */}
			<div
				style={{
					background: 'var(--surface)',
					padding: '24px',
					borderRadius: 16,
					border: '1px solid var(--border)',
					marginBottom: 24,
					boxShadow: 'var(--shadow-md)',
				}}
			>
				<div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
					<div style={{ position: 'relative', flex: '1 1 300px' }}>
						<input
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="Search by student name or exam title..."
							style={{
								width: '100%',
								padding: '12px 16px 12px 48px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								outline: 'none',
								fontSize: '14px',
								fontWeight: 500,
								color: 'var(--text)',
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
					<p style={{ margin: 0, fontWeight: 600 }}>Loading submissions...</p>
				</div>
			)}

			{/* Empty State */}
			{!loading && !error && filteredSubmissions.length === 0 && (
				<div
					style={{
						padding: '60px 20px',
						textAlign: 'center',
						background: 'var(--surface)',
						borderRadius: 16,
						border: '2px dashed var(--border)',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: 16 }}>📋</div>
					<h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
						{query || status !== 'all'
							? 'No matching submissions'
							: 'No submissions yet'}
					</h3>
					<p style={{ margin: 0, color: '#6b7280' }}>
						{query || status !== 'all'
							? 'Try adjusting your search or filters'
							: 'Submissions will appear here once students start taking exams'}
					</p>
				</div>
			)}

			{/* Submissions List */}
			{!loading && !error && filteredSubmissions.length > 0 && (
				<div style={{ display: 'grid', gap: 20 }}>
					{filteredSubmissions.map(submission => (
						<SubmissionCard
							key={submission.id}
							submission={submission}
							onEvaluate={handleEvaluate}
							onGrade={handleGrade}
							isEvaluating={evaluatingId === submission.id}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default TeacherResults;
