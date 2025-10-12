import React from 'react';
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
	const [submission, setSubmission] = React.useState(null);
	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState('');

	React.useEffect(() => {
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

	const handleQuickSave = async () => {
		if (!submission) return;
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
		try {
			const updated = await safeApiCall(submitSubmission, submission.id);
			setSubmission(updated);
			navigate('/student/results');
		} catch (e) {
			setError(e?.message || 'Failed to submit');
		}
	};

	if (loading) return <div>Loading exam…</div>;
	if (error) return <div style={{ color: '#b91c1c' }}>❌ {error}</div>;
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
