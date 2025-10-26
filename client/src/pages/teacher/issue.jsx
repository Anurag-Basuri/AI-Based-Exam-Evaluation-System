import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useToast } from '../../components/ui/Toaster.jsx';
import {
	safeApiCall,
	getTeacherIssues,
	updateTeacherIssueStatus,
	resolveTeacherIssue,
	getTeacherIssueById,
	normalizeIssue,
} from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';

// --- UI Enhancements ---
const statusStyles = {
	open: {
		label: 'Open',
		icon: '⚪',
		color: 'var(--warning-text)',
		bg: 'var(--warning-bg)',
	},
	'in-progress': {
		label: 'In Progress',
		icon: '🟡',
		color: 'var(--info-text)',
		bg: 'var(--info-bg)',
	},
	resolved: {
		label: 'Resolved',
		icon: '🟢',
		color: 'var(--success-text)',
		bg: 'var(--success-bg)',
	},
};

const activityIcons = {
	created: '📝',
	assigned: '👤',
	resolved: '✅',
	'status-changed': '🔄',
};

// --- Components ---

const IssueDetailPanel = ({ issueId, onClose, onUpdate }) => {
	const [issue, setIssue] = useState(null);
	const [loading, setLoading] = useState(true);
	const [reply, setReply] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const { toast } = useToast();

	useEffect(() => {
		if (!issueId) return;
		setLoading(true);
		safeApiCall(getTeacherIssueById, issueId)
			.then(data => setIssue(data))
			.catch(err => toast.error('Failed to load issue details', { description: err.message }))
			.finally(() => setLoading(false));
	}, [issueId, toast]);

	const handleResolve = async e => {
		e.preventDefault();
		if (!reply.trim()) return toast.error('Reply cannot be empty.');
		setIsSaving(true);
		try {
			const updated = await safeApiCall(resolveTeacherIssue, issueId, reply); // Use issueId prop
			onUpdate(updated);
			toast.success('Issue has been resolved!');
			onClose();
		} catch (err) {
			toast.error('Failed to resolve', { description: err.message });
		} finally {
			setIsSaving(false);
		}
	};

	if (!issueId) return null;

	return (
		<div style={styles.detailPanel}>
			<button onClick={onClose} style={styles.modalCloseButton}>
				&times;
			</button>
			{loading && <div style={styles.detailLoading}>Loading details...</div>}
			{!loading && issue && (
				<>
					<h3 style={{ marginTop: 0 }}>{issue.examTitle}</h3>
					<div style={styles.detailMeta}>
						<span>
							<strong>Student:</strong> {issue.studentName}
						</span>
						<span>
							<strong>Status:</strong> {issue.status}
						</span>
						{issue.assignedTo && (
							<span>
								<strong>Assigned To:</strong> {issue.assignedTo}
							</span>
						)}
					</div>
					<div style={styles.detailBox}>
						<strong>Description:</strong> {issue.description}
					</div>

					{issue.submission?.id && (
						<Link
							to={`/teacher/grade/${issue.submission.id}`}
							style={styles.linkButton}
						>
							View Submission
						</Link>
					)}

					{issue.status !== 'resolved' && (
						<form onSubmit={handleResolve} style={{ marginTop: 24 }}>
							<h4>Resolve Issue</h4>
							<textarea
								value={reply}
								onChange={e => setReply(e.target.value)}
								placeholder="Type your reply to the student..."
								rows={4}
								style={styles.textarea}
								required
							/>
							<div
								style={{
									display: 'flex',
									justifyContent: 'flex-end',
									marginTop: 10,
								}}
							>
								<button
									type="submit"
									disabled={isSaving}
									style={styles.buttonPrimary}
								>
									{isSaving ? 'Saving...' : 'Save & Resolve'}
								</button>
							</div>
						</form>
					)}

					{issue.reply && (
						<div style={{ marginTop: 24 }}>
							<h4>Resolution Reply</h4>
							<div style={styles.detailBox}>{issue.reply}</div>
						</div>
					)}

					<div style={{ marginTop: 24 }}>
						<h4>Activity Log</h4>
						<ul style={styles.activityLog}>
							{(issue.activityLog || []).map((log, i) => (
								<li key={i}>
									<span style={styles.activityIcon}>
										{activityIcons[log.action] || '•'}
									</span>
									<div style={styles.activityText}>
										<strong>{log.user?.fullname || 'System'}</strong>:{' '}
										{log.details}
										<span style={styles.activityTime}>
											{new Date(log.createdAt).toLocaleString()}
										</span>
									</div>
								</li>
							))}
						</ul>
					</div>
				</>
			)}
		</div>
	);
};

const IssueRow = ({ issue, onUpdate, onSelect, isSelected, currentUser }) => {
	const config = statusStyles[issue.status] || statusStyles.open;
	const { toast } = useToast();

	const handleStatusChange = async newStatus => {
		try {
			const updatedIssue = await safeApiCall(updateTeacherIssueStatus, issue.id, newStatus);
			onUpdate(updatedIssue);
			toast.success(`Issue status updated to "${newStatus}"`);
		} catch (err) {
			toast.error('Failed to update status', { description: err.message });
		}
	};

	return (
		<tr
			style={{
				...styles.tableRow,
				background: isSelected ? 'var(--primary-bg)' : 'transparent',
			}}
			onClick={() => onSelect(issue)}
		>
			<td style={styles.tableCell}>{issue.studentName || 'N/A'}</td>
			<td style={styles.tableCell}>{issue.examTitle}</td>
			<td style={styles.tableCell}>
				<div style={{ ...styles.statusPill, color: config.color, background: config.bg }}>
					{config.icon} {config.label}
				</div>
			</td>
			<td style={styles.tableCell}>{issue.assignedTo || 'Unassigned'}</td>
			<td style={styles.tableCell}>{issue.createdAt}</td>
			<td style={{ ...styles.tableCell, textAlign: 'right' }}>
				{issue.status === 'open' && (
					<button
						onClick={e => {
							e.stopPropagation();
							handleStatusChange('in-progress');
						}}
						style={styles.actionButton}
					>
						Claim
					</button>
				)}
				{issue.status === 'in-progress' && issue.assignedToId === currentUser?.id && (
					<button
						onClick={e => {
							e.stopPropagation();
							handleStatusChange('open');
						}}
						style={{ ...styles.actionButton, borderColor: 'var(--warning-border)' }}
					>
						Unassign
					</button>
				)}
			</td>
		</tr>
	);
};

const TeacherIssues = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [issues, setIssues] = useState([]);
	const [filter, setFilter] = useState('my-issues');
	const [searchQuery, setSearchQuery] = useState('');
	const [selectedIssueId, setSelectedIssueId] = useState(null);
	const { toast } = useToast();
	const { user } = useAuth();

	const loadIssues = useCallback(async () => {
		setLoading(true);
		try {
			const data = await safeApiCall(getTeacherIssues);
			setIssues(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e.message || 'Failed to load issues');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadIssues();
		if (!user?.id) return; // Don't connect socket if user is not loaded

		const socket = io(API_BASE_URL, {
			withCredentials: true,
			query: { role: 'teacher', userId: user.id },
		});

		socket.on('connect_error', err =>
			toast.error('Real-time updates unavailable', { description: err?.message || '' }),
		);

		socket.on('new-issue', newIssueData => {
			const normalized = normalizeIssue(newIssueData);
			setIssues(prev =>
				prev.some(i => i.id === normalized.id) ? prev : [normalized, ...prev],
			);
			toast.info('New Issue Submitted!', { description: `From ${normalized.studentName}` });
		});

		socket.on('issue-update', updatedIssueData => {
			const normalized = normalizeIssue(updatedIssueData);
			setIssues(prev => prev.map(i => (i.id === normalized.id ? normalized : i)));
		});

		socket.on('issue-deleted', ({ id }) => {
			setIssues(prev => prev.filter(i => i.id !== id));
			if (selectedIssueId === id) setSelectedIssueId(null); // Close detail panel if open
		});

		return () => socket.disconnect();
	}, [loadIssues, toast, user]);

	const handleUpdate = updatedIssue => {
		setIssues(prev => prev.map(i => (i.id === updatedIssue.id ? updatedIssue : i)));
	};

	const filteredIssues = useMemo(() => {
		let filtered = issues;
		if (filter !== 'all') {
			if (filter === 'my-issues') {
				filtered = filtered.filter(i => i.assignedToId === user?.id);
			} else {
				filtered = filtered.filter(i => i.status === filter);
			}
		}
		if (searchQuery) {
			const q = searchQuery.toLowerCase();
			filtered = filtered.filter(
				i =>
					i.studentName?.toLowerCase().includes(q) ||
					i.examTitle?.toLowerCase().includes(q) ||
					i.description?.toLowerCase().includes(q),
			);
		}
		return filtered;
	}, [issues, filter, searchQuery, user?.id]);

	return (
		<div style={styles.pageLayout}>
			<div style={styles.mainContent}>
				<header style={styles.header}>
					<div>
						<h1 style={styles.title}>Manage Issues</h1>
						<p style={styles.subtitle}>Review and resolve student-submitted issues.</p>
					</div>
					<div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
						<input
							type="search"
							placeholder="Search by student, exam..."
							value={searchQuery}
							onChange={e => setSearchQuery(e.target.value)}
							style={styles.searchInput}
						/>
						<div style={styles.filterGroup}>
							{['my-issues', 'open', 'in-progress', 'resolved', 'all'].map(f => (
								<button
									key={f}
									onClick={() => setFilter(f)}
									style={
										filter === f
											? styles.filterButtonActive
											: styles.filterButton
									}
								>
									{f === 'my-issues'
										? 'My Issues'
										: f.charAt(0).toUpperCase() + f.slice(1)}
								</button>
							))}
						</div>
					</div>
				</header>

				{error && <p style={{ color: 'var(--danger-text)', padding: '0 16px' }}>{error}</p>}
				{loading && (
					<p style={{ color: 'var(--text-muted)', padding: '0 16px' }}>
						Loading issues...
					</p>
				)}

				<div style={styles.tableContainer}>
					<table style={styles.table}>
						<thead>
							<tr>
								<th style={styles.tableHeader}>Student</th>
								<th style={styles.tableHeader}>Exam</th>
								<th style={styles.tableHeader}>Status</th>
								<th style={styles.tableHeader}>Assigned To</th>
								<th style={styles.tableHeader}>Date</th>
								<th style={styles.tableHeader}>Actions</th>
							</tr>
						</thead>
						<tbody>
							{!loading && filteredIssues.length === 0 && (
								<tr>
									<td colSpan="6" style={styles.emptyState}>
										<div style={{ fontSize: 48 }}>🎉</div>
										No issues match the current filters. All clear!
									</td>
								</tr>
							)}
							{filteredIssues.map(issue => (
								<IssueRow
									key={issue.id}
									issue={issue}
									onUpdate={handleUpdate}
									onSelect={() => setSelectedIssueId(issue.id)}
									isSelected={selectedIssueId === issue.id}
									currentUser={user}
								/>
							))}
						</tbody>
					</table>
				</div>
			</div>
			{selectedIssueId && (
				<IssueDetailPanel
					issueId={selectedIssueId}
					onClose={() => setSelectedIssueId(null)}
					onUpdate={handleUpdate}
				/>
			)}
		</div>
	);
};

// --- Styles ---
const styles = {
	header: {
		background: 'var(--surface)',
		padding: '24px',
		borderRadius: 16,
		border: '1px solid var(--border)',
		marginBottom: 24,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		flexWrap: 'wrap',
		gap: 16,
	},
	title: { margin: 0, fontSize: 24, color: 'var(--text)' },
	subtitle: { margin: '4px 0 0', color: 'var(--text-muted)' },
	filterGroup: { display: 'flex', gap: 8, background: 'var(--bg)', padding: 4, borderRadius: 10 },
	filterButton: {
		padding: '8px 12px',
		borderRadius: 8,
		border: 'none',
		background: 'transparent',
		color: 'var(--text-muted)',
		fontWeight: 600,
		cursor: 'pointer',
	},
	filterButtonActive: {
		padding: '8px 12px',
		borderRadius: 8,
		border: 'none',
		background: 'var(--surface)',
		color: 'var(--primary)',
		fontWeight: 600,
		cursor: 'pointer',
		boxShadow: 'var(--shadow-sm)',
	},
	tableContainer: {
		background: 'var(--surface)',
		borderRadius: 16,
		border: '1px solid var(--border)',
		overflowX: 'auto',
	},
	table: { width: '100%', borderCollapse: 'collapse' },
	tableHeader: {
		padding: '12px 16px',
		textAlign: 'left',
		borderBottom: '1px solid var(--border)',
		color: 'var(--text-muted)',
		fontSize: 12,
		textTransform: 'uppercase',
	},
	tableRow: { '&:not(:last-child)': { borderBottom: '1px solid var(--border)' } },
	tableCell: { padding: '16px', verticalAlign: 'middle', fontSize: 14 },
	statusPill: {
		padding: '4px 10px',
		borderRadius: 20,
		fontWeight: 700,
		fontSize: 12,
		display: 'inline-flex',
		alignItems: 'center',
		gap: 6,
	},
	actionButton: {
		padding: '6px 10px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		fontWeight: 600,
		cursor: 'pointer',
	},
	modalBackdrop: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.6)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1000,
		padding: 16,
	},
	modalContent: {
		background: 'var(--surface)',
		borderRadius: 16,
		padding: '24px 32px',
		width: '100%',
		maxWidth: '600px',
		position: 'relative',
	},
	modalCloseButton: {
		position: 'absolute',
		top: 12,
		right: 12,
		background: 'none',
		border: 'none',
		fontSize: 24,
		cursor: 'pointer',
		color: 'var(--text-muted)',
	},
	detailBox: {
		background: 'var(--bg)',
		padding: 12,
		borderRadius: 8,
		border: '1px solid var(--border)',
		marginBottom: 16,
		fontSize: 14,
	},
	textarea: {
		width: '100%',
		padding: 12,
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		resize: 'vertical',
		minHeight: 100,
	},
	buttonPrimary: {
		padding: '10px 16px',
		borderRadius: 8,
		border: 'none',
		background: 'var(--primary-gradient)',
		color: 'var(--primary-contrast)',
		fontWeight: 700,
		cursor: 'pointer',
	},
	buttonSecondary: {
		padding: '10px 16px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		fontWeight: 700,
		cursor: 'pointer',
	},
	pageLayout: { display: 'flex', gap: 24 },
	mainContent: { flex: 1, minWidth: 0 },
	detailPanel: {
		width: '450px',
		maxWidth: '40vw',
		background: 'var(--surface)',
		borderLeft: '1px solid var(--border)',
		padding: 24,
		position: 'relative',
	},
	detailMeta: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '8px 16px',
		fontSize: 13,
		color: 'var(--text-muted)',
		marginBottom: 16,
	},
	activityLog: { listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 16 },
	activityIcon: {
		fontSize: 16,
		marginRight: 12,
		background: 'var(--bg)',
		padding: '6px',
		borderRadius: '50%',
		width: 32,
		height: 32,
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
	},
	activityText: { flex: 1 },
	activityTime: { fontSize: 12, color: 'var(--text-muted)', display: 'block', marginTop: 2 },
	linkButton: {
		display: 'inline-block',
		textDecoration: 'none',
		padding: '8px 14px',
		background: 'var(--primary-bg)',
		color: 'var(--primary)',
		border: '1px solid var(--primary-border)',
		borderRadius: 8,
		fontWeight: 600,
		marginBottom: 24,
	},
	emptyState: {
		textAlign: 'center',
		padding: '48px',
		color: 'var(--text-muted)',
		fontSize: 16,
	},
	detailLoading: {
		textAlign: 'center',
		padding: '48px',
		color: 'var(--text-muted)',
	},
};

export default TeacherIssues;
