import React from 'react';
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

const ExamCard = ({ exam, onPublish, onClone, onEdit, publishing }) => {
	const config = statusConfig[exam.status] || statusConfig.draft;

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: '24px',
				transition: 'all 0.2s ease',
				position: 'relative',
				overflow: 'hidden',
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'translateY(-2px)';
				e.currentTarget.style.boxShadow = 'var(--shadow-md)';
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'translateY(0)';
				e.currentTarget.style.boxShadow = 'var(--shadow-md)';
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
			<header style={{ marginBottom: '16px' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
					<h3
						style={{
							margin: 0,
							fontSize: 18,
							fontWeight: 700,
							color: 'var(--text)',
							flex: 1,
						}}
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
							fontWeight: 700,
						}}
					>
						<span>{config.icon}</span>
						{config.label}
					</span>
				</div>

				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
						gap: 12,
						color: 'var(--text-muted)',
						fontSize: 14,
					}}
				>
					<div>
						<strong style={{ color: 'var(--text)' }}>Start:</strong> {exam.startAt}
					</div>
					<div>
						<strong style={{ color: 'var(--text)' }}>Enrolled:</strong> {exam.enrolled}
					</div>
					<div>
						<strong style={{ color: 'var(--text)' }}>Submissions:</strong>{' '}
						{exam.submissions}
					</div>
				</div>
			</header>

			<div
				style={{
					display: 'flex',
					gap: 10,
					flexWrap: 'wrap',
					paddingTop: 16,
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
						fontWeight: 600,
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
						fontWeight: 600,
						fontSize: 14,
					}}
				>
					📋 Clone
				</button>

				{exam.status !== 'active' && exam.status !== 'live' && (
					<button
						onClick={() => onPublish(exam.id)}
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
							fontWeight: 600,
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
	const [status, setStatus] = React.useState('all');
	const [message, setMessage] = React.useState('');
	const [publishingIds, setPublishingIds] = React.useState(new Set());

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
		return exams.filter(exam => {
			const matchesStatus = status === 'all' || exam.status === status;
			const matchesQuery =
				!query.trim() || exam.title.toLowerCase().includes(query.toLowerCase());
			return matchesStatus && matchesQuery;
		});
	}, [exams, status, query]);

	const statusCounts = React.useMemo(() => {
		const counts = { all: exams.length };
		exams.forEach(exam => {
			counts[exam.status] = (counts[exam.status] || 0) + 1;
		});
		return counts;
	}, [exams]);

	const handlePublish = async examId => {
		setPublishingIds(prev => new Set([...prev, examId]));
		setMessage('');
		try {
			await safeApiCall(updateExamStatus, examId, { status: 'active' });
			setExams(prev => prev.map(ex => (ex.id === examId ? { ...ex, status: 'active' } : ex)));
			setMessage('✅ Exam published successfully!');
		} catch (e) {
			setMessage(`❌ ${e.message || 'Failed to publish exam'}`);
		} finally {
			setPublishingIds(prev => {
				const next = new Set(prev);
				next.delete(examId);
				return next;
			});
		}
	};

	const handleClone = exam => {
		setMessage(`📋 Cloning "${exam.title}" (to be implemented)`);
	};

	const handleEdit = exam => {
		setMessage(`✏️ Opening editor for "${exam.title}" (to be implemented)`);
	};

	const filterOptions = [
		{ key: 'all', label: 'All Exams' },
		{ key: 'live', label: 'Live' },
		{ key: 'scheduled', label: 'Scheduled' },
		{ key: 'draft', label: 'Drafts' },
		{ key: 'completed', label: 'Completed' },
	];

	return (
		<div style={{ maxWidth: '1200px' }}>
			<header
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 24,
				}}
			>
				<div>
					<h1
						style={{
							margin: '0 0 8px 0',
							fontSize: '28px',
							fontWeight: 800,
							color: 'var(--text)',
						}}
					>
						Exam Management
					</h1>
					<p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '16px' }}>
						Create, schedule, and monitor all your exams.
					</p>
				</div>
				<button
					onClick={() => setMessage('➕ Create exam functionality coming soon!')}
					style={{
						padding: '12px 20px',
						borderRadius: '10px',
						border: 'none',
						background: 'linear-gradient(135deg, #10b981, #059669)',
						color: '#ffffff',
						fontWeight: 700,
						cursor: 'pointer',
						boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
						fontSize: '14px',
					}}
				>
					➕ Create Exam
				</button>
			</header>

			{message && <div style={{ marginBottom: 16, color: 'var(--text)' }}>{message}</div>}

			<div
				style={{
					background: 'var(--surface)',
					padding: 24,
					borderRadius: 16,
					border: '1px solid var(--border)',
					marginBottom: 24,
					boxShadow: 'var(--shadow-md)',
				}}
			>
				<div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
					<div style={{ position: 'relative', flex: '1 1 300px' }}>
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
				</div>
			</div>

			{/* Loading/Error/Empty States */}
			{loading && (
				<div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
					Loading exams...
				</div>
			)}
			{error && <div style={{ color: '#ef4444', textAlign: 'center' }}>Error: {error}</div>}
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
					<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
						No matching exams found
					</h3>
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
						gap: 20,
						gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
					}}
				>
					{filteredExams.map(exam => (
						<ExamCard
							key={exam.id}
							exam={exam}
							onPublish={handlePublish}
							onClone={handleClone}
							onEdit={handleEdit}
							publishing={publishingIds.has(exam.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default TeacherExams;
