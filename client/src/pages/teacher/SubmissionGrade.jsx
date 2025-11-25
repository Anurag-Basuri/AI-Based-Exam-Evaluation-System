import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import * as TeacherSvc from '../../services/teacherServices.js';

// --- Icons ---
const IconCheck = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="3"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="20 6 9 17 4 12" />
	</svg>
);
const IconX = () => (
	<svg
		width="16"
		height="16"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="3"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<line x1="18" y1="6" x2="6" y2="18" />
		<line x1="6" y1="6" x2="18" y2="18" />
	</svg>
);
const IconChevronDown = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="6 9 12 15 18 9" />
	</svg>
);
const IconChevronUp = () => (
	<svg
		width="20"
		height="20"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<polyline points="18 15 12 9 6 15" />
	</svg>
);
const IconRobot = () => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<rect x="3" y="11" width="18" height="10" rx="2" />
		<circle cx="12" cy="5" r="2" />
		<path d="M12 7v4" />
		<line x1="8" y1="16" x2="8" y2="16" />
		<line x1="16" y1="16" x2="16" y2="16" />
	</svg>
);
const IconUsers = () => (
	<svg
		width="18"
		height="18"
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
	>
		<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
		<circle cx="9" cy="7" r="4" />
		<path d="M23 21v-2a4 4 0 0 0-3-3.87" />
		<path d="M16 3.13a4 4 0 0 1 0 7.75" />
	</svg>
);

// --- Components ---

const AiInsight = ({ meta }) => {
	const [expanded, setExpanded] = React.useState(false);

	if (!meta || typeof meta !== 'object') return null;

	// Check if there's any content to show
	const hasContent =
		(meta.rubric_breakdown && meta.rubric_breakdown.length > 0) ||
		(meta.keywords_matched && meta.keywords_matched.length > 0) ||
		(meta.penalties_applied && meta.penalties_applied.length > 0) ||
		meta.fallback;

	if (!hasContent) return null;

	const renderList = (title, items, colorClass = 'text-gray-600') => {
		if (!Array.isArray(items) || items.length === 0) return null;
		return (
			<div className="mt-3">
				<div className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
					{title}
				</div>
				<ul className="space-y-1">
					{items.map((item, i) => (
						<li key={i} className={`text-sm ${colorClass} flex items-start gap-2`}>
							<span className="mt-1.5 w-1 h-1 rounded-full bg-gray-400 shrink-0" />
							<span>{typeof item === 'string' ? item : JSON.stringify(item)}</span>
						</li>
					))}
				</ul>
			</div>
		);
	};

	return (
		<div className="mt-4 border border-indigo-100 bg-indigo-50/50 rounded-xl overflow-hidden">
			<button
				onClick={() => setExpanded(!expanded)}
				className="w-full flex items-center justify-between p-3 hover:bg-indigo-50 transition-colors text-left"
			>
				<div className="flex items-center gap-2 text-indigo-700 font-semibold text-sm">
					<IconRobot />
					<span>AI Evaluation Insights</span>
				</div>
				<div className="text-indigo-400">
					{expanded ? <IconChevronUp /> : <IconChevronDown />}
				</div>
			</button>

			{expanded && (
				<div className="p-4 pt-0 border-t border-indigo-100/50">
					{renderList('Rubric Breakdown', meta.rubric_breakdown)}
					{renderList('Keywords Matched', meta.keywords_matched, 'text-emerald-700')}
					{renderList('Penalties Applied', meta.penalties_applied, 'text-rose-700')}
					{meta.fallback && (
						<div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg text-sm text-orange-800">
							<strong>Fallback Mode:</strong> {meta.reason || 'Not specified'}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

const AnswerCard = ({ idx, answer, evaluation, onUpdate, disabled, isUnsaved }) => {
	const question = answer.question;
	const isMCQ = question.type === 'multiple-choice';
	const aiEval = evaluation?.evaluation;
	const teacherEval = aiEval?.evaluator === 'teacher';

	// Controlled state from props
	const marks = aiEval?.marks ?? 0;
	const remarks = aiEval?.remarks ?? '';

	const maxMarks = question.max_marks || 0;

	const clampMarks = value => {
		const num = Number(value);
		if (Number.isNaN(num)) return 0;
		return Math.max(0, Math.min(maxMarks, num));
	};

	const handleMarksChange = e => {
		const newMarks = clampMarks(e.target.value);
		onUpdate(question._id, newMarks, remarks);
	};

	const handleRemarksChange = e => {
		const newRemarks = e.target.value;
		onUpdate(question._id, marks, newRemarks);
	};

	const quickAdjust = delta => {
		const newMarks = clampMarks((marks || 0) + delta);
		onUpdate(question._id, newMarks, remarks);
	};

	// --- Render Student Answer ---
	let studentResponse = <i className="text-gray-400">No answer provided.</i>;
	if (isMCQ) {
		const selectedOption = (question.options || []).find(
			opt => String(opt._id) === String(answer.responseOption),
		);
		const correctOption = (question.options || []).find(opt => opt.isCorrect);
		const isCorrect = selectedOption?.isCorrect;

		studentResponse = (
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-gray-500 uppercase tracking-wide w-24 shrink-0">
						Student
					</span>
					{selectedOption ? (
						<div
							className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${
								isCorrect
									? 'bg-emerald-50 border-emerald-200 text-emerald-700'
									: 'bg-rose-50 border-rose-200 text-rose-700'
							}`}
						>
							{isCorrect ? <IconCheck /> : <IconX />}
							{selectedOption.text}
						</div>
					) : (
						<span className="text-gray-400 italic">No option selected</span>
					)}
				</div>

				<div className="flex items-center gap-3">
					<span className="text-sm font-medium text-gray-500 uppercase tracking-wide w-24 shrink-0">
						Correct
					</span>
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-700 text-sm font-medium">
						<IconCheck />
						{correctOption?.text ?? 'N/A'}
					</div>
				</div>
			</div>
		);
	} else if (answer.responseText) {
		studentResponse = (
			<div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-800 whitespace-pre-wrap font-mono text-sm leading-relaxed">
				{answer.responseText}
			</div>
		);
	}

	return (
		<article
			id={`q-${question._id}`}
			className={`scroll-mt-24 bg-white border rounded-xl shadow-sm transition-all duration-200 ${
				isUnsaved ? 'border-amber-300 ring-1 ring-amber-100' : 'border-gray-200'
			}`}
		>
			{/* Header */}
			<div className="flex items-start justify-between p-5 border-b border-gray-100 bg-gray-50/30">
				<div className="flex gap-4">
					<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-sm shrink-0">
						{idx}
					</div>
					<div>
						<h3 className="text-base font-semibold text-gray-900 leading-snug">
							{question.text}
						</h3>
						<div className="flex items-center gap-3 mt-2">
							<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 uppercase tracking-wide">
								{question.type}
							</span>
							<span className="text-xs text-gray-500 font-medium">
								Max Marks: {maxMarks}
							</span>
							{teacherEval && (
								<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
									Edited
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Marks Control */}
				<div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm">
					<button
						type="button"
						onClick={() => quickAdjust(-1)}
						disabled={disabled}
						className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50 transition-colors"
					>
						−
					</button>
					<div className="relative">
						<input
							type="number"
							value={marks}
							onChange={handleMarksChange}
							min={0}
							max={maxMarks}
							disabled={disabled}
							className="w-12 text-center font-bold text-gray-900 border-none p-0 focus:ring-0 text-lg"
						/>
						<div className="absolute -bottom-2 left-0 right-0 text-[10px] text-center text-gray-400 font-medium">
							/{maxMarks}
						</div>
					</div>
					<button
						type="button"
						onClick={() => quickAdjust(1)}
						disabled={disabled}
						className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50 transition-colors"
					>
						+
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-5 space-y-6">
				{/* Student Answer Section */}
				<div>
					<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
						Student Response
					</h4>
					{studentResponse}
				</div>

				{/* Remarks Section */}
				<div>
					<h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
						Teacher Remarks
					</h4>
					<textarea
						value={remarks}
						onChange={handleRemarksChange}
						disabled={disabled}
						rows={2}
						className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
						placeholder="Add feedback for the student..."
					/>
				</div>

				{/* AI Insights */}
				{aiEval?.meta && <AiInsight meta={aiEval.meta} />}
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
	
	// List of all submissions for this exam (for navigation)
	const [allSubmissions, setAllSubmissions] = React.useState([]);

	React.useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				// Parallel fetch: current submission + list of all submissions
				const [subData, allSubs] = await Promise.all([
					TeacherSvc.safeApiCall(TeacherSvc.getSubmissionForGrading, submissionId),
					TeacherSvc.safeApiCall(TeacherSvc.getTeacherSubmissions, examId)
				]);
				
				setSubmission(subData);
				setAllSubmissions(allSubs || []);
				// Reset local updates when switching submissions
				setUpdatedEvals({});
			} catch (e) {
				setError(e.message || 'Failed to load submission data.');
			} finally {
				setLoading(false);
			}
		};
		loadData();
	}, [submissionId, examId]);

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
			// Clear local updates after save
			setUpdatedEvals({});
			// Reload ONLY the submission data to reflect changes
			const data = await TeacherSvc.safeApiCall(
				TeacherSvc.getSubmissionForGrading,
				submissionId,
			);
			setSubmission(data);
		} catch (e) {
			toastError(e.message || 'Failed to save changes.');
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="flex flex-col items-center gap-3">
					<div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
					<p className="text-gray-500 font-medium">Loading submission...</p>
				</div>
			</div>
		);
	}

	if (error) return <Alert type="error">{error}</Alert>;
	if (!submission) return <Alert>Submission data could not be found.</Alert>;

	// Build maps for quick lookup
	const evalsMap = new Map(submission.evaluations.map(e => [String(e.question), e]));

	// Compute totals
	let awarded = 0;
	let max = 0;
	let gradedCount = 0;

	submission.answers.forEach(ans => {
		const q = ans.question;
		const qid = String(q._id);
		const qMax = Number(q.max_marks || 0);
		max += qMax;

		const baseEval = evalsMap.get(qid)?.evaluation;
		const baseMarks = baseEval?.marks ?? 0;
		const pending = updatedEvals[qid]?.marks;
		
		// Determine if this question is "graded"
		if (evalsMap.has(qid) || updatedEvals[qid]) {
			gradedCount++;
		}

		const finalMarks = typeof pending === 'number' ? pending : baseMarks;
		awarded += Number(finalMarks || 0);
	});

	const progressPercent = Math.min(100, (awarded / Math.max(1, max)) * 100);
	const unsavedCount = Object.keys(updatedEvals).length;

	// Navigation Logic
	const currentIndex = allSubmissions.findIndex(s => String(s.id) === String(submissionId));
	const prevSub = currentIndex > 0 ? allSubmissions[currentIndex - 1] : null;
	const nextSub = currentIndex < allSubmissions.length - 1 ? allSubmissions[currentIndex + 1] : null;

	const navigateToSubmission = (id) => {
		if (unsavedCount > 0) {
			if (!window.confirm('You have unsaved changes. Discard them?')) return;
		}
		navigate(`/teacher/submission/${id}/grade/${examId}`);
	};

	return (
		<div className="min-h-screen bg-[#f8fafc] pb-20">
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

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
				<div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
					{/* Main Content: Questions */}
					<main className="lg:col-span-8 space-y-6">
						{/* Navigation Header (Mobile/Desktop) */}
						<div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
							<button
								onClick={() => prevSub && navigateToSubmission(prevSub.id)}
								disabled={!prevSub}
								className="flex items-center gap-2 text-sm font-medium text-gray-600 disabled:opacity-30 hover:text-indigo-600 transition-colors"
							>
								← Previous Student
							</button>
							<div className="text-sm font-bold text-gray-900">
								{currentIndex + 1} of {allSubmissions.length}
							</div>
							<button
								onClick={() => nextSub && navigateToSubmission(nextSub.id)}
								disabled={!nextSub}
								className="flex items-center gap-2 text-sm font-medium text-gray-600 disabled:opacity-30 hover:text-indigo-600 transition-colors"
							>
								Next Student →
							</button>
						</div>

						{submission.violations?.length > 0 && (
							<Alert type="warning">
								<strong>{submission.violations.length} Violation(s) Logged:</strong>
								<ul className="mt-2 list-disc pl-5 space-y-1">
									{submission.violations.map((v, i) => (
										<li key={i}>
											{v.type} at {new Date(v.at).toLocaleTimeString()}
										</li>
									))}
								</ul>
							</Alert>
						)}

						{submission.answers.map((ans, i) => {
							const qid = String(ans.question._id);
							// Merge base evaluation with local updates
							const baseEval = evalsMap.get(qid);
							const localUpdate = updatedEvals[qid];
							
							// Construct a composite evaluation object to pass down
							const compositeEval = {
								...baseEval,
								evaluation: {
									...baseEval?.evaluation,
									...(localUpdate ? { marks: localUpdate.marks, remarks: localUpdate.remarks } : {}),
								}
							};

							return (
								<AnswerCard
									key={qid}
									idx={i + 1}
									answer={ans}
									evaluation={compositeEval}
									onUpdate={handleEvaluationUpdate}
									disabled={saving}
									isUnsaved={!!localUpdate}
								/>
							);
						})}
					</main>

					{/* Sidebar: Summary & Navigation */}
					<aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-6 space-y-6">
						{/* Score Card */}
						<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
							<div className="flex justify-between items-start mb-4">
								<div>
									<h2 className="text-lg font-bold text-gray-900">Total Score</h2>
									<p className="text-sm text-gray-500">
										{gradedCount} of {submission.answers.length} questions graded
									</p>
								</div>
								<div className="text-right">
									<div className="text-3xl font-extrabold text-indigo-600">
										{awarded}
										<span className="text-lg text-gray-400 font-medium">
											/{max}
										</span>
									</div>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="w-full bg-gray-100 rounded-full h-3 mb-6 overflow-hidden">
								<div
									className="bg-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
									style={{ width: `${progressPercent}%` }}
								/>
							</div>

							{/* Actions */}
							<div className="flex flex-col gap-3">
								<button
									onClick={handleSaveChanges}
									disabled={saving || unsavedCount === 0}
									className={`w-full py-2.5 px-4 rounded-lg font-bold text-white shadow-sm transition-all flex items-center justify-center gap-2 ${
										unsavedCount > 0
											? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5'
											: 'bg-gray-300 cursor-not-allowed'
									}`}
								>
									{saving ? (
										'Saving...'
									) : (
										<>
											Save Changes
											{unsavedCount > 0 && (
												<span className="bg-white/20 px-2 py-0.5 rounded text-xs">
													{unsavedCount}
												</span>
											)}
										</>
									)}
								</button>
								<button
									onClick={() => navigate(`/teacher/results/${examId}`)}
									className="w-full py-2.5 px-4 rounded-lg font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-900 transition-colors"
								>
									Back to Results
								</button>
							</div>
						</div>

						{/* Question Navigator */}
						<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
							<h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4">
								Question Navigator
							</h3>
							<div className="grid grid-cols-5 gap-2">
								{submission.answers.map((ans, i) => {
									const qid = String(ans.question._id);
									const hasUnsaved = !!updatedEvals[qid];

									return (
										<a
											key={qid}
											href={`#q-${qid}`}
											onClick={(e) => {
												e.preventDefault();
												document.getElementById(`q-${qid}`)?.scrollIntoView({
													behavior: 'smooth',
													block: 'center'
												});
											}}
											className={`
												flex items-center justify-center h-10 rounded-lg text-sm font-bold transition-all
												${
													hasUnsaved
														? 'bg-amber-100 text-amber-700 border border-amber-200'
														: 'bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 border border-transparent'
												}
											`}
										>
											{i + 1}
										</a>
									);
								})}
							</div>
						</div>

						{/* Student List (New) */}
						<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 max-h-[400px] overflow-y-auto">
							<h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
								<IconUsers /> Class List
							</h3>
							<div className="space-y-1">
								{allSubmissions.map((sub) => {
									const isActive = String(sub.id) === String(submissionId);
									return (
										<button
											key={sub.id}
											onClick={() => !isActive && navigateToSubmission(sub.id)}
											className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between group transition-colors ${
												isActive
													? 'bg-indigo-50 text-indigo-700 font-bold'
													: 'text-gray-600 hover:bg-gray-50'
											}`}
										>
											<span className="truncate">{sub.studentName}</span>
											{sub.status === 'evaluated' && (
												<span className="w-2 h-2 rounded-full bg-emerald-400" title="Evaluated" />
											)}
										</button>
									);
								})}
							</div>
						</div>
					</aside>
				</div>
			</div>
		</div>
	);
};

export default TeacherSubmissionGrade;
