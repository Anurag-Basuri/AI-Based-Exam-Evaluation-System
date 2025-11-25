import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
	addInternalNote,
	bulkResolveIssues,
} from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';
import { useAuth } from '../../hooks/useAuth.js';

const MOBILE_BREAKPOINT = 1024;

// --- UI Constants ---
const statusStyles = {
	open: {
		label: 'Open',
		icon: '⚪',
		color: 'var(--warning-text)',
		bg: 'var(--warning-bg)',
		border: 'var(--warning-border)',
	},
	resolved: {
		label: 'Resolved',
		icon: '🟢',
		color: 'var(--success-text)',
		bg: 'var(--success-bg)',
		border: 'var(--success-border)',
	},
};

const activityIcons = {
	created: '📝',
	assigned: '👤',
	resolved: '✅',
	'status-changed': '🔄',
};

// --- Components ---

const StatusDropdown = ({ currentStatus, issueId, onUpdate, disabled }) => {
	const [isOpen, setIsOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const dropdownRef = useRef(null);
	const { toast } = useToast();

	const config = statusStyles[currentStatus] || statusStyles.open;

	useEffect(() => {
		const handleClickOutside = event => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};
		document.addEventListener('mousedown', handleClickOutside);
		return () => document.removeEventListener('mousedown', handleClickOutside);
	}, []);

	const handleStatusChange = async (newStatus, e) => {
		e.stopPropagation();
		if (newStatus === currentStatus) {
			setIsOpen(false);
			return;
		}
		setLoading(true);
		try {
			const updated = await safeApiCall(updateTeacherIssueStatus, issueId, newStatus);
			onUpdate(updated);
			toast.success(`Status updated to ${statusStyles[newStatus].label}`);
		} catch (err) {
			toast.error('Failed to update status', { description: err.message });
		} finally {
			setLoading(false);
			setIsOpen(false);
		}
	};

	if (currentStatus === 'resolved' || disabled) {
		return (
			<span
				style={{
					...styles.statusPill,
					color: config.color,
					background: config.bg,
					border: `1px solid ${config.border}`,
					cursor: 'default',
					opacity: disabled ? 0.7 : 1,
				}}
			>
				{config.icon} {config.label}
			</span>
		);
	}

	return (
		<div style={{ position: 'relative' }} ref={dropdownRef} onClick={e => e.stopPropagation()}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				disabled={loading}
				style={{
					...styles.statusPill,
					color: config.color,
					background: config.bg,
					border: `1px solid ${config.border}`,
					cursor: 'pointer',
					display: 'flex',
					alignItems: 'center',
					gap: 6,
					paddingRight: 8,
				}}
			>
				{loading ? (
					<span className="spinner-small" />
				) : (
					<>
						{config.icon} {config.label}
						<span style={{ fontSize: 10, opacity: 0.6 }}>▼</span>
					</>
				)}
			</button>

			{isOpen && (
				<div style={styles.dropdownMenu}>
					{['open'].map(status => (
						<button
							key={status}
							onClick={e => handleStatusChange(status, e)}
							style={{
								...styles.dropdownItem,
								background:
									status === currentStatus
										? 'var(--bg-secondary)'
										: 'transparent',
							}}
						>
							{statusStyles[status].icon} {statusStyles[status].label}
						</button>
					))}
				</div>
			)}
		</div>
	);
};

const BulkActionToolbar = ({ selectedIds, onBulkResolve, onClear }) => {
	if (selectedIds.length === 0) return null;

	const handleResolveClick = () => {
		const reply = window.prompt(
			`Enter a single reply to resolve all ${selectedIds.length} selected issues:`,
		);
		if (reply && reply.trim()) {
			onBulkResolve(reply);
		}
	};

	return (
		<div style={styles.bulkToolbar}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
				<div style={styles.selectionBadge}>{selectedIds.length}</div>
				<span style={{ fontWeight: 500, color: 'var(--primary-contrast)' }}>Selected</span>
			</div>
			<div style={{ display: 'flex', gap: 8 }}>
				<button onClick={handleResolveClick} style={styles.buttonWhite}>
					Resolve All
				</button>
				<button onClick={onClear} style={styles.buttonGhostWhite}>
					Cancel
				</button>
			</div>
		</div>
	);
};

const IssueDetailPanel = ({ issueId, onClose, onUpdate, isMobile }) => {
	const [issue, setIssue] = useState(null);
	const [loading, setLoading] = useState(true);
	const [reply, setReply] = useState('');
	const [note, setNote] = useState('');
	const [isSaving, setIsSaving] = useState(false);
	const [isAddingNote, setIsAddingNote] = useState(false);
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
			const updated = await safeApiCall(resolveTeacherIssue, issueId, reply);
			onUpdate(updated);
			setIssue(updated); // Update local state
			toast.success('Issue has been resolved!');
			// Don't close immediately, let them see the result
		} catch (err) {
			toast.error('Failed to resolve', { description: err.message });
		} finally {
			setIsSaving(false);
		}
	};

	const handleAddNote = async e => {
		e.preventDefault();
		if (!note.trim()) return;
		setIsAddingNote(true);
		try {
			const newNotes = await safeApiCall(addInternalNote, issueId, note);
			setIssue(prev => ({ ...prev, internalNotes: newNotes || [] }));
			setNote('');
		} catch (err) {
			toast.error('Failed to add note', { description: err.message });
		} finally {
			setIsAddingNote(false);
		}
	};

	const handleLocalUpdate = updated => {
		setIssue(updated);
		onUpdate(updated);
	};

	if (!issueId) return null;

	return (
		<>
			<div style={styles.modalBackdrop} onClick={onClose} />
			<div style={styles.detailPanel(isMobile)}>
				<div style={styles.detailHeader}>
					<h3 style={{ margin: 0, fontSize: '1.25rem' }}>Issue Details</h3>
					<button onClick={onClose} style={styles.closeButton}>
						&times;
					</button>
				</div>

				<div style={styles.detailContent}>
					{loading && <div style={styles.loadingState}>Loading details...</div>}
					{!loading && issue && (
						<>
							<div style={styles.section}>
								<div style={styles.issueTitleBlock}>
									<h2 style={styles.issueExamTitle}>{issue.examTitle}</h2>
									<StatusDropdown
										currentStatus={issue.status}
										issueId={issue.id}
										onUpdate={handleLocalUpdate}
									/>
								</div>
								<div style={styles.metaGrid}>
									<div style={styles.metaItem}>
										<span style={styles.metaLabel}>Student</span>
										<span style={styles.metaValue}>{issue.studentName}</span>
									</div>
									<div style={styles.metaItem}>
										<span style={styles.metaLabel}>Assigned To</span>
										<span style={styles.metaValue}>
											{issue.assignedTo || 'Unassigned'}
										</span>
									</div>
									<div style={styles.metaItem}>
										<span style={styles.metaLabel}>Reported</span>
										<span style={styles.metaValue}>
											{new Date(issue.createdAt).toLocaleDateString()}
										</span>
									</div>
								</div>
							</div>

							<div style={styles.section}>
								<h4 style={styles.sectionTitle}>Description</h4>
								<div style={styles.descriptionBox}>{issue.description}</div>
								{issue.submission?.id && (
									<Link
										to={`/teacher/grade/${issue.submission.id}`}
										style={styles.viewSubmissionLink}
									>
										View Student Submission &rarr;
									</Link>
								)}
							</div>

							{issue.status !== 'resolved' && (
								<div style={styles.section}>
									<h4 style={styles.sectionTitle}>Resolve Issue</h4>
									<form onSubmit={handleResolve} style={styles.resolveForm}>
										<textarea
											value={reply}
											onChange={e => setReply(e.target.value)}
											placeholder="Type your reply to the student..."
											rows={4}
											style={styles.textarea}
											required
										/>
										<div style={styles.formActions}>
											<button
												type="submit"
												disabled={isSaving}
												style={styles.buttonPrimary}
											>
												{isSaving ? 'Saving...' : 'Resolve Issue'}
											</button>
										</div>
									</form>
								</div>
							)}

							{issue.reply && (
								<div style={styles.section}>
									<h4 style={styles.sectionTitle}>Resolution</h4>
									<div style={styles.resolutionBox}>
										<div style={styles.resolutionHeader}>Reply to Student:</div>
										{issue.reply}
									</div>
								</div>
							)}

							<div style={styles.section}>
								<h4 style={styles.sectionTitle}>Internal Notes</h4>
								<div style={styles.notesList}>
									{(issue.internalNotes || []).length === 0 && (
										<p style={styles.emptyNotes}>No internal notes yet.</p>
									)}
									{(issue.internalNotes || []).map((n, i) => (
										<div key={i} style={styles.noteItem}>
											<div style={styles.noteHeader}>
												<strong>{n.user?.fullname || 'User'}</strong>
												<span style={styles.noteTime}>
													{new Date(n.createdAt).toLocaleString()}
												</span>
											</div>
											<div style={styles.noteContent}>{n.note}</div>
										</div>
									))}
								</div>
								<form onSubmit={handleAddNote} style={styles.addNoteForm}>
									<input
										value={note}
										onChange={e => setNote(e.target.value)}
										placeholder="Add a private note..."
										style={styles.noteInput}
									/>
									<button
										type="submit"
										disabled={isAddingNote}
										style={styles.buttonSecondary}
									>
										Add
									</button>
								</form>
							</div>

							<div style={styles.section}>
								<h4 style={styles.sectionTitle}>Activity Log</h4>
								<div style={styles.timeline}>
									{(issue.activityLog || []).map((log, i) => (
										<div key={i} style={styles.timelineItem}>
											<div style={styles.timelineIcon}>
												{activityIcons[log.action] || '•'}
											</div>
											<div style={styles.timelineContent}>
												<div style={styles.timelineText}>
													<strong>
														{log.user?.fullname || 'System'}
													</strong>{' '}
													{log.details}
												</div>
												<div style={styles.timelineTime}>
													{new Date(log.createdAt).toLocaleString()}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</>
					)}
				</div>
			</div>
		</>
	);
};

const IssueRow = ({ issue, onSelect, onToggleSelect, isChecked, isSelected, onUpdate, toast }) => {
	return (
		<tr
			style={{
				...styles.tableRow,
				background: isSelected ? 'var(--primary-light-bg)' : 'transparent',
			}}
			onClick={() => onSelect(issue)}
		>
			<td style={styles.tableCell} onClick={e => e.stopPropagation()}>
				<input
					type="checkbox"
					checked={isChecked}
					onChange={() => onToggleSelect(issue.id)}
					disabled={issue.status === 'resolved'}
					style={styles.checkbox}
				/>
			</td>
			<td style={styles.tableCell}>
				<div style={styles.studentCell}>
					<div style={styles.avatarPlaceholder}>
						{issue.studentName?.charAt(0) || 'S'}
					</div>
					<span style={{ fontWeight: 500 }}>{issue.studentName || 'N/A'}</span>
				</div>
			</td>
			<td style={styles.tableCell}>{issue.examTitle}</td>
			<td style={styles.tableCell}>
				<StatusDropdown
					currentStatus={issue.status}
					issueId={issue.id}
					onUpdate={onUpdate}
				/>
			</td>
			<td style={styles.tableCell}>{issue.assignedTo || 'Unassigned'}</td>
			<td style={styles.tableCell}>
				{new Date(issue.createdAt).toLocaleDateString(undefined, {
					month: 'short',
					day: 'numeric',
				})}
			</td>
		</tr>
	);
};

const IssueCard = ({ issue, onSelect, onToggleSelect, isChecked, isSelected, onUpdate }) => {
	return (
		<div
			style={{
				...styles.card.container,
				borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
				boxShadow: isSelected ? '0 0 0 2px var(--primary-light)' : 'var(--shadow-sm)',
			}}
			onClick={() => onSelect(issue)}
		>
			<div style={styles.card.header}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
					<input
						type="checkbox"
						checked={isChecked}
						onChange={e => {
							e.stopPropagation();
							onToggleSelect(issue.id);
						}}
						disabled={issue.status === 'resolved'}
						style={styles.checkbox}
					/>
					<span style={styles.card.title}>{issue.examTitle}</span>
				</div>
				<StatusDropdown
					currentStatus={issue.status}
					issueId={issue.id}
					onUpdate={onUpdate}
				/>
			</div>
			<div style={styles.card.body}>
				<div style={styles.cardRow}>
					<span style={styles.cardLabel}>Student:</span>
					<span style={styles.cardValue}>{issue.studentName || 'N/A'}</span>
				</div>
				<div style={styles.cardRow}>
					<span style={styles.cardLabel}>Assigned:</span>
					<span style={styles.cardValue}>{issue.assignedTo || 'Unassigned'}</span>
				</div>
				<div style={styles.cardFooter}>
					Reported on {new Date(issue.createdAt).toLocaleDateString()}
				</div>
			</div>
		</div>
	);
};

const TeacherIssues = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [issues, setIssues] = useState([]);
	const [filter, setFilter] = useState('my-issues');
	const [selectedIssueId, setSelectedIssueId] = useState(null);
	const [selectedIssueIds, setSelectedIssueIds] = useState([]);
	const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);
	const { toast } = useToast();
	const { user } = useAuth();

	useEffect(() => {
		const handleResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
		window.addEventListener('resize', handleResize);
		return () => window.removeEventListener('resize', handleResize);
	}, []);

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
		if (!user?.id) return;

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
			const normalized = normalizeIssue(updatedIssueData.issue || updatedIssueData);
			setIssues(prev => prev.map(i => (i.id === normalized.id ? normalized : i)));
			// Also update selected issue if it matches
			if (selectedIssueId === normalized.id) {
				// We don't need to do anything here as the detail panel fetches its own data,
				// but if we passed data down, we would update it.
			}
		});

		socket.on('issues-updated', updatedIssues => {
			const updatedMap = new Map(
				updatedIssues.map(i => [normalizeIssue(i).id, normalizeIssue(i)]),
			);
			setIssues(prev => prev.map(i => updatedMap.get(i.id) || i));
		});

		socket.on('issue-deleted', ({ id }) => {
			setIssues(prev => prev.filter(i => i.id !== id));
			if (selectedIssueId === id) setSelectedIssueId(null);
		});

		return () => socket.disconnect();
	}, [loadIssues, toast, user, selectedIssueId]);

	const handleUpdate = updatedIssue => {
		setIssues(prev => prev.map(i => (i.id === updatedIssue.id ? updatedIssue : i)));
	};

	const handleToggleSelect = issueId => {
		if (selectedIssueId) setSelectedIssueId(null);
		setSelectedIssueIds(prev =>
			prev.includes(issueId) ? prev.filter(id => id !== issueId) : [...prev, issueId],
		);
	};

	const handleBulkResolve = async reply => {
		try {
			const { updatedCount } = await safeApiCall(bulkResolveIssues, selectedIssueIds, reply);
			toast.success(`${updatedCount} issues resolved!`);
			setSelectedIssueIds([]);
		} catch (err) {
			toast.error('Bulk resolve failed', { description: err.message });
		}
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
		return filtered;
	}, [issues, filter, user?.id]);

	const handleSelectAll = () => {
		const visibleUnresolvedIds = filteredIssues
			.filter(i => i.status !== 'resolved')
			.map(i => i.id);

		const allVisibleSelected =
			visibleUnresolvedIds.length > 0 &&
			visibleUnresolvedIds.every(id => selectedIssueIds.includes(id));

		if (allVisibleSelected) {
			setSelectedIssueIds(prev => prev.filter(id => !visibleUnresolvedIds.includes(id)));
		} else {
			setSelectedIssueIds(prev => [...new Set([...prev, ...visibleUnresolvedIds])]);
		}
	};

	const isAllVisibleSelected = useMemo(() => {
		const visibleUnresolvedIds = filteredIssues
			.filter(i => i.status !== 'resolved')
			.map(i => i.id);
		return (
			visibleUnresolvedIds.length > 0 &&
			visibleUnresolvedIds.every(id => selectedIssueIds.includes(id))
		);
	}, [filteredIssues, selectedIssueIds]);

	return (
		<div style={styles.pageLayout}>
			<div style={styles.mainContent(isMobile)}>
				<header style={styles.header(isMobile)}>
					<div>
						<h1 style={styles.title}>Issue Tracker</h1>
						<p style={styles.subtitle}>Manage and resolve student inquiries.</p>
					</div>
					<div style={styles.controlsContainer(isMobile)}>
						<div style={styles.filterGroup}>
							{['my-issues', 'open', 'resolved'].map(f => (
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

				<div
					style={{
						position: 'relative',
						flex: 1,
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					<BulkActionToolbar
						selectedIds={selectedIssueIds}
						onBulkResolve={handleBulkResolve}
						onClear={() => setSelectedIssueIds([])}
					/>

					{error && <div style={styles.errorBanner}>⚠️ {error}</div>}

					{loading && (
						<div style={styles.loadingContainer}>
							<div className="spinner"></div>
							<p>Loading issues...</p>
						</div>
					)}

					{!loading && !isMobile ? (
						<div style={styles.tableContainer}>
							<table style={styles.table}>
								<thead>
									<tr>
										<th style={{ ...styles.tableHeader, width: 40 }}>
											<input
												type="checkbox"
												onChange={handleSelectAll}
												checked={isAllVisibleSelected}
												style={styles.checkbox}
											/>
										</th>
										<th style={styles.tableHeader}>Student</th>
										<th style={styles.tableHeader}>Exam</th>
										<th style={styles.tableHeader}>Status</th>
										<th style={styles.tableHeader}>Assigned To</th>
										<th style={styles.tableHeader}>Date</th>
									</tr>
								</thead>
								<tbody>
									{filteredIssues.length === 0 && (
										<tr>
											<td colSpan="6" style={styles.emptyState}>
												<div style={{ fontSize: 48, marginBottom: 16 }}>
													🎉
												</div>
												<div style={{ fontWeight: 600, fontSize: 18 }}>
													All caught up!
												</div>
												<div style={{ color: 'var(--text-muted)' }}>
													No issues found matching your filters.
												</div>
											</td>
										</tr>
									)}
									{filteredIssues.map(issue => (
										<IssueRow
											key={issue.id}
											issue={issue}
											onSelect={() => setSelectedIssueId(issue.id)}
											onToggleSelect={handleToggleSelect}
											isChecked={selectedIssueIds.includes(issue.id)}
											isSelected={selectedIssueId === issue.id}
											onUpdate={handleUpdate}
											toast={toast}
										/>
									))}
								</tbody>
							</table>
						</div>
					) : !loading && isMobile ? (
						<div style={styles.cardList}>
							{filteredIssues.length === 0 && (
								<div style={styles.emptyState}>
									<div style={{ fontSize: 48, marginBottom: 16 }}>🎉</div>
									<div style={{ fontWeight: 600, fontSize: 18 }}>
										All caught up!
									</div>
									<div style={{ color: 'var(--text-muted)' }}>
										No issues found matching your filters.
									</div>
								</div>
							)}
							{filteredIssues.map(issue => (
								<IssueCard
									key={issue.id}
									issue={issue}
									onSelect={() => setSelectedIssueId(issue.id)}
									onToggleSelect={handleToggleSelect}
									isChecked={selectedIssueIds.includes(issue.id)}
									isSelected={selectedIssueId === issue.id}
									onUpdate={handleUpdate}
								/>
							))}
						</div>
					) : null}
				</div>
			</div>
			{selectedIssueId && (
				<IssueDetailPanel
					issueId={selectedIssueId}
					onClose={() => setSelectedIssueId(null)}
					onUpdate={handleUpdate}
					isMobile={isMobile}
				/>
			)}
		</div>
	);
};

const styles = {
	pageLayout: {
		display: 'flex',
		position: 'relative',
		height: '100vh',
		overflow: 'hidden',
		background: 'var(--bg-secondary)',
	},
	mainContent: isMobile => ({
		flex: 1,
		minWidth: 0,
		padding: isMobile ? 16 : 32,
		display: 'flex',
		flexDirection: 'column',
		overflowY: 'hidden',
	}),
	header: isMobile => ({
		marginBottom: 24,
		display: 'flex',
		flexDirection: isMobile ? 'column' : 'row',
		justifyContent: 'space-between',
		gap: 20,
		flexShrink: 0,
	}),
	controlsContainer: isMobile => ({
		display: 'flex',
		flexDirection: isMobile ? 'column' : 'row',
		gap: 16,
		alignItems: isMobile ? 'stretch' : 'center',
	}),
	title: {
		margin: 0,
		fontSize: 28,
		fontWeight: 800,
		color: 'var(--text)',
		letterSpacing: '-0.02em',
	},
	subtitle: { margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 15 },
	filterGroup: {
		display: 'flex',
		gap: 4,
		background: 'var(--surface)',
		padding: 4,
		borderRadius: 12,
		border: '1px solid var(--border)',
		overflowX: 'auto',
	},
	filterButton: {
		padding: '8px 16px',
		borderRadius: 8,
		border: 'none',
		background: 'transparent',
		color: 'var(--text-muted)',
		fontWeight: 600,
		fontSize: 13,
		cursor: 'pointer',
		whiteSpace: 'nowrap',
		transition: 'all 0.2s',
	},
	filterButtonActive: {
		padding: '8px 16px',
		borderRadius: 8,
		border: 'none',
		background: 'var(--primary)',
		color: '#fff',
		fontWeight: 600,
		fontSize: 13,
		cursor: 'pointer',
		boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
		whiteSpace: 'nowrap',
	},
	tableContainer: {
		background: 'var(--surface)',
		borderRadius: 16,
		border: '1px solid var(--border)',
		overflow: 'auto',
		flex: 1,
		boxShadow: 'var(--shadow-sm)',
	},
	table: { width: '100%', borderCollapse: 'separate', borderSpacing: 0 },
	tableHeader: {
		padding: '16px 20px',
		textAlign: 'left',
		borderBottom: '1px solid var(--border)',
		color: 'var(--text-muted)',
		fontSize: 12,
		fontWeight: 700,
		textTransform: 'uppercase',
		background: 'var(--surface)',
		position: 'sticky',
		top: 0,
		zIndex: 10,
		whiteSpace: 'nowrap',
	},
	tableRow: {
		cursor: 'pointer',
		transition: 'background 0.15s',
	},
	tableCell: {
		padding: '16px 20px',
		verticalAlign: 'middle',
		fontSize: 14,
		borderBottom: '1px solid var(--border)',
		color: 'var(--text)',
	},
	studentCell: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
	},
	avatarPlaceholder: {
		width: 32,
		height: 32,
		borderRadius: '50%',
		background: 'var(--primary-light)',
		color: 'var(--primary)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontWeight: 700,
		fontSize: 14,
	},
	statusPill: {
		padding: '4px 10px',
		borderRadius: 99,
		fontWeight: 600,
		fontSize: 12,
		display: 'inline-flex',
		alignItems: 'center',
		gap: 6,
		whiteSpace: 'nowrap',
		border: 'none',
		outline: 'none',
		fontFamily: 'inherit',
	},
	dropdownMenu: {
		position: 'absolute',
		top: '100%',
		left: 0,
		marginTop: 4,
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 8,
		boxShadow: 'var(--shadow-md)',
		zIndex: 20,
		minWidth: 140,
		padding: 4,
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
	},
	dropdownItem: {
		padding: '8px 12px',
		borderRadius: 6,
		border: 'none',
		background: 'transparent',
		color: 'var(--text)',
		fontSize: 13,
		fontWeight: 500,
		cursor: 'pointer',
		textAlign: 'left',
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		transition: 'background 0.1s',
	},
	checkbox: {
		width: 16,
		height: 16,
		cursor: 'pointer',
		accentColor: 'var(--primary)',
	},
	modalBackdrop: {
		position: 'fixed',
		top: 0,
		left: 0,
		width: '100%',
		height: '100%',
		background: 'rgba(0,0,0,0.4)',
		backdropFilter: 'blur(2px)',
		zIndex: 100,
	},
	detailPanel: isMobile => ({
		width: isMobile ? '100%' : '480px',
		height: '100%',
		background: 'var(--surface)',
		borderLeft: isMobile ? 'none' : '1px solid var(--border)',
		position: 'fixed',
		top: 0,
		right: 0,
		zIndex: 101,
		boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
		display: 'flex',
		flexDirection: 'column',
		animation: 'slideIn 0.3s ease-out',
	}),
	detailHeader: {
		padding: '20px 24px',
		borderBottom: '1px solid var(--border)',
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		background: 'var(--surface)',
	},
	closeButton: {
		background: 'transparent',
		border: 'none',
		fontSize: 24,
		color: 'var(--text-muted)',
		cursor: 'pointer',
		padding: 4,
		lineHeight: 1,
		borderRadius: 4,
		transition: 'background 0.2s',
	},
	detailContent: {
		flex: 1,
		overflowY: 'auto',
		padding: 24,
	},
	section: {
		marginBottom: 32,
	},
	issueTitleBlock: {
		marginBottom: 16,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 16,
	},
	issueExamTitle: {
		margin: 0,
		fontSize: 20,
		fontWeight: 700,
		lineHeight: 1.3,
		flex: 1,
	},
	metaGrid: {
		display: 'grid',
		gridTemplateColumns: '1fr 1fr',
		gap: 16,
		background: 'var(--bg-secondary)',
		padding: 16,
		borderRadius: 12,
	},
	metaItem: {
		display: 'flex',
		flexDirection: 'column',
		gap: 4,
	},
	metaLabel: {
		fontSize: 12,
		color: 'var(--text-muted)',
		textTransform: 'uppercase',
		fontWeight: 600,
	},
	metaValue: {
		fontSize: 14,
		fontWeight: 500,
		color: 'var(--text)',
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: 700,
		color: 'var(--text-muted)',
		textTransform: 'uppercase',
		marginBottom: 12,
		letterSpacing: '0.05em',
	},
	descriptionBox: {
		background: 'var(--bg-secondary)',
		padding: 16,
		borderRadius: 12,
		fontSize: 15,
		lineHeight: 1.6,
		color: 'var(--text)',
		border: '1px solid var(--border)',
	},
	viewSubmissionLink: {
		display: 'inline-block',
		marginTop: 12,
		color: 'var(--primary)',
		fontWeight: 600,
		textDecoration: 'none',
		fontSize: 14,
	},
	resolveForm: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 12,
		padding: 16,
		boxShadow: 'var(--shadow-sm)',
	},
	textarea: {
		width: '100%',
		padding: 12,
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--bg-secondary)',
		resize: 'vertical',
		minHeight: 100,
		fontSize: 14,
		marginBottom: 12,
		outline: 'none',
		transition: 'border-color 0.2s',
	},
	formActions: {
		display: 'flex',
		justifyContent: 'flex-end',
	},
	buttonPrimary: {
		padding: '10px 20px',
		borderRadius: 8,
		border: 'none',
		background: 'var(--primary)',
		color: '#fff',
		fontWeight: 600,
		cursor: 'pointer',
		fontSize: 14,
		boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
		transition: 'transform 0.1s',
	},
	resolutionBox: {
		background: 'var(--success-bg)',
		border: '1px solid var(--success-border)',
		padding: 16,
		borderRadius: 12,
		color: 'var(--text)',
	},
	resolutionHeader: {
		fontSize: 12,
		fontWeight: 700,
		color: 'var(--success-text)',
		marginBottom: 8,
		textTransform: 'uppercase',
	},
	notesList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 12,
		marginBottom: 16,
	},
	noteItem: {
		background: 'var(--bg-secondary)',
		padding: 12,
		borderRadius: 8,
		fontSize: 14,
	},
	noteHeader: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: 4,
		fontSize: 12,
	},
	noteTime: {
		color: 'var(--text-muted)',
	},
	noteContent: {
		color: 'var(--text)',
		lineHeight: 1.5,
	},
	addNoteForm: {
		display: 'flex',
		gap: 8,
	},
	noteInput: {
		flex: 1,
		padding: '8px 12px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		fontSize: 14,
	},
	buttonSecondary: {
		padding: '8px 16px',
		borderRadius: 8,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		fontWeight: 600,
		cursor: 'pointer',
	},
	timeline: {
		position: 'relative',
		paddingLeft: 24,
		borderLeft: '2px solid var(--border)',
	},
	timelineItem: {
		position: 'relative',
		marginBottom: 24,
	},
	timelineIcon: {
		position: 'absolute',
		left: -33,
		top: 0,
		width: 18,
		height: 18,
		background: 'var(--surface)',
		border: '2px solid var(--primary)',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 10,
	},
	timelineContent: {
		background: 'var(--bg-secondary)',
		padding: '8px 12px',
		borderRadius: 8,
	},
	timelineText: {
		fontSize: 13,
		color: 'var(--text)',
		marginBottom: 4,
	},
	timelineTime: {
		fontSize: 11,
		color: 'var(--text-muted)',
	},
	bulkToolbar: {
		position: 'absolute',
		bottom: 32,
		left: '50%',
		transform: 'translateX(-50%)',
		background: 'var(--primary)',
		padding: '12px 24px',
		borderRadius: 100,
		display: 'flex',
		alignItems: 'center',
		gap: 24,
		boxShadow: '0 10px 30px rgba(59, 130, 246, 0.4)',
		zIndex: 50,
		animation: 'slideUp 0.3s ease-out',
	},
	selectionBadge: {
		background: 'rgba(255,255,255,0.2)',
		color: '#fff',
		width: 24,
		height: 24,
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: 12,
		fontWeight: 700,
	},
	buttonWhite: {
		background: '#fff',
		color: 'var(--primary)',
		border: 'none',
		padding: '8px 16px',
		borderRadius: 20,
		fontWeight: 600,
		fontSize: 13,
		cursor: 'pointer',
	},
	buttonGhostWhite: {
		background: 'transparent',
		color: 'rgba(255,255,255,0.8)',
		border: 'none',
		padding: '8px',
		fontWeight: 500,
		fontSize: 13,
		cursor: 'pointer',
	},
	emptyState: {
		textAlign: 'center',
		padding: '64px',
		color: 'var(--text-muted)',
	},
	cardList: {
		display: 'flex',
		flexDirection: 'column',
		gap: 16,
		paddingBottom: 80,
	},
	card: {
		container: {
			background: 'var(--surface)',
			border: '1px solid var(--border)',
			borderRadius: 16,
			padding: 16,
			cursor: 'pointer',
			transition: 'all 0.2s',
		},
		header: {
			display: 'flex',
			justifyContent: 'space-between',
			alignItems: 'flex-start',
			marginBottom: 12,
		},
		title: {
			fontWeight: 700,
			fontSize: 16,
			color: 'var(--text)',
		},
		body: {
			fontSize: 14,
		},
	},
	cardRow: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: 8,
	},
	cardLabel: {
		color: 'var(--text-muted)',
	},
	cardValue: {
		fontWeight: 500,
		color: 'var(--text)',
	},
	cardFooter: {
		marginTop: 12,
		paddingTop: 12,
		borderTop: '1px solid var(--border)',
		fontSize: 12,
		color: 'var(--text-muted)',
	},
	errorBanner: {
		background: 'var(--danger-bg)',
		color: 'var(--danger-text)',
		padding: '12px 16px',
		borderRadius: 8,
		marginBottom: 16,
		fontSize: 14,
	},
	loadingContainer: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 64,
		color: 'var(--text-muted)',
	},
};

export default TeacherIssues;
