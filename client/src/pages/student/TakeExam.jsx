import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import {
	safeApiCall,
	getSubmissionById,
	saveSubmissionAnswers,
	submitSubmission,
} from '../../services/studentServices.js';
import { apiClient } from '../../services/api.js';
import TakeExamSkeleton from './components/TakeExamSkeleton.jsx';

const MAX_VIOLATIONS = 5;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// --- Environment Hook ---
const useExamEnvironment = (isExamActive, onViolation) => {
	useEffect(() => {
		if (!isExamActive) return;

		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) {
				onViolation('fullscreen');
			}
		};

		const handleVisibilityChange = () => {
			if (document.hidden) {
				onViolation('visibility');
			}
		};

		const handlePopState = () => {
			window.history.pushState(null, '', window.location.href);
			onViolation('navigation');
		};

		// Prevent back navigation
		window.history.pushState(null, '', window.location.href);

		// Add listeners
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('popstate', handlePopState);

		// Block context menu
		const handleContextMenu = e => e.preventDefault();
		document.addEventListener('contextmenu', handleContextMenu);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('popstate', handlePopState);
			document.removeEventListener('contextmenu', handleContextMenu);
		};
	}, [isExamActive, onViolation]);
};

const TakeExam = () => {
	const params = useParams();
	const submissionId = params.submissionId || params.id;
	const navigate = useNavigate();
	const { success, error: toastError, info } = useToast();

	// --- State ---
	const [submission, setSubmission] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isStarted, setIsStarted] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [markedForReview, setMarkedForReview] = useState([]);
	const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
	const [violations, setViolations] = useState({ count: 0, lastType: '' });
	const [violationOverlay, setViolationOverlay] = useState(null);
	const [saving, setSaving] = useState(false);
	const [autoSubmitting, setAutoSubmitting] = useState(false);
	const [lastSaved, setLastSaved] = useState(null);
	const [isOnline, setIsOnline] = useState(() =>
		typeof navigator !== 'undefined' ? navigator.onLine : true,
	);

	const hasUnsavedChanges = useRef(false);
	const saveTimeoutRef = useRef(null);

	// --- Timer Hook ---
	const { remainingMs, remaining } = useTimer(submission);

	// --- Submit Handler ---
	const finalSubmit = useCallback(
		async (isAuto = false, reason = 'Submission confirmed.') => {
			if (!submission || autoSubmitting) return;
			setAutoSubmitting(true);

			if (isAuto) {
				info(reason, { duration: 5000 });
			}

			try {
				// Final save before submitting
				if (hasUnsavedChanges.current) {
					await safeApiCall(saveSubmissionAnswers, submission.id, {
						answers: submission.answers || [],
						markedForReview: markedForReview,
					});
				}

				// Submit
				await safeApiCall(submitSubmission, submission.id, {
					submissionType: isAuto ? 'auto' : 'manual',
				});

				if (document.fullscreenElement) {
					await document.exitFullscreen().catch(() => {});
				}

				success('Submission successful! Redirecting to results...');
				setTimeout(() => {
					navigate('/student/results', { replace: true });
				}, 1500);
			} catch (e) {
				toastError(e?.message || 'Failed to submit. Please try again.');
				setAutoSubmitting(false);
			}
		},
		[submission, autoSubmitting, navigate, markedForReview, success, toastError, info],
	);

	// --- Violation Handler ---
	const handleViolation = useCallback(
		type => {
			const newCount = violations.count + 1;
			setViolations({ count: newCount, lastType: type });
			setViolationOverlay(type);

			// Log violation to backend
			apiClient
				.post(`/api/submissions/${submissionId}/violation`, { type })
				.catch(console.error);

			if (newCount > MAX_VIOLATIONS) {
				finalSubmit(true, `Exceeded warning limit (${MAX_VIOLATIONS} violations).`);
			}
		},
		[violations.count, submissionId, finalSubmit],
	);

	useExamEnvironment(isStarted && !autoSubmitting, handleViolation);

	// --- Prevent tab close ---
	useEffect(() => {
		const onBeforeUnload = e => {
			if (isStarted && submission && submission.status === 'in-progress') {
				e.preventDefault();
				e.returnValue = '';
				return '';
			}
		};
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [isStarted, submission]);

	// --- Online/Offline ---
	useEffect(() => {
		const setOn = () => setIsOnline(true);
		const setOff = () => setIsOnline(false);
		window.addEventListener('online', setOn);
		window.addEventListener('offline', setOff);
		return () => {
			window.removeEventListener('online', setOn);
			window.removeEventListener('offline', setOff);
		};
	}, []);

	// --- Keyboard shortcuts ---
	useEffect(() => {
		const onKey = e => {
			if (!isStarted || autoSubmitting) return;
			const key = `${e.altKey ? 'alt+' : ''}${e.key.toLowerCase()}`;

			if (key === 'alt+n') {
				e.preventDefault();
				document.getElementById('save-next-btn')?.click();
			} else if (key === 'alt+p') {
				e.preventDefault();
				document.getElementById('prev-btn')?.click();
			} else if (key === 'alt+m') {
				e.preventDefault();
				document.getElementById('mark-review-btn')?.click();
			} else if (key === 'alt+s') {
				e.preventDefault();
				document.getElementById('submit-btn')?.click();
			}
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isStarted, autoSubmitting]);

	// --- Load submission ---
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
					return;
				}

				setSubmission(s);
				setMarkedForReview(s.markedForReview || []);
			} catch (e) {
				setError(e?.message || 'Failed to load submission');
			} finally {
				setLoading(false);
			}
		})();
	}, [submissionId, navigate]);

	// --- Start exam ---
	const handleStartExam = async () => {
		try {
			await document.documentElement.requestFullscreen();
			setIsStarted(true);
		} catch (err) {
			toastError('Fullscreen is required to start the exam. Please allow it.');
		}
	};

	// --- Acknowledge violation ---
	const acknowledgeViolation = () => {
		setViolationOverlay(null);
		if (!document.fullscreenElement) {
			document.documentElement.requestFullscreen().catch(err => {
				console.error('Could not re-enter fullscreen:', err);
			});
		}
	};

	// --- Quick save ---
	const handleQuickSave = useCallback(
		async (answersToSave, reviewState) => {
			if (!submission || saving || !isOnline) return;

			// If no specific data is passed, and there are no general unsaved changes, exit.
			if (!answersToSave && !reviewState && !hasUnsavedChanges.current) return;

			setSaving(true);
			// Reset general flag; specific changes are handled by the payload.
			hasUnsavedChanges.current = false;

			try {
				const payload = {};
				if (answersToSave) payload.answers = answersToSave;
				if (reviewState) payload.markedForReview = reviewState;

				await safeApiCall(saveSubmissionAnswers, submission.id, payload);
				setLastSaved(new Date());
			} catch (e) {
				hasUnsavedChanges.current = true; // Re-flag on failure
				console.error('Auto-save failed:', e);
			} finally {
				setSaving(false);
			}
		},
		[submission, saving, isOnline],
	);

	// --- Debounced save ---
	const debouncedSave = useCallback(
		(answers, review) => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}

			saveTimeoutRef.current = setTimeout(() => {
				handleQuickSave(answers, review);
			}, 2000); // Save 2 seconds after last change
		},
		[handleQuickSave],
	);

	// --- Toggle review ---
	const handleToggleReview = useCallback(() => {
		const currentQuestionId = submission?.questions?.[currentQuestionIndex]?.id;
		if (!currentQuestionId) return;

		const newMarkedForReview = markedForReview.includes(currentQuestionId)
			? markedForReview.filter(id => id !== currentQuestionId)
			: [...markedForReview, currentQuestionId];

		setMarkedForReview(newMarkedForReview);
		debouncedSave(null, newMarkedForReview);
	}, [submission, currentQuestionIndex, debouncedSave, markedForReview]);

	// --- Answer change ---
	const handleAnswerChange = (questionId, value, type) => {
		if (!submission) return;

		let updatedAnswer;
		setSubmission(prev => {
			const newAnswers = [...prev.answers];
			const answerIndex = newAnswers.findIndex(a => a.question === questionId);

			if (answerIndex === -1) {
				console.warn(
					'Attempted to update a non-existent answer slot for question:',
					questionId,
				);
				return prev;
			}

			const answerToUpdate = { ...newAnswers[answerIndex] };

			if (type === 'multiple-choice') {
				answerToUpdate.responseOption = value;
			} else {
				answerToUpdate.responseText = value;
			}

			newAnswers[answerIndex] = answerToUpdate;
			updatedAnswer = answerToUpdate; // Capture the single updated answer

			return { ...prev, answers: newAnswers };
		});

		// OPTIMIZATION: Only send the single changed answer to the backend.
		if (updatedAnswer) {
			debouncedSave([updatedAnswer], null);
		}
	};

	// --- Save and next ---
	const handleSaveAndNext = async () => {
		await handleQuickSave();
		if (currentQuestionIndex < submission.questions.length - 1) {
			setCurrentQuestionIndex(i => i + 1);
		}
	};

	// --- Auto-submit on time expiry ---
	useEffect(() => {
		if (remainingMs === 0 && isStarted && !autoSubmitting) {
			finalSubmit(true, 'Time expired.');
		}
	}, [remainingMs, isStarted, autoSubmitting, finalSubmit]);

	// --- Periodic auto-save ---
	useEffect(() => {
		if (!isStarted) return;

		const id = setInterval(() => {
			// This periodic save is a fallback. It will only run if there are changes.
			handleQuickSave(null, markedForReview);
		}, AUTO_SAVE_INTERVAL);

		return () => clearInterval(id);
	}, [isStarted, handleQuickSave, markedForReview]);

	// --- Question stats ---
	const questionStats = useMemo(() => {
		const questions = submission?.questions || [];
		const answers = submission?.answers || [];

		let answeredCount = 0;
		const statusMap = questions.map(q => {
			const ans = answers.find(a => a.question === q.id);
			const isAnswered =
				(ans?.responseText && ans.responseText.trim()) || ans?.responseOption;
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

	// --- Cleanup on unmount ---
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current);
			}
		};
	}, []);

	// --- UI Rendering ---
	if (loading) return <TakeExamSkeleton />;

	if (error) return <div style={{ ...styles.centeredMessage, color: 'red' }}>Error: {error}</div>;

	if (!submission) return <div style={styles.centeredMessage}>Submission not found.</div>;

	if (!isStarted) {
		return <StartScreen submission={submission} onStart={handleStartExam} />;
	}

	const currentQuestion = submission.questions[currentQuestionIndex];

	return (
		<div style={styles.examLayout} className="examLayout">
			{violationOverlay && (
				<ViolationOverlay type={violationOverlay} onAcknowledge={acknowledgeViolation} />
			)}

			{showSubmitConfirm && (
				<SubmitConfirmation
					stats={questionStats}
					onConfirm={() => {
						setShowSubmitConfirm(false);
						finalSubmit(false);
					}}
					onCancel={() => setShowSubmitConfirm(false)}
				/>
			)}

			{/* --- Main Content: Current Question --- */}
			<div style={styles.questionPanel}>
				{/* Sticky in-panel toolbar */}
				<div style={styles.toolbar}>
					<div
						style={{
							display: 'flex',
							gap: 12,
							alignItems: 'center',
							flexWrap: 'wrap',
						}}
					>
						<strong style={{ color: 'var(--text)' }}>
							Q {currentQuestionIndex + 1} / {questionStats.total}
						</strong>
						<span style={styles.toolbarPill}>Answered: {questionStats.answered}</span>
						<span style={styles.toolbarPillMuted}>Review: {questionStats.review}</span>
						<span
							style={{
								marginLeft: 'auto',
								display: 'inline-flex',
								gap: 8,
								alignItems: 'center',
							}}
						>
							<small
								style={{
									color: isOnline ? '#10b981' : '#ef4444',
									fontWeight: 700,
								}}
							>
								{isOnline ? '🟢 Connected' : '🔴 Offline'}
							</small>
							<small style={{ color: 'var(--text-muted)' }}>
								{saving
									? 'Saving…'
									: lastSaved
										? `Saved ${lastSaved.toLocaleTimeString()}`
										: 'Not saved yet'}
							</small>
							<span style={styles.toolbarTimer}>
								⏳ {remaining.mm}:{remaining.ss}
							</span>
						</span>
					</div>
				</div>

				{currentQuestion && (
					<QuestionCard
						key={currentQuestion.id}
						question={currentQuestion}
						index={currentQuestionIndex}
						answer={submission.answers?.find(a => a.question === currentQuestion.id)}
						onAnswerChange={handleAnswerChange}
						disabled={autoSubmitting}
					/>
				)}

				<div style={styles.navigationControls}>
					<button
						id="prev-btn"
						onClick={() => {
							// No need to save, just navigate. Debounce handles saving.
							setCurrentQuestionIndex(i => Math.max(0, i - 1));
						}}
						disabled={currentQuestionIndex === 0 || autoSubmitting}
						style={styles.navButton}
					>
						← Previous
					</button>

					<button
						id="mark-review-btn"
						onClick={handleToggleReview}
						disabled={autoSubmitting}
						style={{
							...styles.navButton,
							background: markedForReview.includes(currentQuestion?.id)
								? '#8b5cf6'
								: 'var(--bg)',
							color: markedForReview.includes(currentQuestion?.id)
								? 'white'
								: 'var(--text)',
						}}
					>
						{markedForReview.includes(currentQuestion?.id)
							? '✓ Marked'
							: '⭐ Mark for Review'}
					</button>

					<button
						id="save-next-btn"
						onClick={handleSaveAndNext}
						disabled={
							currentQuestionIndex === submission.questions.length - 1 ||
							autoSubmitting
						}
						style={{
							...styles.navButton,
							background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							color: 'white',
						}}
					>
						Save & Next →
					</button>
				</div>
			</div>

			{/* --- Sidebar: Status & Navigation --- */}
			<div style={styles.statusBar} className="statusBar">
				<h3 style={{ margin: 0, fontSize: 18 }}>{submission.examTitle}</h3>

				<div style={styles.timer}>
					⏳ {remaining.mm}:{remaining.ss}
				</div>

				<QuestionPalette
					stats={questionStats}
					currentIndex={currentQuestionIndex}
					onSelect={async i => {
						await handleQuickSave();
						setCurrentQuestionIndex(i);
					}}
				/>

				<div style={styles.statusInfo}>
					<p style={{ margin: '4px 0', fontSize: 13 }}>
						<strong>Last saved:</strong>{' '}
						{lastSaved ? lastSaved.toLocaleTimeString() : 'Not yet'}
						{saving && ' (Saving...)'}
					</p>
					<p
						style={{
							margin: '4px 0',
							fontSize: 13,
							color: violations.count > MAX_VIOLATIONS / 2 ? '#ef4444' : '#f59e0b',
							fontWeight: 'bold',
						}}
					>
						⚠️ Violations: {violations.count} / {MAX_VIOLATIONS}
					</p>
				</div>

				<button
					id="submit-btn"
					onClick={() => setShowSubmitConfirm(true)}
					disabled={autoSubmitting}
					style={styles.submitButton}
				>
					{autoSubmitting ? 'Submitting...' : '📤 Submit Exam'}
				</button>
			</div>
		</div>
	);
};

// --- Helper Components ---

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

const EvaluationCriteria = ({ submission }) => {
	const examPolicy = submission?.examPolicy;
	const questionsWithPolicy =
		submission?.questions?.filter(
			q => q.aiPolicy && (q.aiPolicy.rubric?.length > 0 || q.aiPolicy.keywords?.length > 0),
		) || [];

	const hasExamPolicy =
		examPolicy && (examPolicy.rubric?.length > 0 || examPolicy.keywords?.length > 0);

	if (!hasExamPolicy && questionsWithPolicy.length === 0) {
		return null; // Don't render if no policies are defined
	}

	return (
		<div style={styles.criteriaContainer}>
			<h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Evaluation Criteria</h3>
			<p style={{ fontSize: 13, color: 'var(--text-muted)', margin: '0 0 12px 0' }}>
				The AI will use these rules to grade your descriptive answers.
			</p>

			{hasExamPolicy && (
				<div style={styles.criteriaSection}>
					<strong style={{ fontSize: 14 }}>General Exam Policy</strong>
					{examPolicy.rubric?.length > 0 && (
						<div>
							<h4 style={styles.criteriaHeader}>Rubric:</h4>
							<ul style={styles.criteriaList}>
								{examPolicy.rubric.map((item, i) => (
									<li key={`exam-rubric-${i}`}>
										{item.criterion} (Weight:{' '}
										{Math.round((item.weight || 0) * 100)}%)
									</li>
								))}
							</ul>
						</div>
					)}
					{examPolicy.keywords?.length > 0 && (
						<div>
							<h4 style={styles.criteriaHeader}>Keywords:</h4>
							<div style={styles.keywordContainer}>
								{examPolicy.keywords.map((item, i) => (
									<span key={`exam-kw-${i}`} style={styles.keywordPill}>
										{item.term}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			)}

			{questionsWithPolicy.map((q, index) => (
				<div key={q.id} style={styles.criteriaSection}>
					<strong style={{ fontSize: 14 }}>
						Policy for Question: "{q.text.substring(0, 50)}..."
					</strong>
					{q.aiPolicy.rubric?.length > 0 && (
						<div>
							<h4 style={styles.criteriaHeader}>Rubric:</h4>
							<ul style={styles.criteriaList}>
								{q.aiPolicy.rubric.map((item, i) => (
									<li key={`q-${index}-rubric-${i}`}>
										{item.criterion} (Weight:{' '}
										{Math.round((item.weight || 0) * 100)}%)
									</li>
								))}
							</ul>
						</div>
					)}
					{q.aiPolicy.keywords?.length > 0 && (
						<div>
							<h4 style={styles.criteriaHeader}>Keywords:</h4>
							<div style={styles.keywordContainer}>
								{q.aiPolicy.keywords.map((item, i) => (
									<span key={`q-${index}-kw-${i}`} style={styles.keywordPill}>
										{item.term}
									</span>
								))}
							</div>
						</div>
					)}
				</div>
			))}
		</div>
	);
};

const StartScreen = ({ submission, onStart }) => (
	<div style={styles.centeredMessage}>
		<div style={styles.startCard}>
			<h2 style={{ margin: '0 0 16px 0' }}>{submission.examTitle}</h2>
			<div style={styles.startInfo}>
				<p>
					<strong>Duration:</strong> {submission.duration} minutes
				</p>
				<p>
					<strong>Total Questions:</strong> {submission.questions?.length || 0}
				</p>
			</div>

			<EvaluationCriteria submission={submission} />

			<div style={styles.startWarning}>
				<h3 style={{ margin: '0 0 8px 0' }}>Important Instructions:</h3>
				<ul style={{ margin: 0, paddingLeft: 20, textAlign: 'left', fontSize: 14 }}>
					<li>This exam will be conducted in fullscreen mode.</li>
					<li>Do not switch tabs, minimize the window, or use other applications.</li>
					<li>Violations will be logged and may result in auto-submission.</li>
					<li>Ensure you have a stable internet connection.</li>
					<li>Your answers will be auto-saved periodically.</li>
				</ul>
			</div>
			<button onClick={onStart} style={styles.startButton}>
				🚀 Start Exam
			</button>
		</div>
	</div>
);

const paletteStatusStyles = {
	answered: {
		background: 'rgba(16,185,129,0.15)',
		color: '#10b981',
		borderColor: 'rgba(16,185,129,0.35)',
	},
	unanswered: {
		background: 'rgba(239,68,68,0.1)',
		color: '#ef4444',
		borderColor: 'rgba(239,68,68,0.35)',
	},
	review: {
		background: 'rgba(245,158,11,0.1)',
		color: '#f59e0b',
		borderColor: 'rgba(245,158,11,0.35)',
	},
	'answered-review': {
		background: 'rgba(139,92,246,0.15)',
		color: '#8b5cf6',
		borderColor: 'rgba(139,92,246,0.35)',
	},
};

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
					title={`Question ${i + 1} - ${status.replace('-', ' ')}`}
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
				<span style={{ ...styles.legendColor, ...paletteStatusStyles.review }}></span>
				For Review
			</div>
		</div>
	</div>
);

const ViolationOverlay = ({ type, onAcknowledge }) => {
	const messages = {
		fullscreen: 'You have exited fullscreen mode. This is a violation of the exam rules.',
		visibility:
			'You have switched to another tab or window. This is not allowed during the exam.',
		navigation: 'Navigating away from the exam is not allowed.',
	};

	return (
		<div style={styles.violationOverlay}>
			<div style={styles.violationBox}>
				<h2 style={{ margin: '0 0 16px 0', color: '#ef4444' }}>⚠️ Warning</h2>
				<p style={{ margin: '0 0 24px 0' }}>
					{messages[type] || 'An exam rule was violated.'}
				</p>
				<button onClick={onAcknowledge} style={styles.violationButton}>
					Return to Exam
				</button>
			</div>
		</div>
	);
};

const SubmitConfirmation = ({ stats, onConfirm, onCancel }) => (
	<div style={styles.violationOverlay}>
		<div style={styles.violationBox}>
			<h2 style={{ margin: '0 0 16px 0' }}>Confirm Submission</h2>
			<p style={{ margin: '0 0 16px 0' }}>
				Are you sure you want to submit? Here is a summary of your attempt:
			</p>
			<div style={styles.submitSummary}>
				<div style={styles.summaryItem}>
					<span>Answered:</span>
					<strong>
						{stats.answered} / {stats.total}
					</strong>
				</div>
				<div style={styles.summaryItem}>
					<span>Not Answered:</span>
					<strong>
						{stats.unanswered} / {stats.total}
					</strong>
				</div>
				<div style={styles.summaryItem}>
					<span>Marked for Review:</span>
					<strong>{stats.review}</strong>
				</div>
			</div>
			<div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: 24 }}>
				<button onClick={onCancel} style={styles.cancelButton}>
					Cancel
				</button>
				<button onClick={onConfirm} style={styles.confirmButton}>
					Submit Now
				</button>
			</div>
		</div>
	</div>
);

const QuestionCard = ({ question, index, answer, onAnswerChange, disabled }) => {
	const isMCQ = question.type === 'multiple-choice';
	const wordCount = useMemo(
		() => (answer?.responseText || '').trim().split(/\s+/).filter(Boolean).length,
		[answer?.responseText],
	);

	return (
		<div style={styles.questionCard}>
			<div style={styles.questionHeader}>
				<strong style={{ fontSize: 16 }}>
					{index + 1}. {question.text}
				</strong>
				<span style={styles.marksBadge}>{question.max_marks} Marks</span>
			</div>

			{isMCQ ? (
				<div style={{ display: 'grid', gap: 12 }}>
					{(question.options || []).map(opt => {
						const isChecked = answer?.responseOption === opt.id;
						return (
							<label
								key={opt.id}
								style={{
									...styles.mcqOption,
									...(isChecked ? styles.mcqOptionChecked : {}),
								}}
							>
								<input
									type="radio"
									name={`q_${question.id}`}
									value={opt.id}
									checked={isChecked}
									onChange={e =>
										onAnswerChange(
											question.id,
											e.target.value,
											'multiple-choice',
										)
									}
									disabled={disabled}
									style={{
										cursor: disabled ? 'not-allowed' : 'pointer',
										opacity: 0,
										position: 'absolute',
									}}
								/>
								<span
									style={{
										...styles.mcqRadioBubble,
										...(isChecked ? styles.mcqRadioBubbleChecked : {}),
									}}
								/>
								<span style={{ flex: 1 }}>{opt.text}</span>
							</label>
						);
					})}
				</div>
			) : (
				<div style={{ position: 'relative' }}>
					<textarea
						value={answer?.responseText || ''}
						onChange={e => onAnswerChange(question.id, e.target.value, 'descriptive')}
						disabled={disabled}
						rows={8}
						placeholder="Type your answer here..."
						style={styles.textarea}
					/>
					<span style={styles.wordCount}>{wordCount} words</span>
				</div>
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
		minHeight: '100vh',
		gap: '1rem',
		padding: 16,
		background: 'var(--bg)',
	},
	startCard: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 16,
		padding: '24px',
		maxWidth: 700,
		boxShadow: 'var(--shadow-lg)',
	},
	startInfo: {
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: 12,
		padding: '12px 16px',
		marginBottom: 16,
		textAlign: 'left',
	},
	startWarning: {
		background: 'rgba(239, 68, 68, 0.1)',
		border: '1px solid rgba(239, 68, 68, 0.3)',
		borderRadius: 12,
		padding: '12px 16px',
		marginBottom: 24,
		color: 'var(--text)',
	},
	startButton: {
		padding: '14px 28px',
		fontSize: '16px',
		fontWeight: 800,
		cursor: 'pointer',
		background: 'linear-gradient(135deg, #10b981, #059669)',
		color: 'white',
		border: 'none',
		borderRadius: '10px',
		width: '100%',
		transition: 'transform 0.2s',
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
		padding: '12px',
		borderRadius: '10px',
		border: '2px solid var(--border)',
		fontVariantNumeric: 'tabular-nums',
	},
	paletteContainer: {
		border: '1px solid var(--border)',
		borderRadius: '8px',
		padding: '8px',
		background: 'var(--bg)',
		overflowY: 'auto',
		flex: 1,
		minHeight: 100,
	},
	paletteGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(5, 1fr)',
		gap: '8px',
	},
	paletteButton: {
		aspectRatio: '1',
		border: '1px solid var(--border)',
		borderRadius: '6px',
		cursor: 'pointer',
		fontSize: 13,
		fontWeight: 700,
		transition: 'all 0.2s',
	},
	paletteCurrent: {
		outline: '3px solid var(--primary)',
		outlineOffset: '2px',
	},
	legend: {
		display: 'flex',
		gap: '0.5rem',
		fontSize: '11px',
		marginTop: '12px',
		flexWrap: 'wrap',
	},
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
	},
	legendColor: {
		width: '14px',
		height: '14px',
		borderRadius: '3px',
		border: '1px solid var(--border)',
	},
	statusInfo: {
		marginTop: '0',
		fontSize: '14px',
		color: 'var(--text-muted)',
	},
	navigationControls: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gap: '10px',
		marginTop: 'auto',
		paddingTop: '16px',
		borderTop: '1px solid var(--border)',
	},
	navButton: {
		padding: '12px',
		fontSize: '14px',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--bg)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		transition: 'all 0.2s',
	},
	submitButton: {
		padding: '14px',
		fontSize: '16px',
		fontWeight: 'bold',
		cursor: 'pointer',
		background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
		color: 'white',
		border: 'none',
		borderRadius: '10px',
	},
	questionCard: {
		flexGrow: 1,
		color: 'var(--text)',
		marginBottom: '16px',
	},
	questionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
		gap: 12,
	},
	marksBadge: {
		padding: '6px 12px',
		background: 'rgba(59, 130, 246, 0.1)',
		color: '#3b82f6',
		borderRadius: 20,
		fontSize: 13,
		fontWeight: 800,
		whiteSpace: 'nowrap',
	},
	mcqOption: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		padding: '12px 16px',
		cursor: 'pointer',
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		transition: 'all 0.2s',
		position: 'relative',
	},
	mcqOptionChecked: {
		background: 'color-mix(in srgb, var(--primary) 10%, transparent)',
		borderColor: 'var(--primary)',
	},
	mcqRadioBubble: {
		width: 20,
		height: 20,
		borderRadius: 999,
		border: '2px solid var(--border)',
		background: 'var(--surface)',
		transition: 'all 0.2s',
	},
	mcqRadioBubbleChecked: {
		borderColor: 'var(--primary)',
		background: 'var(--primary)',
		boxShadow: '0 0 0 3px var(--surface) inset',
	},
	textarea: {
		width: '100%',
		padding: '12px',
		background: 'var(--bg)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		fontFamily: 'inherit',
		fontSize: '14px',
		lineHeight: 1.5,
		resize: 'vertical',
	},
	wordCount: {
		position: 'absolute',
		bottom: 10,
		right: 10,
		fontSize: 11,
		fontWeight: 600,
		color: 'var(--text-muted)',
		background: 'var(--bg)',
		padding: '2px 6px',
		borderRadius: 4,
	},
	violationOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.9)',
		zIndex: 100,
		display: 'grid',
		placeItems: 'center',
		padding: 16,
	},
	violationBox: {
		background: 'var(--surface)',
		padding: '32px',
		borderRadius: '16px',
		textAlign: 'center',
		maxWidth: '500px',
		width: '100%',
		border: '2px solid #ef4444',
		boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
	},
	violationButton: {
		padding: '12px 24px',
		fontSize: '16px',
		fontWeight: 800,
		cursor: 'pointer',
		background: 'linear-gradient(135deg, #ef4444, #dc2626)',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		width: '100%',
	},
	submitSummary: {
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: '12px',
		padding: '16px',
		display: 'grid',
		gap: '12px',
	},
	summaryItem: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	cancelButton: {
		padding: '12px 24px',
		fontSize: '16px',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--bg)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		flex: 1,
	},
	confirmButton: {
		padding: '12px 24px',
		fontSize: '16px',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		flex: 1,
	},
	toolbar: {
		position: 'sticky',
		top: 0,
		zIndex: 1,
		background: 'var(--surface)',
		borderBottom: '1px solid var(--border)',
		margin: '-16px -16px 16px',
		padding: '12px 16px',
	},
	toolbarPill: {
		fontSize: 12,
		fontWeight: 800,
		padding: '4px 10px',
		borderRadius: 999,
		background: 'rgba(16,185,129,0.15)',
		color: '#10b981',
		border: '1px solid rgba(16,185,129,0.35)',
	},
	toolbarPillMuted: {
		fontSize: 12,
		fontWeight: 800,
		padding: '4px 10px',
		borderRadius: 999,
		background: 'var(--bg)',
		color: 'var(--text-muted)',
		border: '1px solid var(--border)',
	},
	toolbarTimer: {
		fontWeight: 800,
		padding: '6px 12px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		fontVariantNumeric: 'tabular-nums',
	},
	criteriaContainer: {
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: 12,
		padding: '12px 16px',
		marginBottom: 16,
		textAlign: 'left',
	},
	criteriaSection: {
		borderTop: '1px solid var(--border)',
		paddingTop: '8px',
		marginTop: '8px',
	},
	criteriaHeader: {
		margin: '8px 0 4px 0',
		fontSize: 13,
		color: 'var(--text-muted)',
		fontWeight: 600,
	},
	criteriaList: {
		margin: 0,
		paddingLeft: 20,
		fontSize: 13,
		color: 'var(--text)',
	},
	keywordContainer: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '6px',
	},
	keywordPill: {
		background: 'rgba(59, 130, 246, 0.1)',
		color: '#3b82f6',
		padding: '3px 8px',
		borderRadius: 999,
		fontSize: 12,
		fontWeight: 700,
	},
};

// Media query for responsive design
const mediaQuery = `
  @media (max-width: 900px) {
    .examLayout { 
      grid-template-columns: 1fr !important; 
      height: auto !important; 
    }
    .statusBar { 
      position: relative !important; 
      top: 0 !important; 
      height: auto !important; 
    }
  }
`;

const styleSheet = document.createElement('style');
styleSheet.innerText = mediaQuery;
if (!document.querySelector('style[data-exam-styles]')) {
	styleSheet.setAttribute('data-exam-styles', 'true');
	document.head.appendChild(styleSheet);
}

export default TakeExam;
