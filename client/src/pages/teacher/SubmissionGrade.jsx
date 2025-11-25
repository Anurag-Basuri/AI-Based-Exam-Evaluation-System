import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

	const hasContent =
		(meta.rubric_breakdown && meta.rubric_breakdown.length > 0) ||
		(meta.keywords_matched && meta.keywords_matched.length > 0) ||
		(meta.penalties_applied && meta.penalties_applied.length > 0) ||
		meta.fallback;

	if (!hasContent) return null;

	const renderList = (title, items, colorClass = 'text-[var(--text-muted)]') => {
		if (!Array.isArray(items) || items.length === 0) return null;
		return (
			<div className="mt-3">
				<div className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1 opacity-70">
					{title}
				</div>
				<ul className="space-y-1">
					{items.map((item, i) => (
						<li key={i} className={`text-sm ${colorClass} flex items-start gap-2`}>
							<span className="mt-1.5 w-1 h-1 rounded-full bg-[var(--text-muted)] shrink-0 opacity-50" />
							<span className="text-[var(--text)] leading-relaxed">
								{typeof item === 'string' ? item : JSON.stringify(item)}
							</span>
						</li>
					))}
				</ul>
			</div>
		);
	};

	return (
		<motion.div
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			className="mt-4 border border-indigo-500/20 bg-indigo-500/5 rounded-xl overflow-hidden"
		>
			<button
				onClick={() => setExpanded(!expanded)}
				className="w-full flex items-center justify-between p-3 hover:bg-indigo-500/10 transition-colors text-left"
			>
				<div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
					<IconRobot />
					<span>AI Evaluation Insights</span>
				</div>
				<div className="text-indigo-400">
					{expanded ? <IconChevronUp /> : <IconChevronDown />}
				</div>
			</button>

			<AnimatePresence>
				{expanded && (
					<motion.div
						initial={{ height: 0, opacity: 0 }}
						animate={{ height: 'auto', opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.2 }}
						className="overflow-hidden"
					>
						<div className="p-4 pt-0 border-t border-indigo-500/10">
							{renderList('Rubric Breakdown', meta.rubric_breakdown)}
							{renderList(
								'Keywords Matched',
								meta.keywords_matched,
								'text-emerald-600 dark:text-emerald-400',
							)}
							{renderList(
								'Penalties Applied',
								meta.penalties_applied,
								'text-rose-600 dark:text-rose-400',
							)}
							{meta.fallback && (
								<div className="mt-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-sm text-orange-700 dark:text-orange-300">
									<strong>Fallback Mode:</strong> {meta.reason || 'Not specified'}
								</div>
							)}
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
};

const AnswerCard = ({ idx, answer, evaluation, onUpdate, disabled, isUnsaved }) => {
	const question = answer.question;
	const isMCQ = question.type === 'multiple-choice';
	const aiEval = evaluation?.evaluation;
	const teacherEval = aiEval?.evaluator === 'teacher';

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

	let studentResponse = <i className="text-[var(--text-muted)]">No answer provided.</i>;
	if (isMCQ) {
		const selectedOption = (question.options || []).find(
			opt => String(opt._id) === String(answer.responseOption),
		);
		const correctOption = (question.options || []).find(opt => opt.isCorrect);
		const isCorrect = selectedOption?.isCorrect;

		studentResponse = (
			<div className="space-y-3">
				<div className="flex items-center gap-3">
					<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-20 shrink-0">
						Student
					</span>
					{selectedOption ? (
						<div
							className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
								isCorrect
									? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
									: 'bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400'
							}`}
						>
							{isCorrect ? <IconCheck /> : <IconX />}
							{selectedOption.text}
						</div>
					) : (
						<span className="text-[var(--text-muted)] italic">No option selected</span>
					)}
				</div>

				<div className="flex items-center gap-3">
					<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider w-20 shrink-0">
						Correct
					</span>
					<div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] text-sm font-medium">
						<IconCheck />
						{correctOption?.text ?? 'N/A'}
					</div>
				</div>
			</div>
		);
	} else if (answer.responseText) {
		studentResponse = (
			<div className="bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg p-5 text-[var(--text)] whitespace-pre-wrap font-mono text-sm leading-relaxed shadow-inner">
				{answer.responseText}
			</div>
		);
	}

	return (
		<motion.article
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.3, delay: idx * 0.05 }}
			id={`q-${question._id}`}
			className={`scroll-mt-28 bg-[var(--surface)] border rounded-2xl shadow-sm transition-all duration-300 hover:shadow-md ${
				isUnsaved ? 'border-amber-400 ring-1 ring-amber-400/30' : 'border-[var(--border)]'
			}`}
		>
			{/* Header */}
			<div className="flex items-start justify-between p-5 border-b border-[var(--border)] bg-[var(--bg-secondary)]/30 backdrop-blur-sm rounded-t-2xl">
				<div className="flex gap-4">
					<div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0 mt-0.5">
						{idx}
					</div>
					<div>
						<h3 className="text-base font-bold text-[var(--text)] leading-snug">
							{question.text}
						</h3>
						<div className="flex items-center gap-3 mt-2.5">
							<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[var(--bg)] text-[var(--text-muted)] border border-[var(--border)] uppercase tracking-wider">
								{question.type}
							</span>
							<span className="text-xs text-[var(--text-muted)] font-medium">
								Max Marks: {maxMarks}
							</span>
							{teacherEval && (
								<span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 uppercase tracking-wider">
									Edited
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Marks Control */}
				<div className="flex items-center bg-[var(--bg)] border border-[var(--border)] rounded-xl p-1 shadow-sm shrink-0 ml-4">
					<button
						type="button"
						onClick={() => quickAdjust(-1)}
						disabled={disabled}
						className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] disabled:opacity-50 transition-colors active:scale-95"
					>
						−
					</button>
					<div className="relative mx-1">
						<input
							type="number"
							value={marks}
							onChange={handleMarksChange}
							min={0}
							max={maxMarks}
							disabled={disabled}
							className="w-14 text-center font-bold text-[var(--text)] bg-transparent border-none p-0 focus:ring-0 text-xl"
						/>
						<div className="absolute -bottom-2.5 left-0 right-0 text-[9px] text-center text-[var(--text-muted)] font-bold tracking-tight">
							/{maxMarks}
						</div>
					</div>
					<button
						type="button"
						onClick={() => quickAdjust(1)}
						disabled={disabled}
						className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] disabled:opacity-50 transition-colors active:scale-95"
					>
						+
					</button>
				</div>
			</div>

			{/* Body */}
			<div className="p-6 space-y-6">
				{/* Student Answer Section */}
				<div>
					<h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
						Student Response
					</h4>
					{studentResponse}
				</div>

				{/* Remarks Section */}
				<div>
					<h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">
						Teacher Remarks
					</h4>
					<textarea
						value={remarks}
						onChange={handleRemarksChange}
						disabled={disabled}
						rows={2}
						className="w-full rounded-xl bg-[var(--bg)] border-[var(--border)] text-[var(--text)] shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm placeholder-[var(--text-muted)] transition-shadow p-3"
						placeholder="Add feedback for the student..."
					/>
				</div>

				{/* AI Insights */}
				{aiEval?.meta && <AiInsight meta={aiEval.meta} />}
			</div>
		</motion.article>
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
	const [allSubmissions, setAllSubmissions] = React.useState([]);

	React.useEffect(() => {
		const loadData = async () => {
			setLoading(true);
			try {
				const [subData, allSubs] = await Promise.all([
					TeacherSvc.safeApiCall(TeacherSvc.getSubmissionForGrading, submissionId),
					TeacherSvc.safeApiCall(TeacherSvc.getTeacherSubmissions, examId),
				]);

				setSubmission(subData);
				setAllSubmissions(allSubs || []);
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
			setUpdatedEvals({});
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
			<div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
				<div className="flex flex-col items-center gap-4">
					<div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
					<p className="text-[var(--text-muted)] font-medium animate-pulse">
						Loading submission...
					</p>
				</div>
			</div>
		);
	}

	if (error) return <Alert type="error">{error}</Alert>;
	if (!submission) return <Alert>Submission data could not be found.</Alert>;

	const evalsMap = new Map(
		(submission.evaluations || []).map(e => [String(e.question?._id || e.question), e]),
	);

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

		if (evalsMap.has(qid) || updatedEvals[qid]) {
			gradedCount++;
		}

		const finalMarks = typeof pending === 'number' ? pending : baseMarks;
		awarded += Number(finalMarks || 0);
	});

	const progressPercent = Math.min(100, (awarded / Math.max(1, max)) * 100);
	const unsavedCount = Object.keys(updatedEvals).length;

	const currentIndex = allSubmissions.findIndex(s => String(s.id) === String(submissionId));
	const prevSub = currentIndex > 0 ? allSubmissions[currentIndex - 1] : null;
	const nextSub =
		currentIndex < allSubmissions.length - 1 ? allSubmissions[currentIndex + 1] : null;

	const navigateToSubmission = id => {
		if (unsavedCount > 0) {
			if (!window.confirm('You have unsaved changes. Discard them?')) return;
		}
		navigate(`/teacher/results/${examId}/grade/${id}`);
	};

	return (
		<div className="min-h-screen bg-[var(--bg-secondary)] pb-20">
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

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
				<div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
					{/* Main Content: Questions */}
					<main className="lg:col-span-8 space-y-8">
						{/* Navigation Header */}
						<div className="flex items-center justify-between bg-[var(--surface)] p-4 rounded-2xl border border-[var(--border)] shadow-sm sticky top-24 z-10 backdrop-blur-md bg-opacity-90">
							<button
								onClick={() => prevSub && navigateToSubmission(prevSub.id)}
								disabled={!prevSub}
								className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] disabled:opacity-30 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
							>
								← Previous
							</button>
							<div className="text-sm font-bold text-[var(--text)] bg-[var(--bg-secondary)] px-4 py-1.5 rounded-full">
								Student {currentIndex + 1} of {allSubmissions.length}
							</div>
							<button
								onClick={() => nextSub && navigateToSubmission(nextSub.id)}
								disabled={!nextSub}
								className="flex items-center gap-2 text-sm font-bold text-[var(--text-muted)] disabled:opacity-30 hover:text-indigo-600 transition-colors px-3 py-2 rounded-lg hover:bg-[var(--bg-secondary)]"
							>
								Next →
							</button>
						</div>

						{submission.violations?.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
							>
								<Alert type="warning">
									<strong>
										{submission.violations.length} Violation(s) Logged:
									</strong>
									<ul className="mt-2 list-disc pl-5 space-y-1">
										{submission.violations.map((v, i) => (
											<li key={i}>
												{v.type} at {new Date(v.at).toLocaleTimeString()}
											</li>
										))}
									</ul>
								</Alert>
							</motion.div>
						)}

						{submission.answers.map((ans, i) => {
							const qid = String(ans.question._id);
							const baseEval = evalsMap.get(qid);
							const localUpdate = updatedEvals[qid];

							const compositeEval = {
								...baseEval,
								evaluation: {
									...baseEval?.evaluation,
									...(localUpdate
										? { marks: localUpdate.marks, remarks: localUpdate.remarks }
										: {}),
								},
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
					<aside className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-6">
						{/* Score Card */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6"
						>
							<div className="flex justify-between items-start mb-6">
								<div>
									<h2 className="text-lg font-bold text-[var(--text)]">
										Total Score
									</h2>
									<p className="text-sm text-[var(--text-muted)] mt-1">
										{gradedCount} of {submission.answers.length} graded
									</p>
								</div>
								<div className="text-right">
									<div className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400 tracking-tight">
										{awarded}
										<span className="text-xl text-[var(--text-muted)] font-bold opacity-60">
											/{max}
										</span>
									</div>
								</div>
							</div>

							{/* Progress Bar */}
							<div className="w-full bg-[var(--bg-secondary)] rounded-full h-4 mb-8 overflow-hidden border border-[var(--border)]">
								<motion.div
									className="bg-gradient-to-r from-indigo-500 to-violet-600 h-full rounded-full"
									initial={{ width: 0 }}
									animate={{ width: `${progressPercent}%` }}
									transition={{ duration: 0.8, ease: 'easeOut' }}
								/>
							</div>

							{/* Actions */}
							<div className="flex flex-col gap-3">
								<button
									onClick={handleSaveChanges}
									disabled={saving || unsavedCount === 0}
									className={`w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 ${
										unsavedCount > 0
											? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
											: 'bg-[var(--border)] cursor-not-allowed text-[var(--text-muted)] shadow-none'
									}`}
								>
									{saving ? (
										'Saving...'
									) : (
										<>
											Save Changes
											{unsavedCount > 0 && (
												<span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">
													{unsavedCount}
												</span>
											)}
										</>
									)}
								</button>
								<button
									onClick={() => navigate(`/teacher/results/${examId}`)}
									className="w-full py-3 px-4 rounded-xl font-bold text-[var(--text-muted)] bg-[var(--bg)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] hover:text-[var(--text)] transition-colors"
								>
									Back to Results
								</button>
							</div>
						</motion.div>

						{/* Question Navigator */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.3 }}
							className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6"
						>
							<h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4">
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
											onClick={e => {
												e.preventDefault();
												document
													.getElementById(`q-${qid}`)
													?.scrollIntoView({
														behavior: 'smooth',
														block: 'center',
													});
											}}
											className={`
												flex items-center justify-center h-10 rounded-lg text-sm font-bold transition-all
												${
													hasUnsaved
														? 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
														: 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-indigo-500/10 hover:text-indigo-600 border border-transparent'
												}
											`}
										>
											{i + 1}
										</a>
									);
								})}
							</div>
						</motion.div>

						{/* Student List */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.4 }}
							className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm p-6 max-h-[400px] overflow-y-auto custom-scrollbar"
						>
							<h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-4 flex items-center gap-2">
								<IconUsers /> Class List
							</h3>
							<div className="space-y-1">
								{allSubmissions.map(sub => {
									const isActive = String(sub.id) === String(submissionId);
									return (
										<button
											key={sub.id}
											onClick={() =>
												!isActive && navigateToSubmission(sub.id)
											}
											className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center justify-between group transition-all ${
												isActive
													? 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold'
													: 'text-[var(--text-muted)] hover:bg-[var(--bg-secondary)]'
											}`}
										>
											<span className="truncate">{sub.studentName}</span>
											{sub.status === 'evaluated' && (
												<span
													className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
													title="Evaluated"
												/>
											)}
										</button>
									);
								})}
							</div>
						</motion.div>
					</aside>
				</div>
			</div>
		</div>
	);
};

const styles = {
	bulkToolbar: {
		display: 'flex',
		gap: '1rem',
		margin: '1rem 0',
		justifyContent: 'center',
		alignItems: 'center',
	},
};

const BulkActionToolbar = ({ selectedIds, onBulkResolve, onClear }) => {
	if (!selectedIds || selectedIds.length === 0) return null;

	const handleResolveClick = () => {
		const reply = window.prompt(
			`Enter a single reply to resolve all ${selectedIds.length} selected issues:`,
		);
		if (reply && reply.trim()) {
			onBulkResolve(reply);
		}
	};

	return (
		<div style={styles.bulkToolbar}>
			<button
				onClick={handleResolveClick}
				className="px-4 py-2 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 transition-colors"
			>
				Resolve Selected
			</button>
			<button
				onClick={onClear}
				className="px-4 py-2 rounded-md bg-red-600 text-white font-semibold hover:bg-red-700 transition-colors"
			>
				Clear Selections
			</button>
		</div>
	);
};

export default TeacherSubmissionGrade;
