import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	safeApiCall,
	getSubmissionById,
	saveSubmissionAnswers,
	submitSubmission,
} from '../../services/studentServices.js';

const TakeExam = () => {
	const { submissionId } = useParams();
	const navigate = useNavigate();
	const [submission, setSubmission] = useState(null);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState('');

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

	// If already evaluated, send to results
	useEffect(() => {
		if (submission && String(submission.status || '').toLowerCase() === 'evaluated') {
			navigate('/student/results', { replace: true });
		}
	}, [submission, navigate]);

	// UX: quick save with Ctrl/Cmd + S
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

	const handleQuickSave = async () => {
		if (!submission || saving) return;
		setSaving(true);
		try {
			await safeApiCall(saveSubmissionAnswers, submission.id, submission.answers || []);
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
			const updated = await safeApiCall(submitSubmission, submission.id);
			setSubmission(updated);
			navigate('/student/results');
		} catch (e) {
			setError(e?.message || 'Failed to submit');
		}
	};

	if (loading) return <div aria-busy="true">Loading exam…</div>;
	if (error)
		return (
			<div role="alert" style={{ color: '#b91c1c' }}>
				❌ {error}
			</div>
		);
	if (!submission) return <div>Submission not found.</div>;

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			<h1 style={{ margin: 0 }}>Exam: {submission.examTitle}</h1>
			<div style={{ fontSize: 13, color: '#64748b' }}>Submission ID: {submission.id}</div>

			{/* Placeholder UI; integrate real questions/answers here */}
			<div
				style={{
					padding: 16,
					border: '1px solid #e5e7eb',
					borderRadius: 12,
					background: '#fff',
				}}
			>
				<p>
					This is a placeholder exam-taking page. Render questions and capture answers
					here.
				</p>
			</div>

			<div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
				<button
					onClick={handleQuickSave}
					disabled={saving}
					aria-busy={saving}
					title="Ctrl/Cmd + S to save quickly"
					style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db' }}
				>
					{saving ? 'Saving…' : '💾 Save'}
				</button>
				<button
					onClick={handleSubmit}
					style={{
						padding: '10px 14px',
						borderRadius: 8,
						border: 'none',
						background: 'linear-gradient(135deg,#10b981,#059669)',
						color: '#fff',
					}}
				>
					🚀 Submit
				</button>
			</div>
		</div>
	);
};

export default TakeExam;
