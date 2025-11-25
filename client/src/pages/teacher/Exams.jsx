import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../services/api.js';
import * as TeacherSvc from '../../services/teacherServices.js';

// --- Simple Status Map ---
const STATUS_LABELS = {
	active: 'Active',
	live: 'Live',
	scheduled: 'Scheduled',
	draft: 'Draft',
	completed: 'Completed',
	cancelled: 'Cancelled',
};
const STATUS_COLORS = {
	active: '#22c55e',
	live: '#ef4444',
	scheduled: '#3b82f6',
	draft: '#64748b',
	completed: '#6366f1',
	cancelled: '#ef4444',
};

// --- Exam Row (Table) ---
function ExamRow({ exam, onAction, loading }) {
	const status = exam.derivedStatus || exam.status;
	return (
		<tr style={{ background: loading ? '#f3f4f6' : '#fff', opacity: loading ? 0.5 : 1 }}>
			<td>
				<b>{exam.title}</b>
				<div style={{ fontSize: 12, color: '#64748b' }}>{exam.description}</div>
			</td>
			<td>
				<span
					style={{
						padding: '2px 10px',
						borderRadius: 12,
						background: STATUS_COLORS[status] + '22',
						color: STATUS_COLORS[status],
						fontWeight: 600,
						fontSize: 13,
					}}
				>
					{STATUS_LABELS[status] || status}
				</span>
			</td>
			<td>
				<span style={{ fontFamily: 'monospace', fontSize: 13 }}>
					{exam.searchId || '—'}
				</span>
			</td>
			<td>{exam.duration} min</td>
			<td>{exam.questionCount ?? exam.questions.length ?? 0}</td>
			<td>
				{exam.startAt}
				<br />
				{exam.endAt}
			</td>
			<td>
				<button onClick={() => onAction('view', exam)} style={simpleBtn} title="View/Edit">
					View
				</button>
				{(status === 'live' || status === 'scheduled') && (
					<button
						onClick={() => onAction('end', exam)}
						style={{ ...simpleBtn, color: '#ef4444' }}
						title="End Now"
						disabled={loading}
					>
						End
					</button>
				)}
				{status === 'draft' && (
					<button
						onClick={() => onAction('publish', exam)}
						style={{ ...simpleBtn, color: '#6366f1' }}
						title="Publish"
						disabled={loading}
					>
						Publish
					</button>
				)}
				<button
					onClick={() => onAction('delete', exam)}
					style={{ ...simpleBtn, color: '#ef4444' }}
					title="Delete"
					disabled={loading}
				>
					Delete
				</button>
			</td>
		</tr>
	);
}

// --- Main Page ---
export default function TeacherExams() {
	const [exams, setExams] = useState([]);
	const [loading, setLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('all');
	const [actionLoading, setActionLoading] = useState('');
	const navigate = useNavigate();
	const { toast } = useToast();

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
		const socket = io(API_BASE_URL, { withCredentials: true, transports: ['websocket'] });
		socket.on('exam-updated', loadData);
		socket.on('exam-created', loadData);
		socket.on('exam-deleted', loadData);
		return () => socket.disconnect();
	}, [loadData]);

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
				}
			} else if (action === 'delete') {
				if (window.confirm('Delete this exam? This cannot be undone.')) {
					await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
					toast.success?.('Exam deleted');
					await loadData();
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
				<h2 style={{ margin: 0 }}>My Exams</h2>
				<Link to="/teacher/exams/create" style={createBtn}>
					+ New Exam
				</Link>
			</div>
			<div style={toolbarRow}>
				<select
					value={filter}
					onChange={e => setFilter(e.target.value)}
					style={simpleInput}
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
				/>
				<button onClick={loadData} style={simpleBtn}>
					Refresh
				</button>
			</div>
			<div style={{ marginTop: 16 }}>
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
									Loading...
								</td>
							</tr>
						) : filteredExams.length === 0 ? (
							<tr>
								<td colSpan={7} style={{ textAlign: 'center', padding: 40 }}>
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
		</div>
	);
}

// --- Simple Styles ---
const pageWrap = {
	maxWidth: 900,
	margin: '40px auto',
	background: '#fff',
	borderRadius: 10,
	boxShadow: '0 2px 12px #0001',
	padding: 24,
};
const headerRow = {
	display: 'flex',
	justifyContent: 'space-between',
	alignItems: 'center',
	marginBottom: 16,
};
const toolbarRow = {
	display: 'flex',
	gap: 12,
	marginBottom: 16,
};
const createBtn = {
	background: '#6366f1',
	color: '#fff',
	padding: '8px 18px',
	borderRadius: 6,
	textDecoration: 'none',
	fontWeight: 600,
	fontSize: 15,
};
const simpleInput = {
	padding: '7px 12px',
	borderRadius: 6,
	border: '1px solid #e5e7eb',
	fontSize: 14,
};
const simpleBtn = {
	padding: '6px 12px',
	borderRadius: 6,
	border: 'none',
	background: '#f3f4f6',
	color: '#222',
	fontWeight: 500,
	cursor: 'pointer',
	marginRight: 6,
};
const tableStyle = {
	width: '100%',
	borderCollapse: 'collapse',
	background: '#fff',
};
