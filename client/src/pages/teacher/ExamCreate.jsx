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

// --- UI Components ---

const Stepper = ({ step }) => {
	const steps = [
		{ n: 1, label: 'Details' },
		{ n: 2, label: 'Questions' },
		{ n: 3, label: 'Review' },
	];

	return (
		<div style={styles.stepperContainer}>
			{steps.map((s, idx) => {
				const active = step === s.n;
				const done = step > s.n;
				return (
					<React.Fragment key={s.n}>
						<div style={styles.stepItem}>
							<div
								style={{
									...styles.stepCircle,
									background: done ? 'var(--success)' : active ? 'var(--primary)' : 'var(--surface)',
									borderColor: done || active ? 'transparent' : 'var(--border)',
									color: done || active ? '#fff' : 'var(--text-muted)',
								}}
							>
								{done ? '✓' : s.n}
							</div>
							<span
								style={{
									...styles.stepLabel,
									color: active ? 'var(--text)' : 'var(--text-muted)',
									fontWeight: active ? 700 : 500,
								}}
							>
								{s.label}
							</span>
						</div>
						{idx < steps.length - 1 && (
							<div style={styles.stepLine}>
								<div
									style={{
										height: '100%',
										width: done ? '100%' : '0%',
										background: 'var(--success)',
										transition: 'width 0.3s ease',
									}}
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
	<section style={styles.section}>
		<header style={styles.sectionHeader}>
			<div>
				<h2 style={styles.sectionTitle}>{title}</h2>
				{subtitle && <p style={styles.sectionSubtitle}>{subtitle}</p>}
			</div>
			{actions && <div>{actions}</div>}
		</header>
		{children}
	</section>
);

const Pill = ({ children, variant = 'default', onClick }) => {
	const bg = variant === 'primary' ? 'var(--primary-light-bg)' : 'var(--bg)';
	const color = variant === 'primary' ? 'var(--primary)' : 'var(--text)';
	const border = variant === 'primary' ? 'var(--primary-light)' : 'var(--border)';

	return (
		<span
			onClick={onClick}
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 6,
				padding: '4px 12px',
				fontSize: 12,
				fontWeight: 600,
				borderRadius: 999,
				border: `1px solid ${border}`,
				background: bg,
				color: color,
				cursor: onClick ? 'pointer' : 'default',
				transition: 'all 0.2s',
			}}
		>
			{children}
		</span>
	);
};

// --- Main Component ---

const ExamCreate = () => {
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();

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
			if (next.has(id)) next.delete(id);
			else next.add(id);
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
			if (created?.id) {
				setSelectedIds(prev => new Set(prev).add(created.id));
			}
			success('Question created and selected');
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
		} finally {
			setSaving(false);
		}
	};

	const handleNext = () => {
		if (step === 1) {
			if (validateDetails()) setStep(2);
			else setErrorBanner('Please fix the errors before continuing.');
		} else if (step === 2) {
			if (selectedIds.size > 0) setStep(3);
			else setErrorBanner('Please select at least one question.');
		}
	};

	return (
		<div style={styles.page}>
			<div style={styles.container}>
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
							style={styles.btnSecondary}
						>
							Cancel
						</button>,
					]}
				/>

				<Stepper step={step} />

				{errorBanner && (
					<div style={{ marginBottom: 24 }}>
						<Alert type="error" onClose={() => setErrorBanner('')}>
							{errorBanner}
						</Alert>
					</div>
				)}

				{step === 1 && (
					<Section title="1. Exam Details" subtitle="Title, description, time window and duration.">
						<ExamForm
							value={details}
							onChange={setDetails}
							errors={detailErrors}
							disabled={saving}
							aiPolicy={aiPolicy}
							onAiPolicyChange={setAiPolicy}
						/>
						<div style={styles.footerActions}>
							<button onClick={handleNext} style={styles.btnPrimary}>
								Next: Questions →
							</button>
						</div>
					</Section>
				)}

				{step === 2 && (
					<div style={styles.grid}>
						<div style={styles.colMain}>
							<Section 
								title="2. Select Questions" 
								subtitle="Pick from your bank or create new ones."
								actions={
									<div style={{ display: 'flex', gap: 8 }}>
										<button
											onClick={() => {
												setCreateType('multiple-choice');
												setShowCreateQuestion(true);
											}}
											style={styles.btnSecondarySmall}
										>
											+ MCQ
										</button>
										<button
											onClick={() => {
												setCreateType('subjective');
												setShowCreateQuestion(true);
											}}
											style={styles.btnSecondarySmall}
										>
											+ Subjective
										</button>
									</div>
								}
							>
								<div style={styles.filterBar}>
									<div style={styles.searchWrapper}>
										<span style={styles.searchIcon}>🔍</span>
										<input
											value={query}
											onChange={e => setQuery(e.target.value)}
											placeholder="Search questions..."
											style={styles.searchInput}
										/>
									</div>
									<div style={styles.filterRow}>
										<select
											value={typeFilter}
											onChange={e => setTypeFilter(e.target.value)}
											style={styles.select}
										>
											<option value="all">All Types</option>
											<option value="multiple-choice">MCQ</option>
											<option value="subjective">Subjective</option>
										</select>
										<select
											value={difficultyFilter}
											onChange={e => setDifficultyFilter(e.target.value)}
											style={styles.select}
										>
											<option value="all">All Difficulties</option>
											<option value="easy">Easy</option>
											<option value="medium">Medium</option>
											<option value="hard">Hard</option>
										</select>
									</div>
								</div>

								{loadingQ ? (
									<div style={styles.loadingState}>Loading questions...</div>
								) : (
									<div style={styles.questionList}>
										{filteredQuestions.length === 0 ? (
											<div style={styles.emptyState}>No questions found.</div>
										) : (
											filteredQuestions.map(q => {
												const selected = selectedIds.has(q.id);
												return (
													<div
														key={q.id}
														onClick={() => toggleSelected(q.id)}
														style={{
															...styles.questionCard,
															borderColor: selected ? 'var(--primary)' : 'var(--border)',
															background: selected ? 'var(--primary-light-bg)' : 'var(--surface)',
														}}
													>
														<div style={styles.qHeader}>
															<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
																<input
																	type="checkbox"
																	checked={selected}
																	onChange={() => toggleSelected(q.id)}
																	style={styles.checkbox}
																/>
																<span style={styles.qType}>
																	{q.type === 'multiple-choice' ? 'MCQ' : 'Subj'}
																</span>
															</div>
															<span style={styles.qMarks}>{q.max_marks}m</span>
														</div>
														<p style={styles.qText}>{q.text}</p>
														<div style={styles.qFooter}>
															<Pill>{q.difficulty}</Pill>
														</div>
													</div>
												);
											})
										)}
									</div>
								)}
							</Section>
						</div>

						<div style={styles.colSide}>
							<Section title="Summary" subtitle="Selected questions">
								<div style={styles.summaryStats}>
									<div style={styles.statItem}>
										<span style={styles.statValue}>{selectedIds.size}</span>
										<span style={styles.statLabel}>Questions</span>
									</div>
									<div style={styles.statItem}>
										<span style={styles.statValue}>{totalMarks}</span>
										<span style={styles.statLabel}>Total Marks</span>
									</div>
								</div>
								
								<div style={styles.sideActions}>
									<button 
										onClick={() => setStep(1)} 
										style={styles.btnSecondary}
									>
										← Back
									</button>
									<button 
										onClick={handleNext} 
										style={styles.btnPrimary}
										disabled={selectedIds.size === 0}
									>
										Review →
									</button>
								</div>
							</Section>
						</div>
					</div>
				)}

				{step === 3 && (
					<div style={styles.reviewContainer}>
						<Section title="3. Review & Create" subtitle="Double check everything before creating.">
							<div style={styles.reviewGrid}>
								<div style={styles.reviewItem}>
									<span style={styles.reviewLabel}>Title</span>
									<span style={styles.reviewValue}>{details.title}</span>
								</div>
								<div style={styles.reviewItem}>
									<span style={styles.reviewLabel}>Duration</span>
									<span style={styles.reviewValue}>{details.duration} mins</span>
								</div>
								<div style={styles.reviewItem}>
									<span style={styles.reviewLabel}>Start Time</span>
									<span style={styles.reviewValue}>{new Date(details.startTime).toLocaleString()}</span>
								</div>
								<div style={styles.reviewItem}>
									<span style={styles.reviewLabel}>End Time</span>
									<span style={styles.reviewValue}>{new Date(details.endTime).toLocaleString()}</span>
								</div>
								<div style={styles.reviewItem}>
									<span style={styles.reviewLabel}>Questions</span>
									<span style={styles.reviewValue}>{selectedIds.size} selected ({totalMarks} marks)</span>
								</div>
							</div>

							<div style={styles.footerActions}>
								<button onClick={() => setStep(2)} style={styles.btnSecondary}>
									← Back
								</button>
								<button 
									onClick={onSubmitExam} 
									disabled={saving}
									style={saving ? styles.btnDisabled : styles.btnPrimary}
								>
									{saving ? 'Creating...' : 'Create Exam'}
								</button>
							</div>
						</Section>
					</div>
				)}
			</div>

			{showCreateQuestion && (
				<div style={styles.modalOverlay} onClick={() => setShowCreateQuestion(false)}>
					<div style={styles.modalContent} onClick={e => e.stopPropagation()}>
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

const styles = {
	page: {
		minHeight: '100vh',
		background: 'var(--bg-secondary)',
		padding: '24px',
	},
	container: {
		maxWidth: 1200,
		margin: '0 auto',
		display: 'flex',
		flexDirection: 'column',
		gap: 24,
	},
	stepperContainer: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		background: 'var(--surface)',
		padding: '20px 40px',
		borderRadius: 16,
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)',
	},
	stepItem: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		zIndex: 1,
	},
	stepCircle: {
		width: 32,
		height: 32,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 14,
		fontWeight: 700,
		border: '2px solid',
		transition: 'all 0.3s ease',
	},
	stepLabel: {
		fontSize: 14,
		transition: 'all 0.3s ease',
	},
	stepLine: {
		flex: 1,
		height: 2,
		background: 'var(--border)',
		margin: '0 16px',
		borderRadius: 2,
	},
	section: {
		background: 'var(--surface)',
		borderRadius: 16,
		border: '1px solid var(--border)',
		padding: 24,
		boxShadow: 'var(--shadow-sm)',
	},
	sectionHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		marginBottom: 20,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 700,
		color: 'var(--text)',
		margin: 0,
	},
	sectionSubtitle: {
		fontSize: 14,
		color: 'var(--text-muted)',
		margin: '4px 0 0',
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: '2fr 1fr',
		gap: 24,
	},
	colMain: {
		display: 'flex',
		flexDirection: 'column',
		gap: 24,
	},
	colSide: {
		display: 'flex',
		flexDirection: 'column',
		gap: 24,
	},
	btnPrimary: {
		padding: '10px 24px',
		borderRadius: 10,
		border: 'none',
		background: 'var(--primary)',
		color: '#fff',
		fontWeight: 600,
		cursor: 'pointer',
		transition: 'all 0.2s',
	},
	btnSecondary: {
		padding: '10px 20px',
		borderRadius: 10,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		fontWeight: 600,
		cursor: 'pointer',
		transition: 'all 0.2s',
	},
	btnSecondarySmall: {
		padding: '6px 12px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		fontWeight: 600,
		fontSize: 12,
		cursor: 'pointer',
	},
	btnDisabled: {
		padding: '10px 24px',
		borderRadius: 10,
		border: 'none',
		background: 'var(--gray-300)',
		color: 'var(--gray-500)',
		fontWeight: 600,
		cursor: 'not-allowed',
	},
	footerActions: {
		display: 'flex',
		justifyContent: 'flex-end',
		gap: 12,
		marginTop: 24,
		paddingTop: 24,
		borderTop: '1px solid var(--border)',
	},
	filterBar: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
		marginBottom: 16,
	},
	searchWrapper: {
		position: 'relative',
	},
	searchIcon: {
		position: 'absolute',
		left: 12,
		top: '50%',
		transform: 'translateY(-50%)',
		color: 'var(--text-muted)',
	},
	searchInput: {
		width: '100%',
		padding: '10px 12px 10px 36px',
		borderRadius: 10,
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		color: 'var(--text)',
		fontSize: 14,
	},
	filterRow: {
		display: 'flex',
		gap: 8,
	},
	select: {
		flex: 1,
		padding: '8px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		color: 'var(--text)',
		fontSize: 13,
	},
	questionList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
		maxHeight: 500,
		overflowY: 'auto',
		paddingRight: 4,
	},
	questionCard: {
		border: '1px solid var(--border)',
		borderRadius: 12,
		padding: 12,
		transition: 'all 0.2s',
		cursor: 'pointer',
	},
	qHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	qType: {
		fontSize: 12,
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase',
	},
	qMarks: {
		fontSize: 12,
		fontWeight: 600,
		color: 'var(--primary)',
	},
	qText: {
		fontSize: 14,
		color: 'var(--text)',
		margin: '0 0 12px',
		lineHeight: 1.4,
		display: '-webkit-box',
		WebkitLineClamp: 2,
		WebkitBoxOrient: 'vertical',
		overflow: 'hidden',
	},
	qFooter: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	checkbox: {
		width: 16,
		height: 16,
		cursor: 'pointer',
	},
	summaryStats: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 12,
		marginBottom: 24,
	},
	statItem: {
		background: 'var(--bg)',
		padding: 16,
		borderRadius: 12,
		textAlign: 'center',
		border: '1px solid var(--border)',
	},
	statValue: {
		display: 'block',
		fontSize: 24,
		fontWeight: 800,
		color: 'var(--primary)',
		marginBottom: 4,
	},
	statLabel: {
		fontSize: 12,
		color: 'var(--text-muted)',
		fontWeight: 600,
	},
	sideActions: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
	},
	reviewContainer: {
		maxWidth: 800,
		margin: '0 auto',
		width: '100%',
	},
	reviewGrid: {
		display: 'grid',
		gap: 16,
		marginBottom: 24,
	},
	reviewItem: {
		display: 'flex',
		justifyContent: 'space-between',
		padding: '12px 0',
		borderBottom: '1px solid var(--border)',
	},
	reviewLabel: {
		color: 'var(--text-muted)',
		fontWeight: 500,
	},
	reviewValue: {
		color: 'var(--text)',
		fontWeight: 600,
		textAlign: 'right',
	},
	modalOverlay: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.5)',
		display: 'grid',
		placeItems: 'center',
		zIndex: 100,
		padding: 16,
	},
	modalContent: {
		background: 'var(--surface)',
		borderRadius: 16,
		width: '100%',
		maxWidth: 700,
		maxHeight: '90vh',
		overflowY: 'auto',
		padding: 24,
		boxShadow: 'var(--shadow-lg)',
	},
	loadingState: {
		textAlign: 'center',
		padding: 40,
		color: 'var(--text-muted)',
	},
	emptyState: {
		textAlign: 'center',
		padding: 40,
		color: 'var(--text-muted)',
		fontStyle: 'italic',
	},
};

export default ExamCreate;
