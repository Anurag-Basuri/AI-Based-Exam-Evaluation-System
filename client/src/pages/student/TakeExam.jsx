import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
	const submissionId = params.id || params.submissionId;
	const navigate = useNavigate();
	const { state: navState } = useLocation(); // Get state from navigation

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
	const [isPaletteOpen, setIsPaletteOpen] = useState(false);

	const hasUnsavedChanges = useRef(false);
	const saveTimeoutRef = useRef(null);
	const questionPanelRef = useRef(null);

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
					await safeApiCall(saveSubmissionAnswers, submission._id, {
						answers: submission.answers || [],
						markedForReview: markedForReview,
					});
				}

				// Submit
				await safeApiCall(submitSubmission, submission._id, {
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
		const load = async () => {
			setLoading(true);
			try {
				let subData;
				if (navState?.submission) {
					subData = navState.submission;
				} else if (submissionId) {
					subData = await safeApiCall(getSubmissionById, submissionId);
				} else {
					navigate('/student/exams', { replace: true });
					return;
				}

				if (subData.status === 'submitted' || subData.status === 'evaluated') {
					navigate('/student/results', { replace: true });
					return;
				}

				setSubmission(subData);
				setMarkedForReview(subData.markedForReview || []);
			} catch (e) {
				setError(e?.message || 'Failed to load submission');
				toastError(e?.message || 'Failed to load submission');
			} finally {
				setLoading(false);
			}
		};

		load();
	}, [submissionId, navigate]); // navState is removed to prevent re-fetches on navigation

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
			if (!answersToSave && !reviewState && !hasUnsavedChanges.current) return;

			setSaving(true);
			hasUnsavedChanges.current = false;

			try {
				const payload = {
					answers: answersToSave || submission.answers,
					markedForReview: reviewState || markedForReview,
				};
				await safeApiCall(saveSubmissionAnswers, submission._id, payload);
				setLastSaved(new Date());
			} catch (e) {
				hasUnsavedChanges.current = true;
				console.error('Auto-save failed:', e);
			} finally {
				setSaving(false);
			}
		},
		[submission, saving, isOnline, markedForReview],
	);

	// --- Debounced save ---
	const debouncedSave = useCallback(
		(answers, review) => {
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
			saveTimeoutRef.current = setTimeout(() => {
				handleQuickSave(answers, review);
			}, 2000);
		},
		[handleQuickSave],
	);

	// --- Toggle review ---
	const handleToggleReview = useCallback(() => {
		const currentQuestionId = submission?.questions?.[currentQuestionIndex]?._id;
		if (!currentQuestionId) return;

		const newMarkedForReview = markedForReview.includes(currentQuestionId)
			? markedForReview.filter(id => id !== currentQuestionId)
			: [...markedForReview, currentQuestionId];

		setMarkedForReview(newMarkedForReview);
		debouncedSave(null, newMarkedForReview);
	}, [submission, currentQuestionIndex, debouncedSave, markedForReview]);

	// --- Answer change ---
	const handleAnswerChange = (questionId, value, type) => {
		hasUnsavedChanges.current = true;
		let updatedAnswers;
		setSubmission(prev => {
			const newAnswers = [...prev.answers];
			const answerIndex = newAnswers.findIndex(
				a => String(a.question) === String(questionId),
			);

			if (answerIndex === -1) {
				console.error('Could not find answer slot for question:', questionId);
				return prev;
			}

			const answerToUpdate = { ...newAnswers[answerIndex] };
			if (type === 'multiple-choice') {
				answerToUpdate.responseOption = value;
			} else {
				answerToUpdate.responseText = value;
			}
			newAnswers[answerIndex] = answerToUpdate;
			updatedAnswers = newAnswers;
			return { ...prev, answers: newAnswers };
		});
		if (updatedAnswers) debouncedSave(updatedAnswers, null);
	};

	// --- Navigation ---
	const changeQuestion = newIndex => {
		if (newIndex >= 0 && newIndex < submission.questions.length) {
			setCurrentQuestionIndex(newIndex);
			if (questionPanelRef.current) {
				questionPanelRef.current.scrollTop = 0;
			}
		}
	};

	const handleSaveAndNext = async () => {
		if (hasUnsavedChanges.current) await handleQuickSave();
		changeQuestion(currentQuestionIndex + 1);
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
			const ans = answers.find(a => String(a.question) === String(q._id));
			const isAnswered =
				(ans?.responseText && ans.responseText.trim().length > 0) || ans?.responseOption;
			const isMarked = markedForReview.includes(q._id);
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
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
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
			{isPaletteOpen && (
				<QuestionPaletteModal
					stats={questionStats}
					currentIndex={currentQuestionIndex}
					onSelect={async i => {
						await handleQuickSave();
						changeQuestion(i);
						setIsPaletteOpen(false);
					}}
					onClose={() => setIsPaletteOpen(false)}
				/>
			)}

			{/* --- Main Content: Current Question --- */}
			<div ref={questionPanelRef} style={styles.questionPanel}>
				<div style={styles.questionPanelHeader}>
					<h1 style={styles.examTitle}>{submission.examTitle}</h1>
					<div style={styles.desktopTimer}>
						⏳ {remaining.mm}:{remaining.ss}
					</div>
				</div>

				{currentQuestion && (
					<QuestionCard
						key={currentQuestion._id}
						question={currentQuestion}
						index={currentQuestionIndex}
						answer={submission.answers?.find(
							a => String(a.question) === String(currentQuestion._id),
						)}
						onAnswerChange={handleAnswerChange}
						disabled={autoSubmitting}
					/>
				)}
			</div>

			{/* --- Sidebar: Status & Navigation --- */}
			<div style={styles.statusBar} className="statusBar">
				<SidebarContent
					stats={questionStats}
					currentIndex={currentQuestionIndex}
					onSelect={async i => {
						await handleQuickSave();
						changeQuestion(i);
					}}
					lastSaved={lastSaved}
					saving={saving}
					violations={violations}
					onFinalSubmit={() => setShowSubmitConfirm(true)}
					autoSubmitting={autoSubmitting}
					isOnline={isOnline}
				/>
			</div>

			{/* --- Bottom Navigation (Mobile & Desktop) --- */}
			<div style={styles.bottomNav}>
				<button
					id="prev-btn"
					onClick={() => changeQuestion(currentQuestionIndex - 1)}
					disabled={currentQuestionIndex === 0 || autoSubmitting}
					style={styles.navButton}
				>
					<span style={styles.arrow}>←</span>
					<span className="hide-on-mobile">Previous</span>
				</button>

				<div style={styles.mobileCenterNav}>
					<button style={styles.mobileTimer} onClick={() => setIsPaletteOpen(true)}>
						⏳ {remaining.mm}:{remaining.ss}
					</button>
					<button style={styles.mobilePaletteBtn} onClick={() => setIsPaletteOpen(true)}>
						☰ {currentQuestionIndex + 1}/{questionStats.total}
					</button>
				</div>

				<button
					id="mark-review-btn"
					onClick={handleToggleReview}
					disabled={autoSubmitting}
					style={{
						...styles.navButton,
						...(markedForReview.includes(currentQuestion?._id)
							? styles.reviewBtnActive
							: {}),
					}}
				>
					⭐
					<span className="hide-on-mobile">
						{markedForReview.includes(currentQuestion?._id) ? 'Marked' : 'Review'}
					</span>
				</button>

				<button
					id="save-next-btn"
					onClick={handleSaveAndNext}
					disabled={
						currentQuestionIndex === submission.questions.length - 1 || autoSubmitting
					}
					style={{ ...styles.navButton, ...styles.nextBtn }}
				>
					<span className="hide-on-mobile">Save & Next</span>
					<span style={styles.arrow}>→</span>
				</button>
			</div>
		</div>
	);
};

// --- Helper Components ---

const SidebarContent = ({
	stats,
	currentIndex,
	onSelect,
	lastSaved,
	saving,
	violations,
	onFinalSubmit,
	autoSubmitting,
	isOnline,
}) => (
	<>
		<QuestionPalette stats={stats} currentIndex={currentIndex} onSelect={onSelect} />
		<div style={styles.statusInfo}>
			<p style={styles.statusText}>
				<span style={{ color: isOnline ? '#10b981' : '#ef4444' }}>
					{isOnline ? '●' : '●'}
				</span>{' '}
				{isOnline ? 'Connected' : 'Offline'}
			</p>
			<p style={styles.statusText}>
				{saving
					? 'Saving...'
					: lastSaved
					? `Saved ${lastSaved.toLocaleTimeString()}`
					: 'No changes saved'}
			</p>
			<p style={{ ...styles.statusText, color: '#f59e0b' }}>
				⚠️ Violations: {violations.count} / {MAX_VIOLATIONS}
			</p>
		</div>
		<button
			id="submit-btn"
			onClick={onFinalSubmit}
			disabled={autoSubmitting}
			style={styles.submitButton}
		>
			{autoSubmitting ? 'Submitting...' : '📤 Submit Exam'}
		</button>
	</>
);

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
		<div style={styles.startCard}>
			<div style={{ textAlign: 'center', marginBottom: 24 }}>
				<h1 style={{ margin: 0, fontSize: 'clamp(1.5rem, 4vw, 2rem)' }}>
					{submission.examTitle}
				</h1>
				<p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
					You are about to begin the exam.
				</p>
			</div>
			<div style={styles.startInfoGrid}>
				<div>
					<span style={styles.startInfoLabel}>Duration</span>
					<strong style={styles.startInfoValue}>{submission.duration} mins</strong>
				</div>
				<div>
					<span style={styles.startInfoLabel}>Questions</span>
					<strong style={styles.startInfoValue}>
						{submission.questions?.length || 0}
					</strong>
				</div>
				<div>
					<span style={styles.startInfoLabel}>Total Marks</span>
					<strong style={styles.startInfoValue}>
						{(submission.questions || []).reduce((sum, q) => sum + q.max_marks, 0)}
					</strong>
				</div>
			</div>
			<div style={styles.startWarning}>
				<h3 style={{ margin: '0 0 8px 0', fontSize: 16 }}>Please Note:</h3>
				<ul style={styles.startWarningList}>
					<li>The exam must be taken in fullscreen mode.</li>
					<li>Do not switch tabs, minimize, or navigate away.</li>
					<li>Violations will be logged and may lead to auto-submission.</li>
					<li>Your answers are auto-saved periodically.</li>
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
		background: 'var(--success-bg)',
		color: 'var(--success)',
		borderColor: 'var(--success-border)',
	},
	unanswered: {
		background: 'var(--bg)',
		color: 'var(--text-muted)',
		borderColor: 'var(--border)',
	},
	review: {
		background: 'var(--warning-bg)',
		color: 'var(--warning)',
		borderColor: 'var(--warning-border)',
	},
	'answered-review': {
		background: 'var(--review-bg)',
		color: 'var(--review)',
		borderColor: 'var(--review-border)',
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
				<span style={{ ...styles.legendColor, ...paletteStatusStyles.review }}></span>
				Review
			</div>
			<div style={styles.legendItem}>
				<span
					style={{ ...styles.legendColor, ...paletteStatusStyles['answered-review'] }}
				></span>
				Answered & Review
			</div>
		</div>
	</div>
);

const QuestionPaletteModal = ({ stats, currentIndex, onSelect, onClose }) => (
	<>
		<div style={styles.modalBackdrop} onClick={onClose} />
		<div style={styles.modalContent}>
			<div style={styles.modalHeader}>
				<h3 style={{ margin: 0 }}>Question Palette</h3>
				<button onClick={onClose} style={styles.modalCloseBtn}>
					×
				</button>
			</div>
			<QuestionPalette stats={stats} currentIndex={currentIndex} onSelect={onSelect} />
		</div>
	</>
);

const ViolationOverlay = ({ type, onAcknowledge }) => {
	const messages = {
		fullscreen: 'You have exited fullscreen mode. This is a violation of the exam rules.',
		visibility:
			'You have switched to another tab or window. This is not allowed during the exam.',
		navigation: 'Navigating away from the exam is not allowed.',
	};
	return (
		<div style={styles.modalBackdrop}>
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
	<div style={styles.modalBackdrop}>
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
				<p style={styles.questionNumber}>Question {index + 1}</p>
				<p style={styles.questionText}>{question.text}</p>
				<span style={styles.marksBadge}>{question.max_marks} Marks</span>
			</div>
			<div style={styles.answerArea}>
				{isMCQ ? (
					<div style={{ display: 'grid', gap: 12 }}>
						{(question.options || []).map(opt => {
							const isChecked = String(answer?.responseOption) === String(opt._id);
							return (
								<label
									key={opt._id}
									style={{
										...styles.mcqOption,
										...(isChecked ? styles.mcqOptionChecked : {}),
									}}
								>
									<input
										type="radio"
										name={`q_${question._id}`}
										value={opt._id}
										checked={isChecked}
										onChange={e =>
											onAnswerChange(
												question._id,
												e.target.value,
												'multiple-choice',
											)
										}
										disabled={disabled}
										style={{ opacity: 0, position: 'absolute' }}
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
							onChange={e =>
								onAnswerChange(question._id, e.target.value, 'descriptive')
							}
							disabled={disabled}
							rows={10}
							placeholder="Type your answer here..."
							style={styles.textarea}
						/>
						<span style={styles.wordCount}>{wordCount} words</span>
					</div>
				)}
			</div>
		</div>
	);
};

// --- Styles ---
const styles = {
	// Layouts
	centeredMessage: {
		display: 'grid',
		placeContent: 'center',
		textAlign: 'center',
		minHeight: '100vh',
		padding: 16,
		background: 'var(--bg)',
	},
	examLayout: {
		display: 'grid',
		gridTemplateColumns: '1fr 320px',
		gap: '1.5rem',
		height: '100vh',
		padding: '1.5rem',
		background: 'var(--bg-alt)',
	},
	questionPanel: {
		display: 'flex',
		flexDirection: 'column',
		background: 'var(--surface)',
		borderRadius: '16px',
		border: '1px solid var(--border)',
		overflow: 'hidden',
	},
	statusBar: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	},
	bottomNav: {
		position: 'fixed',
		bottom: 0,
		left: 0,
		right: 0,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '12px 16px',
		background: 'var(--surface)',
		borderTop: '1px solid var(--border)',
		zIndex: 50,
	},
	// Start Screen
	startCard: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 24,
		padding: 'clamp(1.5rem, 5vw, 3rem)',
		maxWidth: 600,
		width: '100%',
		boxShadow: 'var(--shadow-lg)',
	},
	startInfoGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
		gap: '1rem',
		background: 'var(--bg-alt)',
		border: '1px solid var(--border)',
		borderRadius: 16,
		padding: '1.5rem',
		marginBottom: '1.5rem',
		textAlign: 'center',
	},
	startInfoLabel: {
		display: 'block',
		fontSize: 13,
		color: 'var(--text-muted)',
		marginBottom: 4,
	},
	startInfoValue: { fontSize: '1.25rem', color: 'var(--text)' },
	startWarning: {
		background: 'var(--warning-bg)',
		border: '1px solid var(--warning-border)',
		borderRadius: 12,
		padding: '1rem',
		marginBottom: '1.5rem',
	},
	startWarningList: { margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--warning)' },
	startButton: {
		padding: '16px 28px',
		fontSize: '1rem',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--primary)',
		color: 'white',
		border: 'none',
		borderRadius: '12px',
		width: '100%',
		transition: 'transform 0.2s, box-shadow 0.2s',
		boxShadow: 'var(--shadow-md)',
	},
	// Question Panel
	questionPanelHeader: {
		padding: '1rem 1.5rem',
		borderBottom: '1px solid var(--border)',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	examTitle: { margin: 0, fontSize: '1.25rem' },
	desktopTimer: {
		fontSize: '1.25rem',
		fontWeight: 700,
		fontVariantNumeric: 'tabular-nums',
	},
	questionCard: {
		flex: 1,
		padding: '1.5rem',
		overflowY: 'auto',
	},
	questionHeader: {
		marginBottom: '1.5rem',
		borderBottom: '1px solid var(--border)',
		paddingBottom: '1rem',
	},
	questionNumber: {
		fontSize: 13,
		fontWeight: 600,
		color: 'var(--text-muted)',
		margin: '0 0 8px 0',
	},
	questionText: {
		fontSize: '1.1rem',
		lineHeight: 1.6,
		margin: 0,
		color: 'var(--text)',
	},
	marksBadge: {
		float: 'right',
		background: 'var(--bg-alt)',
		color: 'var(--primary)',
		borderRadius: 20,
		padding: '4px 10px',
		fontSize: 12,
		fontWeight: 700,
	},
	answerArea: { paddingTop: '1rem' },
	// MCQ
	mcqOption: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		padding: '14px 16px',
		cursor: 'pointer',
		background: 'var(--bg-alt)',
		border: '1px solid var(--border)',
		borderRadius: '12px',
		transition: 'all 0.2s',
	},
	mcqOptionChecked: {
		background: 'var(--primary-bg)',
		borderColor: 'var(--primary-border)',
		boxShadow: '0 0 0 1px var(--primary)',
	},
	mcqRadioBubble: {
		width: 20,
		height: 20,
		borderRadius: 999,
		border: '2px solid var(--border)',
		background: 'var(--surface)',
		transition: 'all 0.2s',
		flexShrink: 0,
	},
	mcqRadioBubbleChecked: {
		borderColor: 'var(--primary)',
		background: 'var(--primary)',
		boxShadow: '0 0 0 3px var(--surface) inset',
	},
	// Subjective
	textarea: {
		width: '100%',
		padding: '12px',
		background: 'var(--bg-alt)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		fontFamily: 'inherit',
		fontSize: '1rem',
		lineHeight: 1.7,
		resize: 'vertical',
		minHeight: '200px',
	},
	wordCount: {
		textAlign: 'right',
		fontSize: 12,
		fontWeight: 600,
		color: 'var(--text-muted)',
		padding: '4px 0',
	},
	// Sidebar
	paletteContainer: {
		border: '1px solid var(--border)',
		borderRadius: '12px',
		padding: '1rem',
		background: 'var(--surface)',
		overflowY: 'auto',
		flex: 1,
	},
	paletteGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fill, minmax(42px, 1fr))',
		gap: '10px',
	},
	paletteButton: {
		aspectRatio: '1',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		cursor: 'pointer',
		fontSize: 14,
		fontWeight: 700,
		transition: 'all 0.2s',
	},
	paletteCurrent: {
		outline: '3px solid var(--primary)',
		outlineOffset: '2px',
		transform: 'scale(1.05)',
	},
	legend: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: '0.5rem',
		fontSize: '12px',
		marginTop: '1rem',
		color: 'var(--text-muted)',
	},
	legendItem: { display: 'flex', alignItems: 'center', gap: '6px' },
	legendColor: {
		width: '12px',
		height: '12px',
		borderRadius: '3px',
		border: '1px solid var(--border)',
	},
	statusInfo: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: '12px',
		padding: '1rem',
	},
	statusText: { margin: '4px 0', fontSize: 13, color: 'var(--text-muted)' },
	submitButton: {
		padding: '16px',
		fontSize: '1rem',
		fontWeight: 'bold',
		cursor: 'pointer',
		background: 'var(--danger)',
		color: 'white',
		border: 'none',
		borderRadius: '12px',
		boxShadow: 'var(--shadow-md)',
	},
	// Bottom Nav
	navButton: {
		padding: '10px 16px',
		fontSize: '14px',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--bg-alt)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '10px',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
	},
	arrow: { fontSize: '1.2rem', lineHeight: 1 },
	nextBtn: { background: 'var(--primary)', color: 'white' },
	reviewBtnActive: { background: 'var(--review)', color: 'white' },
	mobileCenterNav: { display: 'none' },
	// Modals & Overlays
	modalBackdrop: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.6)',
		backdropFilter: 'blur(8px)',
		zIndex: 100,
		display: 'grid',
		placeItems: 'center',
		padding: 16,
	},
	modalContent: {
		background: 'var(--surface)',
		borderRadius: '16px',
		padding: '1rem',
		width: 'min(90vw, 480px)',
		boxShadow: 'var(--shadow-xl)',
	},
	modalHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		padding: '0 0.5rem 1rem 0.5rem',
		borderBottom: '1px solid var(--border)',
	},
	modalCloseBtn: {
		background: 'transparent',
		border: 0,
		fontSize: '1.5rem',
		cursor: 'pointer',
		color: 'var(--text-muted)',
	},
	violationBox: {
		background: 'var(--surface)',
		padding: 'clamp(1.5rem, 5vw, 2.5rem)',
		borderRadius: '16px',
		textAlign: 'center',
		maxWidth: '500px',
		width: '100%',
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-xl)',
	},
	violationButton: {
		padding: '12px 24px',
		fontSize: '1rem',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--danger)',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		width: '100%',
	},
	submitSummary: {
		background: 'var(--bg-alt)',
		border: '1px solid var(--border)',
		borderRadius: '12px',
		padding: '1rem',
		display: 'grid',
		gap: '12px',
		textAlign: 'left',
	},
	summaryItem: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		fontSize: 14,
	},
	cancelButton: {
		padding: '12px 24px',
		fontSize: '1rem',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--bg-alt)',
		color: 'var(--text)',
		border: '1px solid var(--border)',
		borderRadius: '8px',
		flex: 1,
	},
	confirmButton: {
		padding: '12px 24px',
		fontSize: '1rem',
		fontWeight: 700,
		cursor: 'pointer',
		background: 'var(--danger)',
		color: 'white',
		border: 'none',
		borderRadius: '8px',
		flex: 1,
	},
};

// Media query for responsive design
const mediaQuery = `
  :root {
    --success: #10b981; --success-bg: rgba(16,185,129,0.1); --success-border: rgba(16,185,129,0.2);
    --warning: #f59e0b; --warning-bg: rgba(245,158,11,0.1); --warning-border: rgba(245,158,11,0.2);
    --danger: #ef4444;
    --review: #8b5cf6; --review-bg: rgba(139,92,246,0.1); --review-border: rgba(139,92,246,0.2);
    --bg-alt: var(--theme-elevation-1);
  }
  .hide-on-mobile { display: inline-block; }
  .show-on-mobile { display: none !important; }
  @media (max-width: 900px) {
    .examLayout { 
      grid-template-columns: 1fr !important; 
      padding: 0 !important;
      padding-bottom: 70px !important; /* Space for bottom nav */
    }
    .statusBar { display: none !important; }
    .hide-on-mobile { display: none !important; }
    .show-on-mobile { display: inline-flex !important; }
    
    .questionPanel { border-radius: 0; border-left: 0; border-right: 0; }
    .questionPanelHeader { display: none; }
    .bottomNav {
      padding: 8px;
      gap: 8px;
    }
    .mobileCenterNav {
      display: flex !important;
      flex-direction: column;
      gap: 4px;
      text-align: center;
    }
    .mobileTimer {
      font-size: 14px;
      font-weight: 700;
      background: transparent; border: 0; color: var(--text);
      padding: 0;
    }
    .mobilePaletteBtn {
      font-size: 12px;
      font-weight: 600;
      background: var(--bg-alt);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 2px 8px;
      color: var(--text-muted);
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
