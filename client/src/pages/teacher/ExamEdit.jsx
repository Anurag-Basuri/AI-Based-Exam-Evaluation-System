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

// --- UI Components ---

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

const ExamEdit = () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();

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
			<div style={styles.loadingContainer}>
				<div className="spinner" />
				<p>Loading exam details...</p>
			</div>
		);
	}

	return (
		<div style={styles.page}>
			<div style={styles.container}>
				<PageHeader
					title="Edit Exam"
					subtitle={`Modify details and question selection. Status: ${status}`}
					breadcrumbs={[
						{ label: 'Home', to: '/teacher' },
						{ label: 'Exams', to: '/teacher/exams' },
						{ label: 'Edit' },
					]}
					actions={[
						<button
							key="cancel"
							onClick={() => navigate('/teacher/exams')}
							style={styles.btnSecondary}
						>
							Cancel
						</button>,
						<button
							key="save"
							onClick={onSave}
							disabled={saving || isLocked}
							style={saving || isLocked ? styles.btnDisabled : styles.btnPrimary}
						>
							{saving ? 'Saving...' : 'Save Changes'}
						</button>,
					]}
				/>

				{errorBanner && (
					<div style={{ marginBottom: 24 }}>
						<Alert type="error" onClose={() => setErrorBanner('')}>
							{errorBanner}
						</Alert>
					</div>
				)}

				<div style={styles.grid}>
					{/* Left Column: Details */}
					<div style={styles.colMain}>
						<Section title="Exam Details" subtitle="Basic information and settings">
							<ExamForm
								value={details}
								onChange={setDetails}
								errors={detailErrors}
								disabled={saving || isLocked}
								aiPolicy={aiPolicy}
								onAiPolicyChange={setAiPolicy}
							/>
						</Section>
					</div>

					{/* Right Column: Questions */}
					<div style={styles.colSide}>
						<Section 
							title="Questions" 
							subtitle={`${selectedIds.size} selected • ${totalMarks} marks`}
							actions={
								<button
									onClick={() => setSelectedIds(new Set())}
									disabled={isLocked || selectedIds.size === 0}
									style={styles.btnClear}
								>
									Clear All
								</button>
							}
						>
							{!canEditQuestions && (
								<div style={{ marginBottom: 16 }}>
									<Alert type="info">
										Editing locked for non-draft exams.
									</Alert>
								</div>
							)}

							<div style={styles.filterBar}>
								<div style={styles.searchWrapper}>
									<span style={styles.searchIcon}>🔍</span>
									<input
										value={query}
										onChange={e => setQuery(e.target.value)}
										placeholder="Search questions..."
										style={styles.searchInput}
										disabled={isLocked}
									/>
								</div>
								<div style={styles.filterRow}>
									<select
										value={typeFilter}
										onChange={e => setTypeFilter(e.target.value)}
										style={styles.select}
										disabled={isLocked}
									>
										<option value="all">All Types</option>
										<option value="multiple-choice">MCQ</option>
										<option value="subjective">Subjective</option>
									</select>
									<select
										value={difficultyFilter}
										onChange={e => setDifficultyFilter(e.target.value)}
										style={styles.select}
										disabled={isLocked}
									>
										<option value="all">All Difficulties</option>
										<option value="easy">Easy</option>
										<option value="medium">Medium</option>
										<option value="hard">Hard</option>
									</select>
								</div>
							</div>

							<div style={styles.questionList}>
								{filteredQuestions.length === 0 ? (
									<div style={styles.emptyState}>No questions found.</div>
								) : (
									filteredQuestions.map(q => {
										const selected = selectedIds.has(q._id || q.id);
										return (
											<div
												key={q._id || q.id}
												onClick={() => !isLocked && toggleSelected(q._id || q.id)}
												style={{
													...styles.questionCard,
													borderColor: selected ? 'var(--primary)' : 'var(--border)',
													background: selected ? 'var(--primary-light-bg)' : 'var(--surface)',
													cursor: isLocked ? 'default' : 'pointer',
												}}
											>
												<div style={styles.qHeader}>
													<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
														<input
															type="checkbox"
															checked={selected}
															onChange={() => !isLocked && toggleSelected(q._id || q.id)}
															disabled={isLocked}
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
													{canEditQuestions && (
														<button
															onClick={e => {
																e.stopPropagation();
																openEditQuestion(q);
															}}
															style={styles.btnEditQ}
														>
															Edit
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
			</div>

			{showQModal && editQuestion && (
				<div style={styles.modalOverlay} onClick={() => setShowQModal(false)}>
					<div style={styles.modalContent} onClick={e => e.stopPropagation()}>
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
	loadingContainer: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		minHeight: '50vh',
		color: 'var(--text-muted)',
	},
	grid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
		gap: 24,
		alignItems: 'start',
	},
	colMain: {
		flex: 1,
	},
	colSide: {
		flex: 1,
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
	btnPrimary: {
		padding: '10px 20px',
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
	btnDisabled: {
		padding: '10px 20px',
		borderRadius: 10,
		border: 'none',
		background: 'var(--gray-300)',
		color: 'var(--gray-500)',
		fontWeight: 600,
		cursor: 'not-allowed',
	},
	btnClear: {
		background: 'transparent',
		border: 'none',
		color: 'var(--danger-text)',
		fontSize: 13,
		fontWeight: 600,
		cursor: 'pointer',
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
		maxHeight: 600,
		overflowY: 'auto',
		paddingRight: 4,
	},
	questionCard: {
		border: '1px solid var(--border)',
		borderRadius: 12,
		padding: 12,
		transition: 'all 0.2s',
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
	btnEditQ: {
		padding: '4px 8px',
		borderRadius: 6,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		fontSize: 11,
		fontWeight: 600,
		cursor: 'pointer',
	},
	emptyState: {
		textAlign: 'center',
		padding: 24,
		color: 'var(--text-muted)',
		fontStyle: 'italic',
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
	checkbox: {
		width: 16,
		height: 16,
		cursor: 'pointer',
	},
};

export default ExamEdit;
