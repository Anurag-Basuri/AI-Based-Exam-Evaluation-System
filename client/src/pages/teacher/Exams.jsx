import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import { useTheme } from '../../hooks/useTheme.js';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../services/api.js';
import * as TeacherSvc from '../../services/teacherServices.js';
import {
	Eye,
	Plus,
	Search,
	RefreshCw,
	Clipboard,
	Rocket,
	StopCircle,
	Trash2,
	CheckCircle2,
	Copy as CopyIcon,
	MoreVertical,
	Clock,
	Users,
	FileText,
} from 'lucide-react';

/* ─── Utils & Constants ────────────────────────────────────── */
const STATUS_LABELS = {
	active: 'Active',
	live: 'Live',
	scheduled: 'Scheduled',
	draft: 'Draft',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

const STATUS_COLORS = {
	active: '#16a34a',
	live: '#ef4444',
	scheduled: '#3b82f6',
	draft: '#64748b',
	completed: '#8b5cf6',
	cancelled: '#ef4444',
};

const formatDate = dateVal => {
	if (!dateVal || dateVal === '—') return '—';
	const d = new Date(dateVal);
	if (isNaN(d.getTime())) return '—';
	return d.toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

/* ─── UI Components ─────────────────────────────────────────── */

function Spinner({ size = 16, color = 'currentColor' }) {
	return (
		<span
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				border: `2px solid ${color}40`,
				borderTop: `2px solid ${color}`,
				borderRadius: '50%',
				animation: 'spin 1s linear infinite',
			}}
		/>
	);
}

/* ─── Confirm Modal ─────────────────────────────────────────── */
function ConfirmModal({ isOpen, onClose, onConfirm, config, loading, isDark }) {
	if (!isOpen) return null;
	const { title, message, actionLabel, actionColor = '#ef4444', isInput = false } = config;
	const [inputValue, setInputValue] = useState('');

	return (
		<div
			style={{
				position: 'fixed',
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				background: 'rgba(0,0,0,0.6)',
				backdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 9999,
				padding: 16,
				opacity: isOpen ? 1 : 0,
				transition: 'opacity 0.2s',
			}}
		>
			<div
				style={{
					background: isDark ? '#1e293b' : '#fff',
					borderRadius: 16,
					padding: 24,
					width: '100%',
					maxWidth: 420,
					boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
					border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
					animation: 'slideUp 0.3s ease-out',
				}}
			>
				<h3
					style={{
						margin: '0 0 8px',
						fontSize: 20,
						color: isDark ? '#f8fafc' : '#0f172a',
					}}
				>
					{title}
				</h3>
				<p
					style={{
						margin: '0 0 20px',
						fontSize: 14,
						color: isDark ? '#94a3b8' : '#64748b',
						lineHeight: 1.5,
					}}
				>
					{message}
				</p>
				{isInput && (
					<input
						type="number"
						autoFocus
						placeholder="Minutes (e.g., 10)"
						value={inputValue}
						onChange={e => setInputValue(e.target.value)}
						style={{
							width: '100%',
							padding: '10px 14px',
							borderRadius: 8,
							border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
							background: isDark ? '#0f172a' : '#f8fafc',
							color: isDark ? '#f8fafc' : '#0f172a',
							marginBottom: 20,
							outline: 'none',
							fontSize: 15,
						}}
					/>
				)}
				<div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
					<button
						onClick={onClose}
						disabled={loading}
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							fontWeight: 600,
							fontSize: 14,
							border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
							background: 'transparent',
							color: isDark ? '#e2e8f0' : '#475569',
							cursor: loading ? 'not-allowed' : 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						onClick={() => onConfirm(isInput ? inputValue : null)}
						disabled={loading || (isInput && !inputValue)}
						style={{
							padding: '8px 16px',
							borderRadius: 8,
							fontWeight: 600,
							fontSize: 14,
							border: 'none',
							background: actionColor,
							color: '#fff',
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							cursor: loading || (isInput && !inputValue) ? 'not-allowed' : 'pointer',
							opacity: loading || (isInput && !inputValue) ? 0.7 : 1,
						}}
					>
						{loading ? <Spinner size={14} color="#ffffff" /> : null}
						{actionLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

/* ─── Exam Card ─────────────────────────────────────────────── */
function ExamCard({ exam, onAction, openModal, isDark }) {
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const status = exam.derivedStatus || exam.status || 'draft';

	const isDraft = status === 'draft';
	const isScheduled = status === 'scheduled';
	const isLive = status === 'live' || status === 'active';
	const isCompleted = status === 'completed';

	// Close menu on click outside
	useEffect(() => {
		if (!menuOpen) return;
		const close = () => setMenuOpen(false);
		window.addEventListener('click', close);
		return () => window.removeEventListener('click', close);
	}, [menuOpen]);

	const handleCopy = e => {
		e.stopPropagation();
		if (exam.searchId) {
			navigator.clipboard.writeText(exam.searchId);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	// Determine primary action
	let primaryAction = null;
	if (isDraft) {
		primaryAction = {
			label: 'Publish',
			icon: <Rocket size={15} />,
			id: 'publish',
			color: '#6366f1',
			bg: isDark ? '#4f46e533' : '#e0e7ff',
		};
	} else if (isScheduled) {
		primaryAction = {
			label: 'View Exam',
			icon: <Eye size={15} />,
			id: 'view',
			color: '#3b82f6',
			bg: isDark ? '#2563eb33' : '#dbeafe',
		};
	} else if (isLive) {
		primaryAction = {
			label: 'Live Submissions',
			icon: <Activity size={15} />,
			id: 'results',
			color: '#ef4444',
			bg: isDark ? '#dc262633' : '#fee2e2',
		};
	} else {
		primaryAction = {
			label: 'Results',
			icon: <FileText size={15} />,
			id: 'results',
			color: '#8b5cf6',
			bg: isDark ? '#7c3aed33' : '#ede9fe',
		};
	}

	const executePrimary = () => {
		if (primaryAction.id === 'view') navigate(`/teacher/exams/edit/${exam.id}`);
		else if (primaryAction.id === 'results') navigate(`/teacher/results/${exam.id}`);
		else if (primaryAction.id === 'publish') openModal('publish', exam);
	};

	return (
		<div
			style={{
				background: isDark ? '#1e293b' : '#ffffff',
				borderRadius: 16,
				border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
				padding: '20px',
				display: 'flex',
				flexDirection: 'column',
				gap: 16,
				boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
				transition: 'transform 0.2s, box-shadow 0.2s',
				position: 'relative',
			}}
		>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
				}}
			>
				<div style={{ flex: 1, paddingRight: 10 }}>
					<span
						style={{
							display: 'inline-block',
							padding: '2px 10px',
							borderRadius: 12,
							background: `${STATUS_COLORS[status]}22`,
							color: STATUS_COLORS[status],
							fontSize: 12,
							fontWeight: 700,
							marginBottom: 8,
							border: `1px solid ${STATUS_COLORS[status]}40`,
						}}
					>
						{STATUS_LABELS[status] || status}
					</span>
					<h3
						onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)}
						style={{
							margin: 0,
							fontSize: 18,
							fontWeight: 700,
							color: isDark ? '#f8fafc' : '#0f172a',
							cursor: 'pointer',
						}}
					>
						{exam.title}
					</h3>
					{exam.searchId && (
						<div
							onClick={handleCopy}
							style={{
								display: 'flex',
								alignItems: 'center',
								gap: 6,
								marginTop: 6,
								color: isDark ? '#38bdf8' : '#0284c7',
								fontSize: 13,
								fontFamily: 'monospace',
								cursor: 'pointer',
								background: isDark ? '#0c4a6e33' : '#e0f2fe',
								width: 'fit-content',
								padding: '2px 8px',
								borderRadius: 4,
							}}
						>
							<Clipboard size={13} /> {exam.searchId} {copied ? '✓' : ''}
						</div>
					)}
				</div>

				{/* Context Menu */}
				<div style={{ position: 'relative' }}>
					<button
						onClick={e => {
							e.stopPropagation();
							setMenuOpen(!menuOpen);
						}}
						style={{
							background: 'transparent',
							border: 'none',
							color: isDark ? '#94a3b8' : '#64748b',
							cursor: 'pointer',
							padding: 4,
							borderRadius: 20,
						}}
					>
						<MoreVertical size={20} />
					</button>
					{menuOpen && (
						<div
							style={{
								position: 'absolute',
								right: 0,
								top: 30,
								zIndex: 10,
								minWidth: 160,
								background: isDark ? '#0f172a' : '#ffffff',
								border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
								borderRadius: 12,
								boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
								padding: 6,
								display: 'flex',
								flexDirection: 'column',
								gap: 2,
							}}
						>
							<MenuItem
								icon={<Eye />}
								label="View / Edit"
								onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)}
								isDark={isDark}
							/>

							{isDraft && (
								<MenuItem
									icon={<Rocket />}
									label="Publish"
									onClick={() => openModal('publish', exam)}
									isDark={isDark}
									color="#6366f1"
								/>
							)}

							{(isScheduled || isLive) && (
								<MenuItem
									icon={<RefreshCw />}
									label="Extend Time"
									onClick={() => openModal('extend', exam)}
									isDark={isDark}
								/>
							)}

							{(isScheduled || isLive) && (
								<MenuItem
									icon={<StopCircle />}
									label={isLive ? 'End Now' : 'Cancel Exam'}
									onClick={() => openModal(isLive ? 'end' : 'cancel', exam)}
									isDark={isDark}
									color="#ef4444"
								/>
							)}

							{(isDraft || isScheduled) && (
								<MenuItem
									icon={<RefreshCw />}
									label="Regenerate Code"
									onClick={() => openModal('regenerate', exam)}
									isDark={isDark}
								/>
							)}

							<MenuItem
								icon={<CopyIcon />}
								label="Duplicate"
								onClick={() => openModal('duplicate', exam)}
								isDark={isDark}
							/>

							{/* Delete only for non-live/scheduled */}
							{!(isLive || isScheduled) && (
								<>
									<div
										style={{
											height: 1,
											background: isDark ? '#334155' : '#e2e8f0',
											margin: '4px 0',
										}}
									/>
									<MenuItem
										icon={<Trash2 />}
										label="Delete"
										onClick={() => openModal('delete', exam)}
										isDark={isDark}
										color="#ef4444"
									/>
								</>
							)}
						</div>
					)}
				</div>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: '1fr 1fr',
					gap: 12,
					background: isDark ? '#0f172a' : '#f8fafc',
					padding: 14,
					borderRadius: 12,
				}}
			>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						color: isDark ? '#94a3b8' : '#64748b',
						fontSize: 13,
					}}
				>
					<Clock size={16} color={isDark ? '#cbd5e1' : '#475569'} />
					<div>
						<div style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>
							{exam.duration} mins
						</div>
						<div>Duration</div>
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						color: isDark ? '#94a3b8' : '#64748b',
						fontSize: 13,
					}}
				>
					<FileText size={16} color={isDark ? '#cbd5e1' : '#475569'} />
					<div>
						<div style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>
							{exam.questions?.length || 0}
						</div>
						<div>Questions</div>
					</div>
				</div>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: 8,
						color: isDark ? '#94a3b8' : '#64748b',
						fontSize: 13,
						gridColumn: '1 / -1',
					}}
				>
					<Users size={16} color={isDark ? '#cbd5e1' : '#475569'} />
					<div>
						<div style={{ fontWeight: 600, color: isDark ? '#f8fafc' : '#0f172a' }}>
							{exam.submissions || 0} Submissions
						</div>
						<div>From students</div>
					</div>
				</div>
			</div>

			<div
				style={{
					fontSize: 12,
					color: isDark ? '#64748b' : '#94a3b8',
					display: 'flex',
					justifyContent: 'space-between',
				}}
			>
				<span>Begins: {formatDate(exam.startAt)}</span>
			</div>

			<button
				onClick={executePrimary}
				style={{
					width: '100%',
					padding: '10px',
					borderRadius: 8,
					border: 'none',
					background: primaryAction.bg,
					color: primaryAction.color,
					fontWeight: 600,
					fontSize: 14,
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 8,
					cursor: 'pointer',
					transition: 'opacity 0.2s',
				}}
			>
				{primaryAction.icon}
				{primaryAction.label}
			</button>
		</div>
	);
}

function MenuItem({ icon, label, onClick, isDark, color }) {
	return (
		<button
			onClick={e => {
				e.stopPropagation();
				onClick();
			}}
			style={{
				width: '100%',
				display: 'flex',
				alignItems: 'center',
				gap: 8,
				padding: '8px 12px',
				background: 'transparent',
				border: 'none',
				color: color || (isDark ? '#e2e8f0' : '#475569'),
				fontSize: 14,
				cursor: 'pointer',
				borderRadius: 8,
				textAlign: 'left',
			}}
			onMouseEnter={e => (e.currentTarget.style.background = isDark ? '#1e293b' : '#f1f5f9')}
			onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
		>
			{React.cloneElement(icon, { size: 16 })}
			{label}
		</button>
	);
}

function Activity({ size }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
		</svg>
	);
}

/* ─── Stats Card ────────────────────────────────────────────── */
function StatsCard({ stats, loading, isDark }) {
	const items = [
		{ label: 'Total', value: stats?.total ?? 0, color: '#6366f1', icon: <CheckCircle2 /> },
		{ label: 'Draft', value: stats?.draft ?? 0, color: '#64748b', icon: <Rocket /> },
		{ label: 'Scheduled', value: stats?.scheduled ?? 0, color: '#3b82f6', icon: <RefreshCw /> },
		{ label: 'Live', value: stats?.live ?? 0, color: '#ef4444', icon: <Activity size={24} /> },
	];
	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
				gap: 16,
				marginBottom: 24,
			}}
		>
			{items.map(item => (
				<div
					key={item.label}
					style={{
						background: isDark ? '#1e293b' : '#ffffff',
						border: isDark ? `1px solid ${item.color}40` : `1px solid #e2e8f0`,
						borderRadius: 16,
						padding: '16px',
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
						borderLeft: `4px solid ${item.color}`,
					}}
				>
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: 8,
							color: isDark ? '#94a3b8' : '#64748b',
							fontSize: 14,
							fontWeight: 600,
						}}
					>
						<span style={{ color: item.color }}>
							{React.cloneElement(item.icon, { size: 18 })}
						</span>
						{item.label}
					</div>
					<div
						style={{
							fontSize: 28,
							fontWeight: 800,
							color: isDark ? '#f8fafc' : '#0f172a',
						}}
					>
						{loading ? <Spinner size={24} /> : item.value}
					</div>
				</div>
			))}
		</div>
	);
}

/* ─── Main Page ─────────────────────────────────────────────── */
export default function TeacherExams() {
	const [exams, setExams] = useState([]);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('all');

	const [modalConfig, setModalConfig] = useState({ isOpen: false });
	const [actionLoading, setActionLoading] = useState(false);

	const navigate = useNavigate();
	const { toast } = useToast();
	const { theme } = useTheme();
	const isDark = theme === 'dark';

	const loadStats = useCallback(async () => {
		setStatsLoading(true);
		try {
			const res = await TeacherSvc.getExamStats();
			setStats(res || {});
		} catch (err) {
		} finally {
			setStatsLoading(false);
		}
	}, []);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams, {
				limit: 1000,
				q: search,
			});
			setExams(res?.items || []);
		} catch (err) {
			toast?.error?.(err?.message || 'Failed to load exams');
		} finally {
			setLoading(false);
		}
	}, [search, toast]);

	useEffect(() => {
		loadData();
		loadStats();
		const socket = io(API_BASE_URL, { withCredentials: true, transports: ['websocket'] });
		socket.on('exam-updated', () => {
			loadData();
			loadStats();
		});
		socket.on('exam-created', () => {
			loadData();
			loadStats();
		});
		socket.on('exam-deleted', () => {
			loadData();
			loadStats();
		});
		return () => socket.disconnect();
	}, [loadData, loadStats]);

	const handleActionConfirm = async inputValue => {
		const { action, exam } = modalConfig;
		setActionLoading(true);
		try {
			if (action === 'publish') {
				await TeacherSvc.safeApiCall(TeacherSvc.publishTeacherExam, exam.id);
				toast.success?.('Exam published successfully!');
			} else if (action === 'end') {
				await TeacherSvc.safeApiCall(TeacherSvc.endExamNow, exam.id);
				toast.success?.('Exam ended. Students can no longer submit.');
			} else if (action === 'cancel') {
				await TeacherSvc.safeApiCall(TeacherSvc.cancelExam, exam.id);
				toast.success?.('Exam cancelled.');
			} else if (action === 'extend') {
				const minutes = Number(inputValue);
				await TeacherSvc.safeApiCall(TeacherSvc.extendExamEnd, exam.id, { minutes });
				toast.success?.(`Exam extended by ${minutes} minutes.`);
			} else if (action === 'regenerate') {
				const res = await TeacherSvc.safeApiCall(
					TeacherSvc.regenerateExamShareCode,
					exam.id,
				);
				if (res?.searchId) {
					toast.success?.(`New Code: ${res.searchId}`);
				}
			} else if (action === 'duplicate') {
				await TeacherSvc.safeApiCall(TeacherSvc.duplicateTeacherExam, exam.id);
				toast.success?.('Exam duplicated. You can now edit the draft.');
			} else if (action === 'delete') {
				await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
				toast.success?.('Exam deleted forever.');
			}
			setModalConfig({ isOpen: false });
			await loadData();
			await loadStats();
		} catch (err) {
			toast?.error?.(err?.message || 'Action failed');
		} finally {
			setActionLoading(false);
		}
	};

	const openModal = (action, exam) => {
		const m = { isOpen: true, action, exam };
		if (action === 'publish') {
			m.title = 'Publish Exam?';
			m.message = `Are you sure you want to publish "${exam.title}"? Once published, the exam will be accessible to students based on its start time.`;
			m.actionLabel = 'Publish';
			m.actionColor = '#6366f1';
		} else if (action === 'end') {
			m.title = 'End Exam Now?';
			m.message = `This will instantly terminate "${exam.title}" and auto-submit all in-progress student exams. This cannot be undone.`;
			m.actionLabel = 'End Exam';
			m.actionColor = '#ef4444';
		} else if (action === 'cancel') {
			m.title = 'Cancel Exam?';
			m.message = `Are you sure you want to cancel "${exam.title}"?`;
			m.actionLabel = 'Cancel Exam';
			m.actionColor = '#ef4444';
		} else if (action === 'extend') {
			m.title = 'Extend Exam Time';
			m.message = `How many minutes would you like to extend "${exam.title}" by?`;
			m.actionLabel = 'Extend';
			m.actionColor = '#3b82f6';
			m.isInput = true;
		} else if (action === 'regenerate') {
			m.title = 'Regenerate Code?';
			m.message = `This will generate a new share code for "${exam.title}". The old code will no longer work.`;
			m.actionLabel = 'Regenerate';
			m.actionColor = '#f59e0b';
		} else if (action === 'duplicate') {
			m.title = 'Duplicate Exam?';
			m.message = `Create an exact copy of "${exam.title}"? The copy will be saved as a Draft.`;
			m.actionLabel = 'Duplicate';
			m.actionColor = '#6366f1';
		} else if (action === 'delete') {
			m.title = 'Delete Exam?';
			m.message = `Are you absolutely sure you want to delete "${exam.title}"? This will also delete all associated grades and submissions. This is permanent.`;
			m.actionLabel = 'Delete Forever';
			m.actionColor = '#ef4444';
		}
		setModalConfig(m);
	};

	const filteredExams = useMemo(() => {
		return exams.filter(exam => {
			const status = exam.derivedStatus || exam.status || 'draft';
			if (filter === 'all') return true;
			if (filter === 'active') return status === 'active' || status === 'live';
			if (filter === 'scheduled') return status === 'scheduled';
			if (filter === 'draft') return status === 'draft';
			if (filter === 'completed') return status === 'completed' || status === 'cancelled';
			return true;
		});
	}, [exams, filter]);

	return (
		<div style={{ maxWidth: 1200, margin: '24px auto', padding: '0 24px', minHeight: '80vh' }}>
			{/* Header */}
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'flex-start',
					marginBottom: 24,
					gap: 16,
					flexWrap: 'wrap',
				}}
			>
				<div>
					<h2
						style={{
							margin: '0 0 4px',
							fontSize: 24,
							fontWeight: 800,
							color: isDark ? '#f8fafc' : '#0f172a',
						}}
					>
						Exam Management
					</h2>
					<p style={{ margin: 0, color: isDark ? '#94a3b8' : '#64748b', fontSize: 15 }}>
						Create, schedule, and monitor your assessments in real-time.
					</p>
				</div>
				<Link
					to="/teacher/exams/create"
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 8,
						background: '#6366f1',
						color: '#fff',
						padding: '10px 20px',
						borderRadius: 10,
						fontWeight: 600,
						textDecoration: 'none',
						boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
					}}
				>
					<Plus size={18} /> New Exam
				</Link>
			</div>

			<StatsCard stats={stats} loading={statsLoading} isDark={isDark} />

			{/* Filters */}
			<div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
				<div style={{ position: 'relative', flex: '1 1 250px' }}>
					<Search
						size={18}
						style={{
							position: 'absolute',
							left: 12,
							top: '50%',
							transform: 'translateY(-50%)',
							color: isDark ? '#64748b' : '#94a3b8',
						}}
					/>
					<input
						type="text"
						placeholder="Search exams by title or code..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						style={{
							width: '100%',
							padding: '10px 16px 10px 40px',
							borderRadius: 10,
							fontSize: 15,
							border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
							background: isDark ? '#1e293b' : '#ffffff',
							color: isDark ? '#f8fafc' : '#0f172a',
							outline: 'none',
						}}
					/>
				</div>
				<select
					value={filter}
					onChange={e => setFilter(e.target.value)}
					style={{
						padding: '10px 16px',
						borderRadius: 10,
						fontSize: 15,
						cursor: 'pointer',
						border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
						background: isDark ? '#1e293b' : '#ffffff',
						color: isDark ? '#f8fafc' : '#0f172a',
					}}
				>
					<option value="all">All Exams</option>
					<option value="active">Live & Active</option>
					<option value="scheduled">Scheduled</option>
					<option value="draft">Drafts</option>
					<option value="completed">Completed</option>
				</select>
				<button
					onClick={() => {
						loadData();
						loadStats();
					}}
					disabled={loading}
					style={{
						padding: '10px 16px',
						borderRadius: 10,
						border: isDark ? '1px solid #334155' : '1px solid #cbd5e1',
						background: isDark ? '#1e293b' : '#ffffff',
						color: isDark ? '#94a3b8' : '#64748b',
						cursor: 'pointer',
					}}
				>
					{loading ? <Spinner size={18} /> : <RefreshCw size={18} />}
				</button>
			</div>

			{/* Grid */}
			{loading && filteredExams.length === 0 ? (
				<div
					style={{
						padding: '60px 0',
						textAlign: 'center',
						color: isDark ? '#64748b' : '#94a3b8',
					}}
				>
					<Spinner size={32} color="#6366f1" />
					<p style={{ marginTop: 16 }}>Loading exams...</p>
				</div>
			) : filteredExams.length === 0 ? (
				<div
					style={{
						padding: '80px 20px',
						textAlign: 'center',
						background: isDark ? '#1e293b' : '#ffffff',
						borderRadius: 16,
						border: isDark ? '1px dashed #334155' : '1px dashed #cbd5e1',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
					}}
				>
					<FileText
						size={48}
						color={isDark ? '#334155' : '#cbd5e1'}
						style={{ marginBottom: 16 }}
					/>
					<h3 style={{ margin: '0 0 8px', color: isDark ? '#f8fafc' : '#0f172a' }}>
						No exams found
					</h3>
					<p style={{ margin: '0 0 24px', color: isDark ? '#94a3b8' : '#64748b' }}>
						Create your first exam to get started.
					</p>
					<Link
						to="/teacher/exams/create"
						style={{
							background: '#6366f1',
							color: '#fff',
							padding: '10px 24px',
							borderRadius: 8,
							fontWeight: 600,
							textDecoration: 'none',
						}}
					>
						Create Exam
					</Link>
				</div>
			) : (
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
						gap: 20,
					}}
				>
					{filteredExams.map(exam => (
						<ExamCard key={exam.id} exam={exam} openModal={openModal} isDark={isDark} />
					))}
				</div>
			)}

			<ConfirmModal
				isOpen={modalConfig.isOpen}
				onClose={() => setModalConfig({ isOpen: false })}
				onConfirm={handleActionConfirm}
				config={modalConfig}
				loading={actionLoading}
				isDark={isDark}
			/>

			<style>{`
				@keyframes spin { 100% { transform: rotate(360deg); } }
				@keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
			`}</style>
		</div>
	);
}
