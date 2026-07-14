import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExamForm from '../../components/forms/ExamForm.jsx';
import QuestionForm from '../../components/questions/QuestionForm.jsx';
import {
	safeApiCall,
	getTeacherExamById,
	getTeacherQuestions,
	setExamQuestions,
	updateExam,
	updateTeacherQuestion,
} from '../../services/teacherServices.js';
import Alert from '../../components/ui/Alert.jsx';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { Check, Search, Filter, FileText, FileQuestion, Pencil, X, Save, ShieldAlert } from 'lucide-react';

// --- UI Components ---

const Pill = ({ children, variant = 'default', onClick }) => {
	let className = "inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full transition-all ";
	
	if (variant === 'primary') {
		className += "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20";
	} else if (variant === 'success') {
		className += "bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-500/20";
	} else if (variant === 'warning') {
		className += "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20";
	} else if (variant === 'danger') {
		className += "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20";
	} else {
		className += "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700";
	}
	
	if (onClick) {
		className += " cursor-pointer hover:shadow-md hover:-translate-y-0.5";
	}
	
	return (
		<span onClick={onClick} className={className}>
			{children}
		</span>
	);
};

const Section = ({ title, subtitle, children, actions }) => (
	<section className="glass-card rounded-2xl p-6 shadow-sm border-t-4 border-t-indigo-500 flex flex-col h-full dash-enter">
		<header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
			<div>
				<h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
				{subtitle && <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
			</div>
			{actions && <div className="shrink-0">{actions}</div>}
		</header>
		<div className="flex-1 flex flex-col">
			{children}
		</div>
	</section>
);

const ExamEdit = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [errorBanner, setErrorBanner] = useState('');

	const [details, setDetails] = useState({
		title: '',
		description: '',
		instructions: '',
		duration: 60,
		startTime: '',
		endTime: '',
		autoPublishResults: false,
	});
	const [detailErrors, setDetailErrors] = useState({});
	const [status, setStatus] = useState('draft');

	const [aiPolicy, setAiPolicy] = useState({
		strictness: 'moderate',
		reviewTone: 'concise',
		expectedLength: 20,
		customInstructions: '',
	});

	const [questions, setQuestions] = useState([]);
	const [selectedIds, setSelectedIds] = useState(new Set());
	const [query, setQuery] = useState('');
	const [typeFilter, setTypeFilter] = useState('all');
	const [difficultyFilter, setDifficultyFilter] = useState('all');

	const [showQModal, setShowQModal] = useState(false);
	const [editQuestion, setEditQuestion] = useState(null);

	const toISO = v => (v ? new Date(v).toISOString() : null);

	const loadAll = useCallback(async () => {
		setLoading(true);
		setErrorBanner('');
		try {
			const exam = await safeApiCall(getTeacherExamById, id);
			setDetails({
				title: exam.title,
				description: exam.description,
				instructions: exam.instructions,
				duration: exam.duration,
				startTime: exam.startTime
					? new Date(exam.startTime).toISOString().slice(0, 16)
					: '',
				endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
				autoPublishResults: exam.autoPublishResults,
			});
			setAiPolicy({
				strictness: exam.aiPolicy?.strictness || 'moderate',
				reviewTone: exam.aiPolicy?.reviewTone || 'concise',
				expectedLength: exam.aiPolicy?.expectedLength || 20,
				customInstructions: exam.aiPolicy?.customInstructions || '',
			});
			setStatus(exam.status);
			setSelectedIds(new Set((exam.questions || []).map(q => q._id || q)));
			
			const bank = await safeApiCall(getTeacherQuestions);
			setQuestions(Array.isArray(bank?.items) ? bank.items : []);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to load exam');
			toastError('Failed to load exam details');
		} finally {
			setLoading(false);
		}
	}, [id, toastError]);

	useEffect(() => {
		loadAll();
	}, [loadAll]);

	const validateDetails = () => {
		const errs = {};
		if (!details.title.trim()) errs.title = 'Title is required';
		if (!details.description.trim()) errs.description = 'Description is required';
		if (!details.duration || Number(details.duration) < 1) errs.duration = 'Duration invalid';
		if (!details.startTime) errs.startTime = 'Start required';
		if (!details.endTime) errs.endTime = 'End required';
		if (details.startTime && details.endTime) {
			const s = new Date(details.startTime);
			const e = new Date(details.endTime);
			if (e <= s) errs.endTime = 'End must be after start';
			if (s <= new Date()) errs.startTime = 'Start must be in the future';
		}
		setDetailErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const filteredQuestions = useMemo(() => {
		const q = query.trim().toLowerCase();
		return questions.filter(item => {
			const typeOk = typeFilter === 'all' || item.type === typeFilter;
			const difficultyOk = difficultyFilter === 'all' || item.difficulty === difficultyFilter;
			const text = `${item.text ?? ''} ${item.remarks ?? ''}`.toLowerCase();
			return typeOk && (!q || text.includes(q)) && difficultyOk;
		});
	}, [questions, query, typeFilter, difficultyFilter]);

	const selectedList = useMemo(() => {
		const map = new Map(questions.map(q => [q._id || q.id, q]));
		return Array.from(selectedIds)
			.map(i => map.get(i))
			.filter(Boolean);
	}, [selectedIds, questions]);

	const totalMarks = useMemo(
		() => selectedList.reduce((sum, q) => sum + (q?.max_marks || 0), 0),
		[selectedList],
	);

	const toggleSelected = idq => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(idq)) next.delete(idq);
			else next.add(idq);
			return next;
		});
	};

	const onSave = async () => {
		if (status !== 'draft') {
			setErrorBanner('Only draft exams can be edited.');
			return;
		}
		if (!validateDetails()) {
			setErrorBanner('Please fix the highlighted errors in the details section.');
			window.scrollTo({ top: 0, behavior: 'smooth' });
			return;
		}
		setSaving(true);
		setErrorBanner('');
		try {
			await safeApiCall(updateExam, id, {
				title: details.title.trim(),
				description: details.description?.trim() || '',
				instructions: details.instructions?.trim() || '',
				duration: Number(details.duration),
				startTime: toISO(details.startTime),
				endTime: toISO(details.endTime),
				autoPublishResults: details.autoPublishResults,
				aiPolicy: {
					...aiPolicy,
					expectedLength: Number(aiPolicy.expectedLength),
				},
			});
			await safeApiCall(setExamQuestions, id, { questionIds: Array.from(selectedIds) });
			success('Exam updated successfully');
			setTimeout(() => navigate('/teacher/exams'), 500);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to update exam');
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} finally {
			setSaving(false);
		}
	};

	const canEditQuestions = status === 'draft';
	const isLocked = status !== 'draft';

	const openEditQuestion = q => {
		if (!canEditQuestions) return;
		setEditQuestion(q);
		setShowQModal(true);
	};

	const handleSaveQuestion = async values => {
		try {
			const saved = await safeApiCall(updateTeacherQuestion, editQuestion.id, values);
			setQuestions(prev => prev.map(q => (q.id === saved.id ? saved : q)));
			success('Question updated');
			setShowQModal(false);
			setEditQuestion(null);
		} catch (e) {
			toastError(e?.message || 'Failed to update question');
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
				<div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
				<p className="font-medium animate-pulse">Loading exam details...</p>
			</div>
		);
	}

	return (
		<div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 dash-enter max-w-[1400px] mx-auto">
			<PageHeader
				title="Edit Exam"
				subtitle={
					<div className="flex items-center gap-2">
						<span>Modify details and question selection. Status: </span>
						<span className={`px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider ${
							status === 'live' || status === 'active' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
							status === 'scheduled' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
							status === 'draft' ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400' :
							'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
						}`}>
							{status}
						</span>
					</div>
				}
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Exams', to: '/teacher/exams' },
					{ label: 'Edit' },
				]}
				actions={[
					<button
						key="cancel"
						onClick={() => navigate('/teacher/exams')}
						className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
					>
						Cancel
					</button>,
					<button
						key="save"
						onClick={onSave}
						disabled={saving || isLocked}
						className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-6 py-2 rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none ml-2"
					>
						{saving ? (
							<>
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
								Saving...
							</>
						) : (
							<>
								<Save className="w-4 h-4" /> Save Changes
							</>
						)}
					</button>,
				]}
			/>

			{errorBanner && (
				<div className="mb-6">
					<Alert type="error" onClose={() => setErrorBanner('')}>
						{errorBanner}
					</Alert>
				</div>
			)}

			<div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
				{/* Left Column: Details */}
				<div className="flex flex-col gap-6">
					<Section title="Exam Details" subtitle="Basic information and settings">
						<ExamForm
							value={details}
							onChange={setDetails}
							errors={detailErrors}
							disabled={saving || isLocked}
							aiPolicy={aiPolicy}
							onAiPolicyChange={setAiPolicy}
							isDark={isDark}
						/>
					</Section>
				</div>

				{/* Right Column: Questions */}
				<div className="flex flex-col gap-6">
					<Section 
						title="Questions" 
						subtitle={
							<span className="flex items-center gap-2 mt-1">
								<span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedIds.size}</span> selected
								<span className="text-gray-300 dark:text-gray-600">•</span>
								<span className="font-bold text-violet-600 dark:text-violet-400">{totalMarks}</span> marks
							</span>
						}
						actions={
							<button
								onClick={() => setSelectedIds(new Set())}
								disabled={isLocked || selectedIds.size === 0}
								className="text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
							>
								Clear All
							</button>
						}
					>
						{!canEditQuestions && (
							<div className="mb-6">
								<Alert type="info">
									<div className="flex items-center gap-2 font-medium">
										<ShieldAlert className="w-4 h-4" />
										Editing locked for non-draft exams.
									</div>
								</Alert>
							</div>
						)}

						<div className="flex flex-col gap-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
								<input
									value={query}
									onChange={e => setQuery(e.target.value)}
									placeholder="Search questions by text or remarks..."
									className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:text-gray-500"
									disabled={isLocked}
								/>
							</div>
							<div className="flex gap-2">
								<div className="relative flex-1">
									<Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
									<select
										value={typeFilter}
										onChange={e => setTypeFilter(e.target.value)}
										className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none appearance-none font-medium disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:text-gray-500"
										disabled={isLocked}
									>
										<option value="all">All Types</option>
										<option value="multiple-choice">MCQ</option>
										<option value="subjective">Subjective</option>
									</select>
								</div>
								<select
									value={difficultyFilter}
									onChange={e => setDifficultyFilter(e.target.value)}
									className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none font-medium disabled:bg-gray-100 dark:disabled:bg-gray-800/50 disabled:text-gray-500"
									disabled={isLocked}
								>
									<option value="all">All Difficulties</option>
									<option value="easy">Easy</option>
									<option value="medium">Medium</option>
									<option value="hard">Hard</option>
								</select>
							</div>
						</div>

						<div className="flex-1 flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
							{filteredQuestions.length === 0 ? (
								<div className="py-12 flex flex-col items-center justify-center text-center">
									<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
										<FileQuestion className="w-8 h-8 text-gray-400" />
									</div>
									<p className="text-gray-500 dark:text-gray-400 font-medium">No questions found matching criteria.</p>
								</div>
							) : (
								filteredQuestions.map(q => {
									const selected = selectedIds.has(q._id || q.id);
									return (
										<div
											key={q._id || q.id}
											onClick={() => !isLocked && toggleSelected(q._id || q.id)}
											className={`group rounded-xl p-4 border transition-all ${
												selected
													? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/10'
													: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
											} ${isLocked ? 'cursor-default' : 'cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm'}`}
										>
											<div className="flex justify-between items-start mb-3">
												<div className="flex items-center gap-3">
													<div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
														selected 
															? 'bg-indigo-500 border-indigo-500 text-white' 
															: (isLocked ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 group-hover:border-indigo-400')
													}`}>
														{selected && <Check className="w-3.5 h-3.5" />}
													</div>
													<span className={`text-xs font-black tracking-wider uppercase px-2 py-0.5 rounded ${q.type === 'multiple-choice' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
														{q.type === 'multiple-choice' ? 'MCQ' : 'Subj'}
													</span>
												</div>
												<span className="text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md">
													{q.max_marks} marks
												</span>
											</div>
											<p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3 line-clamp-2 leading-relaxed">
												{q.text}
											</p>
											<div className="flex justify-between items-center">
												<Pill variant={
													q.difficulty === 'hard' ? 'danger' : 
													q.difficulty === 'medium' ? 'warning' : 'success'
												}>
													{q.difficulty}
												</Pill>
												{canEditQuestions && (
													<button
														onClick={e => {
															e.stopPropagation();
															openEditQuestion(q);
														}}
														className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
													>
														<Pencil className="w-3.5 h-3.5" /> Edit
													</button>
												)}
											</div>
										</div>
									);
								})
							)}
						</div>
					</Section>
				</div>
			</div>

			{showQModal && editQuestion && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 dash-enter" 
					onClick={() => setShowQModal(false)}
				>
					<div 
						className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-800"
						onClick={e => e.stopPropagation()}
					>
						<QuestionForm
							defaultType={editQuestion.type}
							defaultValue={editQuestion}
							onCancel={() => setShowQModal(false)}
							onSave={handleSaveQuestion}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default ExamEdit;
