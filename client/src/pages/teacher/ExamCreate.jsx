import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ExamForm from '../../components/forms/ExamForm.jsx';
import QuestionForm from '../../components/questions/QuestionForm.jsx';
import {
	safeApiCall,
	createTeacherExam,
	getTeacherQuestions,
	createTeacherQuestion,
} from '../../services/teacherServices.js';
import Alert from '../../components/ui/Alert.jsx';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { Check, Search, Filter, Layers, FileText, FileQuestion, ArrowRight, ArrowLeft } from 'lucide-react';

// --- UI Components ---

const Stepper = ({ step }) => {
	const steps = [
		{ n: 1, label: 'Details', icon: <FileText className="w-4 h-4" /> },
		{ n: 2, label: 'Questions', icon: <FileQuestion className="w-4 h-4" /> },
		{ n: 3, label: 'Review', icon: <Layers className="w-4 h-4" /> },
	];

	return (
		<div className="glass-card flex items-center justify-between px-6 py-5 rounded-2xl mb-8 relative z-10">
			{steps.map((s, idx) => {
				const active = step === s.n;
				const done = step > s.n;
				
				let circleClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm border-2 z-10 relative bg-white dark:bg-gray-800";
				
				if (done) {
					circleClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md border-2 z-10 relative bg-green-500 border-green-500 text-white";
				} else if (active) {
					circleClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-md border-2 z-10 relative bg-indigo-600 border-indigo-600 text-white scale-110";
				} else {
					circleClass = "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm border-2 z-10 relative bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500";
				}
				
				return (
					<React.Fragment key={s.n}>
						<div className="flex flex-col sm:flex-row items-center gap-3 z-10">
							<div className={circleClass}>
								{done ? <Check className="w-5 h-5" /> : (active ? s.icon : s.n)}
							</div>
							<span
								className={`text-sm font-bold transition-colors hidden sm:block ${active ? 'text-indigo-600 dark:text-indigo-400' : (done ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400 dark:text-gray-500')}`}
							>
								{s.label}
							</span>
						</div>
						{idx < steps.length - 1 && (
							<div className="flex-1 h-1.5 mx-4 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative">
								<div
									className="absolute top-0 left-0 h-full bg-green-500 transition-all duration-500 ease-out"
									style={{ width: done ? '100%' : '0%' }}
								/>
							</div>
						)}
					</React.Fragment>
				);
			})}
		</div>
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

// --- Main Component ---

const ExamCreate = () => {
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const [step, setStep] = useState(1);
	const [saving, setSaving] = useState(false);
	const [errorBanner, setErrorBanner] = useState('');

	// Step 1: exam details
	const [details, setDetails] = useState({
		title: '',
		description: '',
		duration: 60,
		startTime: '',
		endTime: '',
	});
	const [detailErrors, setDetailErrors] = useState({});

	const [aiPolicy, setAiPolicy] = useState({
		strictness: 'moderate',
		reviewTone: 'concise',
		expectedLength: 20,
		customInstructions: '',
	});

	// Step 2: question bank + selection + inline create
	const [loadingQ, setLoadingQ] = useState(false);
	const [questions, setQuestions] = useState([]);
	const [query, setQuery] = useState('');
	const [typeFilter, setTypeFilter] = useState('all');
	const [difficultyFilter, setDifficultyFilter] = useState('all');
	const [selectedIds, setSelectedIds] = useState(new Set());

	const [showCreateQuestion, setShowCreateQuestion] = useState(false);
	const [createType, setCreateType] = useState('multiple-choice');

	const loadQuestions = useCallback(async () => {
		setLoadingQ(true);
		try {
			const response = await safeApiCall(getTeacherQuestions);
			const items = Array.isArray(response) ? response : response?.items || [];
			setQuestions(Array.isArray(items) ? items : []);
		} catch (e) {
			toastError('Failed to load questions');
		} finally {
			setLoadingQ(false);
		}
	}, [toastError]);

	useEffect(() => {
		if (step === 2 && questions.length === 0) {
			loadQuestions();
		}
	}, [step, loadQuestions, questions.length]);

	const filteredQuestions = useMemo(() => {
		const q = query.trim().toLowerCase();
		return questions.filter(item => {
			const typeOk = typeFilter === 'all' || item.type === typeFilter;
			const difficultyOk = difficultyFilter === 'all' || item.difficulty === difficultyFilter;
			const text = `${item.text ?? ''} ${item.remarks ?? ''}`.toLowerCase();
			const queryOk = !q || text.includes(q);
			return typeOk && queryOk && difficultyOk;
		});
	}, [questions, query, typeFilter, difficultyFilter]);

	const selectedList = useMemo(() => {
		const map = new Map(questions.map(q => [q.id, q]));
		return Array.from(selectedIds)
			.map(id => map.get(id))
			.filter(Boolean);
	}, [selectedIds, questions]);

	const totalMarks = useMemo(
		() => selectedList.reduce((sum, q) => sum + (q?.max_marks || 0), 0),
		[selectedList],
	);

	const toggleSelected = id => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
				return next;
			}
			
			// Adding a new question: Check limits
			const targetQuestion = questions.find(q => q.id === id || q._id === id);
			if (!targetQuestion) return prev;

			const currentSelected = Array.from(prev).map(selId => questions.find(q => q.id === selId || q._id === selId)).filter(Boolean);
			
			const LIMITS = { total: 30, mcq: 30, subjective: 10 };
			if (currentSelected.length >= LIMITS.total) {
				toastError(`Maximum ${LIMITS.total} questions allowed.`);
				return prev;
			}
			
			const mcqCount = currentSelected.filter(q => q.type === 'multiple-choice').length;
			const subCount = currentSelected.filter(q => q.type === 'subjective').length;
			
			if (targetQuestion.type === 'multiple-choice' && mcqCount >= LIMITS.mcq) {
				toastError(`Maximum ${LIMITS.mcq} MCQs allowed.`);
				return prev;
			}
			if (targetQuestion.type === 'subjective' && subCount >= LIMITS.subjective) {
				toastError(`Maximum ${LIMITS.subjective} subjective questions allowed.`);
				return prev;
			}

			next.add(id);
			return next;
		});
	};

	const validateDetails = () => {
		const errs = {};
		if (!details.title.trim()) errs.title = 'Title is required';
		if (!details.description.trim()) errs.description = 'Description is required';
		if (!details.duration || Number(details.duration) < 1)
			errs.duration = 'Duration must be at least 1 minute';
		if (!details.startTime) errs.startTime = 'Start date/time required';
		if (!details.endTime) errs.endTime = 'End date/time required';
		if (details.startTime && details.endTime) {
			const s = new Date(details.startTime);
			const e = new Date(details.endTime);
			if (e <= s) errs.endTime = 'End time must be after start time';
			if (s <= new Date()) errs.startTime = 'Start time must be in the future';
		}
		setDetailErrors(errs);
		return Object.keys(errs).length === 0;
	};

	const toISO = v => (v ? new Date(v).toISOString() : null);

	const handleCreateQuestion = async values => {
		try {
			const created = await safeApiCall(createTeacherQuestion, values);
			setQuestions(prev => [created, ...prev]);
			if (created?.id || created?._id) {
				const qId = created.id || created._id;
				setSelectedIds(prev => {
					const currentSelected = Array.from(prev).map(selId => questions.find(q => q.id === selId || q._id === selId) || (selId === qId ? created : null)).filter(Boolean);
					const LIMITS = { total: 30, mcq: 30, subjective: 10 };
					
					if (currentSelected.length >= LIMITS.total) {
						toastError(`Created successfully, but couldn't auto-select: Maximum ${LIMITS.total} questions allowed.`);
						return prev;
					}
					
					const mcqCount = currentSelected.filter(q => q.type === 'multiple-choice').length;
					const subCount = currentSelected.filter(q => q.type === 'subjective').length;
					
					if (created.type === 'multiple-choice' && mcqCount >= LIMITS.mcq) {
						toastError(`Created successfully, but couldn't auto-select: Maximum ${LIMITS.mcq} MCQs allowed.`);
						return prev;
					}
					
					if (created.type === 'subjective' && subCount >= LIMITS.subjective) {
						toastError(`Created successfully, but couldn't auto-select: Maximum ${LIMITS.subjective} subjective questions allowed.`);
						return prev;
					}

					success('Question created and selected');
					return new Set(prev).add(qId);
				});
			} else {
				success('Question created');
			}
		} catch (e) {
			toastError(e?.message || 'Failed to create question');
		} finally {
			setShowCreateQuestion(false);
		}
	};

	const onSubmitExam = async () => {
		setSaving(true);
		setErrorBanner('');
		try {
			const payload = {
				title: details.title.trim(),
				description: details.description?.trim() || '',
				duration: Number(details.duration),
				startTime: toISO(details.startTime),
				endTime: toISO(details.endTime),
				questionIds: Array.from(selectedIds),
				aiPolicy: {
					...aiPolicy,
					expectedLength: Number(aiPolicy.expectedLength),
				},
			};
			await safeApiCall(createTeacherExam, payload);
			success('Exam created successfully');
			setTimeout(() => navigate('/teacher/exams'), 500);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to create exam');
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} finally {
			setSaving(false);
		}
	};

	const handleNext = () => {
		if (step === 1) {
			if (validateDetails()) {
				setStep(2);
				setErrorBanner('');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				setErrorBanner('Please fix the highlighted errors before continuing.');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		} else if (step === 2) {
			if (selectedIds.size > 0) {
				setStep(3);
				setErrorBanner('');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				setErrorBanner('Please select at least one question.');
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}
	};

	return (
		<div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 dash-enter max-w-7xl mx-auto">
			<PageHeader
				title="Create Exam"
				subtitle="Setup details, select or create questions, then review and create."
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Exams', to: '/teacher/exams' },
					{ label: 'Create' },
				]}
				actions={[
					<button
						key="cancel"
						onClick={() => navigate('/teacher/exams')}
						className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
					>
						Cancel
					</button>,
				]}
			/>

			<Stepper step={step} />

			{errorBanner && (
				<div className="mb-6">
					<Alert type="error" onClose={() => setErrorBanner('')}>
						{errorBanner}
					</Alert>
				</div>
			)}

			{step === 1 && (
				<div className="max-w-4xl mx-auto">
					<Section
						title="1. Exam Details"
						subtitle="Title, description, time window and duration."
					>
						<ExamForm
							value={details}
							onChange={setDetails}
							errors={detailErrors}
							disabled={saving}
							aiPolicy={aiPolicy}
							onAiPolicyChange={setAiPolicy}
							isDark={isDark}
						/>
						<div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
							<button 
								onClick={handleNext} 
								className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all active:scale-95"
							>
								Next: Questions <ArrowRight className="w-4 h-4" />
							</button>
						</div>
					</Section>
				</div>
			)}

			{step === 2 && (
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 flex flex-col gap-6">
						<Section
							title="2. Select Questions"
							subtitle="Pick from your bank or create new ones."
							actions={
								<div className="flex flex-wrap gap-2">
									<button
										onClick={() => {
											setCreateType('multiple-choice');
											setShowCreateQuestion(true);
										}}
										className="px-3 py-1.5 border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
									>
										+ MCQ
									</button>
									<button
										onClick={() => {
											setCreateType('subjective');
											setShowCreateQuestion(true);
										}}
										className="px-3 py-1.5 border border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
									>
										+ Subjective
									</button>
								</div>
							}
						>
							<div className="flex flex-col gap-3 mb-6 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
								<div className="relative">
									<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
									<input
										value={query}
										onChange={e => setQuery(e.target.value)}
										placeholder="Search questions by text or remarks..."
										className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
									/>
								</div>
								<div className="flex gap-2">
									<div className="relative flex-1">
										<Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
										<select
											value={typeFilter}
											onChange={e => setTypeFilter(e.target.value)}
											className="w-full pl-8 pr-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none appearance-none font-medium"
										>
											<option value="all">All Types</option>
											<option value="multiple-choice">MCQ</option>
											<option value="subjective">Subjective</option>
										</select>
									</div>
									<select
										value={difficultyFilter}
										onChange={e => setDifficultyFilter(e.target.value)}
										className="flex-1 px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 focus:outline-none font-medium"
									>
										<option value="all">All Difficulties</option>
										<option value="easy">Easy</option>
										<option value="medium">Medium</option>
										<option value="hard">Hard</option>
									</select>
								</div>
							</div>

							{loadingQ ? (
								<div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
									<div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
									<p className="font-medium animate-pulse">Loading questions...</p>
								</div>
							) : (
								<div className="flex-1 flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
									{filteredQuestions.length === 0 ? (
										<div className="py-12 flex flex-col items-center justify-center text-center">
											<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
												<FileQuestion className="w-8 h-8 text-gray-400" />
											</div>
											<p className="text-gray-500 dark:text-gray-400 font-medium">No questions found matching criteria.</p>
										</div>
									) : (
										filteredQuestions.map(q => {
											const selected = selectedIds.has(q.id);
											return (
												<div
													key={q.id}
													onClick={() => toggleSelected(q.id)}
													className={`group cursor-pointer rounded-xl p-4 border transition-all ${
														selected
															? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-500 shadow-md shadow-indigo-500/10'
															: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm'
													}`}
												>
													<div className="flex justify-between items-start mb-3">
														<div className="flex items-center gap-3">
															<div className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${selected ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 group-hover:border-indigo-400'}`}>
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
													</div>
												</div>
											);
										})
									)}
								</div>
							)}
						</Section>
					</div>

					<div className="lg:col-span-1">
						<Section title="Summary" subtitle="Selected questions">
							<div className="grid grid-cols-2 gap-4 mb-6">
								<div className="bg-gradient-to-br from-indigo-500/10 to-indigo-500/5 border border-indigo-100 dark:border-indigo-500/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
									<span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mb-1">{selectedIds.size}</span>
									<span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Questions</span>
								</div>
								<div className="bg-gradient-to-br from-violet-500/10 to-violet-500/5 border border-violet-100 dark:border-violet-500/20 p-4 rounded-2xl flex flex-col items-center justify-center text-center">
									<span className="text-3xl font-black text-violet-600 dark:text-violet-400 mb-1">{totalMarks}</span>
									<span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Marks</span>
								</div>
							</div>

							<div className="flex flex-col gap-3 mt-auto">
								<button 
									onClick={handleNext} 
									disabled={selectedIds.size === 0}
									className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 disabled:hover:shadow-none"
								>
									Review <ArrowRight className="w-4 h-4" />
								</button>
								<button 
									onClick={() => setStep(1)} 
									className="w-full flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
								>
									<ArrowLeft className="w-4 h-4" /> Back
								</button>
							</div>
						</Section>
					</div>
				</div>
			)}

			{step === 3 && (
				<div className="max-w-3xl mx-auto">
					<Section
						title="3. Review & Create"
						subtitle="Double check everything before creating."
					>
						<div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 mb-6 space-y-4">
							<div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
								<span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Title</span>
								<span className="text-sm font-bold text-gray-900 dark:text-white text-right max-w-[60%]">{details.title}</span>
							</div>
							<div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
								<span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Duration</span>
								<span className="text-sm font-bold text-gray-900 dark:text-white text-right">{details.duration} mins</span>
							</div>
							<div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
								<span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Start Time</span>
								<span className="text-sm font-bold text-gray-900 dark:text-white text-right">
									{new Date(details.startTime).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
								<span className="text-sm font-semibold text-gray-500 dark:text-gray-400">End Time</span>
								<span className="text-sm font-bold text-gray-900 dark:text-white text-right">
									{new Date(details.endTime).toLocaleString()}
								</span>
							</div>
							<div className="flex justify-between py-3 border-b border-gray-200 dark:border-gray-700 last:border-0">
								<span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Questions</span>
								<span className="text-sm font-bold text-indigo-600 dark:text-indigo-400 text-right">
									{selectedIds.size} selected ({totalMarks} marks)
								</span>
							</div>
						</div>

						<div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-800">
							<button 
								onClick={() => setStep(2)} 
								className="flex items-center gap-2 px-6 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
							>
								<ArrowLeft className="w-4 h-4" /> Back
							</button>
							<button
								onClick={onSubmitExam}
								disabled={saving}
								className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-8 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
							>
								{saving ? (
									<>
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										Creating...
									</>
								) : (
									<>
										<Check className="w-4 h-4" /> Create Exam
									</>
								)}
							</button>
						</div>
					</Section>
				</div>
			)}

			{showCreateQuestion && (
				<div 
					className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 dash-enter" 
					onClick={() => setShowCreateQuestion(false)}
				>
					<div 
						className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar border border-gray-100 dark:border-gray-800"
						onClick={e => e.stopPropagation()}
					>
						<QuestionForm
							defaultType={createType}
							onCancel={() => setShowCreateQuestion(false)}
							onSave={handleCreateQuestion}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default ExamCreate;
