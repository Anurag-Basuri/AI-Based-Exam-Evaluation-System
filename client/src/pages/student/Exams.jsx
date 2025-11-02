import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import Alert from '../../components/ui/Alert.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import * as StudentSvc from '../../services/studentServices.js';

const statusStyles = {
	'in-progress': { color: '#f59e0b', label: 'In Progress', icon: '🟡' },
	started: { color: '#f59e0b', label: 'Started', icon: '🟡' },
	submitted: { color: '#6366f1', label: 'Evaluating...', icon: '⚙️' },
	evaluated: { color: '#10b981', label: 'Evaluated', icon: '✅' },
	published: { color: '#10b981', label: 'Published', icon: '✅' },
	pending: { color: 'var(--text-muted)', label: 'Pending', icon: '⏳' },
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
	const cfg = statusStyles[submission.status] || statusStyles.pending;
	const hasScore = submission.score != null;

	return (
		<article
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 16, // Match ResultCard
				padding: '20px', // Match ResultCard
				boxShadow: 'var(--shadow-sm)', // Match ResultCard
				display: 'flex',
				flexDirection: 'column',
				gap: 12,
			}}
		>
			<div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
				<strong style={{ color: 'var(--text)', fontSize: 16, flex: 1, lineHeight: 1.4 }}>
					{submission.examTitle}
				</strong>
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 6,
						fontSize: 12,
						padding: '6px 12px',
						borderRadius: 20,
						border: `1px solid ${cfg.border}`,
						background: cfg.bg,
						color: cfg.color,
						fontWeight: 700,
					}}
				>
					<span>{cfg.icon}</span>
					{cfg.label}
				</span>
			</div>
			{submission.status === 'published' && hasScore ? (
				<div
					style={{
						background: 'var(--bg)',
						border: '1px solid var(--border)',
						borderRadius: 12,
						padding: 8,
						marginBottom: 8,
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<span style={{ fontWeight: 800, color: 'var(--text)' }}>
						{submission.score.toFixed(1)}
					</span>
					<span style={{ color: 'var(--text-muted)' }}>/ {submission.maxScore ?? 0}</span>
					{submission.percentage != null && (
						<span
							style={{
								marginLeft: 'auto',
								color:
									submission.percentage >= 70
										? 'var(--success-text)'
										: submission.percentage >= 40
										? 'var(--warning-text)'
										: 'var(--danger-text)',
								fontWeight: 800,
								fontSize: 12,
							}}
						>
							{submission.percentage}%
						</span>
					)}
				</div>
			) : (
				submission.status !== 'in-progress' &&
				submission.status !== 'started' && (
					<div
						style={{
							background: 'var(--bg)',
							border: '1px solid var(--border)',
							borderRadius: 12,
							padding: '10px 12px',
							marginBottom: 8,
							fontSize: 13,
							fontWeight: 600,
							color: 'var(--text-muted)',
						}}
					>
						{submission.remarks || 'Results will be available after evaluation.'}
					</div>
				)
			)}
			{['in-progress', 'started'].includes(submission.status) && (
				<div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'auto' }}>
					<button
						onClick={() => onContinue(submission)}
						disabled={isContinuing}
						className="tap"
						style={{
							padding: '8px 12px',
							borderRadius: 8,
							border: 'none',
							background: isContinuing
								? '#9ca3af'
								: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							color: '#fff',
							fontWeight: 800,
							cursor: isContinuing ? 'not-allowed' : 'pointer',
						}}
					>
						{isContinuing ? 'Opening…' : 'Continue'}
					</button>
				</div>
			)}
		</article>
	);
};

const StudentExams = () => {
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();

	const CODE_LEN = 8;
	const [code, setCode] = React.useState('');
	const [searching, setSearching] = React.useState(false);
	const [starting, setStarting] = React.useState(false); // New state for start button
	const [found, setFound] = React.useState(null);
	const [submissions, setSubmissions] = React.useState([]);
	const [errorBanner, setErrorBanner] = React.useState('');
	const [continuingId, setContinuingId] = React.useState('');

	const loadMine = React.useCallback(async (force = false) => {
		try {
			const list = await StudentSvc.safeApiCall(StudentSvc.getMySubmissions, {}, force);
			setSubmissions(Array.isArray(list) ? list : []);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to load your submissions');
		}
	}, []);

	React.useEffect(() => {
		loadMine();
	}, [loadMine]);

	const handleSearch = async e => {
		e?.preventDefault?.();
		setErrorBanner('');
		const cleaned = (code || '').trim().toUpperCase();
		if (!cleaned || cleaned.length !== CODE_LEN) {
			setErrorBanner(`Enter a valid ${CODE_LEN}-character code`);
			return;
		}
		setSearching(true);
		setFound(null);
		try {
			const exam = await StudentSvc.safeApiCall(StudentSvc.searchExamByCode, cleaned);
			setFound(exam || null);
			if (!exam) setErrorBanner('No exam found for this code');
		} catch (e) {
			setErrorBanner(e?.message || 'Search failed');
		} finally {
			setSearching(false);
		}
	};

	const handleStart = async () => {
		if (!found?.id || starting) return;
		setStarting(true);
		setErrorBanner('');
		try {
			console.log('[Exams.jsx] handleStart: Starting exam with examId:', found.id);
			const submission = await StudentSvc.safeApiCall(StudentSvc.startExam, found.id);
			const submissionId = submission?.id || submission?._id; // Handle both .id and ._id

			console.log('[Exams.jsx] handleStart: Received submission from backend:', submission);

			if (!submissionId) {
				console.error(
					'[Exams.jsx] handleStart: ERROR - No submission ID received from backend.',
				);
				throw new Error('Could not start exam. Please try again.');
			}

			// If status is not 'in-progress', it means we are resuming or it's already done.
			// The TakeExam page will handle redirection if it's submitted/evaluated.
			success('Exam session initiated. Redirecting...');
			console.log(`[Exams.jsx] handleStart: Navigating to /student/take/${submissionId}`);
			navigate(`/student/take/${encodeURIComponent(submissionId)}`);
		} catch (e) {
			console.error('[Exams.jsx] handleStart: CATCH -', e);
			setErrorBanner(e?.message || 'Unable to start exam');
		} finally {
			setStarting(false);
		}
	};

	const handleContinue = async sub => {
		if (continuingId) return;
		setContinuingId(sub.id);
		try {
			// Just navigate; TakeExam page will fetch the latest state.
			console.log(`[Exams.jsx] handleContinue: Navigating to /student/take/${sub.id}`);
			// For "Continue", we don't pass state, forcing a fresh fetch of the latest data.
			navigate(`/student/take/${encodeURIComponent(sub.id)}`);
		} catch (e) {
			console.error('[Exams.jsx] handleContinue: CATCH -', e);
			toastError('Could not open exam.');
			setContinuingId('');
		}
	};

	return (
		<div style={{ maxWidth: 1100, margin: '0 auto' }}>
			{/* --- NEW: Consistent Header --- */}
			<header style={styles.pageHeader}>
				<div>
					<h1 style={styles.pageTitle}>Exams</h1>
					<p style={styles.pageSubtitle}>
						Join a new exam with a code or continue a previous one.
					</p>
				</div>
				<button
					onClick={() => loadMine(true)}
					disabled={starting}
					style={styles.refreshButton}
				>
					{starting ? '⏳' : '🔄'} Refresh
				</button>
			</header>

			{errorBanner && (
				<div style={{ marginBottom: 16 }}>
					<Alert type="error" onClose={() => setErrorBanner('')}>
						{errorBanner}
					</Alert>
				</div>
			)}

			<section
				style={{
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					borderRadius: 16,
					padding: 16,
					marginBottom: 24, // Increased margin
				}}
			>
				<form
					onSubmit={handleSearch}
					style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}
				>
					<div style={{ flex: '1 1 320px' }}>
						<label
							htmlFor="exam-code"
							style={{
								display: 'block',
								marginBottom: 6,
								fontWeight: 800,
								color: 'var(--text)',
							}}
						>
							Exam share code
						</label>
						<input
							id="exam-code"
							value={code}
							onChange={e =>
								setCode(
									e.target.value
										.toUpperCase()
										.replace(/[^A-Z0-9]/g, '')
										.slice(0, CODE_LEN),
								)
							}
							placeholder={`Enter ${CODE_LEN}-character code`}
							pattern={`^[A-Z0-9]{${CODE_LEN}}$`}
							maxLength={CODE_LEN}
							required
							style={{
								width: '100%',
								padding: '12px 16px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								fontWeight: 600,
							}}
						/>
					</div>
					<div style={{ display: 'flex', gap: 8 }}>
						<button
							type="submit"
							disabled={searching}
							className="tap"
							style={{
								padding: '12px 16px',
								borderRadius: 10,
								border: 'none',
								background: searching
									? '#9ca3af'
									: 'linear-gradient(135deg, #6366f1, #4f46e5)',
								color: '#fff',
								fontWeight: 900,
								cursor: searching ? 'not-allowed' : 'pointer',
							}}
						>
							{searching ? 'Searching…' : '🔍 Search'}
						</button>
						<button
							type="button"
							onClick={() => {
								setCode('');
								setFound(null);
								setErrorBanner('');
							}}
							className="tap"
							style={{
								padding: '12px 16px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								fontWeight: 800,
							}}
						>
							✨ Clear
						</button>
					</div>
				</form>

				{found && (
					<div
						style={{
							marginTop: 12,
							display: 'grid',
							gap: 10,
							borderTop: '1px solid var(--border)',
							paddingTop: 12,
						}}
					>
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<strong style={{ fontSize: 18, color: 'var(--text)' }}>
								{found.title}
							</strong>
							<span
								style={{
									marginLeft: 'auto',
									color: 'var(--text-muted)',
									fontWeight: 700,
								}}
							>
								Duration: {found.duration} min
							</span>
						</div>
						<p style={{ margin: 0, color: 'var(--text-muted)' }}>{found.description}</p>
						<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
							<button
								onClick={handleStart}
								disabled={starting}
								className="tap"
								style={{
									padding: '10px 14px',
									borderRadius: 10,
									border: 'none',
									background: 'linear-gradient(135deg, #10b981, #059669)',
									color: '#fff',
									fontWeight: 900,
									cursor: starting ? 'not-allowed' : 'pointer',
								}}
							>
								{starting ? 'Starting...' : '🚀 Start Exam'}
							</button>
						</div>
					</div>
				)}
			</section>

			<section>
				<h2 style={{ margin: '0 0 16px 0', color: 'var(--text)', fontSize: 20 }}>
					In Progress & Previous Exams
				</h2>
				{submissions.length === 0 ? (
					<div style={styles.emptyStateBox}>
						<div style={{ fontSize: '48px', marginBottom: 16 }}>📝</div>
						<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
							No Submissions Yet
						</h3>
						<p style={{ margin: 0, color: 'var(--text-muted)' }}>
							Join an exam using a share code to get started.
						</p>
					</div>
				) : (
					<div
						style={{
							display: 'grid',
							gap: 12,
							gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
						}}
					>
						{submissions.map(s => (
							<PreviousExamCard
								key={s.id}
								submission={s}
								onContinue={handleContinue}
								isContinuing={s.id === continuingId}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
};

// --- NEW: Styles object for consistency ---
const styles = {
	pageHeader: {
		background: 'var(--surface)',
		padding: '32px 28px',
		borderRadius: 20,
		border: '1px solid var(--border)',
		marginBottom: 32,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 20,
		flexWrap: 'wrap',
	},
	pageTitle: { margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: 'var(--text)' },
	pageSubtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '16px' },
	refreshButton: {
		padding: '12px 16px',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '14px',
	},
	emptyStateBox: {
		padding: '60px 20px',
		textAlign: 'center',
		background: 'var(--surface)',
		borderRadius: 16,
		border: '2px dashed var(--border)',
	},
};

export default StudentExams;
