import React from 'react';
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
		{ n: 1, label: 'Exam details' },
		{ n: 2, label: 'Select questions' },
		{ n: 3, label: 'Review & create' },
	];

	return (
		<nav
			aria-label="Progress"
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 12,
				padding: 12,
				marginBottom: 16,
			}}
		>
			<ol
				style={{
					listStyle: 'none',
					display: 'grid',
					gridTemplateColumns: '1fr auto 1fr auto 1fr',
					alignItems: 'center',
					gap: 8,
					margin: 0,
					padding: 0,
				}}
			>
				{steps.map((s, idx) => {
					const active = step === s.n;
					const done = step > s.n;
					const isLast = idx === steps.length - 1;
					return (
						<React.Fragment key={s.n}>
							<li
								aria-current={active ? 'step' : undefined}
								style={{
									display: 'flex',
									alignItems: 'center',
									gap: 8,
									minWidth: 0,
								}}
							>
								<div
									aria-hidden
									style={{
										width: 28,
										height: 28,
										borderRadius: 999,
										display: 'grid',
										placeItems: 'center',
										fontWeight: 800,
										fontSize: 13,
										flex: '0 0 auto',
										border: '1px solid var(--border)',
										background: done
											? '#10b981'
											: active
												? '#3b82f6'
												: 'var(--surface)',
										color: done || active ? '#fff' : 'var(--text)',
										boxShadow: active
											? '0 0 0 3px rgba(59,130,246,.15)'
											: 'none',
									}}
									title={s.label}
								>
									{s.n}
								</div>
								<span
									style={{
										color: active ? 'var(--text)' : 'var(--text-muted)',
										fontWeight: active ? 800 : 700,
										fontSize: 13,
										whiteSpace: 'nowrap',
										overflow: 'hidden',
										textOverflow: 'ellipsis',
									}}
								>
									{s.label}
								</span>
							</li>
							{!isLast && (
								<li
									aria-hidden
									style={{ height: 2, background: 'var(--border)' }}
								/>
							)}
						</React.Fragment>
					);
				})}
			</ol>
			<div
				aria-hidden
				style={{
					marginTop: 8,
					height: 6,
					borderRadius: 999,
					background: 'var(--bg)',
					border: '1px solid var(--border)',
					overflow: 'hidden',
				}}
			>
				<div
					style={{
						height: '100%',
						width: `${(Math.min(step, 3) / 3) * 100}%`,
						background: 'linear-gradient(90deg, #3b82f6, #10b981)',
						transition: 'width .25s ease',
					}}
				/>
			</div>
		</nav>
	);
};

const Step = ({ title, subtitle, children }) => (
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
				{title}
			</h2>
			{subtitle && (
				<p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
					{subtitle}
				</p>
			)}
		</header>
		{children}
	</section>
);

const Toolbar = ({ children }) => (
	<div
		style={{
			display: 'flex',
			gap: 10,
			justifyContent: 'space-between',
			alignItems: 'center',
			paddingTop: 10,
			borderTop: '1px solid var(--border)',
			marginTop: 16,
			flexWrap: 'wrap',
		}}
	>
		{children}
	</div>
);

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

// --- Main Component ---

const ExamCreate = () => {
	const navigate = useNavigate();
	const [step, setStep] = React.useState(1);
	const [saving, setSaving] = React.useState(false);
	const [errorBanner, setErrorBanner] = React.useState('');
	const { success } = useToast();

	// Step 1: exam details
	const [details, setDetails] = React.useState({
		title: '',
		description: '',
		duration: 60,
		startTime: '',
		endTime: '',
	});
	const [detailErrors, setDetailErrors] = React.useState({});

	// Step 2: question bank + selection + inline create
	const [loadingQ, setLoadingQ] = React.useState(false);
	const [qError, setQError] = React.useState('');
	const [questions, setQuestions] = React.useState([]);
	const [query, setQuery] = React.useState('');
	const [typeFilter, setTypeFilter] = React.useState('all');
	const [selectedIds, setSelectedIds] = React.useState(new Set());

	const [showCreateQuestion, setShowCreateQuestion] = React.useState(false);
	const [createType, setCreateType] = React.useState('multiple-choice');

	const loadQuestions = React.useCallback(async () => {
		setLoadingQ(true);
		setQError('');
		try {
			// Backend now returns { items: [...] }
			const response = await safeApiCall(getTeacherQuestions);
			// Ensure we handle both array and object responses gracefully
			const items = Array.isArray(response) ? response : response?.items || [];
			setQuestions(Array.isArray(items) ? items : []);
		} catch (e) {
			const msg = e?.message || 'Failed to load your questions';
			setQError(msg);
			setErrorBanner(msg);
		} finally {
			setLoadingQ(false);
		}
	}, []);

	React.useEffect(() => {
		if (step === 2 && questions.length === 0) {
			loadQuestions();
		}
	}, [step, loadQuestions, questions.length]);

	const filteredQuestions = React.useMemo(() => {
		const q = query.trim().toLowerCase();
		return questions.filter(item => {
			const typeOk = typeFilter === 'all' || item.type === typeFilter;
			const text = `${item.text ?? ''} ${item.remarks ?? ''}`.toLowerCase();
			const queryOk = !q || text.includes(q);
			return typeOk && queryOk;
		});
	}, [questions, query, typeFilter]);

	const selectedList = React.useMemo(() => {
		const map = new Map(questions.map(q => [q.id, q]));
		return Array.from(selectedIds)
			.map(id => map.get(id))
			.filter(Boolean);
	}, [selectedIds, questions]);

	const totalMarks = React.useMemo(
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

	const removeSelected = id => {
		setSelectedIds(prev => {
			const next = new Set(prev);
			next.delete(id);
			return next;
		});
	};

	const clearSelected = () => setSelectedIds(new Set());

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
			// Add future validation to match backend
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
			setErrorBanner(e?.message || 'Failed to create question');
		} finally {
			setShowCreateQuestion(false);
		}
	};

	const onSubmitExam = async (redirectToList = true) => {
		if (!validateDetails()) {
			setErrorBanner('Please fix highlighted fields in Step 1.');
			setStep(1);
			return;
		}
		if (selectedIds.size === 0) {
			setErrorBanner('Please select at least one question in Step 2.');
			setStep(2);
			return;
		}

		setSaving(true);
		setErrorBanner('');
		try {
			const payload = {
				title: details.title.trim(),
				description: details.description?.trim() || '',
				duration: Number(details.duration),
				startTime: toISO(details.startTime),
				endTime: toISO(details.endTime),
				// Backend expects an array of IDs
				questionIds: Array.from(selectedIds),
			};
			await safeApiCall(createTeacherExam, payload);
			success('Exam created successfully');
			if (redirectToList) {
				setTimeout(() => navigate('/teacher/exams'), 400);
			} else {
				// Reset form for creating another
				setDetails({
					title: '',
					description: '',
					duration: 60,
					startTime: '',
					endTime: '',
				});
				setSelectedIds(new Set());
				setStep(1);
			}
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to create exam');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
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
						← Cancel
					</button>,
				]}
			/>

			<Stepper step={step} />

			{errorBanner && (
				<div style={{ marginBottom: 12 }}>
					<Alert type="error" onClose={() => setErrorBanner('')}>
						{errorBanner}
					</Alert>
				</div>
			)}

			{step === 1 && (
				<Step
					title="1) Exam details"
					subtitle="Title, description, time window and duration."
				>
					<ExamForm
						value={details}
						onChange={setDetails}
						errors={detailErrors}
						disabled={saving}
					/>
					<Toolbar>
						<div /> {/* Spacer */}
						<button
							onClick={() => {
								if (validateDetails()) setStep(2);
								else setErrorBanner('Please fix the errors before continuing.');
							}}
							style={{
								padding: '10px 16px',
								borderRadius: 10,
								border: 'none',
								background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
								color: '#fff',
								fontWeight: 800,
								cursor: 'pointer',
							}}
						>
							Next: Questions →
						</button>
					</Toolbar>
				</Step>
			)}

			{step === 2 && (
				<Step
					title="2) Select questions"
					subtitle="Pick from your bank or create new ones."
				>
					<div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
						{/* Left: bank */}
						<div>
							<div
								style={{
									display: 'flex',
									gap: 16,
									flexWrap: 'wrap',
									marginBottom: 12,
									alignItems: 'center',
								}}
							>
								<div style={{ position: 'relative', flex: '1 1 360px' }}>
									<input
										value={query}
										onChange={e => setQuery(e.target.value)}
										placeholder="Search in your questions..."
										aria-label="Search questions"
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
									/>
									<span
										style={{
											position: 'absolute',
											left: 12,
											top: '50%',
											transform: 'translateY(-50%)',
											color: 'var(--text-muted)',
										}}
										aria-hidden
									>
										🔎
									</span>
								</div>

								<div
									style={{
										display: 'flex',
										gap: 8,
										alignItems: 'center',
										flexWrap: 'wrap',
									}}
								>
									<Pill>
										Type:
										<select
											value={typeFilter}
											onChange={e => setTypeFilter(e.target.value)}
											aria-label="Filter by type"
											style={{
												background: 'var(--bg)',
												color: 'var(--text)',
												border: '1px solid var(--border)',
												borderRadius: 8,
												padding: '6px 8px',
												fontWeight: 700,
											}}
										>
											<option value="all">All</option>
											<option value="multiple-choice">MCQ</option>
											<option value="subjective">Subjective</option>
										</select>
									</Pill>
									<Pill>
										{filteredQuestions.length} of {questions.length}
									</Pill>
									<button
										onClick={() => {
											const ids = filteredQuestions.map(q => q.id);
											setSelectedIds(prev => new Set([...prev, ...ids]));
										}}
										className="tap"
										style={{
											padding: '8px 12px',
											borderRadius: 10,
											border: '1px solid var(--border)',
											background: 'var(--surface)',
											color: 'var(--text)',
											fontWeight: 800,
											cursor: 'pointer',
										}}
										title="Select all filtered"
									>
										Select all
									</button>
									<button
										onClick={() => {
											const toRemove = new Set(
												filteredQuestions.map(q => q.id),
											);
											setSelectedIds(prev => {
												const next = new Set(prev);
												toRemove.forEach(id => next.delete(id));
												return next;
											});
										}}
										className="tap"
										style={{
											padding: '8px 12px',
											borderRadius: 10,
											border: '1px solid var(--border)',
											background: 'var(--surface)',
											color: 'var(--text)',
											fontWeight: 800,
											cursor: 'pointer',
										}}
										title="Deselect all filtered"
									>
										Deselect
									</button>
									<button
										onClick={() => {
											setCreateType('multiple-choice');
											setShowCreateQuestion(true);
										}}
										style={{
											padding: '10px 14px',
											borderRadius: 10,
											border: 'none',
											background: 'linear-gradient(135deg, #10b981, #059669)',
											color: '#fff',
											fontWeight: 800,
											cursor: 'pointer',
										}}
									>
										＋ New MCQ
									</button>
									<button
										onClick={() => {
											setCreateType('subjective');
											setShowCreateQuestion(true);
										}}
										style={{
											padding: '10px 14px',
											borderRadius: 10,
											border: '1px solid var(--border)',
											background: 'var(--surface)',
											color: 'var(--text)',
											fontWeight: 800,
											cursor: 'pointer',
										}}
									>
										＋ New Subjective
									</button>
								</div>
							</div>

							{loadingQ && (
								<div style={{ color: 'var(--text-muted)', padding: 10 }}>
									Loading…
								</div>
							)}
							{qError && (
								<div style={{ color: '#ef4444', padding: 10 }}>Error: {qError}</div>
							)}

							<div
								role="list"
								aria-label="Question bank"
								style={{
									display: 'grid',
									gap: 12,
									gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
								}}
							>
								{filteredQuestions.map(q => {
									const selected = selectedIds.has(q.id);
									return (
										<div
											key={q.id}
											role="listitem"
											style={{
												userSelect: 'none',
												background: 'var(--surface)',
												border: `2px solid ${selected ? '#3b82f6' : 'var(--border)'}`,
												borderRadius: 12,
												padding: 14,
												boxShadow: selected
													? '0 0 0 4px rgba(59,130,246,.12)'
													: 'none',
												transition:
													'border-color .15s ease, box-shadow .15s ease',
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 10,
												}}
											>
												<div
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: 10,
													}}
												>
													<input
														type="checkbox"
														checked={selected}
														onChange={() => toggleSelected(q.id)}
														aria-label={`Select question ${q.text?.slice(0, 40) || ''}`}
													/>
													<strong style={{ color: 'var(--text)' }}>
														{q.type === 'multiple-choice'
															? 'MCQ'
															: 'Subjective'}
													</strong>
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
												title={q.text}
											>
												{q.text}
											</p>
											{q.type === 'multiple-choice' &&
												q.options?.length > 0 && (
													<ul
														style={{
															margin: '8px 0 0 16px',
															color: 'var(--text-muted)',
															fontSize: 13,
														}}
													>
														{q.options.slice(0, 3).map((o, i) => (
															<li key={i}>
																{o.text} {o.isCorrect ? '✅' : ''}
															</li>
														))}
														{q.options.length > 3 && <li>…</li>}
													</ul>
												)}
											<div
												style={{
													display: 'flex',
													justifyContent: 'flex-end',
													marginTop: 10,
												}}
											>
												<button
													onClick={() => toggleSelected(q.id)}
													className="tap"
													style={{
														padding: '8px 12px',
														borderRadius: 8,
														border: selected
															? 'none'
															: '1px solid var(--border)',
														background: selected
															? 'linear-gradient(135deg, #3b82f6, #1d4ed8)'
															: 'var(--surface)',
														color: selected ? '#fff' : 'var(--text)',
														fontWeight: 800,
														cursor: 'pointer',
													}}
												>
													{selected ? 'Selected ✓' : 'Add to Exam'}
												</button>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						{/* Right: selection basket */}
						<aside
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 12,
								padding: 12,
								height: '100%',
								alignSelf: 'start',
								position: 'sticky',
								top: 12,
							}}
						>
							<div
								style={{
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									marginBottom: 8,
								}}
							>
								<strong style={{ color: 'var(--text)' }}>Selected</strong>
								<Pill>
									{selectedIds.size} items • {totalMarks} marks
								</Pill>
							</div>
							{selectedList.length === 0 ? (
								<p style={{ color: 'var(--text-muted)', margin: 0 }}>
									No questions selected yet.
								</p>
							) : (
								<ul
									style={{
										listStyle: 'none',
										margin: 0,
										padding: 0,
										display: 'grid',
										gap: 8,
										maxHeight: 360,
										overflow: 'auto',
									}}
								>
									{selectedList.map(q => (
										<li
											key={q.id}
											style={{
												display: 'grid',
												gap: 6,
												border: '1px solid var(--border)',
												borderRadius: 10,
												background: 'var(--surface)',
												padding: 10,
											}}
										>
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'space-between',
													gap: 8,
												}}
											>
												<span
													style={{
														color: 'var(--text-muted)',
														fontSize: 12,
														fontWeight: 700,
														textTransform: 'uppercase',
													}}
												>
													{q.type === 'multiple-choice'
														? 'MCQ'
														: 'Subjective'}
												</span>
												<Pill>+{q.max_marks}</Pill>
											</div>
											<div
												style={{
													color: 'var(--text)',
													fontSize: 13,
													fontWeight: 700,
													overflow: 'hidden',
													display: '-webkit-box',
													WebkitLineClamp: 2,
													WebkitBoxOrient: 'vertical',
												}}
												title={q.text}
											>
												{q.text}
											</div>
											<div
												style={{
													display: 'flex',
													justifyContent: 'flex-end',
												}}
											>
												<button
													onClick={() => removeSelected(q.id)}
													style={{
														padding: '6px 10px',
														borderRadius: 8,
														border: '1px solid var(--border)',
														background: 'var(--surface)',
														color: '#dc2626',
														fontWeight: 800,
														cursor: 'pointer',
														fontSize: 12,
													}}
												>
													Remove
												</button>
											</div>
										</li>
									))}
								</ul>
							)}
							{selectedList.length > 0 && (
								<button
									onClick={clearSelected}
									style={{
										marginTop: 10,
										width: '100%',
										padding: '8px 10px',
										borderRadius: 8,
										border: '1px solid var(--border)',
										background: 'var(--surface)',
										color: 'var(--text)',
										fontWeight: 800,
										cursor: 'pointer',
										fontSize: 12,
									}}
								>
									Clear selection
								</button>
							)}
						</aside>
					</div>

					<Toolbar>
						<button
							onClick={() => setStep(1)}
							style={{
								padding: '10px 16px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								fontWeight: 800,
								cursor: 'pointer',
							}}
						>
							← Back
						</button>
						<button
							onClick={() => setStep(3)}
							style={{
								padding: '10px 16px',
								borderRadius: 10,
								border: 'none',
								background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
								color: '#fff',
								fontWeight: 800,
								cursor: 'pointer',
							}}
						>
							Review →
						</button>
					</Toolbar>

					{showCreateQuestion && (
						<div
							role="dialog"
							aria-modal="true"
							style={{
								position: 'fixed',
								inset: 0,
								background: 'rgba(0,0,0,0.5)',
								backdropFilter: 'blur(4px)',
								display: 'grid',
								placeItems: 'center',
								padding: 16,
								zIndex: 50,
							}}
							onClick={e => {
								if (e.target === e.currentTarget) setShowCreateQuestion(false);
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
									defaultType={createType}
									onCancel={() => setShowCreateQuestion(false)}
									onSave={handleCreateQuestion}
								/>
							</div>
						</div>
					)}
				</Step>
			)}

			{step === 3 && (
				<Step title="3) Review and create">
					<div
						style={{
							display: 'grid',
							gap: 10,
							gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
							marginBottom: 10,
						}}
					>
						<div
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 12,
								padding: 12,
							}}
						>
							<strong style={{ color: 'var(--text)' }}>Title</strong>
							<div style={{ color: 'var(--text-muted)' }}>{details.title || '—'}</div>
						</div>
						<div
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 12,
								padding: 12,
							}}
						>
							<strong style={{ color: 'var(--text)' }}>Duration</strong>
							<div style={{ color: 'var(--text-muted)' }}>{details.duration} min</div>
						</div>
						<div
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 12,
								padding: 12,
							}}
						>
							<strong style={{ color: 'var(--text)' }}>Start</strong>
							<div style={{ color: 'var(--text-muted)' }}>
								{new Date(details.startTime).toLocaleString() || '—'}
							</div>
						</div>
						<div
							style={{
								background: 'var(--bg)',
								border: '1px solid var(--border)',
								borderRadius: 12,
								padding: 12,
							}}
						>
							<strong style={{ color: 'var(--text)' }}>End</strong>
							<div style={{ color: 'var(--text-muted)' }}>
								{new Date(details.endTime).toLocaleString() || '—'}
							</div>
						</div>
					</div>

					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'space-between',
							marginTop: 6,
							marginBottom: 10,
						}}
					>
						<strong style={{ color: 'var(--text)' }}>Selected questions</strong>
						<Pill>
							{selectedList.length} items • {totalMarks} marks
						</Pill>
					</div>

					<Toolbar>
						<button
							onClick={() => setStep(2)}
							style={{
								padding: '10px 16px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								fontWeight: 800,
								cursor: 'pointer',
							}}
						>
							← Back
						</button>
						<div style={{ display: 'flex', gap: 8 }}>
							<button
								onClick={() => onSubmitExam(false)}
								disabled={saving}
								style={{
									padding: '10px 16px',
									borderRadius: 10,
									border: '1px solid var(--border)',
									background: 'var(--surface)',
									color: 'var(--text)',
									fontWeight: 800,
									cursor: saving ? 'not-allowed' : 'pointer',
								}}
							>
								{saving ? 'Creating…' : 'Create & add another'}
							</button>
							<button
								onClick={() => onSubmitExam(true)}
								disabled={saving}
								style={{
									padding: '10px 16px',
									borderRadius: 10,
									border: 'none',
									background: saving
										? '#9ca3af'
										: 'linear-gradient(135deg, #10b981, #059669)',
									color: '#fff',
									fontWeight: 800,
									cursor: saving ? 'not-allowed' : 'pointer',
								}}
							>
								{saving ? 'Creating…' : 'Create exam'}
							</button>
						</div>
					</Toolbar>
				</Step>
			)}
		</div>
	);
};

export default ExamCreate;
