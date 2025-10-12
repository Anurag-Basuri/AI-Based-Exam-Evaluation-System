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

	useEffect(() => {
		if (submission && String(submission.status || '').toLowerCase() === 'evaluated') {
			navigate('/student/results', { replace: true });
		}
	}, [submission, navigate]);

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

	return (
		<div style={{ display: 'grid', gap: 12 }}>
			{/* Sticky toolbar */}
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
					<div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
						<button
							onClick={handleQuickSave}
							disabled={saving}
							aria-busy={saving}
							title="Ctrl/Cmd + S to save quickly"
							style={{
								padding: '8px 12px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								cursor: saving ? 'not-allowed' : 'pointer',
							}}
						>
							{saving ? 'Saving…' : '💾 Save'}
						</button>
						<button
							onClick={handleSubmit}
							style={{
								padding: '8px 12px',
								borderRadius: 8,
								border: 'none',
								background: 'linear-gradient(135deg,#10b981,#059669)',
								color: '#fff',
								cursor: 'pointer',
								fontWeight: 700,
							}}
						>
							🚀 Submit
						</button>
					</div>
				</div>
			</div>

			{/* Meta */}
			<div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
				Submission ID: {submission.id}
			</div>

			{/* Placeholder Question Panel */}
			<div
				style={{
					padding: 16,
					border: '1px solid var(--border)',
					borderRadius: 12,
					background: 'var(--surface)',
					color: 'var(--text)',
				}}
			>
				<p style={{ margin: 0 }}>
					This is a placeholder exam-taking page. Render questions and capture answers
					here.
				</p>
			</div>
		</div>
	);
};

export default TakeExam;
