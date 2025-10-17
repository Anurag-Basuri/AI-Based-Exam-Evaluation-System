import React from 'react';
import { useNavigate } from 'react-router-dom';
import { safeApiCall, getTeacherExams, updateExamStatus } from '../../services/teacherServices.js';

const statusConfig = {
	live: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#10b981',
		label: 'Live',
		icon: '🟢',
	},
	active: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#10b981',
		label: 'Live',
		icon: '🟢',
	},
	scheduled: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#1d4ed8',
		label: 'Scheduled',
		icon: '🗓️',
	},
	draft: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: 'var(--text-muted)',
		label: 'Draft',
		icon: '📄',
	},
	completed: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#7c3aed',
		label: 'Completed',
		icon: '✅',
	},
	cancelled: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#dc2626',
		label: 'Cancelled',
		icon: '❌',
	},
};

const FilterButton = ({ active, children, onClick, count }) => (
	<button
		onClick={onClick}
		style={{
			padding: '10px 16px',
			borderRadius: 25,
			border: active ? '2px solid #3b82f6' : '1px solid var(--border)',
			background: active ? 'color-mix(in srgb, #3b82f6 20%, transparent)' : 'var(--surface)',
			color: active ? '#3b82f6' : 'var(--text)',
			cursor: 'pointer',
			fontWeight: 600,
			fontSize: '14px',
			display: 'flex',
			alignItems: 'center',
			gap: 8,
		}}
	>
		{children}
		{count !== undefined && (
			<span
				style={{
					background: active ? '#3b82f6' : 'var(--text-muted)',
					color: '#ffffff',
					borderRadius: '12px',
					padding: '2px 8px',
					fontSize: '12px',
					fontWeight: 700,
				}}
			>
				{count}
			</span>
		)}
	</button>
);

const Badge = ({ children }) => (
	<span
		style={{
			display: 'inline-flex',
			alignItems: 'center',
			gap: 6,
			fontSize: 12,
			padding: '6px 10px',
			borderRadius: 20,
			border: '1px solid var(--border)',
			background: 'var(--bg)',
			color: 'var(--text)',
			fontWeight: 700,
		}}
	>
		{children}
	</span>
);

const ExamCard = ({ exam, onPublish, onClone, onEdit, publishing, onCopyCode }) => {
	const visualStatus = exam.derivedStatus || exam.status || 'draft';
	const config = statusConfig[visualStatus] || statusConfig.draft;

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: '20px',
				transition: 'transform .2s ease',
				position: 'relative',
				overflow: 'hidden',
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'translateY(-2px)';
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'translateY(0)';
			}}
		>
			<div
				style={{
					position: 'absolute',
					top: 0,
					right: 0,
					width: 4,
					height: '100%',
					background: config.color,
				}}
			/>
			<header style={{ marginBottom: '14px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
					<h3
						style={{
							margin: 0,
							fontSize: 18,
							fontWeight: 800,
							color: 'var(--text)',
							flex: 1,
						}}
						title={exam.title}
					>
						{exam.title}
					</h3>

					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 6,
							fontSize: 12,
							padding: '6px 12px',
							borderRadius: 20,
							border: `1px solid ${config.border}`,
							background: config.bg,
							color: config.color,
							fontWeight: 800,
						}}
					>
						<span>{config.icon}</span>
						{config.label}
					</span>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
						gap: 10,
						color: 'var(--text-muted)',
						fontSize: 13,
					}}
				>
					<div>
						<strong style={{ color: 'var(--text)' }}>Start:</strong>{' '}
						{exam.startAt || '—'}
					</div>
					<div>
						<strong style={{ color: 'var(--text)' }}>End:</strong> {exam.endAt || '—'}
					</div>
					<div>
						<strong style={{ color: 'var(--text)' }}>Enrolled:</strong> {exam.enrolled}
					</div>
					<div>
						<strong style={{ color: 'var(--text)' }}>Submissions:</strong>{' '}
						{exam.submissions}
					</div>
				</div>

				{/* Share code */}
				<div
					style={{
						display: 'flex',
						gap: 8,
						alignItems: 'center',
						marginTop: 10,
						justifyContent: 'space-between',
						flexWrap: 'wrap',
					}}
				>
					<Badge>
						Share code:{' '}
						<span style={{ color: 'var(--text)' }}>{exam.searchId || '—'}</span>
					</Badge>
					<div style={{ display: 'flex', gap: 8 }}>
						<button
							onClick={() => onCopyCode(exam.searchId)}
							disabled={!exam.searchId}
							title="Copy share code"
							style={{
								padding: '8px 10px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								cursor: exam.searchId ? 'pointer' : 'not-allowed',
								fontWeight: 700,
								fontSize: 12,
							}}
						>
							📋 Copy
						</button>
					</div>
				</div>
			</header>

			<div
				style={{
					display: 'flex',
					gap: 10,
					flexWrap: 'wrap',
					paddingTop: 12,
					borderTop: '1px solid var(--border)',
				}}
			>
				<button
					onClick={() => onEdit(exam)}
					style={{
						flex: '1 1 120px',
						padding: '10px 14px',
						borderRadius: 8,
						border: 'none',
						background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
						color: '#ffffff',
						cursor: 'pointer',
						fontWeight: 700,
						fontSize: 14,
						boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
					}}
				>
					✏️ Edit
				</button>

				<button
					onClick={() => onClone(exam)}
					style={{
						flex: '1 1 120px',
						padding: '10px 14px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						cursor: 'pointer',
						fontWeight: 700,
						fontSize: 14,
					}}
				>
					📋 Clone
				</button>

				{/* Only allow publish from draft (server requires draft -> active) */}
				{exam.status === 'draft' && (
					<button
						onClick={() => onPublish(exam)}
						disabled={publishing}
						style={{
							flex: '1 1 120px',
							padding: '10px 14px',
							borderRadius: 8,
							border: 'none',
							background: publishing
								? '#9ca3af'
								: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#ffffff',
							cursor: publishing ? 'not-allowed' : 'pointer',
							fontWeight: 700,
							fontSize: 14,
							boxShadow: publishing ? 'none' : '0 4px 12px rgba(16,185,129,0.25)',
						}}
					>
						{publishing ? '⏳ Publishing...' : '🚀 Publish'}
					</button>
				)}
			</div>
		</article>
	);
};

const TeacherExams = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [exams, setExams] = React.useState([]);
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all'); // all | live | scheduled | draft | completed | cancelled
	const [sortBy, setSortBy] = React.useState('start'); // start | title
	const [message, setMessage] = React.useState('');
	const [publishingIds, setPublishingIds] = React.useState(new Set());
	const navigate = useNavigate();

	const loadExams = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getTeacherExams);
			setExams(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load exams');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadExams();
	}, [loadExams]);

	const filteredExams = React.useMemo(() => {
		const qLower = query.trim().toLowerCase();
		let list = exams.filter(exam => {
			const visual = exam.derivedStatus || exam.status;
			const matchesStatus = status === 'all' || visual === status;
			const matchesQuery = !qLower || exam.title.toLowerCase().includes(qLower);
			return matchesStatus && matchesQuery;
		});
		// Sort
		if (sortBy === 'start') {
			list = list.sort((a, b) => (a.startMs || 0) - (b.startMs || 0));
		} else if (sortBy === 'title') {
			list = list.sort((a, b) => a.title.localeCompare(b.title));
		}
		return list;
	}, [exams, status, query, sortBy]);

	const statusCounts = React.useMemo(() => {
		const counts = {
			all: exams.length,
			live: 0,
			scheduled: 0,
			draft: 0,
			completed: 0,
			cancelled: 0,
		};
		exams.forEach(exam => {
			const visual = exam.derivedStatus || exam.status;
			if (counts[visual] !== undefined) counts[visual] += 1;
		});
		return counts;
	}, [exams]);

	const handlePublish = async exam => {
		// Guard: must have at least one question before activation (server enforces too)
		if (!exam?.questions?.length) {
			setMessage('❌ Add at least one question before publishing this exam.');
			return;
		}
		// Confirm and warn timing
		const now = Date.now();
		const startsInFuture = exam.startMs && now < exam.startMs;
		const endsInPast = exam.endMs && now > exam.endMs;
		const warn = endsInPast
			? 'End time appears to be in the past. Continue publishing?'
			: startsInFuture
				? 'Exam will be scheduled (not live yet). Publish now?'
				: 'Publish this exam now?';
		if (!window.confirm(warn)) return;

		setPublishingIds(prev => new Set([...prev, exam.id]));
		setMessage('');
		try {
			await safeApiCall(updateExamStatus, exam.id, { status: 'active' });
			// server status becomes 'active'; derivedStatus will be recomputed on reload
			setExams(prev =>
				prev.map(ex =>
					ex.id === exam.id
						? { ...ex, status: 'active', derivedStatus: ex.derivedStatus }
						: ex,
				),
			);
			setMessage('✅ Exam published successfully!');
		} catch (e) {
			setMessage(`❌ ${e.message || 'Failed to publish exam'}`);
		} finally {
			setPublishingIds(prev => {
				const next = new Set(prev);
				next.delete(exam.id);
				return next;
			});
		}
	};

	const handleClone = exam => {
		setMessage(`📋 Cloning "${exam.title}" (coming soon)`);
	};

	const handleEdit = exam => {
		setMessage(`✏️ Editor for "${exam.title}" (coming soon)`);
	};

	const handleCopyCode = async code => {
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code);
			setMessage('✅ Share code copied to clipboard');
		} catch {
			setMessage('❌ Failed to copy code');
		}
	};

	const filterOptions = [
		{ key: 'all', label: 'All' },
		{ key: 'live', label: 'Live' },
		{ key: 'scheduled', label: 'Scheduled' },
		{ key: 'draft', label: 'Draft' },
		{ key: 'completed', label: 'Completed' },
		{ key: 'cancelled', label: 'Cancelled' },
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			<header
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 18,
					gap: 12,
					flexWrap: 'wrap',
				}}
			>
				<div>
					<h1
						style={{
							margin: '0 0 6px 0',
							fontSize: '28px',
							fontWeight: 800,
							color: 'var(--text)',
						}}
					>
						Exam Management
					</h1>
					<p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>
						Create, schedule, publish, and track your exams.
					</p>
				</div>
				<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
					<button
						onClick={loadExams}
						title="Refresh"
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 700,
							cursor: 'pointer',
						}}
					>
						↻ Refresh
					</button>
					<button
						onClick={() => navigate('/teacher/exams/new')}
						style={{
							padding: '12px 20px',
							borderRadius: '10px',
							border: 'none',
							background: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#ffffff',
							fontWeight: 800,
							cursor: 'pointer',
							boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
							fontSize: '14px',
						}}
					>
						➕ Create Exam
					</button>
				</div>
			</header>

			{message && (
				<div
					role="status"
					style={{
						marginBottom: 12,
						padding: '10px 12px',
						borderRadius: 12,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						fontWeight: 700,
					}}
				>
					{message}
				</div>
			)}

			<div
				style={{
					background: 'var(--surface)',
					padding: 16,
					borderRadius: 16,
					border: '1px solid var(--border)',
					marginBottom: 18,
					boxShadow: 'var(--shadow-md)',
				}}
			>
				<div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
					<div style={{ position: 'relative', flex: '1 1 320px' }}>
						<input
							value={query}
							onChange={e => setQuery(e.target.value)}
							placeholder="Search exams by title..."
							style={{
								width: '100%',
								padding: '12px 16px 12px 48px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								outline: 'none',
								fontSize: '14px',
							}}
						/>
						<span
							style={{
								position: 'absolute',
								left: 16,
								top: '50%',
								transform: 'translateY(-50%)',
								color: 'var(--text-muted)',
								fontSize: '16px',
							}}
						>
							🔍
						</span>
					</div>

					<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
						{filterOptions.map(option => (
							<FilterButton
								key={option.key}
								active={status === option.key}
								onClick={() => setStatus(option.key)}
								count={statusCounts[option.key] || 0}
							>
								{option.label}
							</FilterButton>
						))}
					</div>

					<div style={{ marginLeft: 'auto' }}>
						<select
							value={sortBy}
							onChange={e => setSortBy(e.target.value)}
							title="Sort"
							style={{
								background: 'var(--bg)',
								color: 'var(--text)',
								border: '1px solid var(--border)',
								borderRadius: 10,
								padding: '10px 12px',
								fontWeight: 700,
							}}
						>
							<option value="start">Sort by start time</option>
							<option value="title">Sort by title</option>
						</select>
					</div>
				</div>
			</div>

			{/* Loading/Error/Empty States */}
			{loading && (
				<div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
					Loading exams...
				</div>
			)}
			{error && (
				<div style={{ color: '#ef4444', textAlign: 'center', fontWeight: 700 }}>
					Error: {error}
				</div>
			)}
			{!loading && !error && filteredExams.length === 0 && (
				<div
					style={{
						padding: '60px 20px',
						textAlign: 'center',
						background: 'var(--surface)',
						borderRadius: 16,
						border: '2px dashed var(--border)',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: 16 }}>📝</div>
					<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>No matching exams</h3>
					<p style={{ margin: 0, color: 'var(--text-muted)' }}>
						Try adjusting your search or filters, or create a new exam.
					</p>
				</div>
			)}

			{/* Exams Grid */}
			{!loading && !error && filteredExams.length > 0 && (
				<div
					style={{
						display: 'grid',
						gap: 16,
						gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
					}}
				>
					{filteredExams.map(exam => (
						<ExamCard
							key={exam.id}
							exam={exam}
							onPublish={handlePublish}
							onClone={handleClone}
							onEdit={handleEdit}
							onCopyCode={handleCopyCode}
							publishing={publishingIds.has(exam.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default TeacherExams;
