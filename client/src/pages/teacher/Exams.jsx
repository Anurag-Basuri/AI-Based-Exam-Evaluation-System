import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
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
} from 'lucide-react';

// --- Status Map ---
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
	live: '#dc2626',
	scheduled: '#2563eb',
	draft: '#64748b',
	completed: '#6366f1',
	cancelled: '#dc2626',
};

// --- Spinner ---
function Spinner({ size = 20 }) {
	return (
		<span
			style={{
				display: 'inline-block',
				width: size,
				height: size,
				border: '2px solid #cbd5e1',
				borderTop: '2px solid #6366f1',
				borderRadius: '50%',
				animation: 'spin 1s linear infinite',
				verticalAlign: 'middle',
			}}
			aria-label="Loading"
		/>
	);
}

// --- Exam Row ---
function ExamRow({ exam, onAction, loadingAction, onCodeUpdate, isDark }) {
	const status = exam.derivedStatus || exam.status;
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (exam.searchId) {
			navigator.clipboard.writeText(exam.searchId);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		}
	};

	const isDraft = status === 'draft';
	const isScheduled = status === 'scheduled';
	const isLive = status === 'live';

	return (
		<tr
			style={{
				background: loadingAction
					? isDark
						? '#23272e'
						: '#f3f4f6'
					: isDark
					? '#181a20'
					: '#fff',
				opacity: loadingAction ? 0.6 : 1,
				transition: 'background 0.2s, opacity 0.2s',
				cursor: 'pointer',
			}}
			tabIndex={0}
			aria-label={`Exam: ${exam.title}`}
			onDoubleClick={() => onAction('view', exam)}
		>
			<td>
				<div
					style={{
						fontWeight: 600,
						fontSize: 16,
						display: 'flex',
						alignItems: 'center',
						gap: 6,
						color: isDark ? '#e0e7ef' : '#222',
					}}
				>
					<Eye size={18} color="#6366f1" style={{ opacity: 0.7 }} title="View/Edit" />
					{exam.title}
				</div>
				{exam.description && (
					<div
						style={{
							fontSize: 13,
							color: isDark ? '#a0aec0' : '#64748b',
							marginTop: 2,
						}}
					>
						{exam.description}
					</div>
				)}
			</td>
			<td>
				<span
					style={{
						display: 'inline-block',
						padding: '2px 12px',
						borderRadius: 12,
						background: STATUS_COLORS[status] + (isDark ? '33' : '22'),
						color: STATUS_COLORS[status],
						fontWeight: 600,
						fontSize: 13,
						letterSpacing: 0.2,
						border: `1px solid ${STATUS_COLORS[status]}33`,
					}}
					title={`Status: ${STATUS_LABELS[status] || status}`}
					aria-label={`Status: ${STATUS_LABELS[status] || status}`}
				>
					{STATUS_LABELS[status] || status}
				</span>
			</td>
			<td>
				{exam.searchId ? (
					<span
						style={{
							fontFamily: 'monospace',
							fontSize: 14,
							cursor: 'pointer',
							position: 'relative',
							color: isDark ? '#60a5fa' : '#2563eb',
							userSelect: 'all',
							display: 'inline-flex',
							alignItems: 'center',
							gap: 4,
						}}
						title="Click to copy code"
						tabIndex={0}
						role="button"
						aria-label="Copy exam code"
						onClick={handleCopy}
						onKeyDown={e => (e.key === 'Enter' ? handleCopy() : undefined)}
					>
						<Clipboard size={15} style={{ opacity: 0.7 }} />
						{exam.searchId}
						{copied && (
							<span
								style={{
									position: 'absolute',
									top: -22,
									left: 0,
									background: isDark ? '#23272e' : '#f1f5f9',
									color: '#16a34a',
									fontSize: 12,
									padding: '2px 8px',
									borderRadius: 6,
									boxShadow: '0 1px 4px #0001',
									whiteSpace: 'nowrap',
									zIndex: 10,
								}}
							>
								Copied!
							</span>
						)}
					</span>
				) : (
					<span style={{ color: isDark ? '#6b7280' : '#94a3b8' }}>—</span>
				)}
			</td>
			<td>{exam.duration} min</td>
			<td>{exam.questionCount ?? exam.questions.length ?? 0}</td>
			<td>
				<div style={{ fontSize: 13, color: isDark ? '#a0aec0' : undefined }}>
					{formatDate(exam.startAt)}
					<br />
					<span style={{ color: isDark ? '#718096' : '#64748b' }}>
						{formatDate(exam.endAt)}
					</span>
				</div>
			</td>
			<td>
				<div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
					<Tooltip label="View or edit exam">
						<button
							type="button"
							onClick={() => onAction('view', exam)}
							style={iconBtn(isDark)}
							aria-label="View or edit exam"
							disabled={!!loadingAction}
						>
							<Eye /> View
						</button>
					</Tooltip>
					{isDraft && (
						<Tooltip label="Publish exam">
							<button
								type="button"
								onClick={() => onAction('publish', exam)}
								style={{
									...iconBtn(isDark),
									color: '#6366f1',
									border: isDark ? '1px solid #3730a3' : '1px solid #e0e7ff',
									background: isDark ? '#232046' : '#f5f7ff',
								}}
								aria-label="Publish exam"
								disabled={!!loadingAction}
							>
								{loadingAction === 'publish' ? (
									<Spinner size={14} />
								) : (
									<Rocket size={15} />
								)}{' '}
								Publish
							</button>
						</Tooltip>
					)}
					{(isScheduled || isLive) && (
						<Tooltip label={isLive ? 'Cancel (End) Live Exam' : 'Cancel Exam'}>
							<button
								type="button"
								onClick={() => onAction('cancel', exam)}
								style={{
									...iconBtn(isDark),
									color: '#dc2626',
									border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2',
									background: isDark ? '#2d1a1a' : '#fff0f0',
								}}
								aria-label={isLive ? 'Cancel (End) Live Exam' : 'Cancel Exam'}
								disabled={!!loadingAction}
							>
								{loadingAction === 'cancel' ? (
									<Spinner size={14} />
								) : (
									<StopCircle size={15} />
								)}{' '}
								Cancel
							</button>
						</Tooltip>
					)}
					{isLive && (
						<Tooltip label="End exam (students can no longer submit)">
							<button
								type="button"
								onClick={() => onAction('end', exam)}
								style={{
									...iconBtn(isDark),
									color: '#dc2626',
									border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2',
									background: isDark ? '#2d1a1a' : '#fff0f0',
								}}
								aria-label="End Exam"
								disabled={!!loadingAction}
							>
								{loadingAction === 'end' ? (
									<Spinner size={14} />
								) : (
									<StopCircle size={15} />
								)}{' '}
								End
							</button>
						</Tooltip>
					)}
					{(isLive || isScheduled) && (
						<Tooltip label="Extend exam end time">
							<button
								type="button"
								onClick={() => onAction('extend', exam)}
								style={{
									...iconBtn(isDark),
									color: '#2563eb',
									border: isDark ? '1px solid #1e40af' : '1px solid #dbeafe',
									background: isDark ? '#1e293b' : '#f0f7ff',
								}}
								aria-label="Extend End Time"
								disabled={!!loadingAction}
							>
								{loadingAction === 'extend' ? (
									<Spinner size={14} />
								) : (
									<RefreshCw size={15} />
								)}{' '}
								Extend
							</button>
						</Tooltip>
					)}
					{(isDraft || isScheduled) && (
						<Tooltip label="Regenerate exam code">
							<button
								type="button"
								onClick={async () => {
									const newCode = await onAction('regenerate', exam);
									if (newCode && onCodeUpdate) onCodeUpdate(exam.id, newCode);
								}}
								style={{
									...iconBtn(isDark),
									color: '#6366f1',
									border: isDark ? '1px solid #3730a3' : '1px solid #e0e7ff',
									background: isDark ? '#232046' : '#f5f7ff',
								}}
								aria-label="Regenerate Code"
								disabled={!!loadingAction}
							>
								{loadingAction === 'regenerate' ? (
									<Spinner size={14} />
								) : (
									<Clipboard size={15} />
								)}{' '}
								Regenerate
							</button>
						</Tooltip>
					)}
					<Tooltip label="Duplicate exam">
						<button
							type="button"
							onClick={() => onAction('duplicate', exam)}
							style={{
								...iconBtn(isDark),
								color: isDark ? '#a3a3a3' : '#64748b',
								border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
								background: isDark ? '#23272e' : '#f8fafc',
							}}
							aria-label="Duplicate Exam"
							disabled={!!loadingAction}
						>
							{loadingAction === 'duplicate' ? (
								<Spinner size={14} />
							) : (
								<CopyIcon size={15} />
							)}{' '}
							Duplicate
						</button>
					</Tooltip>
					{isLive || isScheduled ? (
						<Tooltip label="Cannot delete live/scheduled exam. Cancel it first.">
							<button
								type="button"
								style={{
									...iconBtn(isDark),
									color: '#dc2626',
									border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2',
									background: isDark ? '#2d1a1a' : '#fff0f0',
									opacity: 0.5,
									cursor: 'not-allowed',
								}}
								aria-label="Delete exam (disabled)"
								disabled
							>
								<Trash2 size={15} /> Delete
							</button>
						</Tooltip>
					) : (
						<Tooltip label="Delete exam">
							<button
								type="button"
								onClick={() => onAction('delete', exam)}
								style={{
									...iconBtn(isDark),
									color: '#dc2626',
									border: isDark ? '1px solid #7f1d1d' : '1px solid #fee2e2',
									background: isDark ? '#2d1a1a' : '#fff0f0',
								}}
								aria-label="Delete exam"
								disabled={!!loadingAction}
							>
								{loadingAction === 'delete' ? (
									<Spinner size={14} />
								) : (
									<Trash2 size={15} />
								)}{' '}
								Delete
							</button>
						</Tooltip>
					)}
				</div>
			</td>
		</tr>
	);
}

// --- Tooltip ---
function Tooltip({ label, children }) {
	const [show, setShow] = useState(false);
	return (
		<span
			style={{ position: 'relative', display: 'inline-block' }}
			onMouseEnter={() => setShow(true)}
			onMouseLeave={() => setShow(false)}
			onFocus={() => setShow(true)}
			onBlur={() => setShow(false)}
		>
			{children}
			{show && (
				<span
					style={{
						position: 'absolute',
						bottom: '120%',
						left: '50%',
						transform: 'translateX(-50%)',
						background: '#222',
						color: '#fff',
						padding: '4px 10px',
						borderRadius: 6,
						fontSize: 13,
						whiteSpace: 'nowrap',
						boxShadow: '0 2px 8px #0002',
						zIndex: 100,
					}}
					role="tooltip"
				>
					{label}
				</span>
			)}
		</span>
	);
}

// --- Date Formatter ---
function formatDate(dateVal) {
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
}

// --- Stats Card ---
function StatsCard({ stats, loading, isDark }) {
	const items = [
		{ label: 'Total', value: stats?.total ?? 0, color: '#6366f1', icon: <CheckCircle2 /> },
		{ label: 'Draft', value: stats?.draft ?? 0, color: '#64748b', icon: <Rocket /> },
		{ label: 'Scheduled', value: stats?.scheduled ?? 0, color: '#2563eb', icon: <RefreshCw /> },
		{ label: 'Live', value: stats?.live ?? 0, color: '#16a34a', icon: <Eye /> },
		{
			label: 'Completed',
			value: stats?.completed ?? 0,
			color: '#6366f1',
			icon: <CheckCircle2 />,
		},
	];
	return (
		<div style={statsWrap}>
			{items.map(item => (
				<div
					key={item.label}
					style={{
						...statBox(isDark),
						borderColor: item.color,
						boxShadow: isDark ? '0 2px 8px #0008' : '0 2px 8px #0001',
						transition: 'box-shadow 0.2s, transform 0.2s',
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'center',
						justifyContent: 'center',
						gap: 4,
						background: isDark ? '#23272e' : '#f8fafc',
					}}
					title={item.label}
				>
					<div style={{ fontSize: 18, color: item.color, marginBottom: 2 }}>
						{item.icon}
					</div>
					<div
						style={{
							fontSize: 13,
							color: isDark ? '#a0aec0' : '#64748b',
							marginBottom: 2,
						}}
					>
						{item.label}
					</div>
					<div style={{ fontWeight: 700, fontSize: 22, color: item.color }}>
						{loading ? <Spinner size={18} /> : item.value}
					</div>
				</div>
			))}
		</div>
	);
}

// --- Main Page ---
export default function TeacherExams() {
	const [exams, setExams] = useState([]);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('all');
	const [actionLoading, setActionLoading] = useState({});
	const navigate = useNavigate();
	const { toast } = useToast();

	// --- Detect dark mode (using Tailwind or custom class on body) ---
	const [isDark, setIsDark] = useState(
		() =>
			document.documentElement.classList.contains('dark') ||
			document.body.classList.contains('dark') ||
			window.matchMedia('(prefers-color-scheme: dark)').matches,
	);
	useEffect(() => {
		const listener = () => {
			setIsDark(
				document.documentElement.classList.contains('dark') ||
					document.body.classList.contains('dark') ||
					window.matchMedia('(prefers-color-scheme: dark)').matches,
			);
		};
		window.addEventListener('storage', listener);
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', listener);
		return () => {
			window.removeEventListener('storage', listener);
			window
				.matchMedia('(prefers-color-scheme: dark)')
				.removeEventListener('change', listener);
		};
	}, []);

	const loadStats = useCallback(async () => {
		setStatsLoading(true);
		try {
			const res = await TeacherSvc.getExamStats();
			setStats(res || {});
		} catch (err) {
			toast?.error?.(err?.message || 'Failed to load stats');
		} finally {
			setStatsLoading(false);
		}
	}, [toast]);

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

	// Update code in UI after regeneration
	const handleCodeUpdate = (examId, newCode) => {
		setExams(prev => prev.map(e => (e.id === examId ? { ...e, searchId: newCode } : e)));
	};

	const handleAction = async (action, exam) => {
		if (!exam) return;
		setActionLoading(prev => ({ ...prev, [exam.id]: action }));
		try {
			if (action === 'view') {
				navigate(`/teacher/exams/edit/${exam.id}`);
			} else if (action === 'publish') {
				if (window.confirm('Publish this exam?')) {
					await TeacherSvc.safeApiCall(TeacherSvc.publishTeacherExam, exam.id);
					toast.success?.('Exam published');
				}
			} else if (action === 'end') {
				if (window.confirm('End this exam now?')) {
					await TeacherSvc.safeApiCall(TeacherSvc.endExamNow, exam.id);
					toast.success?.('Exam ended');
				}
			} else if (action === 'cancel') {
				const msg =
					exam.derivedStatus === 'live'
						? 'Cancel (end) this live exam? This will immediately stop the exam for all students.'
						: 'Cancel this scheduled exam?';
				if (window.confirm(msg)) {
					await TeacherSvc.safeApiCall(TeacherSvc.cancelExam, exam.id);
					toast.success?.('Exam cancelled');
				}
			} else if (action === 'extend') {
				const min = prompt('Extend by how many minutes? (e.g. 10)');
				const minutes = Number(min);
				if (minutes > 0) {
					await TeacherSvc.safeApiCall(TeacherSvc.extendExamEnd, exam.id, { minutes });
					toast.success?.('Exam end time extended');
				} else {
					toast.error?.('Please enter a valid number of minutes.');
				}
			} else if (action === 'regenerate') {
				if (window.confirm('Regenerate exam code? Old code will be invalid.')) {
					const res = await TeacherSvc.safeApiCall(
						TeacherSvc.regenerateExamShareCode,
						exam.id,
					);
					if (res && res.searchId) {
						toast.success?.('Exam code regenerated: ' + res.searchId);
						await loadData(); // Refresh after regeneration
						await loadStats();
						return res.searchId;
					} else {
						toast.error?.('Failed to regenerate code.');
					}
				}
			} else if (action === 'duplicate') {
				if (window.confirm('Duplicate this exam?')) {
					await TeacherSvc.safeApiCall(TeacherSvc.duplicateTeacherExam, exam.id);
					toast.success?.('Exam duplicated');
				}
			} else if (action === 'delete') {
				if (exam.derivedStatus === 'live' || exam.derivedStatus === 'scheduled') {
					toast.error?.(
						'Live or scheduled exams cannot be deleted. Please cancel them first.',
					);
				} else if (window.confirm('Delete this exam? This cannot be undone.')) {
					await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
					toast.success?.('Exam deleted');
				}
			} else {
				toast.error?.('Unknown action');
			}
			await loadData();
			await loadStats();
		} catch (err) {
			toast?.error?.(err?.message || 'Action failed');
		} finally {
			setActionLoading(prev => ({ ...prev, [exam.id]: '' }));
		}
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
		<div style={pageWrap(isDark)}>
			<div style={headerRow}>
				<div>
					<h2
						style={{
							margin: 0,
							fontWeight: 700,
							fontSize: 24,
							display: 'flex',
							alignItems: 'center',
							gap: 10,
							color: isDark ? '#e0e7ef' : undefined,
						}}
					>
						<Eye style={{ color: '#6366f1', fontSize: 22 }} />
						My Exams
					</h2>
					<div
						style={{
							color: isDark ? '#a0aec0' : '#64748b',
							fontSize: 15,
							marginTop: 2,
						}}
					>
						Manage, schedule, and monitor your exams here.
					</div>
				</div>
				<Link
					to="/teacher/exams/create"
					style={createBtn(isDark)}
					aria-label="Create new exam"
				>
					<Plus style={{ marginRight: 7, fontSize: 15 }} />
					New Exam
				</Link>
			</div>
			<StatsCard stats={stats} loading={statsLoading} isDark={isDark} />
			<div style={toolbarRow}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
					<select
						value={filter}
						onChange={e => setFilter(e.target.value)}
						style={simpleInput(isDark)}
						aria-label="Filter exams by status"
					>
						<option value="all">All</option>
						<option value="active">Active</option>
						<option value="scheduled">Scheduled</option>
						<option value="draft">Draft</option>
						<option value="completed">Completed</option>
					</select>
					<div style={{ position: 'relative', flex: 1 }}>
						<Search
							style={{
								position: 'absolute',
								left: 10,
								top: 10,
								color: isDark ? '#64748b' : '#94a3b8',
								fontSize: 15,
							}}
						/>
						<input
							type="text"
							placeholder="Search exams..."
							value={search}
							onChange={e => setSearch(e.target.value)}
							style={{ ...simpleInput(isDark), paddingLeft: 32, width: '100%' }}
							aria-label="Search exams"
						/>
					</div>
				</div>
				<button
					type="button"
					onClick={() => {
						loadData();
						loadStats();
					}}
					style={refreshBtn(isDark)}
					aria-label="Refresh exams"
					disabled={loading}
					title="Refresh"
				>
					{loading ? <Spinner size={16} /> : <RefreshCw />}
				</button>
			</div>
			<div style={{ marginTop: 16, overflowX: 'auto' }}>
				<table style={tableStyle(isDark)}>
					<thead>
						<tr>
							<th>Title</th>
							<th>Status</th>
							<th>Code</th>
							<th>Duration</th>
							<th>Questions</th>
							<th>Dates</th>
							<th>Actions</th>
						</tr>
					</thead>
					<tbody>
						{loading ? (
							<tr>
								<td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
									<Spinner size={28} />
								</td>
							</tr>
						) : filteredExams.length === 0 ? (
							<tr>
								<td
									colSpan={7}
									style={{
										textAlign: 'center',
										padding: 40,
										color: isDark ? '#a0aec0' : '#64748b',
										fontSize: 17,
										lineHeight: 1.6,
									}}
								>
									<img
										src="https://cdn.jsdelivr.net/gh/edent/SuperTinyIcons/images/svg/clipboard.svg"
										alt="No exams"
										style={{ width: 48, opacity: 0.25, marginBottom: 12 }}
									/>
									<br />
									No exams found.
									<br />
									<span
										style={{
											fontSize: 14,
											color: isDark ? '#64748b' : '#94a3b8',
										}}
									>
										Click <b>New Exam</b> to create your first exam.
									</span>
								</td>
							</tr>
						) : (
							filteredExams.map(exam => (
								<ExamRow
									key={exam.id}
									exam={exam}
									onAction={handleAction}
									loadingAction={actionLoading[exam.id]}
									onCodeUpdate={handleCodeUpdate}
									isDark={isDark}
								/>
							))
						)}
					</tbody>
				</table>
			</div>
			<Link
				to="/teacher/exams/create"
				style={fabBtn(isDark)}
				aria-label="Create new exam"
				title="Create new exam"
				className="fab"
			>
				<Plus />
			</Link>
			<style>
				{`
                @keyframes spin {
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                }
                table th, table td {
                    padding: 10px 8px;
                    text-align: left;
                    vertical-align: middle;
                }
                table thead th {
                    background: var(--thead-bg, #f1f5f9);
                    font-weight: 600;
                    font-size: 14px;
                    border-bottom: 1px solid var(--thead-border, #e5e7eb);
                    color: var(--thead-color, #222);
                }
                table tbody tr {
                    transition: background 0.18s, box-shadow 0.18s;
                }
                table tbody tr:hover, table tbody tr:focus {
                    background: var(--row-hover, #f3f6fd);
                    box-shadow: 0 2px 8px #6366f122;
                    outline: none;
                }
                .fab {
                    display: none;
                }
                @media (max-width: 700px) {
                    .fab {
                        display: flex !important;
                    }
                }
                `}
			</style>
			{/* Dynamic style for dark mode */}
			<style>
				{isDark
					? `
                    :root {
                        --thead-bg: #23272e;
                        --thead-border: #2d3748;
                        --thead-color: #e0e7ef;
                        --row-hover: #23272e;
                    }
                    body {
                        background: #181a20;
                        color: #e0e7ef;
                    }
                `
					: `
                    :root {
                        --thead-bg: #f1f5f9;
                        --thead-border: #e5e7eb;
                        --thead-color: #222;
                        --row-hover: #f3f6fd;
                    }
                `}
			</style>
		</div>
	);
}

// --- Styles ---
const pageWrap = isDark => ({
	maxWidth: 1100,
	margin: '40px auto',
	background: isDark ? '#181a20' : '#fff',
	borderRadius: 14,
	boxShadow: isDark ? '0 2px 16px #0008' : '0 2px 16px #0001',
	padding: 28,
});
const headerRow = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'flex-end',
	marginBottom: 18,
	gap: 16,
};
const statsWrap = {
	display: 'flex',
	gap: 18,
	marginBottom: 18,
	flexWrap: 'wrap',
};
const statBox = isDark => ({
	flex: '1 1 120px',
	minWidth: 120,
	background: isDark ? '#23272e' : '#f8fafc',
	border: '2px solid #e5e7eb',
	borderRadius: 12,
	padding: '14px 18px',
	textAlign: 'center',
	boxShadow: isDark ? '0 1px 4px #0008' : '0 1px 4px #0001',
});
const toolbarRow = {
	display: 'flex',
	gap: 12,
	marginBottom: 18,
	alignItems: 'center',
};
const createBtn = isDark => ({
	background: '#6366f1',
	color: '#fff',
	padding: '10px 26px',
	borderRadius: 8,
	textDecoration: 'none',
	fontWeight: 700,
	fontSize: 16,
	boxShadow: isDark ? '0 1px 4px #6366f188' : '0 1px 4px #6366f133',
	transition: 'background 0.2s, box-shadow 0.2s',
	border: 'none',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
});
const simpleInput = isDark => ({
	padding: '9px 13px',
	borderRadius: 7,
	border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
	fontSize: 15,
	background: isDark ? '#23272e' : '#f8fafc',
	color: isDark ? '#e0e7ef' : '#222',
	outline: 'none',
});
const iconBtn = isDark => ({
	padding: '7px 14px',
	borderRadius: 7,
	border: 'none',
	background: isDark ? '#23272e' : '#f3f4f6',
	color: isDark ? '#e0e7ef' : '#222',
	fontWeight: 500,
	cursor: 'pointer',
	marginRight: 0,
	fontSize: 14,
	transition: 'background 0.2s, color 0.2s',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 6,
});
const refreshBtn = isDark => ({
	...iconBtn(isDark),
	padding: '7px 12px',
	fontSize: 16,
	background: isDark ? '#23272e' : '#f3f4f6',
	color: '#6366f1',
	border: isDark ? '1px solid #3730a3' : '1px solid #e0e7ff',
});
const fabBtn = isDark => ({
	position: 'fixed',
	bottom: 28,
	right: 28,
	width: 52,
	height: 52,
	borderRadius: '50%',
	background: '#6366f1',
	color: '#fff',
	display: 'none',
	alignItems: 'center',
	justifyContent: 'center',
	fontSize: 26,
	boxShadow: isDark ? '0 4px 16px #6366f188' : '0 4px 16px #6366f133',
	zIndex: 100,
	border: 'none',
});
const tableStyle = isDark => ({
	width: '100%',
	borderCollapse: 'collapse',
	background: isDark ? '#181a20' : '#fff',
	minWidth: 800,
});
