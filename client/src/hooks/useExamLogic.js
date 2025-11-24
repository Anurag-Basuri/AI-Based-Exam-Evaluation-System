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
			finalSubmit(true, 'Time expired.');
		}
	}, [timer.remainingMs, isStarted, autoSubmitting, finalSubmit]);

	// --- Violation Handling ---
	const handleViolation = useCallback(
		type => {
			const newCount = violations.count + 1;
			setViolations({ count: newCount, lastType: type });
			setViolationOverlay(type);

			apiClient
				.post(`/api/submissions/${submissionId}/violation`, { type })
				.catch(console.error);

			if (newCount > MAX_VIOLATIONS) {
				finalSubmit(true, `Exceeded warning limit (${MAX_VIOLATIONS} violations).`);
			}
		},
		[violations.count, submissionId, finalSubmit],
	);

	// --- Environment Monitoring ---
	useEffect(() => {
		if (!isStarted || autoSubmitting) return;

		const handleFullscreenChange = () => {
			if (!document.fullscreenElement) handleViolation('fullscreen');
		};
		const handleVisibilityChange = () => {
			if (document.hidden) handleViolation('visibility');
		};
		const handlePopState = () => {
			window.history.pushState(null, '', window.location.href);
			handleViolation('navigation');
		};
		const handleContextMenu = e => {
			const t = e.target;
			if (t && (['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName) || t.isContentEditable))
				return;
			e.preventDefault();
		};

		window.history.pushState(null, '', window.location.href);
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		document.addEventListener('visibilitychange', handleVisibilityChange);
		window.addEventListener('popstate', handlePopState);
		document.addEventListener('contextmenu', handleContextMenu);

		return () => {
			document.removeEventListener('fullscreenchange', handleFullscreenChange);
			document.removeEventListener('visibilitychange', handleVisibilityChange);
			window.removeEventListener('popstate', handlePopState);
			document.removeEventListener('contextmenu', handleContextMenu);
		};
	}, [isStarted, autoSubmitting, handleViolation]);

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
		// Try to enter fullscreen before marking started. If user denies, still allow start but notify.
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
