import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useToast } from '../../components/ui/Toaster.jsx';
import {
	safeApiCall,
	getAllIssues,
	updateIssueStatus,
	resolveIssue,
} from '../../services/teacherServices.js';
import { VITE_API_BASE_URL } from '../../services/api.js';

// (Re-using student status styles for consistency)
const statusStyles = {
	open: {
		bg: 'var(--warning-bg)',
		border: 'var(--warning-border)',
		color: 'var(--warning-text)',
		label: 'Open',
	},
	'in-progress': {
		bg: 'var(--info-bg)',
		border: 'var(--info-border)',
		color: 'var(--info-text)',
		label: 'In Progress',
	},
	resolved: {
		bg: 'var(--success-bg)',
		border: 'var(--success-border)',
		color: 'var(--success-text)',
		label: 'Resolved',
	},
};

const ReplyModal = ({ issue, onClose, onUpdate }) => {
	const [reply, setReply] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const { toast } = useToast();

	const handleSubmit = async e => {
		e.preventDefault();
		if (!reply.trim()) {
			toast({ variant: 'destructive', title: 'Reply cannot be empty.' });
			return;
		}
		setIsSaving(true);
		try {
			const updatedIssue = await safeApiCall(resolveIssue, issue.id, { reply });
			onUpdate(updatedIssue);
			toast({ variant: 'success', title: 'Issue Resolved!' });
			onClose();
		} catch (err) {
			toast({
				variant: 'destructive',
				title: 'Failed to resolve issue',
				description: err.message,
			});
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div style={styles.modalBackdrop} onClick={onClose}>
			<div style={styles.modalContent} onClick={e => e.stopPropagation()}>
				<button onClick={onClose} style={styles.modalCloseButton}>
					×
				</button>
				<h3 style={{ marginTop: 0 }}>Resolve Issue: {issue.examTitle}</h3>
				<p style={{ color: 'var(--text-muted)', fontSize: 14 }}>
					From: {issue.student?.fullname}
				</p>
				<div style={styles.detailBox}>
					<strong>Description:</strong> {issue.description}
				</div>
				<form onSubmit={handleSubmit}>
					<textarea
						value={reply}
						onChange={e => setReply(e.target.value)}
						placeholder="Type your reply to the student..."
						rows={5}
						style={styles.textarea}
						required
					/>
					<div
						style={{
							display: 'flex',
							justifyContent: 'flex-end',
							gap: 10,
							marginTop: 16,
						}}
					>
						<button type="button" onClick={onClose} style={styles.buttonSecondary}>
							Cancel
						</button>
						<button type="submit" disabled={isSaving} style={styles.buttonPrimary}>
							{isSaving ? 'Saving...' : 'Save & Resolve'}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
};

const IssueRow = ({ issue, onUpdate, onSelect }) => {
	const config = statusStyles[issue.status] || statusStyles.open;
	const { toast } = useToast();

	const handleStatusChange = async newStatus => {
		try {
			const updatedIssue = await safeApiCall(updateIssueStatus, issue.id, {
				status: newStatus,
			});
			onUpdate(updatedIssue);
			toast({ variant: 'success', title: `Status updated to "${config.label}"` });
		} catch (err) {
			toast({ variant: 'destructive', title: 'Update failed', description: err.message });
		}
	};

	return (
		<tr style={styles.tableRow}>
			<td style={styles.tableCell}>{issue.student?.fullname || 'N/A'}</td>
			<td style={styles.tableCell}>{issue.examTitle}</td>
			<td style={styles.tableCell}>
				<div style={{ ...styles.statusPill, ...config }}>{config.label}</div>
			</td>
			<td style={styles.tableCell}>{issue.createdAt}</td>
			<td style={{ ...styles.tableCell, textAlign: 'right' }}>
				<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
					{issue.status === 'open' && (
						<button
							onClick={() => handleStatusChange('in-progress')}
							style={styles.actionButton}
						>
							Start
						</button>
					)}
					<button onClick={() => onSelect(issue)} style={styles.actionButton}>
						View & Reply
					</button>
				</div>
			</td>
		</tr>
	);
};

const TeacherIssues = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [issues, setIssues] = useState([]);
	const [filter, setFilter] = useState('open');
	const [selectedIssue, setSelectedIssue] = useState(null);
	const { toast } = useToast();

	const loadIssues = useCallback(async () => {
		setLoading(true);
		try {
			const data = await safeApiCall(getAllIssues);
			setIssues(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e.message || 'Failed to load issues');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadIssues();
		const socket = io(VITE_API_BASE_URL, { withCredentials: true });
		socket.on('new-issue', newIssue => {
			setIssues(prev => [newIssue, ...prev]);
			toast({
				variant: 'info',
				title: 'New Issue Submitted!',
				description: `From ${newIssue.student.fullname}`,
			});
		});
		return () => socket.disconnect();
	}, [loadIssues, toast]);

	const handleUpdate = updatedIssue => {
		setIssues(prev => prev.map(i => (i.id === updatedIssue.id ? updatedIssue : i)));
	};

	const filteredIssues = useMemo(() => {
		if (filter === 'all') return issues;
		return issues.filter(i => i.status === filter);
	}, [issues, filter]);

	return (
		<div style={{ maxWidth: 1200, margin: '0 auto' }}>
			{selectedIssue && (
				<ReplyModal
					issue={selectedIssue}
					onClose={() => setSelectedIssue(null)}
					onUpdate={handleUpdate}
				/>
			)}
			<header style={styles.header}>
				<div>
					<h1 style={styles.title}>Manage Issues</h1>
					<p style={styles.subtitle}>Review and resolve student-submitted issues.</p>
				</div>
				<div style={styles.filterGroup}>
					{['open', 'in-progress', 'resolved', 'all'].map(f => (
						<button
							key={f}
							onClick={() => setFilter(f)}
							style={filter === f ? styles.filterButtonActive : styles.filterButton}
						>
							{f.charAt(0).toUpperCase() + f.slice(1)}
						</button>
					))}
				</div>
			</header>

			{error && <p style={{ color: 'var(--danger-text)' }}>{error}</p>}
			{loading && <p>Loading issues...</p>}

			<div style={styles.tableContainer}>
				<table style={styles.table}>
					<thead>
						<tr>
							<th style={styles.tableHeader}>Student</th>
							<th style={styles.tableHeader}>Exam</th>
							<th style={styles.tableHeader}>Status</th>
							<th style={styles.tableHeader}>Date</th>
							<th style={styles.tableHeader}></th>
						</tr>
					</thead>
					<tbody>
						{!loading && filteredIssues.length === 0 && (
							<tr>
								<td colSpan="5" style={{ textAlign: 'center', padding: 40 }}>
									No issues found for this filter.
								</td>
							</tr>
						)}
						{filteredIssues.map(issue => (
							<IssueRow
								key={issue.id}
								issue={issue}
								onUpdate={handleUpdate}
								onSelect={setSelectedIssue}
							/>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
};

// Abridged styles for brevity
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
		display: 'inline-block',
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
};

export default TeacherIssues;
