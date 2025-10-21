import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	safeApiCall,
	getSubmissionById,
	saveSubmissionAnswers,
	submitSubmission,
} from '../../services/studentServices.js';

// A hook to manage the exam environment (fullscreen, visibility, back navigation)
const useExamEnvironment = (isExamActive, onViolation) => {
	useEffect(() => {
		if (!isExamActive) return;

		// 1. Fullscreen enforcement
		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) {
				onViolation('fullscreen');
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);

		// 2. Visibility change (tab switching)
		const handleVisibilityChange = () => {
			if (document.hidden) {
				onViolation('visibility');
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);

		// 3. Prevent back navigation
		window.history.pushState(null, '', window.location.href);
		const handlePopState = () => {
			window.history.pushState(null, '', window.location.href);
			onViolation('navigation');
		};
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

	const [submission, setSubmission] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isStarted, setIsStarted] = useState(false); // Controls the initial start screen
	const [violations, setViolations] = useState({ count: 0, lastType: '' });

	// --- Existing state for exam logic ---
	const [saving, setSaving] = useState(false);
	const [autoSubmitting, setAutoSubmitting] = useState(false);
	const [lastSaved, setLastSaved] = useState(null);

	// --- Environment Violation Handler ---
	const handleViolation = useCallback(type => {
		setViolations(v => ({ count: v.count + 1, lastType: type }));
		// Here you could also make an API call to log the violation
	}, []);

	useExamEnvironment(isStarted && !autoSubmitting, handleViolation);

	// --- Data Loading and Timer Logic (largely unchanged) ---
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

	const { endAtMs, remainingMs, remaining } = useMemo(() => {
		if (!submission?.startedAt || !submission?.duration)
			return { endAtMs: null, remainingMs: null, remaining: { mm: '--', ss: '--' } };
		const started = new Date(submission.startedAt).getTime();
		const end = started + Number(submission.duration) * 60 * 1000;
		const now = Date.now();
		const remMs = Math.max(0, end - now);
		const totalS = Math.floor(remMs / 1000);
		return {
			endAtMs: end,
			remainingMs: remMs,
			remaining: {
				mm: String(Math.floor(totalS / 60)).padStart(2, '0'),
				ss: String(totalS % 60).padStart(2, '0'),
			},
		};
	}, [submission]);

	// --- Actions: Start, Save, Submit ---
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
			// Non-critical error
		} finally {
			setSaving(false);
		}
	}, [submission, saving]);

	const handleSubmit = useCallback(
		async (isAuto = false) => {
			if (!submission || autoSubmitting) return;

			const confirmSubmit = isAuto
				? true
				: window.confirm('Are you sure you want to submit the exam?');
			if (!confirmSubmit) return;

			setAutoSubmitting(true);
			try {
				await handleQuickSave(); // Final save before submitting
				await safeApiCall(submitSubmission, { examId: submission.examId });
				if (document.fullscreenElement) {
					document.exitFullscreen();
				}
				navigate('/student/results', { replace: true });
			} catch (e) {
				setError(e?.message || 'Failed to submit. Please check your connection.');
			}
		},
		[submission, autoSubmitting, navigate, handleQuickSave],
	);

	// --- Effects for Auto-Save, Auto-Submit, and Shortcuts ---
	useEffect(() => {
		if (remainingMs === 0 && isStarted && !autoSubmitting) {
			handleSubmit(true);
		}
	}, [remainingMs, isStarted, autoSubmitting, handleSubmit]);

	useEffect(() => {
		const id = setInterval(() => {
			if (isStarted) handleQuickSave();
		}, 30000);
		return () => clearInterval(id);
	}, [isStarted, handleQuickSave]);

	// --- UI Rendering ---
	if (loading) return <div>Loading Exam...</div>;
	if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;
	if (!submission) return <div>Submission not found.</div>;

	if (!isStarted) {
		return (
			<div style={styles.startScreen}>
				<h2>{submission.examTitle}</h2>
				<p>Duration: {submission.duration} minutes</p>
				<p>Click the button below to start the exam in fullscreen mode.</p>
				<button onClick={handleStartExam} style={styles.startButton}>
					Start Exam
				</button>
			</div>
		);
	}

	return (
		<div style={styles.examLayout}>
			<div style={styles.questionPanel}>
				{(submission.questions || []).map((q, index) => (
					<QuestionCard
						key={q.id}
						question={q}
						index={index}
						answer={submission.answers?.find(a => a.question === q.id)}
						onAnswerChange={(...args) =>
							setSubmission(prev => handleAnswerChange(prev, ...args))
						}
						disabled={autoSubmitting}
					/>
				))}
			</div>

			<div style={styles.statusBar}>
				<h3>{submission.examTitle}</h3>
				<div style={styles.timer}>
					⏳ {remaining.mm}:{remaining.ss}
				</div>
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
					onClick={() => handleSubmit(false)}
					disabled={autoSubmitting}
					style={styles.submitButton}
				>
					{autoSubmitting ? 'Submitting...' : 'Submit Exam'}
				</button>
			</div>
		</div>
	);
};

// --- Helper Components & Styles ---

const handleAnswerChange = (submission, questionId, value, type) => {
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
	/* This component remains the same as your existing one */
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

const styles = {
	startScreen: {
		display: 'grid',
		placeContent: 'center',
		textAlign: 'center',
		minHeight: '60vh',
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
		gridTemplateColumns: '1fr 300px',
		gap: '16px',
		height: 'calc(100vh - 32px)',
		background: 'var(--bg)',
		padding: '16px',
	},
	questionPanel: { overflowY: 'auto', paddingRight: '10px' },
	statusBar: {
		position: 'sticky',
		top: '16px',
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
	statusInfo: { flexGrow: 1, fontSize: '14px' },
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
	questionCard: {
		padding: 16,
		border: '1px solid var(--border)',
		borderRadius: 12,
		background: 'var(--surface)',
		color: 'var(--text)',
		marginBottom: '16px',
	},
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
};

// Add media query for responsiveness
const mediaQuery = `@media (max-width: 768px) {
  .examLayout { grid-template-columns: 1fr; height: auto; }
  .statusBar { position: relative; top: 0; }
}`;
const styleSheet = document.createElement('style');
styleSheet.innerText = mediaQuery;
document.head.appendChild(styleSheet);

export default TakeExam;
