import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	safeApiCall,
	getSubmissionById,
	saveSubmissionAnswers,
	submitSubmission,
} from '../../services/studentServices.js';

const TakeExam = () => {
	const params = useParams();
	const submissionId = params.submissionId || params.id;
	const navigate = useNavigate();
	const [submission, setSubmission] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');
	const [autoSubmitting, setAutoSubmitting] = useState(false);
	const [lastSaved, setLastSaved] = useState(null);

	// Early guard: if param missing, send back to Exams
	useEffect(() => {
		if (!submissionId) {
			navigate('/student/exams', { replace: true });
		}
	}, [submissionId, navigate]);

	// Load submission details
	useEffect(() => {
		(async () => {
			try {
				const s = await safeApiCall(getSubmissionById, submissionId);
				setSubmission(s);
			} catch (e) {
				setError(e?.message || 'Failed to load submission');
			} finally {
				setLoading(false);
			}
		})();
	}, [submissionId]);

	// If already completed, redirect to results
	useEffect(() => {
		if (!submission) return;
		const status = String(submission.status || '').toLowerCase();
		if (status === 'submitted' || status === 'evaluated') {
			navigate('/student/results', { replace: true });
		}
	}, [submission, navigate]);

	// Compute time left (client-side) from startedAt + duration minutes
	const endAtMs = useMemo(() => {
		if (!submission?.startedAt || !submission?.duration) return null;
		const started = new Date(submission.startedAt).getTime();
		return started + Number(submission.duration) * 60 * 1000;
	}, [submission]);

	const [now, setNow] = useState(Date.now());
	useEffect(() => {
		if (!endAtMs) return;
		const id = setInterval(() => setNow(Date.now()), 1000);
		return () => clearInterval(id);
	}, [endAtMs]);

	const remainingMs = endAtMs ? Math.max(0, endAtMs - now) : null;
	const remaining = useMemo(() => {
		if (remainingMs == null) return { mm: '--', ss: '--' };
		const total = Math.floor(remainingMs / 1000);
		const mm = String(Math.floor(total / 60)).padStart(2, '0');
		const ss = String(total % 60).padStart(2, '0');
		return { mm, ss };
	}, [remainingMs]);

	// Auto-submit when time is up
	useEffect(() => {
		if (!submission || remainingMs == null) return;
		const status = String(submission.status || '').toLowerCase();
		if (status !== 'in-progress') return;
		if (remainingMs > 0 || autoSubmitting) return;

		(async () => {
			setAutoSubmitting(true);
			try {
				const updated = await safeApiCall(submitSubmission, { examId: submission.examId });
				setSubmission(updated);
				navigate('/student/results', { replace: true });
			} catch (e) {
				// Last resort: notify and lock UI
				setError(e?.message || 'Auto-submit failed. Please refresh.');
			} finally {
				setAutoSubmitting(false);
			}
		})();
	}, [remainingMs, submission, autoSubmitting, navigate]);

	// Auto-save periodically (e.g., every 30 seconds)
	useEffect(() => {
		const autoSaveInterval = setInterval(() => {
			// Trigger save only if there are changes and not already saving
			if (submission && !saving) {
				handleQuickSave();
			}
		}, 30000); // 30 seconds

		return () => clearInterval(autoSaveInterval);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [submission, saving]);

	// Quick save (Ctrl/Cmd+S)
	useEffect(() => {
		const onKeyDown = e => {
			const isSave = (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's';
			if (isSave) {
				e.preventDefault();
				handleQuickSave();
			}
		};
		window.addEventListener('keydown', onKeyDown);
		return () => window.removeEventListener('keydown', onKeyDown);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [submission, saving]);

	// Auto-save on tab hide
	useEffect(() => {
		const onVis = () => {
			if (document.hidden) {
				if (submission?.examId) {
					saveSubmissionAnswers({
						examId: submission.examId,
						answers: submission.answers || [],
					}).catch(() => {});
				}
			}
		};
		document.addEventListener('visibilitychange', onVis);
		return () => document.removeEventListener('visibilitychange', onVis);
	}, [submission]);

	const handleQuickSave = async () => {
		if (!submission || saving) return;
		setSaving(true);
		try {
			await safeApiCall(saveSubmissionAnswers, {
				examId: submission.examId,
				answers: submission.answers || [],
			});
			setLastSaved(new Date()); // Set save timestamp
		} catch (e) {
			setError(e?.message || 'Failed to save');
		} finally {
			setSaving(false);
		}
	};

	const handleSubmit = async () => {
		if (!submission) return;
		const ok = window.confirm(
			'Submit your exam now? You will not be able to edit after submitting.',
		);
		if (!ok) return;
		try {
			const updated = await safeApiCall(submitSubmission, { examId: submission.examId });
			setSubmission(updated);
			navigate('/student/results');
		} catch (e) {
			setError(e?.message || 'Failed to submit');
		}
	};

	const handleAnswerChange = (questionId, value, type) => {
		setSubmission(prev => {
			if (!prev) return null;
			const newAnswers = [...(prev.answers || [])];
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

			return { ...prev, answers: newAnswers };
		});
	};

	if (loading)
		return (
			<div aria-busy="true" style={{ color: 'var(--text)' }}>
				Loading exam…
			</div>
		);
	if (error)
		return (
			<div role="alert" style={{ color: '#ef4444' }}>
				❌ {error}
			</div>
		);
	if (!submission) return <div style={{ color: 'var(--text)' }}>Submission not found.</div>;

	const status = String(submission.status || '').toLowerCase();
	const locked = status !== 'in-progress';

	return (
		<div style={{ display: 'grid', gap: 16 }}>
			{/* Sticky toolbar with timer */}
			<div
				style={{
					position: 'sticky',
					top: 0,
					zIndex: 1,
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					borderRadius: 12,
					padding: 12,
					boxShadow: 'var(--shadow-md)',
				}}
			>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
					<div style={{ fontWeight: 800, color: 'var(--text)' }}>
						{submission.examTitle}
					</div>
					<div
						style={{
							marginLeft: 'auto',
							display: 'flex',
							gap: 8,
							alignItems: 'center',
							fontWeight: 800,
							color:
								remainingMs != null && remainingMs <= 60_000
									? '#ef4444'
									: 'var(--text)',
						}}
						title="Time remaining"
					>
						⏳ {remaining.mm}:{remaining.ss}
					</div>
					<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
						{saving && (
							<span
								style={{
									fontSize: 12,
									color: 'var(--text-muted)',
									fontStyle: 'italic',
								}}
							>
								Saving...
							</span>
						)}
						{lastSaved && !saving && (
							<span
								style={{ fontSize: 12, color: 'var(--primary)' }}
								title={lastSaved.toLocaleTimeString()}
							>
								✅ Saved
							</span>
						)}
						<button
							onClick={handleSubmit}
							disabled={locked || autoSubmitting}
							style={{
								padding: '8px 12px',
								borderRadius: 8,
								border: 'none',
								background:
									locked || autoSubmitting
										? '#9ca3af'
										: 'linear-gradient(135deg,#10b981,#059669)',
								color: '#fff',
								cursor: locked ? 'not-allowed' : 'pointer',
								fontWeight: 700,
							}}
						>
							{autoSubmitting ? 'Submitting…' : '🚀 Submit'}
						</button>
					</div>
				</div>
			</div>

			{/* Meta */}
			<div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
				Submission ID: {submission.id}
			</div>

			{/* Questions List */}
			<div style={{ display: 'grid', gap: 16 }}>
				{(submission.questions || []).map((q, index) => (
					<QuestionCard
						key={q.id}
						question={q}
						index={index}
						answer={submission.answers?.find(a => a.question === q.id)}
						onAnswerChange={handleAnswerChange}
						disabled={locked}
					/>
				))}
				{(!submission.questions || submission.questions.length === 0) && (
					<div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 20 }}>
						No questions found for this exam.
					</div>
				)}
			</div>
		</div>
	);
};

const QuestionCard = ({ question, index, answer, onAnswerChange, disabled }) => {
	const isMCQ = question.type === 'multiple-choice';

	return (
		<div
			style={{
				padding: 16,
				border: '1px solid var(--border)',
				borderRadius: 12,
				background: 'var(--surface)',
				color: 'var(--text)',
			}}
		>
			<div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
				<strong style={{ flex: 1 }}>
					{index + 1}. {question.text}
				</strong>
				<span
					style={{
						fontSize: 12,
						fontWeight: 700,
						padding: '4px 8px',
						borderRadius: 8,
						background: 'var(--bg)',
						border: '1px solid var(--border)',
					}}
				>
					{question.max_marks} Marks
				</span>
			</div>

			{isMCQ ? (
				<div style={{ display: 'grid', gap: 8 }}>
					{(question.options || []).map(opt => (
						<label
							key={opt.id}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 8,
								padding: '8px 12px',
								borderRadius: 8,
								background: 'var(--bg)',
								cursor: disabled ? 'not-allowed' : 'pointer',
							}}
						>
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
							<span>{opt.text}</span>
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
					style={{
						width: '100%',
						padding: '8px 12px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--bg)',
						color: 'var(--text)',
						resize: 'vertical',
					}}
				/>
			)}
		</div>
	);
};

export default TakeExam;
