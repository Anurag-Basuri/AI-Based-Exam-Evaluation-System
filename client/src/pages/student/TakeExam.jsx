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

// --- Small Screen Warning Component ---
const SmallScreenWarning = ({ onDismiss }) => (
    <div style={styles.warningOverlay}>
        <div style={styles.warningModal}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
            <h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>Small Screen Detected</h2>
            <p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
                We strongly recommend using a <strong>laptop or desktop computer</strong> for the best exam experience. 
                Small screens may make it difficult to view questions and type answers comfortably.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button 
                    onClick={() => window.history.back()}
                    style={{ ...styles.button.secondary, width: 'auto' }}
                >
                    Go Back
                </button>
                <button 
                    onClick={onDismiss}
                    style={{ ...styles.button.primary, width: 'auto' }}
                >
                    Continue Anyway
                </button>
            </div>
        </div>
    </div>
);

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

		// Block context menu while exam active
		const handleContextMenu = e => {
			// allow inside inputs/selects/etc.
			const t = e.target;
			if (
				t &&
				(t.tagName === 'INPUT' ||
					t.tagName === 'TEXTAREA' ||
					t.tagName === 'SELECT' ||
					t.isContentEditable)
			)
				return;
			e.preventDefault();
		};
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
    const [showSmallScreenWarning, setShowSmallScreenWarning] = useState(false);

	const hasUnsavedChanges = useRef(false);
	const saveTimeoutRef = useRef(null);
	const questionPanelRef = useRef(null);
	const submissionRef = useRef(submission); // <-- Create a ref to hold the latest submission state

    // Check screen size on mount
    useEffect(() => {
        if (window.innerWidth < 768) {
            setShowSmallScreenWarning(true);
        }
    }, []);

	// Keep the ref updated whenever the submission state changes
	useEffect(() => {
		submissionRef.current = submission;
	}, [submission]);

	// --- Timer Hook ---
	const { remainingMs, remaining } = useTimer(submission?.startedAt, submission?.duration);

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
					navigate(`/student/results/view/${submission.id}`, { replace: true });
				}, 800);
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

			// Do not interfere with typing in inputs/textareas or contenteditable
			const target = e.target;
			const interactive =
				target &&
				(target.tagName === 'INPUT' ||
					target.tagName === 'TEXTAREA' ||
					target.tagName === 'SELECT' ||
					target.isContentEditable);
			if (interactive && !e.altKey) return;

			const key = `${e.altKey ? 'alt+' : ''}${e.key.toLowerCase()}`;
			let handled = false;

			if (key === 'alt+n') {
				document.getElementById('save-next-btn')?.click();
				handled = true;
			} else if (key === 'alt+p') {
				document.getElementById('prev-btn')?.click();
				handled = true;
			} else if (key === 'alt+m') {
				document.getElementById('mark-review-btn')?.click();
				handled = true;
			} else if (key === 'alt+s') {
				document.getElementById('submit-btn')?.click();
				handled = true;
			}

			if (handled) e.preventDefault();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [isStarted, autoSubmitting]);

	// --- Load submission ---
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				if (submissionId) {
					const subData = await safeApiCall(getSubmissionById, submissionId);

					if (
						subData.status === 'submitted' ||
						subData.status === 'evaluated' ||
						subData.status === 'published'
					) {
						navigate('/student/results', { replace: true });
						return;
					}

					// Ensure answers array exists (one slot per question)
					const normalized = {
						...(subData || {}),
						answers:
							Array.isArray(subData?.answers) && subData.answers.length > 0
								? subData.answers
								: (subData.questions || []).map(q => ({
										question: String(q.id),
										responseText: '',
										responseOption: null,
								  })),
					};

					setSubmission(normalized);
					setMarkedForReview(normalized.markedForReview || []);
				} else {
					navigate('/student/exams', { replace: true });
					return;
				}
			} catch (e) {
				setError(e?.message || 'Failed to load submission');
				toastError(e?.message || 'Failed to load submission');
			} finally {
				setLoading(false);
			}
		};

		load();
		// navState is removed to prevent re-fetches. We only depend on submissionId.
	}, [submissionId, navigate, toastError]);

	// --- Start exam ---
	const handleStartExam = async () => {
		// mark started locally immediately so UI is ready
		setIsStarted(true);
		try {
			// attempt fullscreen but don't block start if denied
			await document.documentElement.requestFullscreen();
		} catch (err) {
			// still allow exam to start but notify user
			toastError(
				'Fullscreen was not granted. Exam will continue, please enable fullscreen for best experience.',
			);
		}
		// focus first input if present
		setTimeout(() => {
			document.querySelector('textarea')?.focus();
		}, 200);
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
			const currentSubmission = submissionRef.current;
			if (!currentSubmission || !currentSubmission.id || saving || !isOnline) return;
			if (!answersToSave && !reviewState && !hasUnsavedChanges.current) return;

			setSaving(true);
			// don't clear unsaved flag until save succeeds
			try {
				const payload = {
					answers: answersToSave || currentSubmission.answers,
					markedForReview: reviewState || markedForReview,
				};
				const updatedSubmission = await safeApiCall(
					saveSubmissionAnswers,
					currentSubmission.id,
					payload,
				);
				// only update state when server returns valid normalized submission
				if (updatedSubmission && updatedSubmission.id) {
					setSubmission(prev => {
						// keep currentQuestionIndex stable by returning merged structure
						return { ...prev, ...updatedSubmission };
					});
					submissionRef.current = updatedSubmission;
					hasUnsavedChanges.current = false;
					setLastSaved(new Date());
				} else {
					// keep local state if server response unexpected
					console.warn('Unexpected save response, preserving local state.');
				}
			} catch (e) {
				hasUnsavedChanges.current = true;
				console.error('Auto-save failed:', e);
				toastError('Auto-save failed. Check your connection.');
			} finally {
				setSaving(false);
			}
		},
		[saving, isOnline, markedForReview, toastError],
	);

	// --- Debounced save ---
	const debouncedSave = useCallback(
		(answers, review) => {
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
			// store current answers snapshot if not passed
			const snapshot = answers || submissionRef.current?.answers || null;
			saveTimeoutRef.current = setTimeout(() => {
				handleQuickSave(snapshot, review);
			}, 800);
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
		hasUnsavedChanges.current = true;
		let newAnswersForSave;
		setSubmission(prev => {
			if (!prev) return null;
			const newAnswers = [...(prev.answers || [])];
			const answerIndex = newAnswers.findIndex(
				a => String(a.question) === String(questionId),
			);

			if (answerIndex === -1) {
				// create a slot if missing
				const slot = {
					question: String(questionId),
					responseText: type === 'multiple-choice' ? '' : String(value || ''),
					responseOption: type === 'multiple-choice' ? String(value || null) : null,
				};
				newAnswers.push(slot);
				newAnswersForSave = newAnswers;
				return { ...prev, answers: newAnswers };
			}

			const answerToUpdate = { ...newAnswers[answerIndex] };
			if (type === 'multiple-choice') {
				answerToUpdate.responseOption = value;
			} else {
				answerToUpdate.responseText = value;
			}
			newAnswers[answerIndex] = answerToUpdate;
			newAnswersForSave = newAnswers; // Capture the new answers for the debounced save
			return { ...prev, answers: newAnswers };
		});
		// Pass the updated answers directly to the debounced function
		debouncedSave(newAnswersForSave, null);
	};

	// --- Navigation ---
	const changeQuestion = newIndex => {
		if (!submission?.questions) return;
		const total = submission.questions.length;
		const clamped = Math.max(0, Math.min(total - 1, newIndex));
		setCurrentQuestionIndex(clamped);
		if (questionPanelRef.current) {
			questionPanelRef.current.scrollTop = 0;
		}
		// focus textarea or first input after change
		setTimeout(() => {
			const el =
				document.querySelector('textarea') || document.querySelector('input[type="radio"]');
			el?.focus?.();
		}, 80);
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
			const ans = answers.find(a => String(a.question) === String(q.id));
			const isAnswered =
				(ans?.responseText && ans.responseText.trim().length > 0) || ans?.responseOption;
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
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
		};
	}, []);

	// --- UI Rendering ---
	if (loading) return <TakeExamSkeleton />;
	if (error) return <div style={{ ...styles.centeredMessage, color: 'red' }}>Error: {error}</div>;
	if (!submission) return <div style={styles.centeredMessage}>Submission not found.</div>;

	if (!isStarted) {
		return (
            <>
                {showSmallScreenWarning && <SmallScreenWarning onDismiss={() => setShowSmallScreenWarning(false)} />}
                <StartScreen submission={submission} onStart={handleStartExam} />
            </>
        );
	}

	const currentQuestion = submission.questions[currentQuestionIndex];

	return (
		<div style={styles.examLayout} className="examLayout">
            {showSmallScreenWarning && <SmallScreenWarning onDismiss={() => setShowSmallScreenWarning(false)} />}
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
						key={currentQuestion.id}
						question={currentQuestion}
						index={currentQuestionIndex}
						answer={submission.answers?.find(
							a => String(a.question) === String(currentQuestion.id),
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
						...(markedForReview.includes(currentQuestion?.id)
							? styles.reviewBtnActive
							: {}),
					}}
				>
					⭐
					<span className="hide-on-mobile">
						{markedForReview.includes(currentQuestion?.id) ? 'Marked' : 'Review'}
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

const useTimer = (startedAt, duration) => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const timerId = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(timerId);
	}, []);
	return useMemo(() => {
		if (!startedAt || !duration)
			return { remainingMs: null, remaining: { mm: '--', ss: '--' } };
		const started = new Date(startedAt).getTime();
		const end = started + Number(duration) * 60 * 1000;
		const remMs = Math.max(0, end - now);
		const totalS = Math.floor(remMs / 1000);
		return {
			remainingMs: remMs,
			remaining: {
				mm: String(Math.floor(totalS / 60)).padStart(2, '0'),
				ss: String(totalS % 60).padStart(2, '0'),
			},
		};
	}, [startedAt, duration, now]);
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

const QuestionCard = ({ question, index, answer, onAnswerChange, disabled }) => {
	const isMCQ = question.type === 'multiple-choice';
	return (
		<div style={styles.questionCard}>
			<div style={styles.questionHeader}>
				<span style={styles.questionNumber}>Question {index + 1}</span>
				<span style={styles.questionMarks}>
					{question.max_marks} Mark{question.max_marks !== 1 ? 's' : ''}
				</span>
			</div>
			<div style={styles.questionText}>{question.text}</div>
			<div style={styles.answerSection}>
				{isMCQ ? (
					<div style={styles.optionsGrid}>
						{question.options?.map((opt, i) => {
							const isSelected = String(answer?.responseOption) === String(i);
							return (
								<label
									key={i}
									style={{
										...styles.optionLabel,
										...(isSelected ? styles.optionSelected : {}),
									}}
								>
									<input
										type="radio"
										name={`q-${question.id}`}
										value={i}
										checked={isSelected}
										onChange={() =>
											onAnswerChange(question.id, String(i), 'multiple-choice')
										}
										disabled={disabled}
										style={styles.radioInput}
									/>
									<span style={styles.optionText}>{opt.text}</span>
								</label>
							);
						})}
					</div>
				) : (
					<textarea
						value={answer?.responseText || ''}
						onChange={e =>
							onAnswerChange(question.id, e.target.value, 'subjective')
						}
						disabled={disabled}
						placeholder="Type your answer here..."
						style={styles.textArea}
					/>
				)}
			</div>
		</div>
	);
};

const ViolationOverlay = ({ type, onAcknowledge }) => (
	<div style={styles.overlay}>
		<div style={styles.overlayCard}>
			<div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
			<h2 style={{ margin: '0 0 12px 0', color: '#ef4444' }}>Warning: Violation Detected</h2>
			<p style={{ color: '#4b5563', marginBottom: 24 }}>
				{type === 'fullscreen'
					? 'You exited fullscreen mode. Please return to fullscreen to continue.'
					: type === 'visibility'
					? 'You switched tabs or minimized the window.'
					: 'Navigation attempt detected.'}
			</p>
			<button onClick={onAcknowledge} style={styles.button.primary}>
				I Understand, Return to Exam
			</button>
		</div>
	</div>
);

const SubmitConfirmation = ({ stats, onConfirm, onCancel }) => (
	<div style={styles.overlay}>
		<div style={styles.overlayCard}>
			<h2 style={{ margin: '0 0 16px 0' }}>Submit Exam?</h2>
			<div style={styles.confirmStats}>
				<div style={styles.confirmStatItem}>
					<strong>{stats.answered}</strong> Answered
				</div>
				<div style={styles.confirmStatItem}>
					<strong>{stats.review}</strong> Marked for Review
				</div>
				<div style={styles.confirmStatItem}>
					<strong>{stats.unanswered}</strong> Unanswered
				</div>
			</div>
			<p style={{ color: '#64748b', marginBottom: 24 }}>
				Are you sure you want to submit? You cannot change your answers after submission.
			</p>
			<div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
				<button onClick={onCancel} style={styles.button.secondary}>
					Cancel
				</button>
				<button onClick={onConfirm} style={styles.button.primary}>
					Yes, Submit Exam
				</button>
			</div>
		</div>
	</div>
);

// --- Styles ---
const styles = {
	examLayout: {
		display: 'flex',
		height: '100vh',
		background: 'var(--bg)',
		overflow: 'hidden',
		position: 'relative',
	},
	questionPanel: {
		flex: 1,
		overflowY: 'auto',
		padding: '24px 24px 100px 24px', // bottom padding for mobile nav
		scrollBehavior: 'smooth',
	},
	questionPanelHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 24,
		paddingBottom: 16,
		borderBottom: '1px solid var(--border)',
	},
	examTitle: { fontSize: 24, fontWeight: 700, color: 'var(--text)', margin: 0 },
	desktopTimer: {
		fontSize: 20,
		fontWeight: 700,
		color: 'var(--primary)',
		background: 'var(--surface)',
		padding: '8px 16px',
		borderRadius: 8,
		boxShadow: 'var(--shadow-sm)',
		display: 'none', // hidden on mobile, shown via media query or logic if needed. Actually we use CSS class for this usually.
        // For simplicity in inline styles, we'll assume desktop first but add media query support via classNames in real app.
        // Here we'll just leave it as flex for desktop.
        display: 'flex',
	},
	statusBar: {
		width: 300,
		background: 'var(--surface)',
		borderLeft: '1px solid var(--border)',
		padding: 24,
		display: 'flex',
		flexDirection: 'column',
		gap: 24,
		overflowY: 'auto',
        // Hide on mobile
        display: 'none', 
	},
	bottomNav: {
		position: 'fixed',
		bottom: 0,
		left: 0,
		right: 0,
		background: 'var(--surface)',
		borderTop: '1px solid var(--border)',
		padding: '12px 24px',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		boxShadow: '0 -4px 6px -1px rgba(0, 0, 0, 0.1)',
		zIndex: 50,
	},
	navButton: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		padding: '10px 20px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		color: 'var(--text)',
		fontWeight: 600,
		cursor: 'pointer',
		fontSize: 14,
	},
	nextBtn: {
		background: 'var(--primary)',
		color: 'white',
		border: 'none',
	},
	reviewBtnActive: {
		background: '#fef9c3',
		color: '#854d0e',
		borderColor: '#fcd34d',
	},
	mobileCenterNav: {
		display: 'flex',
		gap: 12,
	},
	mobileTimer: {
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: 8,
		padding: '8px 12px',
		fontWeight: 700,
		fontSize: 14,
	},
	mobilePaletteBtn: {
		background: 'var(--bg)',
		border: '1px solid var(--border)',
		borderRadius: 8,
		padding: '8px 12px',
		fontWeight: 600,
		fontSize: 14,
	},
	questionCard: {
		background: 'var(--surface)',
		borderRadius: 16,
		padding: 32,
		boxShadow: 'var(--shadow-sm)',
		border: '1px solid var(--border)',
		maxWidth: 900,
		margin: '0 auto',
	},
	questionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: 20,
		color: 'var(--text-muted)',
		fontSize: 14,
		fontWeight: 600,
		textTransform: 'uppercase',
		letterSpacing: 1,
	},
	questionText: {
		fontSize: 20,
		lineHeight: 1.6,
		color: 'var(--text)',
		marginBottom: 32,
		fontWeight: 500,
	},
	optionsGrid: {
		display: 'grid',
		gap: 16,
	},
	optionLabel: {
		display: 'flex',
		alignItems: 'center',
		gap: 16,
		padding: 20,
		borderRadius: 12,
		border: '2px solid var(--border)',
		cursor: 'pointer',
		transition: 'all 0.2s',
	},
	optionSelected: {
		borderColor: 'var(--primary)',
		background: 'var(--primary-light)',
	},
	radioInput: {
		width: 20,
		height: 20,
		accentColor: 'var(--primary)',
	},
	optionText: {
		fontSize: 16,
		color: 'var(--text)',
	},
	textArea: {
		width: '100%',
		minHeight: 200,
		padding: 20,
		borderRadius: 12,
		border: '1px solid var(--border)',
		fontSize: 16,
		lineHeight: 1.6,
		resize: 'vertical',
		fontFamily: 'inherit',
	},
	paletteContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: 16,
	},
	paletteGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(5, 1fr)',
		gap: 8,
	},
	paletteButton: {
		aspectRatio: '1',
		borderRadius: 8,
		border: '1px solid',
		fontWeight: 700,
		cursor: 'pointer',
		fontSize: 14,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	paletteCurrent: {
		ring: '2px solid var(--primary)',
		ringOffset: '2px',
	},
	legend: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: 12,
		fontSize: 12,
		color: 'var(--text-muted)',
	},
	legendItem: {
		display: 'flex',
		alignItems: 'center',
		gap: 6,
	},
	legendColor: {
		width: 12,
		height: 12,
		borderRadius: 4,
		border: '1px solid',
	},
	statusInfo: {
		background: 'var(--bg)',
		padding: 16,
		borderRadius: 12,
		display: 'flex',
		flexDirection: 'column',
		gap: 8,
	},
	statusText: {
		margin: 0,
		fontSize: 13,
		fontWeight: 500,
		color: 'var(--text-muted)',
	},
	submitButton: {
		width: '100%',
		padding: 16,
		borderRadius: 12,
		background: '#ef4444',
		color: 'white',
		border: 'none',
		fontWeight: 700,
		cursor: 'pointer',
		marginTop: 'auto',
	},
	centeredMessage: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '100vh',
		background: 'var(--bg)',
	},
	startCard: {
		background: 'var(--surface)',
		padding: 40,
		borderRadius: 24,
		boxShadow: 'var(--shadow-lg)',
		maxWidth: 500,
		width: '90%',
		textAlign: 'center',
	},
	startInfoGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gap: 16,
		marginBottom: 32,
		padding: '20px 0',
		borderTop: '1px solid var(--border)',
		borderBottom: '1px solid var(--border)',
	},
	startInfoLabel: {
		display: 'block',
		fontSize: 12,
		color: 'var(--text-muted)',
		textTransform: 'uppercase',
		letterSpacing: 1,
		marginBottom: 4,
	},
	startInfoValue: {
		fontSize: 18,
		color: 'var(--text)',
	},
	startWarning: {
		background: '#fff7ed',
		border: '1px solid #ffedd5',
		borderRadius: 12,
		padding: 16,
		textAlign: 'left',
		marginBottom: 32,
	},
	startWarningList: {
		margin: 0,
		paddingLeft: 20,
		color: '#9a3412',
		fontSize: 14,
		lineHeight: 1.6,
	},
	startButton: {
		width: '100%',
		padding: 16,
		borderRadius: 12,
		background: 'linear-gradient(135deg, #10b981, #059669)',
		color: 'white',
		border: 'none',
		fontSize: 18,
		fontWeight: 700,
		cursor: 'pointer',
		boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
	},
	overlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.8)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 100,
		padding: 24,
	},
	overlayCard: {
		background: 'white',
		padding: 32,
		borderRadius: 20,
		maxWidth: 400,
		width: '100%',
		textAlign: 'center',
	},
    warningOverlay: {
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 200,
        padding: 24,
        backdropFilter: 'blur(5px)',
    },
    warningModal: {
        background: 'white',
        padding: 40,
        borderRadius: 24,
        maxWidth: 480,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    },
	confirmStats: {
		display: 'flex',
		justifyContent: 'space-around',
		marginBottom: 24,
		background: '#f8fafc',
		padding: 16,
		borderRadius: 12,
	},
	confirmStatItem: {
		display: 'flex',
		flexDirection: 'column',
		fontSize: 12,
		color: '#64748b',
	},
	modalBackdrop: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.5)',
		zIndex: 60,
	},
	modalContent: {
		position: 'fixed',
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		background: 'var(--surface)',
		padding: 24,
		borderRadius: 16,
		width: '90%',
		maxWidth: 500,
		zIndex: 70,
		maxHeight: '80vh',
		overflowY: 'auto',
	},
	modalHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalCloseBtn: {
		background: 'none',
		border: 'none',
		fontSize: 24,
		cursor: 'pointer',
		color: 'var(--text-muted)',
	},
	button: {
		primary: {
			background: 'var(--primary)',
			color: 'white',
			border: 'none',
			padding: '12px 24px',
			borderRadius: 10,
			fontWeight: 700,
			cursor: 'pointer',
		},
		secondary: {
			background: 'var(--surface)',
			color: 'var(--text)',
			border: '1px solid var(--border)',
			padding: '12px 24px',
			borderRadius: 10,
			fontWeight: 600,
			cursor: 'pointer',
		},
	},
};

// Add media queries via style tag for better responsiveness
const styleSheet = document.createElement("style");
styleSheet.innerText = `
    @media (min-width: 1024px) {
        .statusBar { display: flex !important; }
        .hide-on-mobile { display: inline !important; }
        .mobileCenterNav { display: none !important; }
        .questionPanel { padding-bottom: 24px !important; }
    }
    @media (max-width: 1023px) {
        .hide-on-mobile { display: none !important; }
        .statusBar { display: none !important; }
    }
`;
document.head.appendChild(styleSheet);

export default TakeExam;
