import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import * as TeacherSvc from '../../services/teacherServices.js';

const AiInsight = ({ meta }) => {
	if (!meta || typeof meta !== 'object') return null;

	const renderList = (title, items) => {
		if (!Array.isArray(items) || items.length === 0) return null;
		return (
			<div>
				<strong style={{ fontSize: 13, color: 'var(--text-muted)' }}>{title}</strong>
				<ul style={{ margin: '4px 0', paddingLeft: 20, fontSize: 14 }}>
					{items.map((item, i) => (
						<li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
					))}
				</ul>
			</div>
		);
	};

	return (
		<div
			style={{
				background: 'color-mix(in srgb, var(--primary) 5%, transparent)',
				border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)',
				borderRadius: 8,
				padding: '12px 16px',
				marginTop: 12,
				display: 'grid',
				gap: 8,
			}}
		>
			<h5 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--primary)' }}>
				🤖 AI Evaluation Insights
			</h5>
			{renderList('Rubric Breakdown:', meta.rubric_breakdown)}
			{renderList('Keywords Matched:', meta.keywords_matched)}
			{renderList('Penalties Applied:', meta.penalties_applied)}
			{meta.fallback && (
				<p style={{ fontSize: 13, margin: 0, color: '#f59e0b' }}>
					Fell back to a simpler evaluation model. Reason:{' '}
					{meta.reason || 'Not specified'}
				</p>
			)}
		</div>
	);
};

const AnswerCard = ({ answer, evaluation, onUpdate, disabled }) => {
	const question = answer.question;
	const isMCQ = question.type === 'multiple-choice';
	const aiEval = evaluation?.evaluation;
	const teacherEval = aiEval?.evaluator === 'teacher';

	// FIX: Initialize state from evaluation, ensuring it reflects the most recent data.
	const [marks, setMarks] = React.useState(aiEval?.marks ?? 0);
	const [remarks, setRemarks] = React.useState(aiEval?.remarks ?? '');

	// Sync local state if the parent evaluation data changes (e.g., after a save)
	React.useEffect(() => {
		setMarks(aiEval?.marks ?? 0);
		setRemarks(aiEval?.remarks ?? '');
	}, [aiEval]);

	const handleMarksChange = e => {
		const newMarks = Math.max(0, Math.min(question.max_marks, Number(e.target.value)));
		setMarks(newMarks);
		onUpdate(question._id, newMarks, remarks);
	};

	const handleRemarksChange = e => {
		const newRemarks = e.target.value;
		setRemarks(newRemarks);
		onUpdate(question._id, marks, newRemarks);
	};

	let studentResponse = <i style={{ color: 'var(--text-muted)' }}>No answer provided.</i>;
	if (isMCQ) {
		const selectedOption = question.options.find(
			opt => String(opt._id) === String(answer.responseOption),
		);
		const correctOption = question.options.find(opt => opt.isCorrect);

		studentResponse = (
			<div style={{ display: 'grid', gap: '8px' }}>
				<div>
					<strong>Student's Answer: </strong>
					{selectedOption ? (
						<span
							style={{
								color: selectedOption.isCorrect ? '#10b981' : '#ef4444',
								fontWeight: 700,
							}}
						>
							{selectedOption.text}
						</span>
					) : (
						<i style={{ color: 'var(--text-muted)' }}>No option selected.</i>
					)}
				</div>
				<div>
					<strong>Correct Answer: </strong>
					<span style={{ color: '#10b981', fontWeight: 500 }}>
						{correctOption?.text ?? 'N/A'}
					</span>
				</div>
			</div>
		);
	} else if (answer.responseText) {
		studentResponse = (
			<p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{answer.responseText}</p>
		);
	}

	return (
		<div
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 16,
				boxShadow: 'var(--shadow-sm)',
			}}
		>
			<div
				style={{
					padding: '16px 20px',
					borderBottom: '1px solid var(--border)',
					display: 'flex',
					flexWrap: 'wrap', // Allow wrapping on small screens
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					gap: 12,
				}}
			>
				<h4
					style={{
						margin: 0,
						fontSize: 16,
						fontWeight: 700,
						lineHeight: 1.4,
						flex: '1 1 300px',
					}}
				>
					{question.text}
				</h4>
				<span
					style={{
						fontSize: 12,
						fontWeight: 700,
						color: 'var(--text)',
						background: 'var(--bg)',
						border: '1px solid var(--border)',
						padding: '4px 8px',
						borderRadius: 6,
						whiteSpace: 'nowrap',
						height: 'fit-content',
					}}
				>
					{question.max_marks} Marks
				</span>
			</div>
			<div style={{ padding: '16px 20px', background: 'var(--bg)' }}>
				<strong style={{ fontSize: 13, color: 'var(--text-muted)', display: 'block' }}>
					Student's Answer
				</strong>
				<div style={{ marginTop: 8, fontSize: 15 }}>{studentResponse}</div>
			</div>
			<div style={{ padding: '16px 20px' }}>
				<div
					className="grade-inputs"
					style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 16 }}
				>
					<div>
						<label
							style={{
								fontSize: 13,
								fontWeight: 600,
								display: 'block',
								color: teacherEval ? 'var(--primary)' : 'inherit',
							}}
						>
							Remarks {teacherEval && '(Edited by you)'}
						</label>
						<textarea
							value={remarks}
							onChange={handleRemarksChange}
							disabled={disabled}
							rows="3"
							style={{
								width: '100%',
								marginTop: 4,
								resize: 'vertical',
								padding: '8px 12px',
								borderRadius: 8,
								border: '1px solid var(--border)',
							}}
						/>
					</div>
					<div>
						<label
							style={{
								fontSize: 13,
								fontWeight: 600,
								display: 'block',
								color: teacherEval ? 'var(--primary)' : 'inherit',
							}}
						>
							Marks
						</label>
						<input
							type="number"
							value={marks}
							onChange={handleMarksChange}
							disabled={disabled}
							max={question.max_marks}
							min={0}
							style={{
								width: '100%',
								marginTop: 4,
								textAlign: 'center',
								padding: '8px 12px',
								borderRadius: 8,
								border: `1px solid ${
									teacherEval ? 'var(--primary)' : 'var(--border)'
								}`,
								fontSize: 16,
								fontWeight: 700,
							}}
						/>
					</div>
				</div>
			</div>
			{aiEval?.meta && <AiInsight meta={aiEval.meta} />}
			<style>{`
        @media (max-width: 480px) {
          .grade-inputs {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
		</div>
	);
};

const TeacherSubmissionGrade = () => {
	const { submissionId, examId } = useParams(); // Get examId from URL
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();

	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [error, setError] = React.useState('');
	const [submission, setSubmission] = React.useState(null);
	const [updatedEvals, setUpdatedEvals] = React.useState({});

	React.useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const data = await TeacherSvc.safeApiCall(
					TeacherSvc.getSubmissionForGrading,
					submissionId,
				);
				setSubmission(data);
			} catch (e) {
				setError(e.message || 'Failed to load submission data.');
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [submissionId]);

	const handleEvaluationUpdate = (questionId, marks, remarks) => {
		setUpdatedEvals(prev => ({
			...prev,
			[questionId]: { question: questionId, marks, remarks },
		}));
	};

	const handleSaveChanges = async () => {
		const payload = Object.values(updatedEvals);
		if (payload.length === 0) {
			toastError('No changes to save.');
			return; // Exit early
		}

		setSaving(true);
		try {
			await TeacherSvc.safeApiCall(
				TeacherSvc.updateSubmissionEvaluation,
				submissionId,
				payload,
			);
			success('Grades updated successfully!');
			// IMPORTANT: Only navigate on success
			navigate(`/teacher/results/${examId}`);
		} catch (e) {
			toastError(e.message || 'Failed to save changes.');
		} finally {
			setSaving(false);
		}
	};

	if (loading)
		return <div style={{ textAlign: 'center', padding: 40 }}>Loading Grading Interface...</div>;
	if (error) return <Alert type="error">{error}</Alert>;
	if (!submission) return <Alert>Submission data could not be found.</Alert>;

	const answersMap = new Map(submission.answers.map(a => [String(a.question._id), a]));
	const evalsMap = new Map(submission.evaluations.map(e => [String(e.question), e]));

	return (
		<div>
			<PageHeader
				title={`Grading: ${submission.student.fullname}`}
				subtitle={`For exam: ${submission.exam.title}`}
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Results', to: '/teacher/results' },
					{ label: submission.exam.title, to: `/teacher/results/${examId}` },
					{ label: 'Grade' },
				]}
				actions={[
					<button
						key="back"
						onClick={() => navigate(`/teacher/results/${examId}`)}
						className="tap"
						style={{
							padding: '10px 16px',
							background: 'var(--bg)',
							border: '1px solid var(--border)',
							borderRadius: 8,
							fontWeight: 700,
						}}
					>
						← Back
					</button>,
					<button
						key="save"
						onClick={handleSaveChanges}
						disabled={saving || Object.keys(updatedEvals).length === 0}
						className="tap"
						style={{
							padding: '10px 16px',
							background: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#fff',
							border: 'none',
							borderRadius: 8,
							fontWeight: 700,
							cursor: 'pointer',
							opacity: saving || Object.keys(updatedEvals).length === 0 ? 0.6 : 1,
						}}
					>
						{saving ? 'Saving...' : 'Save All Changes'}
					</button>,
				]}
			/>

			{submission.violations?.length > 0 && (
				<div style={{ marginBottom: 16 }}>
					<Alert type="warning">
						<strong>{submission.violations.length} Violation(s) Logged:</strong>
						<ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
							{submission.violations.map((v, i) => (
								<li key={i}>
									{v.type} at {new Date(v.at).toLocaleTimeString()}
								</li>
							))}
						</ul>
					</Alert>
				</div>
			)}

			<div style={{ display: 'grid', gap: 24, marginTop: 24 }}>
				{Array.from(answersMap.keys()).map(questionId => (
					<AnswerCard
						key={questionId}
						answer={answersMap.get(questionId)}
						evaluation={evalsMap.get(questionId)}
						onUpdate={handleEvaluationUpdate}
						disabled={saving}
					/>
				))}
			</div>
		</div>
	);
};

export default TeacherSubmissionGrade;
