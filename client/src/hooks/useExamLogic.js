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

// ── Blocked keys ──────────────────────────────────────────────────
const BLOCKED_KEYS = new Set(['F12', 'PrintScreen']);

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
	const violationThrottleRef = useRef(0);
	// Track the save generation: incremented every time the user edits an answer.
	// When a save completes, we only overwrite submission state if no newer edits
	// happened while the network call was in-flight. This prevents the "vanishing
	// text" bug where a slow API response clobbers keystrokes typed during save.
	const answerEditGenRef = useRef(0);

	// Keep ref in sync
	useEffect(() => {
		submissionRef.current = submission;
	}, [submission]);

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

			// Throttle: max 1 violation per 2 seconds
			const now = Date.now();
			if (now - violationThrottleRef.current < 2000) return;
			violationThrottleRef.current = now;

			setViolations(prev => {
				const newCount = (prev?.count || 0) + 1;
				setViolationOverlay(type);

				if (submissionId) {
					apiClient
						.post(`/api/submissions/${submissionId}/violation`, { type })
						.catch(() => {});
				}

				if (newCount > MAX_VIOLATIONS) {
					finalSubmit(true, `Exceeded warning limit (${MAX_VIOLATIONS} violations). Auto-submitting.`);
				}

				return { count: newCount, lastType: type };
			});
		},
		[submissionId, autoSubmitting, finalSubmit],
	);

	// ═══════════════════════════════════════════════════════════════
	// ENVIRONMENT MONITORING
	// ═══════════════════════════════════════════════════════════════
	useEffect(() => {
		if (!isStarted || autoSubmitting) return;

		const onFullscreenChange = () => {
			try { if (!document.fullscreenElement) handleViolation('fullscreen'); } catch { /* */ }
		};

		const onVisibilityChange = () => {
			try { if (document.hidden) handleViolation('tab-switch'); } catch { /* */ }
		};

		const onWindowBlur = () => {
			try { if (!document.hidden) handleViolation('window-blur'); } catch { /* */ }
		};

		const onContextMenu = e => {
			try {
				const t = e.target;
				if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable)) return;
				e.preventDefault();
			} catch { /* */ }
		};

		const onCopyEvent = e => { e.preventDefault(); handleViolation('copy-attempt'); };
		const onCutEvent = e => { e.preventDefault(); handleViolation('copy-attempt'); };
		const onPasteEvent = e => {
			const t = e.target;
			if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT') && t.classList.contains('subjective-input')) return;
			e.preventDefault();
			handleViolation('paste-attempt');
		};

		const onKeyDown = e => {
			const key = e.key;
			const mod = e.ctrlKey || e.metaKey;
			const shift = e.shiftKey;

			if (BLOCKED_KEYS.has(key)) { e.preventDefault(); e.stopPropagation(); if (key === 'F12') handleViolation('devtools-attempt'); if (key === 'PrintScreen') handleViolation('screenshot-attempt'); return; }
			if (mod && shift && ['I', 'i', 'J', 'j', 'C', 'c'].includes(key)) { e.preventDefault(); e.stopPropagation(); handleViolation('devtools-attempt'); return; }
			if (mod && (key === 'u' || key === 'U')) { e.preventDefault(); e.stopPropagation(); handleViolation('devtools-attempt'); return; }
			if (mod && (key === 'p' || key === 'P')) { e.preventDefault(); e.stopPropagation(); return; }
			if (mod && (key === 's' || key === 'S')) { e.preventDefault(); return; }
			if (mod && (key === 'a' || key === 'A')) {
				const t = e.target;
				if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return;
				e.preventDefault(); return;
			}
			if (mod && ['c', 'C', 'x', 'X'].includes(key)) {
				const t = e.target;
				if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) return;
				e.preventDefault(); handleViolation('copy-attempt'); return;
			}
		};

		const devtoolsCheckId = setInterval(() => {
			const widthDiff = window.outerWidth - window.innerWidth;
			const heightDiff = window.outerHeight - window.innerHeight;
			if (widthDiff > 200 || heightDiff > 200) handleViolation('devtools-open');
		}, 5000);

		document.addEventListener('fullscreenchange', onFullscreenChange);
		document.addEventListener('visibilitychange', onVisibilityChange);
		window.addEventListener('blur', onWindowBlur);
		document.addEventListener('contextmenu', onContextMenu);
		document.addEventListener('copy', onCopyEvent);
		document.addEventListener('cut', onCutEvent);
		document.addEventListener('paste', onPasteEvent);
		document.addEventListener('keydown', onKeyDown, true);

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

	// --- Beforeunload Guard ---
	useEffect(() => {
		if (!isStarted || autoSubmitting) return;
		const onBeforeUnload = e => { e.preventDefault(); e.returnValue = ''; return ''; };
		window.addEventListener('beforeunload', onBeforeUnload);
		return () => window.removeEventListener('beforeunload', onBeforeUnload);
	}, [isStarted, autoSubmitting]);

	// --- Cleanup on unmount ---
	useEffect(() => {
		return () => {
			try {
				if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
				pendingSave.current = null;
			} catch { /* */ }
		};
	}, []);

	// ═══════════════════════════════════════════════════════════════
	// SAVE LOGIC — Fixed: no longer overwrites live textarea content
	// ═══════════════════════════════════════════════════════════════
	const handleQuickSave = useCallback(
		async (answersToSave, reviewState) => {
			const currentSubmission = submissionRef.current;
			if (!currentSubmission?.id || !isOnline) return;

			const snapshotAnswers = answersToSave ? JSON.parse(JSON.stringify(answersToSave)) : null;
			const snapshotReview = reviewState ? (Array.isArray(reviewState) ? reviewState.map(String) : []) : null;

			if (saving) {
				pendingSave.current = { answers: snapshotAnswers, reviewState: snapshotReview };
				return;
			}

			if (!snapshotAnswers && !snapshotReview && !hasUnsavedChanges.current && !pendingSave.current) return;

			setSaving(true);

			// Capture the edit generation BEFORE the network call. If the user types
			// anything while the call is in flight, answerEditGenRef will be bumped
			// by handleAnswerChange and genAtSave will be stale → we skip the state update.
			const genAtSave = answerEditGenRef.current;

			try {
				const finalAnswers = snapshotAnswers || pendingSave.current?.answers || currentSubmission.answers;
				const finalReview = snapshotReview || pendingSave.current?.reviewState || markedForReview;
				pendingSave.current = null;

				const updated = await safeApiCall(saveSubmissionAnswers, currentSubmission.id, {
					answers: finalAnswers,
					markedForReview: finalReview,
				});

				if (updated?.id) {
					// ─── KEY FIX: Only update submission state if the user has NOT
					// typed anything while the save was in-flight. If they have,
					// their local state is newer than the server response. ───
					if (answerEditGenRef.current === genAtSave) {
						updated.answers = Array.isArray(updated.answers)
							? updated.answers.map(a => ({
									...a,
									question: String(a.question),
									responseOption: a.responseOption ? String(a.responseOption) : null,
							  }))
							: updated.answers;
						setSubmissionState({ ...currentSubmission, ...updated });
					}
					// Either way, mark as saved
					hasUnsavedChanges.current = false;
					setLastSaved(new Date());
				}
			} catch (e) {
				hasUnsavedChanges.current = true;
				console.error('Auto-save failed', e);
			} finally {
				setSaving(false);
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
		try {
			await document.documentElement.requestFullscreen?.();
		} catch {
			toastError('Could not enter fullscreen. Please enable fullscreen for best experience.');
		} finally {
			setIsStarted(true);
		}
	};

	const handleAnswerChange = (questionId, value, type) => {
		hasUnsavedChanges.current = true;
		// Bump the edit generation so in-flight saves know not to overwrite
		answerEditGenRef.current += 1;

		let newAnswersForSave;
		setSubmissionState(prev => {
			if (!prev) return prev;
			const newAnswers = Array.isArray(prev.answers) ? [...prev.answers] : [];
			const qid = String(questionId);
			const idx = newAnswers.findIndex(a => String(a.question) === qid);

			if (idx === -1) {
				newAnswers.push({
					question: qid,
					responseText: type === 'multiple-choice' ? '' : String(value || ''),
					responseOption: type === 'multiple-choice' ? String(value || null) : null,
				});
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
		submission, loading, error, isStarted,
		currentQuestionIndex, setCurrentQuestionIndex,
		markedForReview, violations, violationOverlay, setViolationOverlay,
		saving, lastSaved, isOnline,
		showSubmitConfirm, setShowSubmitConfirm,
		showSmallScreenWarning, setShowSmallScreenWarning,
		timer, handleStartExam, handleAnswerChange,
		toggleReview, finalSubmit, handleQuickSave, autoSubmitting,
	};
};

// --- Timer ---
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
