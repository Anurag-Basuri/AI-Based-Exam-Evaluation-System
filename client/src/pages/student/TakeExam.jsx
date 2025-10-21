import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	safeApiCall,
	getSubmissionById,
	saveSubmissionAnswers,
	submitSubmission,
} from '../../services/studentServices.js';

// --- Environment Hook (from previous step, unchanged) ---
const useExamEnvironment = (isExamActive, onViolation) => {
	useEffect(() => {
		if (!isExamActive) return;
		const handleFullscreenChange = () =>
			!document.fullscreenElement && onViolation('fullscreen');
		const handleVisibilityChange = () => document.hidden && onViolation('visibility');
		window.history.pushState(null, '', window.location.href);
		const handlePopState = () => {
			window.history.pushState(null, '', window.location.href);
			onViolation('navigation');
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('popstate', handlePopState);
		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('popstate', handlePopState);
		};
	}, [isExamActive, onViolation]);
};

const TakeExam = () => {
	const params = useParams();
	const submissionId = params.submissionId || params.id;
	const navigate = useNavigate();

	// --- Core State ---
	const [submission, setSubmission] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	// --- Exam Control State ---
	const [isStarted, setIsStarted] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [markedForReview, setMarkedForReview] = useState([]);
	const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);

	// --- Environment & Action State ---
	const [violations, setViolations] = useState({ count: 0, lastType: '' });
	const [violationOverlay, setViolationOverlay] = useState(null);
	const [saving, setSaving] = useState(false);
	const [autoSubmitting, setAutoSubmitting] = useState(false);
	const [lastSaved, setLastSaved] = useState(null);

	// --- Environment Violation Handler ---
	const handleViolation = useCallback(type => {
		setViolations(v => ({ count: v.count + 1, lastType: type }));
		setViolationOverlay(type);
	}, []);

	useExamEnvironment(isStarted && !autoSubmitting, handleViolation);

	// --- Data Loading & Timer (unchanged) ---
	useEffect(() => {
		if (!submissionId) {
			navigate('/student/exams', { replace: true });
			return;
		}
		(async () => {
			try {
				const s = await safeApiCall(getSubmissionById, submissionId);
				if (s.status === 'submitted' || s.status === 'evaluated') {
					navigate('/student/results', { replace: true });
				} else {
					setSubmission(s);
				}
			} catch (e) {
				setError(e?.message || 'Failed to load submission');
			} finally {
				setLoading(false);
			}
		})();
	}, [submissionId, navigate]);

	const { remainingMs, remaining } = useTimer(submission);

	// --- Actions: Start, Save, Submit, Navigation ---
	const handleStartExam = async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsStarted(true);
		} catch (err) {
			alert('Fullscreen is required to start the exam. Please allow it.');
		}
	};

	const handleQuickSave = useCallback(async () => {
		if (!submission || saving) return;
		setSaving(true);
		try {
			await safeApiCall(saveSubmissionAnswers, {
				examId: submission.examId,
				answers: submission.answers || [],
			});
			setLastSaved(new Date());
		} catch (e) {
			/* Non-critical error */
		} finally {
			setSaving(false);
		}
	}, [submission, saving]);

	const finalSubmit = useCallback(async () => {
		if (!submission || autoSubmitting) return;
		setAutoSubmitting(true);
		try {
			await handleQuickSave();
			await safeApiCall(submitSubmission, { examId: submission.examId });
			if (document.fullscreenElement) document.exitFullscreen();
			navigate('/student/results', { replace: true });
		} catch (e) {
			setError(e?.message || 'Failed to submit. Please check your connection.');
		}
	}, [submission, autoSubmitting, navigate, handleQuickSave]);

	const handleToggleReview = useCallback(() => {
		const currentQuestionId = submission?.questions?.[currentQuestionIndex]?.id;
		if (!currentQuestionId) return;
		setMarkedForReview(prev =>
			prev.includes(currentQuestionId)
				? prev.filter(id => id !== currentQuestionId)
				: [...prev, currentQuestionId],
		);
	}, [submission, currentQuestionIndex]);

	// --- Effects for Auto-Save & Auto-Submit ---
	useEffect(() => {
		if (remainingMs === 0 && isStarted && !autoSubmitting) finalSubmit();
	}, [remainingMs, isStarted, autoSubmitting, finalSubmit]);

	useEffect(() => {
		const id = setInterval(() => isStarted && handleQuickSave(), 30000);
		return () => clearInterval(id);
	}, [isStarted, handleQuickSave]);

	// --- Memoized Question Status ---
	const questionStats = useMemo(() => {
		const questions = submission?.questions || [];
		const answers = submission?.answers || [];
		const answeredIds = new Set(answers.map(a => a.question));
		let answeredCount = 0;
		const statusMap = questions.map(q => {
			const isAnswered = answeredIds.has(q.id);
			const isMarked = markedForReview.includes(q.id);
			if (isAnswered) answeredCount++;
			if (isMarked && isAnswered) return 'answered-review';
			if (isMarked) return 'review';
			if (isAnswered) return 'answered';
			return 'unanswered';
		});
		return {
			statusMap,
			total: questions.length,
			answered: answeredCount,
			unanswered: questions.length - answeredCount,
			review: markedForReview.length,
		};
	}, [submission, markedForReview]);

	// --- UI Rendering ---
	if (loading) return <div style={styles.centeredMessage}>Loading Exam...</div>;
	if (error) return <div style={{ ...styles.centeredMessage, color: 'red' }}>Error: {error}</div>;
	if (!submission) return <div style={styles.centeredMessage}>Submission not found.</div>;

	if (!isStarted) {
		return <StartScreen submission={submission} onStart={handleStartExam} />;
	}

	const currentQuestion = submission.questions[currentQuestionIndex];

	return (
		<div style={styles.examLayout} className="examLayout">
			{violationOverlay && (
				<ViolationOverlay
					type={violationOverlay}
					onAcknowledge={() => setViolationOverlay(null)}
				/>
			)}

			{showSubmitConfirm && (
				<SubmitConfirmation
					stats={questionStats}
					onConfirm={finalSubmit}
					onCancel={() => setShowSubmitConfirm(false)}
				/>
			)}

			{/* --- Main Content: Current Question --- */}
			<div style={styles.questionPanel}>
				{currentQuestion && (
					<QuestionCard
						key={currentQuestion.id}
						question={currentQuestion}
						index={currentQuestionIndex}
						answer={submission.answers?.find(a => a.question === currentQuestion.id)}
						onAnswerChange={(...args) =>
							setSubmission(prev => handleAnswerChange(prev, ...args))
						}
						disabled={autoSubmitting}
					/>
				)}
				<div style={styles.navigationControls}>
					<button
						onClick={() => setCurrentQuestionIndex(i => Math.max(0, i - 1))}
						disabled={currentQuestionIndex === 0}
					>
						Previous
					</button>
					<button onClick={handleToggleReview}>
						{markedForReview.includes(currentQuestion?.id)
							? 'Unmark Review'
							: 'Mark for Review'}
					</button>
					<button
						onClick={() =>
							setCurrentQuestionIndex(i =>
								Math.min(submission.questions.length - 1, i + 1),
							)
						}
						disabled={currentQuestionIndex === submission.questions.length - 1}
					>
						Next
					</button>
				</div>
			</div>

			{/* --- Sidebar: Status & Navigation --- */}
			<div style={styles.statusBar} className="statusBar">
				<h3>{submission.examTitle}</h3>
				<div style={styles.timer}>
					⏳ {remaining.mm}:{remaining.ss}
				</div>
				<QuestionPalette
					stats={questionStats}
					currentIndex={currentQuestionIndex}
					onSelect={setCurrentQuestionIndex}
				/>
				<div style={styles.statusInfo}>
					<p>
						Last saved: {lastSaved ? lastSaved.toLocaleTimeString() : 'Not yet'}
						{saving && '...'}
					</p>
					<p style={{ color: '#ef4444', fontWeight: 'bold' }}>
						Violations: {violations.count}
					</p>
				</div>
				<button
					onClick={() => setShowSubmitConfirm(true)}
					disabled={autoSubmitting}
					style={styles.submitButton}
				>
					{autoSubmitting ? 'Submitting...' : 'Submit Exam'}
				</button>
			</div>
		</div>
	);
};

// --- Helper & UI Components ---

const useTimer = submission => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timerId = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timerId);
	}, []);

	return useMemo(() => {
		if (!submission?.startedAt || !submission?.duration)
			return { remainingMs: null, remaining: { mm: '--', ss: '--' } };
		const started = new Date(submission.startedAt).getTime();
		const end = started + Number(submission.duration) * 60 * 1000;
		const remMs = Math.max(0, end - now);
		const totalS = Math.floor(remMs / 1000);
		return {
			remainingMs: remMs,
			remaining: {
				mm: String(Math.floor(totalS / 60)).padStart(2, '0'),
				ss: String(totalS % 60).padStart(2, '0'),
			},
		};
	}, [submission, now]);
};

const StartScreen = ({ submission, onStart }) => (
	<div style={styles.centeredMessage}>
		<h2>{submission.examTitle}</h2>
		<p>Duration: {submission.duration} minutes</p>
		<p>This exam will be conducted in a secure, fullscreen environment.</p>
		<button onClick={onStart} style={styles.startButton}>
			Start Exam
		</button>
	</div>
);

const QuestionPalette = ({ stats, currentIndex, onSelect }) => (
	<div style={styles.paletteContainer}>
		<div style={styles.paletteGrid}>
			{stats.statusMap.map((status, i) => (
				<button
					key={i}
					onClick={() => onSelect(i)}
					style={{
						...styles.paletteButton,
						...paletteStatusStyles[status],
						...(i === currentIndex && styles.paletteCurrent),
					}}
				>
					{i + 1}
				</button>
			))}
		</div>
		<div style={styles.legend}>
			<div style={styles.legendItem}>
				<span style={{ ...styles.legendColor, ...paletteStatusStyles.answered }}></span>
				Answered
			</div>
			<div style={styles.legendItem}>
				<span style={{ ...styles.legendColor, ...paletteStatusStyles.unanswered }}></span>
				Not Answered
			</div>
			<div style={styles.legendItem}>
				<span style={{ ...styles.legendColor, ...paletteStatusStyles.review }}></span>For
				Review
			</div>
		</div>
	</div>
);

const ViolationOverlay = ({ type, onAcknowledge }) => {
	const messages = {
		fullscreen: 'You have exited fullscreen mode. Please return to fullscreen to continue.',
		visibility: 'You have switched to another tab or window. This is not allowed.',
		navigation: 'Navigating away from the exam is not allowed.',
	};
	return (
		<div style={styles.violationOverlay}>
			<div style={styles.violationBox}>
				<h2>Warning</h2>
				<p>{messages[type] || 'An exam rule was violated.'}</p>
				<button onClick={onAcknowledge}>I Understand</button>
			</div>
		</div>
	);
};

const SubmitConfirmation = ({ stats, onConfirm, onCancel }) => (
	<div style={styles.violationOverlay}>
		<div style={styles.violationBox}>
			<h2>Confirm Submission</h2>
			<p>Are you sure you want to submit? Here is a summary of your attempt:</p>
			<ul>
				<li>
					Answered: {stats.answered} / {stats.total}
				</li>
				<li>
					Not Answered: {stats.unanswered} / {stats.total}
				</li>
				<li>Marked for Review: {stats.review}</li>
			</ul>
			<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
				<button onClick={onCancel} style={{ background: 'grey' }}>
					Cancel
				</button>
				<button onClick={onConfirm} style={{ background: '#dc2626' }}>
					Submit Now
				</button>
			</div>
		</div>
	</div>
);

const handleAnswerChange = (submission, questionId, value, type) => {
	/* Unchanged */
	if (!submission) return null;
	const newAnswers = [...(submission.answers || [])];
	let answer = newAnswers.find(a => a.question === questionId);
	if (!answer) {
		answer = { question: questionId };
		newAnswers.push(answer);
	}
	if (type === 'multiple-choice') {
		answer.responseOption = value;
		delete answer.responseText;
	} else {
		answer.responseText = value;
		delete answer.responseOption;
	}
	return { ...submission, answers: newAnswers };
};

const QuestionCard = ({ question, index, answer, onAnswerChange, disabled }) => {
	/* Unchanged */
	const isMCQ = question.type === 'multiple-choice';
	return (
		<div style={styles.questionCard}>
			<div style={styles.questionHeader}>
				<strong>
					{index + 1}. {question.text}
				</strong>
				<span>{question.max_marks} Marks</span>
			</div>
			{isMCQ ? (
				<div>
					{(question.options || []).map(opt => (
						<label key={opt.id} style={styles.mcqOption}>
							<input
								type="radio"
								name={`q_${question.id}`}
								value={opt.id}
								checked={answer?.responseOption === opt.id}
								onChange={e =>
									onAnswerChange(question.id, e.target.value, 'multiple-choice')
								}
								disabled={disabled}
							/>
							{opt.text}
						</label>
					))}
				</div>
			) : (
				<textarea
					value={answer?.responseText || ''}
					onChange={e => onAnswerChange(question.id, e.target.value, 'descriptive')}
					disabled={disabled}
					rows={5}
					placeholder="Your answer..."
					style={styles.textarea}
				/>
			)}
		</div>
	);
};

// --- Styles ---
const styles = {
	centeredMessage: {
		display: 'grid',
		placeContent: 'center',
		textAlign: 'center',
		minHeight: 'calc(100vh - 64px)',
		gap: '1rem',
	},
	startButton: {
		padding: '12px 24px',
		fontSize: '16px',
		cursor: 'pointer',
		background: '#10b981',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
	},
	examLayout: {
		display: 'grid',
		gridTemplateColumns: '1fr 320px',
		gap: '16px',
		height: '100vh',
		background: 'var(--bg)',
		padding: '16px',
	},
	questionPanel: {
		display: 'flex',
		flexDirection: 'column',
		overflowY: 'auto',
		padding: '16px',
		background: 'var(--surface)',
		borderRadius: '12px',
		border: '1px solid var(--border)',
	},
	statusBar: {
		position: 'sticky',
		top: '16px',
		height: 'calc(100vh - 32px)',
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: '12px',
		padding: '16px',
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	},
	timer: {
		fontSize: '2rem',
		fontWeight: 'bold',
		textAlign: 'center',
		background: 'var(--bg)',
		padding: '10px',
		borderRadius: '8px',
	},
	statusInfo: { marginTop: 'auto', fontSize: '14px' },
	submitButton: {
		padding: '12px',
		fontSize: '16px',
		fontWeight: 'bold',
		cursor: 'pointer',
		background: '#dc2626',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
	},
	questionCard: { flexGrow: 1, color: 'var(--text)', marginBottom: '16px' },
	questionHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 12 },
	mcqOption: { display: 'flex', gap: 8, padding: '8px', cursor: 'pointer' },
	textarea: {
		width: '100%',
		padding: '8px',
		background: 'var(--bg)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
	},
	navigationControls: {
		display: 'flex',
		justifyContent: 'space-between',
		marginTop: 'auto',
		paddingTop: '16px',
		borderTop: '1px solid var(--border)',
	},
	paletteContainer: {
		border: '1px solid var(--border)',
		borderRadius: '8px',
		padding: '8px',
		background: 'var(--bg)',
	},
	paletteGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))',
		gap: '8px',
	},
	paletteButton: {
		aspectRatio: '1',
		border: '1px solid var(--border)',
		borderRadius: '4px',
		cursor: 'pointer',
	},
	paletteCurrent: { outline: '2px solid var(--primary)', outlineOffset: '2px' },
	legend: { display: 'flex', gap: '1rem', fontSize: '12px', marginTop: '8px', flexWrap: 'wrap' },
	legendItem: { display: 'flex', alignItems: 'center', gap: '4px' },
	legendColor: { width: '12px', height: '12px', borderRadius: '2px' },
	violationOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.8)',
		zIndex: 100,
		display: 'grid',
		placeItems: 'center',
	},
	violationBox: {
		background: 'var(--surface)',
		padding: '2rem',
		borderRadius: '12px',
		textAlign: 'center',
		maxWidth: '400px',
		border: '1px solid #ef4444',
	},
};

const paletteStatusStyles = {
	unanswered: { background: 'var(--surface)' },
	answered: { background: '#10b981', color: 'white', border: 'none' },
	review: { background: '#8b5cf6', color: 'white', border: 'none' },
	'answered-review': { background: '#10b981', color: 'white', border: '2px solid #8b5cf6' },
};

const mediaQuery = `@media (max-width: 900px) {
  .examLayout { grid-template-columns: 1fr; height: auto; }
  .statusBar { position: relative; top: 0; height: auto; }
}`;
const styleSheet = document.createElement('style');
styleSheet.innerText = mediaQuery;
document.head.appendChild(styleSheet);

export default TakeExam;
