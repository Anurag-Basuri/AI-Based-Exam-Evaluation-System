import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	safeApiCall,
	getMySubmissions,
	searchExamByCode,
	startExam,
} from '../../services/studentServices.js';

const statusStyles = {
	'in-progress': {
		bg: '#fff7ed',
		border: '#fed7aa',
		color: '#9a3412',
		label: 'In Progress',
		icon: '🟡',
	},
	started: { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', label: 'Started', icon: '🟡' },
	submitted: {
		bg: '#dbeafe',
		border: '#93c5fd',
		color: '#1d4ed8',
		label: 'Submitted',
		icon: '📋',
	},
	evaluated: {
		bg: '#ecfdf5',
		border: '#6ee7b7',
		color: '#047857',
		label: 'Evaluated',
		icon: '✅',
	},
	pending: { bg: '#f3f4f6', border: '#d1d5db', color: '#374151', label: 'Pending', icon: '⏳' },
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
	const config = statusStyles[submission.status] || statusStyles.pending;
	const canContinue = ['in-progress', 'started'].includes(submission.status);
	const hasScore = submission.score !== null && submission.score !== undefined;

	return (
		<article
			style={{
				background: '#ffffff',
				borderRadius: 16,
				border: '1px solid #e5e7eb',
				boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
				padding: '20px',
				transition: 'all 0.2s ease',
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
							fontSize: '16px',
							fontWeight: 700,
							color: '#0f172a',
							flex: 1,
						}}
					>
						{submission.examTitle}
					</h3>
					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							fontSize: '12px',
							padding: '4px 10px',
							borderRadius: '16px',
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

				<div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '13px' }}>
					{submission.startedAt && (
						<div>
							<strong>Started:</strong> {submission.startedAt}
						</div>
					)}
					{submission.submittedAt && (
						<div>
							<strong>Submitted:</strong> {submission.submittedAt}
						</div>
					)}
				</div>
			</header>

			{hasScore && (
				<div
					style={{
						background: '#f0f9ff',
						borderRadius: 12,
						padding: '12px',
						border: '1px solid #bae6fd',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ fontSize: '18px', fontWeight: 800, color: '#0369a1' }}>
							{submission.score}
						</span>
						<span style={{ color: '#64748b' }}>/ {submission.maxScore || 100}</span>
						<span
							style={{
								marginLeft: 'auto',
								color:
									submission.score >= submission.maxScore * 0.7
										? '#047857'
										: '#dc2626',
								fontWeight: 600,
							}}
						>
							{Math.round((submission.score / (submission.maxScore || 100)) * 100)}%
						</span>
					</div>
				</div>
			)}

			<div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
				{canContinue && (
					<button
						onClick={() => onContinue(submission)}
						disabled={isContinuing}
						style={{
							padding: '10px 16px',
							borderRadius: '8px',
							border: 'none',
							background: isContinuing
								? '#9ca3af'
								: 'linear-gradient(135deg, #f59e0b, #d97706)',
							color: '#ffffff',
							cursor: isContinuing ? 'not-allowed' : 'pointer',
							fontWeight: 600,
							fontSize: '14px',
						}}
					>
						{isContinuing ? '⏳ Loading...' : '▶️ Continue'}
					</button>
				)}
				{submission.status === 'evaluated' && (
					<button
						onClick={() => alert('View detailed results (to be implemented)')}
						style={{
							padding: '10px 16px',
							borderRadius: '8px',
							border: '1px solid #d1d5db',
							background: '#ffffff',
							color: '#374151',
							cursor: 'pointer',
							fontWeight: 600,
							fontSize: '14px',
						}}
					>
						📊 View Details
					</button>
				)}
			</div>
		</article>
	);
};

const StudentExams = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [message, setMessage] = React.useState('');
	const [searchCode, setSearchCode] = React.useState('');
	const [searching, setSearching] = React.useState(false);
	const [foundExam, setFoundExam] = React.useState(null);
	const [starting, setStarting] = React.useState(false);
	const [previousExams, setPreviousExams] = React.useState([]);
	const [continuingId, setContinuingId] = React.useState(null);

	const loadPreviousExams = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const submissions = await safeApiCall(getMySubmissions);
			setPreviousExams(Array.isArray(submissions) ? submissions : []);
		} catch (e) {
			setError(e?.message || 'Failed to load previous exams');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadPreviousExams();
	}, [loadPreviousExams]);

	const handleSearch = async e => {
		e.preventDefault();
		if (!searchCode.trim()) return;

		setSearching(true);
		setError('');
		setFoundExam(null);
		setMessage('');

		try {
			const exam = await safeApiCall(searchExamByCode, searchCode.trim());
			setFoundExam(exam);
			setMessage('✅ Exam found! Click "Start Exam" to begin.');
		} catch (e) {
			setError(e?.message || 'Exam not found. Please check the search code.');
		} finally {
			setSearching(false);
		}
	};

	const handleStartExam = async () => {
		if (!foundExam) return;

		setStarting(true);
		setMessage('');

		try {
			const submission = await safeApiCall(startExam, foundExam.id);
			// Navigate to exam taking page (you'll need to create this)
			navigate(`/student/take-exam/${submission.id}`);
		} catch (e) {
			setError(e?.message || 'Failed to start exam');
		} finally {
			setStarting(false);
		}
	};

	const handleContinueExam = async submission => {
		setContinuingId(submission.id);
		try {
			// Navigate to exam taking page
			navigate(`/student/take-exam/${submission.id}`);
		} catch (e) {
			setError(e?.message || 'Failed to continue exam');
		} finally {
			setContinuingId(null);
		}
	};

	return (
		<div style={{ maxWidth: '1200px' }}>
			{/* Header */}
			<header
				style={{
					background:
						'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid rgba(16,185,129,0.2)',
					marginBottom: 32,
				}}
			>
				<h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800 }}>
					Find Your Exam
				</h1>
				<p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
					Enter the exam search code provided by your instructor to start the exam.
				</p>
			</header>

			{/* Search Form */}
			<div
				style={{
					background: '#ffffff',
					padding: '24px',
					borderRadius: 16,
					border: '1px solid #e5e7eb',
					marginBottom: 32,
					boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
				}}
			>
				<h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>
					🔍 Search for Exam
				</h2>

				<form
					onSubmit={handleSearch}
					style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}
				>
					<div style={{ flex: 1 }}>
						<label
							style={{
								display: 'block',
								marginBottom: 6,
								fontWeight: 600,
								color: '#374151',
							}}
						>
							Exam Search Code
						</label>
						<input
							value={searchCode}
							onChange={e =>
								setSearchCode(
									e.target.value
										.toUpperCase()
										.replace(/[^A-Z0-9]/g, '')
										.slice(0, 8),
								)
							}
							placeholder="Enter your 8‑char exam code (e.g., 7GKD2A8Q)…"
							pattern="^[A-Z0-9]{8}$"
							maxLength={8}
							title="Enter exactly 8 characters: A–Z and 0–9"
							required
							style={{
								width: '100%',
								padding: '12px 16px',
								borderRadius: 12,
								border: '1px solid #d1d5db',
								background: '#f9fafb',
								outline: 'none',
								fontSize: '14px',
								fontWeight: 500,
							}}
						/>
					</div>
					<button
						type="submit"
						disabled={searching}
						style={{
							padding: '12px 16px',
							borderRadius: '8px',
							border: 'none',
							background: searching
								? '#9ca3af'
								: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#ffffff',
							cursor: searching ? 'not-allowed' : 'pointer',
							fontWeight: 600,
							fontSize: '14px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							gap: '6px',
						}}
					>
						{searching ? '⏳ Searching...' : '🔍 Search Exam'}
					</button>
				</form>

				{message && (
					<div
						style={{
							marginTop: '16px',
							padding: '12px',
							borderRadius: 12,
							background: '#f0f9ff',
							border: '1px solid #bae6fd',
							color: '#0c4a6e',
							fontWeight: 600,
						}}
					>
						{message}
					</div>
				)}
				{error && (
					<div
						style={{
							marginTop: '8px',
							padding: '12px',
							borderRadius: 12,
							background: '#fef2f2',
							border: '1px solid #fca5a5',
							color: '#b91c1c',
							textAlign: 'center',
						}}
					>
						❌ {error}
					</div>
				)}
				{foundExam && (
					<div style={{ marginTop: '24px' }}>
						<h3
							style={{
								margin: '0 0 12px 0',
								fontSize: '18px',
								fontWeight: 700,
								color: '#0f172a',
							}}
						>
							Found Exam: {foundExam.title}
						</h3>

						<div
							style={{
								display: 'grid',
								gap: 12,
								gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
								marginBottom: 12,
							}}
						>
							<div
								style={{
									padding: 12,
									border: '1px solid #e5e7eb',
									borderRadius: 12,
									background: '#fff',
									color: '#374151',
									fontSize: 13,
								}}
							>
								<strong>Duration:</strong>{' '}
								{foundExam.duration ? `${foundExam.duration} mins` : '—'}
							</div>
							<div
								style={{
									padding: 12,
									border: '1px solid #e5e7eb',
									borderRadius: 12,
									background: '#fff',
									color: '#374151',
									fontSize: 13,
								}}
							>
								<strong>Starts:</strong> {foundExam.startAt || '—'}
							</div>
							<div
								style={{
									padding: 12,
									border: '1px solid #e5e7eb',
									borderRadius: 12,
									background: '#fff',
									color: '#374151',
									fontSize: 13,
								}}
							>
								<strong>Ends:</strong> {foundExam.endAt || '—'}
							</div>
						</div>

						{!foundExam.canStart && (
							<div
								style={{
									marginBottom: 12,
									padding: 12,
									borderRadius: 12,
									border: '1px solid #fde68a',
									background: '#fffbeb',
									color: '#92400e',
									fontWeight: 600,
								}}
							>
								This exam is not available to start right now.
							</div>
						)}

						<div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
							<button
								onClick={handleStartExam}
								disabled={starting || !foundExam.canStart}
								style={{
									padding: '12px 16px',
									borderRadius: '8px',
									border: 'none',
									background:
										starting || !foundExam.canStart
											? '#9ca3af'
											: 'linear-gradient(135deg, #10b981, #059669)',
									color: '#ffffff',
									cursor:
										starting || !foundExam.canStart ? 'not-allowed' : 'pointer',
									fontWeight: 600,
									fontSize: '14px',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									gap: '6px',
									flex: '1 1 200px',
								}}
							>
								{starting ? '⏳ Starting Exam...' : '🚀 Start Exam'}
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Previous Exams Section */}
			<section style={{ marginBottom: 32 }}>
				<h2 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 700 }}>
					📚 Your Previous Exams
				</h2>

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
						<p style={{ margin: 0, fontWeight: 600 }}>Loading your previous exams...</p>
					</div>
				)}

				{/* Empty State */}
				{!loading && !error && previousExams.length === 0 && (
					<div
						style={{
							padding: '60px 20px',
							textAlign: 'center',
							background: '#ffffff',
							borderRadius: 16,
							border: '2px dashed #d1d5db',
						}}
					>
						<div style={{ fontSize: '48px', marginBottom: 16 }}>📭</div>
						<h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
							No previous exams found
						</h3>
						<p style={{ margin: 0, color: '#6b7280' }}>
							You haven't taken any exams yet. Check back later or contact your
							instructor.
						</p>
					</div>
				)}

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

				{/* Exams List */}
				{!loading && !error && previousExams.length > 0 && (
					<div
						style={{
							display: 'grid',
							gap: 20,
							gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
						}}
					>
						{previousExams.map(submission => (
							<PreviousExamCard
								key={submission.id}
								submission={submission}
								onContinue={handleContinueExam}
								isContinuing={continuingId === submission.id}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
};

export default StudentExams;
