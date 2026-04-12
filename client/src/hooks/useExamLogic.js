import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toaster.jsx';
import {
	safeApiCall,
	getSubmissionById,
	saveSubmissionAnswers,
	submitSubmission,
} from '../services/studentServices.js';
import { apiClient } from '../services/api.js';

const MAX_VIOLATIONS = 5;
const AUTO_SAVE_INTERVAL = 30000; // 30 seconds

// ── Blocked keyboard shortcuts ────────────────────────────────────
const BLOCKED_SHORTCUTS = new Set([
	'c', 'v', 'x', 'a',    // copy, paste, cut, select-all
	'p',                     // print
	's',                     // save
	'u',                     // view source
]);
const BLOCKED_KEYS = new Set([
	'F12', 'PrintScreen',
]);

export const useExamLogic = submissionId => {
	const navigate = useNavigate();
	const { success, error: toastError, info } = useToast();

	// --- State ---
	const [submission, setSubmission] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [isStarted, setIsStarted] = useState(false);
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
	const [markedForReview, setMarkedForReview] = useState([]);
	const [violations, setViolations] = useState({ count: 0, lastType: '' });
	const [violationOverlay, setViolationOverlay] = useState(null);
	const [saving, setSaving] = useState(false);
	const [autoSubmitting, setAutoSubmitting] = useState(false);
	const [lastSaved, setLastSaved] = useState(null);
	const [isOnline, setIsOnline] = useState(() =>
		typeof navigator !== 'undefined' ? navigator.onLine : true,
	);
	const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
	const [showSmallScreenWarning, setShowSmallScreenWarning] = useState(false);

	// --- Refs ---
	const hasUnsavedChanges = useRef(false);
	const saveTimeoutRef = useRef(null);
	const submissionRef = useRef(submission);
	const pendingSave = useRef(null);
	const violationThrottleRef = useRef(0); // timestamp of last violation

	// Keep ref updated
	useEffect(() => {
		submissionRef.current = submission;
	}, [submission]);

	// helper: always keep submission state + ref in sync
	const setSubmissionState = useCallback(newSubmission => {
		setSubmission(newSubmission);
		submissionRef.current = newSubmission;
	}, []);

	// --- Load Submission ---
	useEffect(() => {
		const load = async () => {
			setLoading(true);
			try {
				if (!submissionId) {
					navigate('/student/exams', { replace: true });
					return;
				}

				const subData = await safeApiCall(getSubmissionById, submissionId);

				if (['submitted', 'evaluated', 'published'].includes(subData.status)) {
					navigate('/student/results', { replace: true });
					return;
				}

				// Normalize answers (ensure strings for ids)
				const normalized = {
					...(subData || {}),
					answers:
						Array.isArray(subData?.answers) && subData.answers.length > 0
							? subData.answers.map(a => ({
									question: String(a.question ?? a.question?._id ?? a.questionId),
									responseText: a.responseText ?? '',
									responseOption: a.responseOption
										? String(a.responseOption._id ?? a.responseOption)
										: null,
							  }))
							: (subData.questions || []).map(q => ({
									question: String(q.id),
									responseText: '',
									responseOption: null,
							  })),
				};

				setSubmissionState(normalized);
				setMarkedForReview(
					Array.isArray(normalized.markedForReview)
						? normalized.markedForReview.map(id => String(id))
						: [],
				);
			} catch (e) {
				setError(e?.message || 'Failed to load submission');
				toastError(e?.message || 'Failed to load submission');
			} finally {
				setLoading(false);
			}
		};
		load();
	}, [submissionId, navigate, toastError, setSubmissionState]);

	// --- Timer ---
	const timer = useTimer(submission?.startedAt, submission?.duration);

	// --- Submit Logic ---
	const finalSubmit = useCallback(
		async (isAuto = false, reason = 'Submission confirmed.') => {
			if (!submission || autoSubmitting) return;
			setAutoSubmitting(true);

			if (isAuto) info(reason, { duration: 5000 });

			try {
				// Final save
				if (hasUnsavedChanges.current || pendingSave.current) {
					const finalAnswers = pendingSave.current?.answers || submission.answers || [];
					const finalReview = pendingSave.current?.reviewState || markedForReview;
					await safeApiCall(saveSubmissionAnswers, submission.id, {
						answers: finalAnswers,
						markedForReview: finalReview,
					});
				}

				await safeApiCall(submitSubmission, submission.id, {
					submissionType: isAuto ? 'auto' : 'manual',
				});

				if (document.fullscreenElement) {
					await document.exitFullscreen().catch(() => {});
				}

				success('Submission successful! Redirecting...');
				setTimeout(() => {
					navigate(`/student/results/view/${submission.id}`, { replace: true });
				}, 800);
			} catch (e) {
				toastError(e?.message || 'Failed to submit.');
				setAutoSubmitting(false);
			}
		},
		[submission, autoSubmitting, navigate, markedForReview, success, toastError, info],
	);

	// --- Auto-Submit on Time Expiry ---
	useEffect(() => {
		if (timer.remainingMs === 0 && isStarted && !autoSubmitting) {
			finalSubmit(true, 'Time expired — your exam has been auto-submitted.');
		}
	}, [timer.remainingMs, isStarted, autoSubmitting, finalSubmit]);

	// ═══════════════════════════════════════════════════════════════
	// VIOLATION HANDLING
	// ═══════════════════════════════════════════════════════════════
	const handleViolation = useCallback(
		type => {
			if (autoSubmitting) return;

			// Throttle: max 1 violation per 2 seconds to prevent spam
			const now = Date.now();
			if (now - violationThrottleRef.current < 2000) return;
			violationThrottleRef.current = now;

			setViolations(prev => {
				const newCount = (prev?.count || 0) + 1;

				// Show overlay immediately
				setViolationOverlay(type);

				// Notify server (fire-and-forget)
				if (submissionId) {
					apiClient
						.post(`/api/submissions/${submissionId}/violation`, { type })
						.catch(() => {});
				}

				// Auto-submit when exceeding threshold
				if (newCount > MAX_VIOLATIONS) {
					finalSubmit(true, `Exceeded warning limit (${MAX_VIOLATIONS} violations). Auto-submitting.`);
				}

				return { count: newCount, lastType: type };
			});
		},
		[submissionId, autoSubmitting, finalSubmit],
	);

	// ═══════════════════════════════════════════════════════════════
	// ENVIRONMENT MONITORING — Full security suite
	// ═══════════════════════════════════════════════════════════════
	useEffect(() => {
		if (!isStarted || autoSubmitting) return;

		// 1. Fullscreen exit detection
		const onFullscreenChange = () => {
			try {
				if (!document.fullscreenElement) handleViolation('fullscreen');
			} catch { /* noop */ }
		};

		// 2. Tab visibility change detection
		const onVisibilityChange = () => {
			try {
				if (document.hidden) handleViolation('tab-switch');
			} catch { /* noop */ }
		};

		// 3. Window blur detection (catches pop-over windows that visibilitychange misses)
		const onWindowBlur = () => {
			try {
				// Only fire if document is NOT hidden (visibilitychange handles that case)
				if (!document.hidden) handleViolation('window-blur');
			} catch { /* noop */ }
		};

		// 4. Right-click prevention
		const onContextMenu = e => {
			try {
				const t = e.target;
				// Allow right-click on inputs for accessibility
				if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return;
				e.preventDefault();
			} catch { /* noop */ }
		};

		// 5. Copy / Cut / Paste event interception
		const onCopyEvent = e => {
			e.preventDefault();
			handleViolation('copy-attempt');
		};
		const onCutEvent = e => {
			e.preventDefault();
			handleViolation('copy-attempt');
		};
		const onPasteEvent = e => {
			// Allow paste only inside textarea/input answer fields
			const t = e.target;
			if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') && t.classList.contains('subjective-input')) {
				// Allow paste in answer boxes — it's the student's choice to type or paste their own draft
				return;
			}
			e.preventDefault();
			handleViolation('paste-attempt');
		};

		// 6. Keyboard shortcut blocking
		const onKeyDown = e => {
			const key = e.key;
			const mod = e.ctrlKey || e.metaKey;
			const shift = e.shiftKey;

			// Block F12 and PrintScreen globally
			if (BLOCKED_KEYS.has(key)) {
				e.preventDefault();
				e.stopPropagation();
				if (key === 'F12') handleViolation('devtools-attempt');
				if (key === 'PrintScreen') handleViolation('screenshot-attempt');
				return;
			}

			// Block Ctrl/Cmd + Shift + I/J/C (DevTools)
			if (mod && shift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) {
				e.preventDefault();
				e.stopPropagation();
				handleViolation('devtools-attempt');
				return;
			}

			// Block Ctrl/Cmd + U (view source)
			if (mod && (key === 'u' || key === 'U')) {
				e.preventDefault();
				e.stopPropagation();
				handleViolation('devtools-attempt');
				return;
			}

			// Block Ctrl/Cmd + P (print)
			if (mod && (key === 'p' || key === 'P')) {
				e.preventDefault();
				e.stopPropagation();
				return; // just block, not a major violation
			}

			// Block Ctrl/Cmd + S (save page)
			if (mod && (key === 's' || key === 'S')) {
				e.preventDefault();
				return;
			}

			// Block Ctrl+A (select all) outside of text inputs
			if (mod && (key === 'a' || key === 'A')) {
				const t = e.target;
				if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return; // allow in answer fields
				e.preventDefault();
				return;
			}

			// Block Ctrl+C/X outside of text inputs
			if (mod && ['c', 'C', 'x', 'X'].includes(key)) {
				const t = e.target;
				if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) {
					// Even in inputs, log but don't block (they might be rearranging their own answer)
					return;
				}
				e.preventDefault();
				handleViolation('copy-attempt');
				return;
			}
		};

		// 7. DevTools size heuristic (check periodically)
		const devtoolsCheckId = setInterval(() => {
			const widthDiff = window.outerWidth - window.innerWidth;
			const heightDiff = window.outerHeight - window.innerHeight;
			// Typical browser chrome is ~0-100px; DevTools adds 200+
			if (widthDiff > 200 || heightDiff > 200) {
				handleViolation('devtools-open');
			}
		}, 5000);

		// --- Register all listeners ---
		document.addEventListener('fullscreenchange', onFullscreenChange);
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('blur', onWindowBlur);
		document.addEventListener('contextmenu', onContextMenu);
		document.addEventListener('copy', onCopyEvent);
		document.addEventListener('cut', onCutEvent);
		document.addEventListener('paste', onPasteEvent);
		document.addEventListener('keydown', onKeyDown, true); // capture phase

		return () => {
			document.removeEventListener('fullscreenchange', onFullscreenChange);
			document.removeEventListener('visibilitychange', onVisibilityChange);
			window.removeEventListener('blur', onWindowBlur);
			document.removeEventListener('contextmenu', onContextMenu);
			document.removeEventListener('copy', onCopyEvent);
			document.removeEventListener('cut', onCutEvent);
			document.removeEventListener('paste', onPasteEvent);
			document.removeEventListener('keydown', onKeyDown, true);
			clearInterval(devtoolsCheckId);
		};
	}, [isStarted, autoSubmitting, handleViolation]);

	// ═══════════════════════════════════════════════════════════════
	// BEFOREUNLOAD GUARD — Prevent accidental refresh/close
	// ═══════════════════════════════════════════════════════════════
	useEffect(() => {
		if (!isStarted || autoSubmitting) return;

		const onBeforeUnload = e => {
			e.preventDefault();
			// Standard way to trigger browser "Leave site?" dialog
			e.returnValue = '';
			return '';
		};

		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [isStarted, autoSubmitting]);

	// --- Cleanup on unmount: clear pending timers / saves ---
	useEffect(() => {
		return () => {
			try {
				if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
				pendingSave.current = null;
			} catch { /* noop */ }
		};
	}, []);

	// --- Save Logic ---
	const handleQuickSave = useCallback(
		async (answersToSave, reviewState) => {
			const currentSubmission = submissionRef.current;
			if (!currentSubmission?.id || !isOnline) return;

			// Don't mutate inputs later: take deep snapshot
			const snapshotAnswers = answersToSave
				? JSON.parse(JSON.stringify(answersToSave))
				: null;
			const snapshotReview = reviewState
				? Array.isArray(reviewState)
					? reviewState.map(String)
					: []
				: null;

			if (saving) {
				pendingSave.current = { answers: snapshotAnswers, reviewState: snapshotReview };
				return;
			}

			if (
				!snapshotAnswers &&
				!snapshotReview &&
				!hasUnsavedChanges.current &&
				!pendingSave.current
			)
				return;

			setSaving(true);
			try {
				const finalAnswers =
					snapshotAnswers || pendingSave.current?.answers || currentSubmission.answers;
				const finalReview =
					snapshotReview || pendingSave.current?.reviewState || markedForReview;
				// clear pending copy before network call to avoid infinite loop
				pendingSave.current = null;

				const updated = await safeApiCall(saveSubmissionAnswers, currentSubmission.id, {
					answers: finalAnswers,
					markedForReview: finalReview,
				});

				if (updated?.id) {
					// updated is normalized by service; ensure IDs are strings
					updated.answers = Array.isArray(updated.answers)
						? updated.answers.map(a => ({
								...a,
								question: String(a.question),
								responseOption: a.responseOption ? String(a.responseOption) : null,
						  }))
						: updated.answers;
					setSubmissionState({ ...currentSubmission, ...updated });
					hasUnsavedChanges.current = false;
					setLastSaved(new Date());
				}
			} catch (e) {
				hasUnsavedChanges.current = true;
				console.error('Auto-save failed', e);
			} finally {
				setSaving(false);
				// If another pending save was queued while saving, flush it
				if (pendingSave.current) {
					handleQuickSave(pendingSave.current.answers, pendingSave.current.reviewState);
				}
			}
		},
		[saving, isOnline, markedForReview, setSubmissionState],
	);

	const debouncedSave = useCallback(
		(answers, review) => {
			if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
			const snapshot = answers || submissionRef.current?.answers || null;
			saveTimeoutRef.current = setTimeout(() => {
				handleQuickSave(snapshot, review);
			}, 800);
		},
		[handleQuickSave],
	);

	// --- Actions ---
	const handleStartExam = async () => {
		// Try to enter fullscreen before marking started
		try {
			await document.documentElement.requestFullscreen?.();
		} catch (err) {
			toastError('Could not enter fullscreen. Please enable fullscreen for best experience.');
		} finally {
			setIsStarted(true);
		}
	};

	const handleAnswerChange = (questionId, value, type) => {
		hasUnsavedChanges.current = true;
		let newAnswersForSave;
		setSubmissionState(prev => {
			if (!prev) return prev;
			const newAnswers = Array.isArray(prev.answers) ? [...prev.answers] : [];
			const qid = String(questionId);
			const idx = newAnswers.findIndex(a => String(a.question) === qid);

			if (idx === -1) {
				const newAns = {
					question: qid,
					responseText: type === 'multiple-choice' ? '' : String(value || ''),
					responseOption: type === 'multiple-choice' ? String(value || null) : null,
				};
				newAnswers.push(newAns);
			} else {
				newAnswers[idx] = {
					...newAnswers[idx],
					[type === 'multiple-choice' ? 'responseOption' : 'responseText']:
						type === 'multiple-choice' ? String(value || null) : String(value || ''),
				};
			}
			newAnswersForSave = JSON.parse(JSON.stringify(newAnswers));
			return { ...prev, answers: newAnswers };
		});
		debouncedSave(newAnswersForSave, null);
	};

	const toggleReview = () => {
		const qId = String(submission?.questions?.[currentQuestionIndex]?.id);
		if (!qId) return;
		const newReview = markedForReview.includes(qId)
			? markedForReview.filter(id => id !== qId)
			: [...markedForReview, qId];
		setMarkedForReview(newReview);
		// keep submission.markedForReview in sync so sidebar/readers see it
		setSubmissionState(prev => (prev ? { ...prev, markedForReview: newReview } : prev));
		debouncedSave(null, newReview);
	};

	// --- Periodic Save ---
	useEffect(() => {
		if (!isStarted) return;
		const id = setInterval(() => handleQuickSave(null, markedForReview), AUTO_SAVE_INTERVAL);
		return () => clearInterval(id);
	}, [isStarted, handleQuickSave, markedForReview]);

	// --- Online Status ---
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

	// --- Screen Size Warning ---
	useEffect(() => {
		if (window.innerWidth < 768) setShowSmallScreenWarning(true);
	}, []);

	return {
		submission,
		loading,
		error,
		isStarted,
		currentQuestionIndex,
		setCurrentQuestionIndex,
		markedForReview,
		violations,
		violationOverlay,
		setViolationOverlay,
		saving,
		lastSaved,
		isOnline,
		showSubmitConfirm,
		setShowSubmitConfirm,
		showSmallScreenWarning,
		setShowSmallScreenWarning,
		timer,
		handleStartExam,
		handleAnswerChange,
		toggleReview,
		finalSubmit,
		handleQuickSave,
		autoSubmitting,
	};
};

// --- Timer Helper ---
const useTimer = (startedAt, duration) => {
	const [now, setNow] = useState(() => Date.now());
	useEffect(() => {
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);
	return useMemo(() => {
		if (!startedAt || !duration)
			return { remainingMs: null, remaining: { mm: '--', ss: '--' } };
		const end = new Date(startedAt).getTime() + Number(duration) * 60 * 1000;
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
