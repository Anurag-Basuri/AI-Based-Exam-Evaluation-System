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
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#f59e0b',
		label: 'In Progress',
		icon: '🟡',
	},
	started: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#f59e0b',
		label: 'Started',
		icon: '🟡',
	},
	submitted: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#3b82f6',
		label: 'Submitted',
		icon: '📋',
	},
	evaluated: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#10b981',
		label: 'Evaluated',
		icon: '✅',
	},
	pending: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: 'var(--text-muted)',
		label: 'Pending',
		icon: '⏳',
	},
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
	const config = statusStyles[submission.status] || statusStyles.pending;
	const canContinue = ['in-progress', 'started'].includes(submission.status);
	const hasScore = submission.score !== null && submission.score !== undefined;

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
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
							color: 'var(--text)',
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

				<div
					style={{
						display: 'flex',
						gap: '16px',
						color: 'var(--text-muted)',
						fontSize: '13px',
					}}
				>
					{submission.startedAt && (
						<div>
							<strong style={{ color: 'var(--text)' }}>Started:</strong>{' '}
							{submission.startedAt}
						</div>
					)}
					{submission.submittedAt && (
						<div>
							<strong style={{ color: 'var(--text)' }}>Submitted:</strong>{' '}
							{submission.submittedAt}
						</div>
					)}
				</div>
			</header>

			{hasScore && (
				<div
					style={{
						background: 'var(--surface)',
						borderRadius: 12,
						padding: '12px',
						border: '1px solid var(--border)',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
							{submission.score}
						</span>
						<span style={{ color: 'var(--text-muted)' }}>
							/ {submission.maxScore || 100}
						</span>
						<span
							style={{
								marginLeft: 'auto',
								color:
									submission.score >= (submission.maxScore || 100) * 0.7
										? '#10b981'
										: '#ef4444',
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
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
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

	// Small UX: allow Enter to search and auto-trim/uppercase is already applied
	const handleSearch = async e => {
		e.preventDefault();
		const cleaned = (searchCode || '').trim().toUpperCase();
		if (!cleaned || cleaned.length !== 6) {
			setError('Please enter a valid 6-character exam code.');
			return;
		}

		setSearching(true);
		setError('');
		setFoundExam(null);
		setMessage('');

		try {
			const exam = await safeApiCall(searchExamByCode, cleaned);
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
			navigate(`/student/take-exam/${submission.id}`);
		} catch (e) {
			setError(e?.message || 'Failed to continue exam');
		} finally {
			setContinuingId(null);
		}
	};

	return (
		<div style={{ maxWidth: '1200px' }}>
			<header
				style={{
					background:
						'linear-gradient(135deg, color-mix(in srgb, #10b981 12%, transparent), color-mix(in srgb, #3b82f6 6%, transparent))',
					padding: '32px 28px',
					borderRadius: 20,
					border: '1px solid color-mix(in srgb, #10b981 25%, transparent)',
					marginBottom: 32,
				}}
			>
				<h1
					style={{
						margin: '0 0 8px 0',
						fontSize: '28px',
						fontWeight: 800,
						color: 'var(--text)',
					}}
				>
					Find Your Exam
				</h1>
				<p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>
					Enter the exam search code provided by your instructor to start the exam.
				</p>
			</header>

			<div
				style={{
					background: 'var(--surface)',
					padding: '24px',
					borderRadius: 16,
					border: '1px solid var(--border)',
					marginBottom: 32,
					boxShadow: 'var(--shadow-md)',
				}}
			>
				<h2
					style={{
						margin: '0 0 16px 0',
						fontSize: '18px',
						fontWeight: 700,
						color: 'var(--text)',
					}}
				>
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
								color: 'var(--text)',
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
										.slice(0, 6),
								)
							}
							placeholder="Enter your 6‑char exam code (e.g., 7GKD2Q)…"
							pattern="^[A-Z0-9]{6}$"
							maxLength={6}
							title="Enter exactly 6 characters: A–Z and 0–9"
							required
							style={{
								width: '100%',
								padding: '12px 16px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
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
						role="status"
						style={{
							marginTop: '16px',
							padding: '12px',
							borderRadius: 12,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							color: 'var(--text)',
							fontWeight: 600,
						}}
					>
						{message}
					</div>
				)}
				{error && (
					<div
						role="alert"
						style={{
							marginTop: '8px',
							padding: '12px',
							borderRadius: 12,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							color: '#ef4444',
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
								color: 'var(--text)',
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
									border: '1px solid var(--border)',
									borderRadius: 12,
									background: 'var(--surface)',
									color: 'var(--text)',
									fontSize: 13,
								}}
							>
								<strong>Duration:</strong>{' '}
								{foundExam.duration ? `${foundExam.duration} mins` : '—'}
							</div>
							<div
								style={{
									padding: 12,
									border: '1px solid var(--border)',
									borderRadius: 12,
									background: 'var(--surface)',
									color: 'var(--text)',
									fontSize: 13,
								}}
							>
								<strong>Starts:</strong> {foundExam.startAt || '—'}
							</div>
							<div
								style={{
									padding: 12,
									border: '1px solid var(--border)',
									borderRadius: 12,
									background: 'var(--surface)',
									color: 'var(--text)',
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
									border: '1px solid var(--border)',
									background: 'var(--surface)',
									color: 'var(--text)',
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

			<section style={{ marginBottom: 32 }}>
				<h2
					style={{
						margin: '0 0 16px 0',
						fontSize: '18px',
						fontWeight: 700,
						color: 'var(--text)',
					}}
				>
					📚 Your Previous Exams
				</h2>

				{loading && (
					<div
						style={{
							padding: '60px 20px',
							textAlign: 'center',
							color: 'var(--text-muted)',
						}}
					>
						<div style={{ fontSize: '32px', marginBottom: 16 }}>⏳</div>
						<p style={{ margin: 0, fontWeight: 600 }}>Loading your previous exams...</p>
					</div>
				)}

				{!loading && !error && previousExams.length === 0 && (
					<div
						style={{
							padding: '60px 20px',
							textAlign: 'center',
							background: 'var(--surface)',
							borderRadius: 16,
							border: '2px dashed var(--border)',
						}}
					>
						<div style={{ fontSize: '48px', marginBottom: 16 }}>📭</div>
						<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
							No previous exams found
						</h3>
						<p style={{ margin: 0, color: 'var(--text-muted)' }}>
							You haven't taken any exams yet. Check back later or contact your
							instructor.
						</p>
					</div>
				)}

				{error && (
					<div
						role="alert"
						style={{
							padding: '20px',
							borderRadius: 12,
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							color: '#ef4444',
							textAlign: 'center',
							marginBottom: 24,
						}}
					>
						❌ {error}
					</div>
				)}

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
