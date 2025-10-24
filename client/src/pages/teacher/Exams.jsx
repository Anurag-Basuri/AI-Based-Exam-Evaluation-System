import React from 'react';
import { useNavigate } from 'react-router-dom';
import * as TeacherSvc from '../../services/teacherServices.js';
import { apiClient } from '../../services/api.js';
import Alert from '../../components/ui/Alert.jsx';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';

const ActionModal = ({ title, children, onConfirm, onCancel, confirmText = 'Confirm' }) => (
	<div
		style={{
			position: 'fixed',
			inset: 0,
			background: 'rgba(0,0,0,0.5)',
			backdropFilter: 'blur(4px)',
			display: 'grid',
			placeItems: 'center',
			padding: 16,
			zIndex: 100,
		}}
		onClick={onCancel}
	>
		<div
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 16,
				padding: '20px',
				width: 'min(500px, 95vw)',
				boxShadow: 'var(--shadow-lg)',
			}}
			onClick={e => e.stopPropagation()}
		>
			<h3 style={{ marginTop: 0, color: 'var(--text)' }}>{title}</h3>
			<div style={{ margin: '16px 0' }}>{children}</div>
			<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
				<button
					onClick={onCancel}
					style={{
						padding: '10px 16px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						fontWeight: 700,
					}}
				>
					Cancel
				</button>
				<button
					onClick={onConfirm}
					style={{
						padding: '10px 16px',
						borderRadius: 8,
						border: 'none',
						background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
						color: '#fff',
						fontWeight: 700,
					}}
				>
					{confirmText}
				</button>
			</div>
		</div>
	</div>
);

const MoreActionsMenu = ({ children }) => {
	const [isOpen, setIsOpen] = React.useState(false);
	const ref = React.useRef(null);

	React.useEffect(() => {
		const handleClickOutside = event => {
			if (ref.current && !ref.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	return (
		<div ref={ref} style={{ position: 'relative' }}>
			<button
				onClick={() => setIsOpen(o => !o)}
				style={{
					flex: '1 1 120px',
					padding: '10px 14px',
					borderRadius: 8,
					border: '1px solid var(--border)',
					background: 'var(--surface)',
					color: 'var(--text)',
					fontWeight: 700,
					fontSize: 14,
				}}
			>
				More...
			</button>
			{isOpen && (
				<div
					style={{
						position: 'absolute',
						right: 0,
						bottom: '100%',
						marginBottom: 8,
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						borderRadius: 8,
						boxShadow: 'var(--shadow-lg)',
						zIndex: 10,
						minWidth: 180,
						display: 'flex',
						flexDirection: 'column',
						padding: 6,
					}}
				>
					{React.Children.map(children, child =>
						React.cloneElement(child, {
							style: {
								...child.props.style,
								width: '100%',
								textAlign: 'left',
								padding: '10px 14px',
								background: 'transparent',
								border: 'none',
								borderRadius: 6,
								cursor: 'pointer',
							},
							onMouseEnter: e => (e.currentTarget.style.background = 'var(--bg)'),
							onMouseLeave: e => (e.currentTarget.style.background = 'transparent'),
							onClick: e => {
								child.props.onClick(e);
								setIsOpen(false);
							},
						}),
					)}
				</div>
			)}
		</div>
	);
};

const statusConfig = {
	live: {
		bg: '#dcfce7',
		border: '#22c55e',
		color: '#166534',
		label: 'Live',
		icon: '🟢',
	},
	active: {
		bg: '#dcfce7',
		border: '#22c55e',
		color: '#166534',
		label: 'Live',
		icon: '🟢',
	},
	scheduled: {
		bg: '#dbeafe',
		border: '#3b82f6',
		color: '#1e40af',
		label: 'Scheduled',
		icon: '🗓️',
	},
	draft: {
		bg: '#f3f4f6',
		border: '#9ca3af',
		color: '#4b5563',
		label: 'Draft',
		icon: '📄',
	},
	completed: {
		bg: '#ede9fe',
		border: '#8b5cf6',
		color: '#5b21b6',
		label: 'Completed',
		icon: '✅',
	},
	cancelled: {
		bg: '#fee2e2',
		border: '#ef4444',
		color: '#991b1b',
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

const ExamCard = ({
	exam,
	onPublish,
	onClone,
	onEdit,
	publishing,
	onCopyCode,
	onEndNow,
	onCancel,
	onExtend15,
	onRegenerate,
	onRename,
	onDelete,
	onReschedule,
}) => {
	const visualStatus = exam.derivedStatus || exam.status || 'draft';
	const config = statusConfig[visualStatus] || statusConfig.draft;

	// Derive view state
	const now = Date.now();
	const isScheduled = exam.status === 'active' && exam.startMs && now < exam.startMs;
	const isLive =
		exam.status === 'active' &&
		exam.startMs &&
		exam.endMs &&
		now >= exam.startMs &&
		now <= exam.endMs;
	const isDraft = exam.status === 'draft';
	const isCompleted = exam.derivedStatus === 'completed';
	const isCancelled = exam.status === 'cancelled';

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-sm)',
				display: 'flex',
				flexDirection: 'column',
				transition: 'transform .2s ease, box-shadow .2s ease',
			}}
			onMouseEnter={e => {
				e.currentTarget.style.transform = 'translateY(-2px)';
				e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
			}}
			onMouseLeave={e => {
				e.currentTarget.style.transform = 'translateY(0)';
				e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
			}}
		>
			<header
				style={{
					padding: '16px 20px',
					borderBottom: '1px solid var(--border)',
					background: 'var(--bg)',
					borderTopLeftRadius: 16,
					borderTopRightRadius: 16,
				}}
			>
				<div
					style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}
				>
					<h3
						style={{
							margin: 0,
							fontSize: 18,
							fontWeight: 800,
							color: 'var(--text)',
							flex: 1,
							lineHeight: 1.3,
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
							padding: '4px 10px',
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

				{/* Share code */}
				{!isDraft && (
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
							<span style={{ color: 'var(--text)', fontFamily: 'monospace' }}>
								{exam.searchId || '—'}
							</span>
						</Badge>
						<button
							onClick={() => onCopyCode(exam.searchId)}
							disabled={!exam.searchId}
							title="Copy share code"
							style={{
								padding: '6px 10px',
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
				)}
			</header>

			<div style={{ padding: '16px 20px', flex: 1 }}>
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr 1fr',
						gap: '8px 16px',
						color: 'var(--text-muted)',
						fontSize: 13,
						marginBottom: 16,
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
			</div>

			<div
				style={{
					display: 'flex',
					gap: 10,
					flexWrap: 'wrap',
					padding: '0 20px 20px 20px',
					borderTop: '1px solid var(--border)',
					paddingTop: 16,
				}}
			>
				<button
					onClick={() => onEdit(exam)}
					// SIMPLIFIED: Use the reliable derivedStatus for UI logic.
					disabled={exam.derivedStatus === 'live'}
					title={
						exam.derivedStatus === 'live'
							? 'Cannot edit a live exam'
							: 'Edit exam details'
					}
					style={{
						flex: '1 1 120px',
						padding: '10px 14px',
						borderRadius: 8,
						border: 'none',
						background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
						color: '#ffffff',
						cursor: exam.derivedStatus === 'live' ? 'not-allowed' : 'pointer',
						fontWeight: 700,
						fontSize: 14,
						boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
						opacity: exam.derivedStatus === 'live' ? 0.6 : 1,
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

				{isScheduled && (
					<>
						<button
							onClick={() => onCancel(exam)}
							style={{
								/* neutral */ padding: '10px 14px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: '#dc2626',
								fontWeight: 700,
							}}
						>
							⛔ Cancel
						</button>
						<button
							onClick={() => onExtend15(exam)}
							style={{
								padding: '10px 14px',
								borderRadius: 8,
								border: 'none',
								background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
								color: '#fff',
								fontWeight: 700,
							}}
						>
							➕ Extend +15m
						</button>
						<button
							onClick={() => onRegenerate(exam)}
							style={{
								padding: '10px 14px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								fontWeight: 700,
							}}
						>
							🔁 New code
						</button>
						<button
							onClick={() => onRename(exam)}
							style={{
								padding: '10px 14px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								fontWeight: 700,
							}}
						>
							🖊️ Rename
						</button>
					</>
				)}

				{isLive && (
					<>
						<button
							onClick={() => onEndNow(exam)}
							style={{
								padding: '10px 14px',
								borderRadius: 8,
								border: 'none',
								background: 'linear-gradient(135deg, #ef4444, #dc2626)',
								color: '#fff',
								fontWeight: 800,
							}}
						>
							🛑 End now
						</button>
						<button
							onClick={() => onExtend15(exam)}
							style={{
								padding: '10px 14px',
								borderRadius: 8,
								border: 'none',
								background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
								color: '#fff',
								fontWeight: 700,
							}}
						>
							➕ Extend +15m
						</button>
					</>
				)}

				{/* Reschedule (scheduled only) */}
				{isScheduled && (
					<button
						onClick={() => onReschedule(exam)}
						style={{
							padding: '10px 14px',
							borderRadius: 8,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: '#1d4ed8',
							fontWeight: 700,
						}}
					>
						🗓️ Reschedule
					</button>
				)}

				{/* Delete (only when not active/live/scheduled) */}
				{(isDraft || isCancelled || isCompleted) && (
					<button
						onClick={() => onDelete(exam)}
						style={{
							padding: '10px 14px',
							borderRadius: 8,
							border: '1px solid color-mix(in srgb, #ef4444 30%, var(--border))',
							background: 'var(--surface)',
							color: '#ef4444',
							fontWeight: 800,
						}}
					>
						🗑️ Delete
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
	const [errorBanner, setErrorBanner] = React.useState('');
	const { success, error: toastError } = useToast();
	const navigate = useNavigate();
	const [modal, setModal] = React.useState({ type: null, exam: null, value: '' });

	const loadExams = React.useCallback(async () => {
		setLoading(true);
		setErrorBanner('');
		try {
			const params = {
				status: status === 'all' ? undefined : status,
				q: query || undefined,
				sortBy: sortBy,
			};
			const response = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams, params);
			setExams(Array.isArray(response?.items) ? response.items : []);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to load exams');
		} finally {
			setLoading(false);
		}
	}, [status, query, sortBy]);

	React.useEffect(() => {
		loadExams();
	}, [loadExams]);

	const filteredExams = React.useMemo(() => {
		// Filtering is now done on the backend, client just displays the result.
		return exams;
	}, [exams]);

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
		if (!exam?.questions?.length) {
			setErrorBanner('Add at least one question before publishing this exam.');
			return;
		}
		const now = Date.now();
		// Use startMs from normalized data
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
			const updated = await TeacherSvc.safeApiCall(TeacherSvc.publishTeacherExam, exam.id);
			// Merge back into list
			setExams(prev => prev.map(ex => (ex.id === exam.id ? updated : ex)));
			success('Exam published successfully');
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to publish exam');
		} finally {
			setPublishingIds(prev => {
				const next = new Set(prev);
				next.delete(exam.id);
				return next;
			});
		}
	};

	const handleClone = async exam => {
		try {
			const copy = await TeacherSvc.safeApiCall(TeacherSvc.duplicateTeacherExam, exam.id);
			setExams(prev => [copy, ...prev]);
			success(`Cloned "${exam.title}"`);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to clone exam');
		}
	};

	const handleEdit = exam => {
		navigate(`/teacher/exams/edit/${exam.id}`);
	};

	const handleCopyCode = async code => {
		if (!code) return;
		try {
			await navigator.clipboard.writeText(code);
			success('Share code copied');
		} catch {
			setErrorBanner('Failed to copy code');
		}
	};

	const handleEndNow = async exam => {
		if (!window.confirm('End this exam immediately?')) return;
		try {
			const updated = await TeacherSvc.safeApiCall(TeacherSvc.endExamNow, exam.id);
			setExams(prev => prev.map(e => (e.id === exam.id ? updated : e)));
			success('Exam ended');
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to end exam');
		}
	};

	const handleCancel = async exam => {
		if (!window.confirm('Cancel this scheduled exam? Students will not be able to join.'))
			return;
		try {
			const updated = await TeacherSvc.safeApiCall(TeacherSvc.cancelExam, exam.id);
			setExams(prev => prev.map(e => (e.id === exam.id ? updated : e)));
			success('Exam cancelled');
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to cancel exam');
		}
	};

	const handleExtend15 = async exam => {
		try {
			const updated = await TeacherSvc.safeApiCall(TeacherSvc.extendExamEnd, exam.id, {
				minutes: 15,
			});
			setExams(prev => prev.map(e => (e.id === exam.id ? updated : e)));
			success('Extended by 15 minutes');
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to extend exam');
		}
	};

	const handleRegenerate = async exam => {
		if (!window.confirm('Regenerate the share code? Existing code will no longer work.'))
			return;
		try {
			const { searchId } = await TeacherSvc.safeApiCall(
				TeacherSvc.regenerateExamShareCode,
				exam.id,
			);
			setExams(prev => prev.map(e => (e.id === exam.id ? { ...e, searchId } : e)));
			success('New share code generated');
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to regenerate code');
		}
	};

	const handleRename = async exam => {
		setModal({ type: 'rename', exam, value: exam.title });
	};

	const handleDelete = async exam => {
		const warn =
			'Delete this exam permanently?\nThis cannot be undone and removes the exam from your list.';
		if (!window.confirm(warn)) return;
		try {
			const res = await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
			if (res?.success) {
				setExams(prev => prev.filter(e => e.id !== exam.id));
				success('Exam deleted');
			} else {
				setErrorBanner('Failed to delete exam');
			}
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to delete exam');
		}
	};

	const handleReschedule = async exam => {
		const toLocalInput = ms => new Date(ms).toISOString().slice(0, 16);
		const startDefault = exam.startMs
			? toLocalInput(exam.startMs)
			: new Date(Date.now() + 60 * 60 * 1000).toISOString().slice(0, 16);
		const endDefault = exam.endMs
			? toLocalInput(exam.endMs)
			: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString().slice(0, 16);

		setModal({
			type: 'reschedule',
			exam,
			value: { start: startDefault, end: endDefault },
		});
	};

	const handleModalConfirm = async () => {
		const { type, exam, value } = modal;
		if (!type || !exam) return;

		try {
			if (type === 'rename') {
				if (!value || !value.trim()) return;
				const updated = await TeacherSvc.safeApiCall(TeacherSvc.updateExam, exam.id, {
					title: value.trim(),
				});
				setExams(prev => prev.map(e => (e.id === exam.id ? updated : e)));
				success('Title updated');
			} else if (type === 'reschedule') {
				const start = new Date(value.start);
				const end = new Date(value.end);
				if (isNaN(start.getTime()) || isNaN(end.getTime())) {
					setErrorBanner('Invalid date/time format');
					return;
				}
				if (end <= start) {
					setErrorBanner('End time must be after start time');
					return;
				}
				if (start <= new Date()) {
					setErrorBanner('Start time must be in the future');
					return;
				}
				const updated = await TeacherSvc.safeApiCall(TeacherSvc.updateExam, exam.id, {
					startTime: start.toISOString(),
					endTime: end.toISOString(),
				});
				setExams(prev => prev.map(e => (e.id === exam.id ? updated : e)));
				success('Exam rescheduled');
			}
		} catch (e) {
			setErrorBanner(e?.message || `Failed to perform action: ${type}`);
		} finally {
			setModal({ type: null, exam: null, value: '' });
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
			<PageHeader
				title="Exam Management"
				subtitle="Create, schedule, publish, and track your exams."
				breadcrumbs={[{ label: 'Home', to: '/teacher' }, { label: 'Exams' }]}
				actions={[
					<button
						key="refresh"
						onClick={loadExams}
						className="tap"
						title="Refresh"
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 800,
						}}
					>
						<span className="desktop-only">↻ Refresh</span>
						<span className="mobile-only">↻</span>
					</button>,
					<button
						key="create"
						onClick={() => navigate('/teacher/exams/create')}
						className="tap"
						style={{
							padding: '12px 20px',
							borderRadius: 10,
							border: 'none',
							background: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#fff',
							fontWeight: 900,
							boxShadow: '0 8px 20px rgba(16,185,129,0.3)',
						}}
					>
						<span className="desktop-only">➕ Create Exam</span>
						<span className="mobile-only">➕</span>
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

			{modal.type === 'rename' && (
				<ActionModal
					title="Rename Exam"
					onCancel={() => setModal({ type: null, exam: null, value: '' })}
					onConfirm={handleModalConfirm}
					confirmText="Rename"
				>
					<input
						type="text"
						value={modal.value}
						onChange={e => setModal(m => ({ ...m, value: e.target.value }))}
						style={{
							width: '100%',
							padding: '12px',
							borderRadius: 8,
							border: '1px solid var(--border)',
						}}
						placeholder="New exam title"
					/>
				</ActionModal>
			)}

			{modal.type === 'reschedule' && (
				<ActionModal
					title="Reschedule Exam"
					onCancel={() => setModal({ type: null, exam: null, value: '' })}
					onConfirm={handleModalConfirm}
					confirmText="Reschedule"
				>
					<div style={{ display: 'grid', gap: 12 }}>
						<label>
							New Start Time
							<input
								type="datetime-local"
								value={modal.value.start}
								onChange={e =>
									setModal(m => ({
										...m,
										value: { ...m.value, start: e.target.value },
									}))
								}
								style={{
									width: '100%',
									padding: '12px',
									borderRadius: 8,
									border: '1px solid var(--border)',
									marginTop: 4,
								}}
							/>
						</label>
						<label>
							New End Time
							<input
								type="datetime-local"
								value={modal.value.end}
								onChange={e =>
									setModal(m => ({
										...m,
										value: { ...m.value, end: e.target.value },
									}))
								}
								style={{
									width: '100%',
									padding: '12px',
									borderRadius: 8,
									border: '1px solid var(--border)',
									marginTop: 4,
								}}
							/>
						</label>
					</div>
				</ActionModal>
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
				<div
					aria-busy="true"
					style={{
						display: 'grid',
						gap: 12,
						gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
					}}
				>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							style={{
								height: 180,
								borderRadius: 16,
								border: '1px solid var(--border)',
								background:
									'linear-gradient(90deg, var(--bg) 25%, color-mix(in srgb, var(--bg) 80%, #fff) 37%, var(--bg) 63%)',
								backgroundSize: '400% 100%',
								animation: 'shimmer 1.1s ease-in-out infinite',
							}}
						/>
					))}

					<style>{`@keyframes shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}`}</style>
				</div>
			)}
			{error && (
				<div style={{ color: '#ef4444', textAlign: 'center', fontWeight: 700 }}>
					Error: {error}
				</div>
			)}
			{!loading && !errorBanner && filteredExams.length === 0 && (
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
						Adjust your search or filters, or create a new exam.
					</p>
				</div>
			)}

			{/* Exams Grid */}
			{!loading && !errorBanner && filteredExams.length > 0 && (
				<div
					style={{
						display: 'grid',
						gap: 20,
						gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 400px), 1fr))',
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
							onEndNow={handleEndNow}
							onCancel={handleCancel}
							onExtend15={handleExtend15}
							onRegenerate={handleRegenerate}
							onRename={handleRename}
							onDelete={handleDelete}
							onReschedule={handleReschedule}
							publishing={publishingIds.has(exam.id)}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default TeacherExams;
