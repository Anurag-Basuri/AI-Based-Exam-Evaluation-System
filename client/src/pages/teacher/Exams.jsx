import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../services/api.js';
import * as TeacherSvc from '../../services/teacherServices.js';

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
function ExamRow({ exam, onAction, loading }) {
	const status = exam.derivedStatus || exam.status;
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		if (exam.searchId) {
			navigator.clipboard.writeText(exam.searchId);
			setCopied(true);
			setTimeout(() => setCopied(false), 1200);
		}
	};

	return (
		<tr
			style={{
				background: loading ? '#f3f4f6' : '#fff',
				opacity: loading ? 0.6 : 1,
				transition: 'background 0.2s, opacity 0.2s',
			}}
		>
			<td>
				<div style={{ fontWeight: 600, fontSize: 16 }}>{exam.title}</div>
				{exam.description && (
					<div style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
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
						background: STATUS_COLORS[status] + '22',
						color: STATUS_COLORS[status],
						fontWeight: 600,
						fontSize: 13,
						letterSpacing: 0.2,
						border: `1px solid ${STATUS_COLORS[status]}33`,
					}}
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
							color: '#2563eb',
							userSelect: 'all',
						}}
						title="Click to copy code"
						tabIndex={0}
						role="button"
						aria-label="Copy exam code"
						onClick={handleCopy}
						onKeyDown={e => (e.key === 'Enter' ? handleCopy() : undefined)}
					>
						{exam.searchId}
						{copied && (
							<span
								style={{
									position: 'absolute',
									top: -22,
									left: 0,
									background: '#f1f5f9',
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
					<span style={{ color: '#94a3b8' }}>—</span>
				)}
			</td>
			<td>{exam.duration} min</td>
			<td>{exam.questionCount ?? exam.questions.length ?? 0}</td>
			<td>
				<div style={{ fontSize: 13 }}>
					{formatDate(exam.startAt)}
					<br />
					<span style={{ color: '#64748b' }}>{formatDate(exam.endAt)}</span>
				</div>
			</td>
			<td>
				<div style={{ display: 'flex', gap: 6 }}>
					<button
						type="button"
						onClick={() => onAction('view', exam)}
						style={simpleBtn}
						title="View/Edit"
						aria-label="View or edit exam"
						disabled={loading}
					>
						View
					</button>
					{['live', 'scheduled', 'active'].includes(status) && (
						<button
							type="button"
							onClick={() => onAction('end', exam)}
							style={{ ...simpleBtn, color: '#dc2626', border: '1px solid #fee2e2' }}
							title={
								status === 'scheduled'
									? 'Cancel Exam'
									: status === 'active'
									? 'End Exam'
									: 'End Now'
							}
							aria-label={
								status === 'scheduled'
									? 'Cancel Exam'
									: status === 'active'
									? 'End Exam'
									: 'End Now'
							}
							disabled={loading}
						>
							{loading ? <Spinner size={14} /> : 'End'}
						</button>
					)}
					{status === 'draft' && (
						<button
							type="button"
							onClick={() => onAction('publish', exam)}
							style={{ ...simpleBtn, color: '#6366f1', border: '1px solid #e0e7ff' }}
							title="Publish"
							aria-label="Publish exam"
							disabled={loading}
						>
							{loading ? <Spinner size={14} /> : 'Publish'}
						</button>
					)}
					<button
						type="button"
						onClick={() => onAction('delete', exam)}
						style={{ ...simpleBtn, color: '#dc2626', border: '1px solid #fee2e2' }}
						title="Delete"
						aria-label="Delete exam"
						disabled={loading}
					>
						{loading ? <Spinner size={14} /> : 'Delete'}
					</button>
				</div>
			</td>
		</tr>
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
function StatsCard({ stats, loading }) {
	const items = [
		{ label: 'Total', value: stats?.total ?? 0, color: '#6366f1' },
		{ label: 'Draft', value: stats?.draft ?? 0, color: '#64748b' },
		{ label: 'Scheduled', value: stats?.scheduled ?? 0, color: '#2563eb' },
		{ label: 'Live', value: stats?.live ?? 0, color: '#16a34a' },
		{ label: 'Completed', value: stats?.completed ?? 0, color: '#6366f1' },
	];
	return (
		<div style={statsWrap}>
			{items.map(item => (
				<div key={item.label} style={{ ...statBox, borderColor: item.color }}>
					<div style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }}>
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
	const [actionLoading, setActionLoading] = useState('');
	const navigate = useNavigate();
	const { toast } = useToast();

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

	const handleAction = async (action, exam) => {
		if (!exam) return;
		setActionLoading(exam.id + ':' + action);
		try {
			if (action === 'view') {
				navigate(`/teacher/exams/edit/${exam.id}`);
			} else if (action === 'publish') {
				if (window.confirm('Publish this exam?')) {
					await TeacherSvc.safeApiCall(TeacherSvc.publishTeacherExam, exam.id);
					toast.success?.('Exam published');
					await loadData();
					await loadStats();
				}
			} else if (action === 'end') {
				if (
					window.confirm(
						exam.derivedStatus === 'scheduled'
							? 'Cancel this scheduled exam?'
							: 'End this exam now?',
					)
				) {
					await TeacherSvc.endExamNow(exam.id);
					toast.success?.('Exam ended');
					await loadData();
					await loadStats();
				}
			} else if (action === 'delete') {
				if (window.confirm('Delete this exam? This cannot be undone.')) {
					await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
					toast.success?.('Exam deleted');
					await loadData();
					await loadStats();
				}
			}
		} catch (err) {
			toast?.error?.(err?.message || 'Action failed');
		} finally {
			setActionLoading('');
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
		<div style={pageWrap}>
			<div style={headerRow}>
				<h2 style={{ margin: 0, fontWeight: 700, fontSize: 24 }}>My Exams</h2>
				<Link to="/teacher/exams/create" style={createBtn} aria-label="Create new exam">
					+ New Exam
				</Link>
			</div>
			<StatsCard stats={stats} loading={statsLoading} />
			<div style={toolbarRow}>
				<select
					value={filter}
					onChange={e => setFilter(e.target.value)}
					style={simpleInput}
					aria-label="Filter exams by status"
				>
					<option value="all">All</option>
					<option value="active">Active</option>
					<option value="scheduled">Scheduled</option>
					<option value="draft">Draft</option>
					<option value="completed">Completed</option>
				</select>
				<input
					type="text"
					placeholder="Search exams..."
					value={search}
					onChange={e => setSearch(e.target.value)}
					style={simpleInput}
					aria-label="Search exams"
				/>
				<button
					type="button"
					onClick={() => {
						loadData();
						loadStats();
					}}
					style={simpleBtn}
					aria-label="Refresh exams"
					disabled={loading}
				>
					{loading ? <Spinner size={16} /> : 'Refresh'}
				</button>
			</div>
			<div style={{ marginTop: 16, overflowX: 'auto' }}>
				<table style={tableStyle}>
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
									style={{ textAlign: 'center', padding: 40, color: '#64748b' }}
								>
									No exams found.
								</td>
							</tr>
						) : (
							filteredExams.map(exam => (
								<ExamRow
									key={exam.id}
									exam={exam}
									onAction={handleAction}
									loading={actionLoading.startsWith(exam.id)}
								/>
							))
						)}
					</tbody>
				</table>
			</div>
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
                    background: #f1f5f9;
                    font-weight: 600;
                    font-size: 14px;
                    border-bottom: 1px solid #e5e7eb;
                }
                table tbody tr:hover {
                    background: #f9fafb;
                }
                `}
			</style>
		</div>
	);
}

// --- Styles ---
const pageWrap = {
	maxWidth: 1000,
	margin: '40px auto',
	background: '#fff',
	borderRadius: 12,
	boxShadow: '0 2px 12px #0001',
	padding: 28,
};
const headerRow = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: 18,
};
const statsWrap = {
	display: 'flex',
	gap: 18,
	marginBottom: 18,
	flexWrap: 'wrap',
};
const statBox = {
	flex: '1 1 120px',
	minWidth: 100,
	background: '#f8fafc',
	border: '2px solid #e5e7eb',
	borderRadius: 10,
	padding: '12px 18px',
	textAlign: 'center',
	boxShadow: '0 1px 4px #0001',
};
const toolbarRow = {
	display: 'flex',
	gap: 12,
	marginBottom: 18,
};
const createBtn = {
	background: '#6366f1',
	color: '#fff',
	padding: '9px 22px',
	borderRadius: 7,
	textDecoration: 'none',
	fontWeight: 700,
	fontSize: 16,
	boxShadow: '0 1px 4px #6366f133',
	transition: 'background 0.2s',
	border: 'none',
};
const simpleInput = {
	padding: '8px 13px',
	borderRadius: 7,
	border: '1px solid #e5e7eb',
	fontSize: 15,
	background: '#f8fafc',
};
const simpleBtn = {
	padding: '7px 14px',
	borderRadius: 7,
	border: 'none',
	background: '#f3f4f6',
	color: '#222',
	fontWeight: 500,
	cursor: 'pointer',
	marginRight: 0,
	fontSize: 14,
	transition: 'background 0.2s, color 0.2s',
	display: 'inline-flex',
	alignItems: 'center',
	gap: 4,
};
const tableStyle = {
	width: '100%',
	borderCollapse: 'collapse',
	background: '#fff',
	minWidth: 800,
};
