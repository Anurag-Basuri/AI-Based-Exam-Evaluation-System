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
			<div className="sg-ai-list">
				<div className="sg-ai-title">{title}</div>
				<ul>
					{items.map((item, i) => (
						<li key={i}>{typeof item === 'string' ? item : JSON.stringify(item)}</li>
					))}
				</ul>
			</div>
		);
	};

	return (
		<div className="sg-ai-box" role="region" aria-label="AI evaluation insights">
			<div className="sg-ai-header">🤖 AI Evaluation Insights</div>
			{renderList('Rubric Breakdown:', meta.rubric_breakdown)}
			{renderList('Keywords Matched:', meta.keywords_matched)}
			{renderList('Penalties Applied:', meta.penalties_applied)}
			{meta.fallback && (
				<p className="sg-ai-fallback">
					Fell back to a simpler evaluation model. Reason:{' '}
					{meta.reason || 'Not specified'}
				</p>
			)}
		</div>
	);
};

const AnswerCard = ({ idx, answer, evaluation, onUpdate, disabled }) => {
	const question = answer.question;
	const isMCQ = question.type === 'multiple-choice';
	const aiEval = evaluation?.evaluation;
	const teacherEval = aiEval?.evaluator === 'teacher';

	const [marks, setMarks] = React.useState(aiEval?.marks ?? 0);
	const [remarks, setRemarks] = React.useState(aiEval?.remarks ?? '');

	React.useEffect(() => {
		setMarks(aiEval?.marks ?? 0);
		setRemarks(aiEval?.remarks ?? '');
	}, [aiEval]);

	const clampMarks = value =>
		Number.isNaN(Number(value))
			? 0
			: Math.max(0, Math.min(question.max_marks || 0, Number(value)));

	const handleMarksChange = e => {
		const newMarks = clampMarks(e.target.value);
		setMarks(newMarks);
		onUpdate(question._id, newMarks, remarks);
	};

	const handleRemarksChange = e => {
		const newRemarks = e.target.value;
		setRemarks(newRemarks);
		onUpdate(question._id, marks, newRemarks);
	};

	const quickAdjust = delta => {
		const newMarks = clampMarks((marks || 0) + delta);
		setMarks(newMarks);
		onUpdate(question._id, newMarks, remarks);
	};

	let studentResponse = <i className="sg-muted">No answer provided.</i>;
	if (isMCQ) {
		const selectedOption = (question.options || []).find(
			opt => String(opt._id) === String(answer.responseOption),
		);
		const correctOption = (question.options || []).find(opt => opt.isCorrect);

		studentResponse = (
			<div className="sg-mcq">
				<div>
					<strong>Student's Answer: </strong>
					{selectedOption ? (
						<span
							className={`sg-pill ${
								selectedOption.isCorrect ? 'sg-pill-ok' : 'sg-pill-wrong'
							}`}
						>
							{selectedOption.text}
						</span>
					) : (
						<i className="sg-muted">No option selected.</i>
					)}
				</div>
				<div style={{ marginTop: 6 }}>
					<strong>Correct Answer: </strong>
					<span className="sg-correct">{correctOption?.text ?? 'N/A'}</span>
				</div>
			</div>
		);
	} else if (answer.responseText) {
		studentResponse = <pre className="sg-response">{answer.responseText}</pre>;
	}

	return (
		<article className="answer-card" aria-labelledby={`q-${idx}`}>
			<div className="answer-header">
				<div className="answer-meta">
					<div id={`q-${idx}`} className="answer-title">
						<span className="answer-index">{idx}.</span>
						{question.text}
					</div>
					<div className="answer-submeta">
						<span className="sg-tag">{question.type}</span>
						<span className="sg-tag">Max {question.max_marks}</span>
						{teacherEval && <span className="sg-badge">Edited</span>}
					</div>
				</div>

				<div className="answer-actions" aria-hidden={disabled}>
					<div className="marks-control" title="Adjust marks">
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() => quickAdjust(-1)}
							disabled={disabled}
							aria-label="Decrease marks"
						>
							−
						</button>
						<input
							type="number"
							className="marks-input"
							value={marks}
							onChange={handleMarksChange}
							min={0}
							max={question.max_marks}
							disabled={disabled}
							aria-label={`Marks for question ${idx}`}
						/>
						<button
							type="button"
							className="btn btn-ghost"
							onClick={() => quickAdjust(1)}
							disabled={disabled}
							aria-label="Increase marks"
						>
							+
						</button>
					</div>
				</div>
			</div>

			<div className="answer-body">
				<div className="answer-section">
					<div className="section-title">Student's Answer</div>
					<div>{studentResponse}</div>
				</div>

				<div className="answer-section">
					<div className="section-title">Teacher Remarks</div>
					<textarea
						value={remarks}
						onChange={handleRemarksChange}
						disabled={disabled}
						rows={3}
						placeholder="Add or edit remarks for the student..."
						aria-label={`Remarks for question ${idx}`}
					/>
				</div>

				{aiEval?.meta && (
					<div style={{ marginTop: 10 }}>
						<AiInsight meta={aiEval.meta} />
					</div>
				)}
			</div>
		</article>
	);
};

const TeacherSubmissionGrade = () => {
	const { submissionId, examId } = useParams();
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
			return;
		}
		setSaving(true);
		try {
			await TeacherSvc.safeApiCall(
				TeacherSvc.updateSubmissionEvaluation,
				submissionId,
				payload,
			);
			success('Grades updated successfully!');
			// Refresh page after save to reflect authoritative data
			navigate(`/teacher/results/${examId}`);
		} catch (e) {
			toastError(e.message || 'Failed to save changes.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) return <div className="sg-empty">Loading grading interface…</div>;
	if (error) return <Alert type="error">{error}</Alert>;
	if (!submission) return <Alert>Submission data could not be found.</Alert>;

	// Build maps for quick lookup
	const answersMap = new Map(submission.answers.map(a => [String(a.question._id), a]));
	const evalsMap = new Map(submission.evaluations.map(e => [String(e.question), e]));

	// Utility: compute totals (including unsaved local edits)
	const computeTotals = () => {
		let awarded = 0;
		let max = 0;
		submission.answers.forEach(ans => {
			const q = ans.question;
			const qid = String(q._id);
			const qMax = Number(q.max_marks || 0);
			max += qMax;

			const baseEval = evalsMap.get(qid)?.evaluation;
			const baseMarks = baseEval?.marks ?? 0;
			const pending = updatedEvals[qid]?.marks;
			const finalMarks = typeof pending === 'number' ? pending : baseMarks;
			awarded += Number(finalMarks || 0);
		});
		return { awarded, max };
	};

	const totals = computeTotals();
	const totalQuestions = submission.answers.length;
	const gradedCount = submission.evaluations.filter(Boolean).length;

	return (
		<div className="sg-root">
			<style>{`
                :root {
                    --sg-bg: var(--bg, #f6f8fb);
                    --sg-surface: var(--surface, #fff);
                    --sg-border: var(--border, rgba(2,6,23,0.06));
                    --sg-primary: var(--primary, #2563eb);
                    --sg-accent: #10b981;
                    --sg-muted: var(--text-muted, #6b7280);
                    --sg-shadow: 0 8px 24px rgba(15,23,42,0.06);
                }

                .sg-root { padding: 20px; max-width: 1100px; margin: 0 auto; color: var(--text, #0b1220); }
                .sg-grid { display: grid; gap: 20px; grid-template-columns: 1fr 320px; align-items: start; }
                @media (max-width: 980px) { .sg-grid { grid-template-columns: 1fr; } }

                .sg-empty { padding: 80px 16px; text-align:center; color:var(--sg-muted); }

                /* Answer card */
                .answer-card { background: var(--sg-surface); border:1px solid var(--sg-border); border-radius:14px; box-shadow: var(--sg-shadow); overflow:hidden; }
                .answer-header { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; padding:18px 20px; border-bottom:1px solid var(--sg-border); }
                .answer-title { font-weight:700; font-size:15px; line-height:1.3; display:flex; gap:10px; align-items:center; max-width: calc(100% - 160px); }
                .answer-index { background: linear-gradient(90deg,#eef2ff,#eef6ff); color:var(--sg-primary); padding:6px 10px; border-radius:10px; font-weight:800; font-size:13px; display:inline-block; }
                .answer-submeta { display:flex; gap:8px; align-items:center; margin-top:8px; font-size:12px; color:var(--sg-muted); flex-wrap:wrap; }
                .sg-tag { background: rgba(99,102,241,0.06); padding:6px 8px; border-radius:8px; font-weight:700; }
                .sg-badge { background:#fff7ed; color:#b45309; padding:6px 8px; border-radius:999px; font-weight:700; font-size:12px; }

                .answer-actions { display:flex; gap:8px; align-items:center; }
                .marks-control { display:flex; align-items:center; gap:8px; background: linear-gradient(180deg,#fff,#fbfbff); padding:6px; border-radius:10px; border:1px solid var(--sg-border); }
                .marks-input { width:84px; text-align:center; font-weight:800; font-size:16px; padding:8px 6px; border-radius:8px; border:1px solid transparent; background:transparent; }
                .btn { display:inline-flex; align-items:center; justify-content:center; border-radius:8px; padding:6px 8px; border:1px solid transparent; cursor:pointer; background:transparent; }
                .btn-ghost { width:34px; height:34px; border:1px solid var(--sg-border); background:transparent; font-weight:700; }

                .answer-body { padding:18px 20px; display:flex; flex-direction:column; gap:12px; }
                .answer-section { display:flex; flex-direction:column; gap:8px; }
                .section-title { font-weight:700; color:var(--sg-muted); font-size:13px; }
                .sg-response { white-space:pre-wrap; background: #fbfbff; padding:12px; border-radius:8px; border:1px solid var(--sg-border); }
                .sg-muted { color: var(--sg-muted); }

                /* AI box */
                .sg-ai-box { border-radius:10px; padding:12px; background: linear-gradient(180deg, rgba(37,99,235,0.04), rgba(37,99,235,0.02)); border:1px solid rgba(37,99,235,0.08); }
                .sg-ai-header { font-weight:800; color:var(--sg-primary); font-size:14px; }
                .sg-ai-list { margin-top:6px; }
                .sg-ai-list .sg-ai-title { font-weight:700; color:var(--sg-muted); font-size:13px; margin-bottom:6px; }
                .sg-ai-fallback { color:#b45309; margin:0; }

                /* Sidebar */
                .sg-sidebar { position:relative; top:0; display:flex; flex-direction:column; gap:12px; }
                .sg-card { background:var(--sg-surface); border-radius:12px; padding:16px; border:1px solid var(--sg-border); box-shadow: var(--sg-shadow); }
                .sg-summary { display:flex; flex-direction:column; gap:10px; }
                .sg-score { display:flex; align-items:baseline; gap:8px; font-weight:800; font-size:20px; }
                .sg-progress { height:10px; background:#eef2f5; border-radius:999px; overflow:hidden; }
                .sg-progress > i { display:block; height:100%; background:linear-gradient(90deg,var(--sg-primary), #7c3aed); width:30%; }

                .btn-primary { background: linear-gradient(135deg,#10b981,#059669); color:#fff; padding:10px 14px; border-radius:10px; border:none; font-weight:800; cursor:pointer; }
                .btn-ghost-lg { background:transparent; border:1px solid var(--sg-border); padding:10px 14px; border-radius:10px; font-weight:700; cursor:pointer; }

                .sg-quick-actions { display:flex; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
                @media (max-width: 980px) { .sg-quick-actions { justify-content:flex-start; } }

            `}</style>

			<PageHeader
				title={`Grading: ${submission.student.fullname}`}
				subtitle={`Exam: ${submission.exam.title}`}
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Results', to: '/teacher/results' },
					{ label: submission.exam.title, to: `/teacher/results/${examId}` },
					{ label: 'Grade' },
				]}
				actions={[]}
			/>

			<div className="sg-grid">
				<main>
					{submission.violations?.length > 0 && (
						<div style={{ marginBottom: 12 }}>
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

					<div style={{ display: 'grid', gap: 16 }}>
						{submission.answers.map((ans, i) => {
							const qid = String(ans.question._id);
							return (
								<AnswerCard
									key={qid}
									idx={i + 1}
									answer={ans}
									evaluation={evalsMap.get(qid)}
									onUpdate={handleEvaluationUpdate}
									disabled={saving}
								/>
							);
						})}
					</div>
				</main>

				<aside className="sg-sidebar" aria-label="Grading summary">
					<div className="sg-card sg-summary" role="region">
						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'center',
							}}
						>
							<div>
								<div style={{ fontSize: 13, color: 'var(--sg-muted)' }}>
									Student
								</div>
								<div style={{ fontWeight: 800 }}>{submission.student.fullname}</div>
								<div style={{ fontSize: 13, color: 'var(--sg-muted)' }}>
									{submission.student.email}
								</div>
							</div>
							<div style={{ textAlign: 'right' }}>
								<div style={{ fontSize: 13, color: 'var(--sg-muted)' }}>Status</div>
								<div
									style={{
										fontWeight: 800,
										color:
											submission.status === 'published'
												? 'var(--sg-accent)'
												: 'inherit',
									}}
								>
									{submission.status}
								</div>
							</div>
						</div>

						<hr style={{ border: 'none', borderTop: '1px solid var(--sg-border)' }} />

						<div
							style={{
								display: 'flex',
								justifyContent: 'space-between',
								alignItems: 'baseline',
							}}
						>
							<div style={{ fontSize: 13, color: 'var(--sg-muted)' }}>Score</div>
							<div className="sg-score">
								{totals.awarded} / {totals.max}
							</div>
						</div>

						<div style={{ marginTop: 8 }}>
							<div className="sg-progress" aria-hidden="true">
								<i
									style={{
										width: `${Math.min(
											100,
											(totals.awarded / Math.max(1, totals.max)) * 100,
										)}%`,
									}}
								/>
							</div>
							<div style={{ fontSize: 12, color: 'var(--sg-muted)', marginTop: 6 }}>
								{gradedCount} of {totalQuestions} questions have evaluations
							</div>
						</div>

						<div
							style={{ display: 'flex', gap: 8, marginTop: 12 }}
							className="sg-quick-actions"
						>
							<button
								type="button"
								onClick={() => navigate(`/teacher/results/${examId}`)}
								className="btn-ghost-lg"
								aria-label="Back to results"
							>
								← Back
							</button>
							<button
								type="button"
								onClick={handleSaveChanges}
								className="btn-primary"
								disabled={saving || Object.keys(updatedEvals).length === 0}
								aria-disabled={saving || Object.keys(updatedEvals).length === 0}
							>
								{saving
									? 'Saving…'
									: `Save ${
											Object.keys(updatedEvals).length
												? `(${Object.keys(updatedEvals).length})`
												: ''
									  }`}
							</button>
						</div>
					</div>

					{/* Helpful info / AI insights */}
					<div className="sg-card" aria-hidden={false}>
						<div style={{ fontWeight: 800, marginBottom: 8 }}>Exam Info</div>
						<div style={{ fontSize: 14 }}>{submission.exam.title}</div>
						<div style={{ fontSize: 13, color: 'var(--sg-muted)', marginTop: 8 }}>
							Started:{' '}
							{submission.startedAt
								? new Date(submission.startedAt).toLocaleString()
								: '—'}
						</div>
						<div style={{ fontSize: 13, color: 'var(--sg-muted)' }}>
							Submitted:{' '}
							{submission.submittedAt
								? new Date(submission.submittedAt).toLocaleString()
								: '—'}
						</div>
					</div>

					{/* Small CTA */}
					<div className="sg-card" aria-hidden>
						<div style={{ fontWeight: 800, marginBottom: 8 }}>Quick actions</div>
						<button
							className="btn-ghost-lg"
							style={{ width: '100%' }}
							onClick={() => window.print()}
						>
							Print report
						</button>
					</div>
				</aside>
			</div>
		</div>
	);
};

export default TeacherSubmissionGrade;
