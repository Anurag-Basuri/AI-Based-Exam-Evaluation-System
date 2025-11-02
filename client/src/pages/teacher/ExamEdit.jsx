import React from 'react';
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

const Pill = ({ children }) => (
	<span
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 6,
			padding: '4px 10px',
			fontSize: 12,
			fontWeight: 700,
			borderRadius: 999,
			border: '1px solid var(--border)',
			background: 'var(--bg)',
			color: 'var(--text)',
		}}
	>
		{children}
	</span>
);

const ExamEdit = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [loading, setLoading] = React.useState(true);
	const [saving, setSaving] = React.useState(false);
	const [message, setMessage] = React.useState('');
	const [errorBanner, setErrorBanner] = React.useState('');

	const [details, setDetails] = React.useState({
		title: '',
		description: '',
		instructions: '',
		duration: 60,
		startTime: '',
		endTime: '',
		autoPublishResults: false,
	});
	const [detailErrors, setDetailErrors] = React.useState({});
	const [status, setStatus] = React.useState('draft');

	// Add state for AI Policy
	const [aiPolicy, setAiPolicy] = React.useState({
		strictness: 'moderate',
		reviewTone: 'concise',
		expectedLength: 20,
		customInstructions: '',
	});

	const [questions, setQuestions] = React.useState([]);
	const [selectedIds, setSelectedIds] = React.useState(new Set());
	const [query, setQuery] = React.useState('');
	const [typeFilter, setTypeFilter] = React.useState('all');
	const [difficultyFilter, setDifficultyFilter] = React.useState('all');

	const [showQModal, setShowQModal] = React.useState(false);
	const [editQuestion, setEditQuestion] = React.useState(null);
	const { success } = useToast();

	const toISO = v => (v ? new Date(v).toISOString() : null);

	const loadAll = React.useCallback(async () => {
		setLoading(true);
		setMessage('');
		setErrorBanner('');
		try {
			const exam = await safeApiCall(getTeacherExamById, id);
			setDetails({
				title: exam.title,
				description: exam.description,
				instructions: exam.instructions,
				duration: exam.duration,
				// Use correct normalized fields (startMs/endMs) if available, otherwise format from string
				startTime: exam.startTime
					? new Date(exam.startTime).toISOString().slice(0, 16)
					: '',
				endTime: exam.endTime ? new Date(exam.endTime).toISOString().slice(0, 16) : '',
				autoPublishResults: exam.autoPublishResults,
			});
			// Load AI policy, providing defaults if not set
			setAiPolicy({
				strictness: exam.aiPolicy?.strictness || 'moderate',
				reviewTone: exam.aiPolicy?.reviewTone || 'concise',
				expectedLength: exam.aiPolicy?.expectedLength || 20,
				customInstructions: exam.aiPolicy?.customInstructions || '',
			});
			setStatus(exam.status);
			// The `questions` array now contains full objects, so we map to get their IDs
			setSelectedIds(new Set((exam.questions || []).map(q => q._id)));
			// Backend now returns { items: [...] }
			const bank = await safeApiCall(getTeacherQuestions);
			setQuestions(Array.isArray(bank?.items) ? bank.items : []);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to load exam');
		} finally {
			setLoading(false);
		}
	}, [id]);

	React.useEffect(() => {
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

	const filteredQuestions = React.useMemo(() => {
		const q = query.trim().toLowerCase();
		return questions.filter(item => {
			const typeOk = typeFilter === 'all' || item.type === typeFilter;
			const difficultyOk = difficultyFilter === 'all' || item.difficulty === difficultyFilter;
			const text = `${item.text ?? ''} ${item.remarks ?? ''}`.toLowerCase();
			return typeOk && (!q || text.includes(q)) && difficultyOk;
		});
	}, [questions, query, typeFilter, difficultyFilter]);

	const selectedList = React.useMemo(() => {
		const map = new Map(questions.map(q => [q._id, q]));
		return Array.from(selectedIds)
			.map(i => map.get(i))
			.filter(Boolean);
	}, [selectedIds, questions]);

	const totalMarks = React.useMemo(
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
			setErrorBanner('Fix highlighted fields');
			return;
		}
		setSaving(true);
		setErrorBanner('');
		try {
			// 1) Update details (not questions)
			await safeApiCall(updateExam, id, {
				title: details.title.trim(),
				description: details.description?.trim() || '',
				instructions: details.instructions?.trim() || '',
				duration: Number(details.duration),
				startTime: toISO(details.startTime),
				endTime: toISO(details.endTime),
				autoPublishResults: details.autoPublishResults,
				// status is not changed here; publishing is a separate action
				aiPolicy: {
					...aiPolicy,
					expectedLength: Number(aiPolicy.expectedLength),
				},
			});
			// 2) Update question set (server validates ownership)
			await safeApiCall(setExamQuestions, id, { questionIds: Array.from(selectedIds) });
			success('Exam updated');
			setTimeout(() => navigate('/teacher/exams'), 400);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to update exam');
		} finally {
			setSaving(false);
		}
	};

	const isScheduled = React.useMemo(() => {
		if (!details.startTime) return false;
		return status === 'active' && new Date(details.startTime) > new Date();
	}, [status, details.startTime]);

	const canEditQuestions = status === 'draft';

	// Open editor for a question
	const openEditQuestion = q => {
		if (!canEditQuestions) return;
		setEditQuestion(q);
		setShowQModal(true);
	};

	const handleSaveQuestion = async values => {
		try {
			const saved = await safeApiCall(updateTeacherQuestion, editQuestion.id, values);
			// Update bank with edited question
			setQuestions(prev => prev.map(q => (q.id === saved.id ? saved : q)));
			success('Question updated');
			setShowQModal(false);
			setEditQuestion(null);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to update question');
		}
	};

	if (loading) {
		return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;
	}

	const isLocked = status !== 'draft'; // Block editing if not draft

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
						key="back"
						onClick={() => navigate('/teacher/exams')}
						className="tap"
						style={{
							padding: '10px 16px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 800,
						}}
					>
						<span className="desktop-only">← Back</span>
						<span className="mobile-only">←</span>
					</button>,
					<button
						key="save"
						onClick={onSave}
						disabled={saving || isLocked}
						className="tap"
						title={isLocked ? 'Only draft exams can be edited' : 'Save changes'}
						style={{
							padding: '10px 16px',
							borderRadius: 10,
							border: 'none',
							background:
								saving || isLocked
									? '#9ca3af'
									: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#fff',
							fontWeight: 900,
							cursor: saving || isLocked ? 'not-allowed' : 'pointer',
						}}
					>
						{saving ? 'Saving…' : 'Save changes'}
					</button>,
				]}
			/>
			<style>{`
        .desktop-only { display: inline; }
        .mobile-only { display: none; }
        @media (max-width: 768px) {
          .desktop-only { display: none; }
          .mobile-only { display: inline; }
        }
      `}</style>

			{errorBanner && (
				<div style={{ marginBottom: 12 }}>
					<Alert type="error" onClose={() => setErrorBanner('')}>
						{errorBanner}
					</Alert>
				</div>
			)}

			<section
				style={{
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					borderRadius: 16,
					padding: 16,
					marginBottom: 16,
				}}
			>
				<header style={{ marginBottom: 12 }}>
					<h2 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: 20 }}>
						Details
					</h2>
					<p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
						Title, description, time window and duration.
					</p>
				</header>
				<ExamForm
					value={details}
					onChange={setDetails}
					errors={detailErrors}
					disabled={saving || isLocked}
					aiPolicy={aiPolicy}
					onAiPolicyChange={setAiPolicy}
				/>
			</section>

			<section
				style={{
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					borderRadius: 16,
					padding: 16,
				}}
			>
				<header
					style={{
						marginBottom: 12,
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<h2 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: 20 }}>
						Questions
					</h2>
					<Pill>
						{selectedIds.size} selected • {totalMarks} marks
					</Pill>
				</header>
				{!canEditQuestions && (
					<div style={{ marginBottom: 12 }}>
						<Alert type="info">
							Question selection is locked because this exam is no longer a draft. You
							can still view the selected questions.
						</Alert>
					</div>
				)}

				<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 12 }}>
					<div style={{ position: 'relative', flex: '1 1 360px' }}>
						<input
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="Search in your questions..."
							style={{
								width: '100%',
								padding: '12px 14px 12px 38px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								outline: 'none',
								fontSize: 14,
							}}
							disabled={isLocked}
						/>
						<span
							style={{
								position: 'absolute',
								left: 12,
								top: '50%',
								transform: 'translateY(-50%)',
								color: 'var(--text-muted)',
							}}
						>
							🔎
						</span>
					</div>
					<Pill>
						Type:&nbsp;
						<select
							value={typeFilter}
							onChange={e => setTypeFilter(e.target.value)}
							style={{
								background: 'var(--bg)',
								color: 'var(--text)',
								border: '1px solid var(--border)',
								borderRadius: 8,
								padding: '6px 8px',
								fontWeight: 700,
							}}
							disabled={isLocked}
						>
							<option value="all">All Types</option>
							<option value="multiple-choice">MCQ</option>
							<option value="subjective">Subjective</option>
						</select>
					</Pill>
					<Pill>
						Difficulty:&nbsp;
						<select
							value={difficultyFilter}
							onChange={e => setDifficultyFilter(e.target.value)}
							style={{
								background: 'var(--bg)',
								color: 'var(--text)',
								border: '1px solid var(--border)',
								borderRadius: 8,
								padding: '6px 8px',
								fontWeight: 700,
							}}
							disabled={isLocked}
						>
							<option value="all">All</option>
							<option value="easy">Easy</option>
							<option value="medium">Medium</option>
							<option value="hard">Hard</option>
						</select>
					</Pill>
				</div>

				<div
					style={{
						display: 'grid',
						gap: 12,
						gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
					}}
				>
					{filteredQuestions.map(q => {
						const selected = selectedIds.has(q._id);
						return (
							<div
								key={q._id}
								onClick={() => (isLocked ? undefined : toggleSelected(q._id))}
								style={{
									userSelect: 'none',
									cursor: isLocked ? 'not-allowed' : 'pointer',
									// Use explicit checkbox, remove color-mix
									background: 'var(--surface)',
									border: `2px solid ${selected ? '#3b82f6' : 'var(--border)'}`,
									borderRadius: 12,
									padding: 14,
									boxShadow: selected ? '0 0 0 4px rgba(59,130,246,.12)' : 'none',
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										gap: 10,
									}}
								>
									<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
										<input
											type="checkbox"
											checked={selected}
											onChange={() =>
												isLocked ? undefined : toggleSelected(q._id)
											}
											disabled={isLocked}
											style={{
												cursor: isLocked ? 'pointer' : 'not-allowed',
											}}
										/>
										<strong style={{ color: 'var(--text)' }}>
											{q.type === 'multiple-choice' ? 'MCQ' : 'Subjective'}
										</strong>
										<Pill>{q.difficulty}</Pill>
									</div>
									<Pill>Marks: {q.max_marks}</Pill>
								</div>
								<p
									style={{
										margin: '8px 0 0 0',
										color: 'var(--text)',
										fontWeight: 600,
										fontSize: 14,
										overflow: 'hidden',
										display: '-webkit-box',
										WebkitLineClamp: 3,
										WebkitBoxOrient: 'vertical',
									}}
								>
									{q.text}
								</p>
								{q.tags && q.tags.length > 0 && (
									<div
										style={{
											display: 'flex',
											flexWrap: 'wrap',
											gap: 4,
											marginTop: 8,
										}}
									>
										{q.tags.map(tag => (
											<Pill key={tag}>{tag}</Pill>
										))}
									</div>
								)}
								<div
									style={{
										display: 'flex',
										justifyContent: 'flex-end',
										gap: 8,
										marginTop: 8,
									}}
								>
									<button
										type="button"
										onClick={e => {
											e.stopPropagation();
											openEditQuestion(q);
										}}
										disabled={!canEditQuestions}
										style={{
											padding: '6px 10px',
											borderRadius: 8,
											border: '1px solid var(--border)',
											background: 'var(--surface)',
											color: 'var(--text)',
											fontWeight: 700,
											fontSize: 12,
											cursor: canEditQuestions ? 'pointer' : 'not-allowed',
										}}
									>
										Edit question
									</button>
								</div>
							</div>
						);
					})}
				</div>

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
					<button
						onClick={() => setSelectedIds(new Set())}
						disabled={isLocked || selectedIds.size === 0}
						style={{
							padding: '8px 10px',
							borderRadius: 8,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 800,
							cursor: isLocked ? 'not-allowed' : 'pointer',
							fontSize: 12,
						}}
					>
						Clear selection
					</button>
					<button
						onClick={onSave}
						disabled={saving || isLocked}
						style={{
							padding: '10px 16px',
							borderRadius: 10,
							border: 'none',
							background:
								saving || isLocked
									? '#9ca3af'
									: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#fff',
							fontWeight: 800,
							cursor: saving || isLocked ? 'not-allowed' : 'pointer',
						}}
					>
						{saving ? 'Saving…' : 'Save changes'}
					</button>
				</div>
			</section>

			{/* Modal for editing question */}
			{showQModal && editQuestion && (
				<div
					role="dialog"
					aria-modal="true"
					style={{
						position: 'fixed',
						inset: 0,
						background: 'color-mix(in srgb, var(--bg) 50%, transparent)',
						display: 'grid',
						placeItems: 'center',
						padding: 16,
						zIndex: 50,
					}}
					onClick={e => {
						if (e.target === e.currentTarget) {
							setShowQModal(false);
							setEditQuestion(null);
						}
					}}
				>
					<div
						style={{
							width: 'min(720px, 96vw)',
							maxHeight: '90vh',
							overflow: 'auto',
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 16,
							boxShadow: 'var(--shadow-md)',
							padding: 16,
						}}
					>
						<QuestionForm
							defaultType={editQuestion.type}
							defaultValue={editQuestion}
							onCancel={() => {
								setShowQModal(false);
								setEditQuestion(null);
							}}
							onSave={handleSaveQuestion}
						/>
					</div>
				</div>
			)}
		</div>
	);
};

export default ExamEdit;
