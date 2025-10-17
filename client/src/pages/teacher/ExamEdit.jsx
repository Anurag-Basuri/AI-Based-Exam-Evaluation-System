import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ExamForm from '../../components/forms/ExamForm.jsx';
import {
	safeApiCall,
	getTeacherExamById,
	getTeacherQuestions,
	setExamQuestions,
	updateExam,
	createTeacherQuestion,
} from '../../services/teacherServices.js';

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

	const [details, setDetails] = React.useState({
		title: '',
		description: '',
		duration: 60,
		startTime: '',
		endTime: '',
	});
	const [detailErrors, setDetailErrors] = React.useState({});
	const [status, setStatus] = React.useState('draft');

	const [questions, setQuestions] = React.useState([]);
	const [selectedIds, setSelectedIds] = React.useState(new Set());
	const [query, setQuery] = React.useState('');
	const [typeFilter, setTypeFilter] = React.useState('all');

	const toISO = v => (v ? new Date(v).toISOString() : null);

	const loadAll = React.useCallback(async () => {
		setLoading(true);
		setMessage('');
		try {
			const exam = await safeApiCall(getTeacherExamById, id);
			setDetails({
				title: exam.title,
				description: exam.description,
				duration: exam.duration,
				startTime: exam.startMs ? new Date(exam.startMs).toISOString().slice(0, 16) : '',
				endTime: exam.endMs ? new Date(exam.endMs).toISOString().slice(0, 16) : '',
			});
			setStatus(exam.status);
			setSelectedIds(new Set(exam.questions || []));
			const bank = await safeApiCall(getTeacherQuestions);
			setQuestions(Array.isArray(bank) ? bank : []);
		} catch (e) {
			setMessage(`❌ ${e?.message || 'Failed to load exam'}`);
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
			const text = `${item.text ?? ''} ${item.remarks ?? ''}`.toLowerCase();
			return typeOk && (!q || text.includes(q));
		});
	}, [questions, query, typeFilter]);

	const selectedList = React.useMemo(() => {
		const map = new Map(questions.map(q => [q.id, q]));
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
		if (!validateDetails()) {
			setMessage('❌ Fix highlighted fields');
			return;
		}
		setSaving(true);
		setMessage('');
		try {
			// 1) Update details (not questions)
			await safeApiCall(updateExam, id, {
				title: details.title.trim(),
				description: details.description?.trim() || '',
				duration: Number(details.duration),
				startTime: toISO(details.startTime),
				endTime: toISO(details.endTime),
				// status stays 'draft' while editing; publishing handled elsewhere
			});
			// 2) Update question set (server validates ownership)
			await safeApiCall(setExamQuestions, id, Array.from(selectedIds));
			setMessage('✅ Exam updated');
			setTimeout(() => navigate('/teacher/exams'), 400);
		} catch (e) {
			setMessage(`❌ ${e?.message || 'Failed to update exam'}`);
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return <div style={{ color: 'var(--text-muted)' }}>Loading…</div>;
	}

	const isLocked = status !== 'draft'; // Block editing if not draft

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
			<header
				style={{
					marginBottom: 16,
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					gap: 12,
					flexWrap: 'wrap',
				}}
			>
				<div>
					<h1 style={{ margin: 0, color: 'var(--text)', fontWeight: 800, fontSize: 26 }}>
						Edit Exam
					</h1>
					<p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)' }}>
						Modify details and question selection. Status: <Pill>{status}</Pill>
					</p>
				</div>
				<div style={{ display: 'flex', gap: 8 }}>
					<button
						onClick={() => navigate('/teacher/exams')}
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
						title={isLocked ? 'Only draft exams can be edited' : 'Save changes'}
					>
						{saving ? 'Saving…' : 'Save changes'}
					</button>
				</div>
			</header>

			{message && (
				<div
					style={{
						marginBottom: 16,
						padding: '12px 14px',
						borderRadius: 12,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						fontWeight: 600,
					}}
				>
					{message}
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
							<option value="all">All</option>
							<option value="multiple-choice">MCQ</option>
							<option value="subjective">Subjective</option>
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
						const selected = selectedIds.has(q.id);
						return (
							<div
								key={q.id}
								onClick={() => !isLocked && toggleSelected(q.id)}
								style={{
									userSelect: 'none',
									cursor: isLocked ? 'not-allowed' : 'pointer',
									background: selected
										? 'color-mix(in srgb, #3b82f6 12%, var(--surface))'
										: 'var(--surface)',
									border: `2px solid ${selected ? '#3b82f6' : 'var(--border)'}`,
									borderRadius: 12,
									padding: 14,
								}}
							>
								<div
									style={{
										display: 'flex',
										justifyContent: 'space-between',
										gap: 10,
									}}
								>
									<strong style={{ color: 'var(--text)' }}>
										{q.type === 'multiple-choice' ? 'MCQ' : 'Subjective'}
									</strong>
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
		</div>
	);
};

export default ExamEdit;
