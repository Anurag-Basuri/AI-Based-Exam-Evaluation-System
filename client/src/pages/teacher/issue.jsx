import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import {
	safeApiCall,
	getTeacherIssues,
	updateTeacherIssueStatus,
	resolveTeacherIssue,
	getTeacherIssueById,
	addInternalNote,
	bulkResolveIssues,
} from '../../services/teacherServices.js';
import { useAuth } from '../../hooks/useAuth.js';
import { 
    MessageSquare, AlertCircle, CheckCircle2, ChevronDown, 
    X, Send, Plus, Filter, Circle, Clock, CheckCircle, Search, User
} from 'lucide-react';

const MOBILE_BREAKPOINT = 1024;

const statusStyles = {
	open: {
		label: 'Open',
		icon: <Circle className="w-3.5 h-3.5" />,
		colorClass: 'text-amber-700 dark:text-amber-400',
		bgClass: 'bg-amber-50 dark:bg-amber-500/10',
		borderClass: 'border-amber-200 dark:border-amber-500/30',
	},
	resolved: {
		label: 'Resolved',
		icon: <CheckCircle className="w-3.5 h-3.5" />,
		colorClass: 'text-emerald-700 dark:text-emerald-400',
		bgClass: 'bg-emerald-50 dark:bg-emerald-500/10',
		borderClass: 'border-emerald-200 dark:border-emerald-500/30',
	},
};

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
			<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bgClass} ${config.colorClass} ${config.borderClass} ${disabled ? 'opacity-70' : ''}`}>
				{config.icon} {config.label}
			</span>
		);
	}

	return (
		<div className="relative inline-block" ref={dropdownRef} onClick={e => e.stopPropagation()}>
			<button
				onClick={() => setIsOpen(!isOpen)}
				disabled={loading}
				className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${config.bgClass} ${config.colorClass} ${config.borderClass} hover:brightness-95 transition-all`}
			>
				{loading ? (
					<div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
				) : (
					<>
						{config.icon} {config.label}
						<ChevronDown className="w-3 h-3 opacity-60 ml-1" />
					</>
				)}
			</button>

			{isOpen && (
				<div className="absolute top-full left-0 mt-1 w-32 bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-lg z-50 overflow-hidden">
					{['open'].map(status => (
						<button
							key={status}
							onClick={e => handleStatusChange(status, e)}
							className={`w-full text-left px-4 py-2 text-sm font-medium flex items-center gap-2 hover:bg-[var(--bg-secondary)] transition-colors ${status === currentStatus ? 'bg-[var(--bg-secondary)]' : ''}`}
						>
							<span className={statusStyles[status].colorClass}>{statusStyles[status].icon}</span>
							<span className="text-[var(--text)]">{statusStyles[status].label}</span>
						</button>
					))}
				</div>
			)}
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
			setIssue(updated);
			toast.success('Issue has been resolved!');
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

	if (!issueId) return null;

	return (
		<>
			{/* Backdrop for mobile */}
			{isMobile && (
				<div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity" onClick={onClose} />
			)}
			
			<div className={`
				flex flex-col bg-[var(--surface)] border border-[var(--border)]
				${isMobile 
					? 'fixed inset-x-0 bottom-0 top-16 z-50 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)]' 
					: 'w-[450px] shrink-0 sticky top-[88px] h-[calc(100vh-120px)] rounded-3xl shadow-lg'
				}
			`}>
				<div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
					<h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
						<MessageSquare className="w-5 h-5 text-indigo-500" /> Issue Details
					</h3>
					<button 
						onClick={onClose} 
						className="p-2 hover:bg-[var(--bg-secondary)] rounded-full text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
					{loading ? (
						<div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-4">
							<div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
							<p className="font-medium">Loading details...</p>
						</div>
					) : issue ? (
						<>
							<div>
								<div className="flex items-start justify-between gap-4 mb-6">
									<h2 className="text-2xl font-bold text-[var(--text)] leading-tight">{issue.examTitle}</h2>
									<StatusDropdown
										currentStatus={issue.status}
										issueId={issue.id}
										onUpdate={(updated) => { setIssue(updated); onUpdate(updated); }}
									/>
								</div>
								
								<div className="grid grid-cols-2 gap-4 mb-6 p-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border)]">
									<div>
										<div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Student</div>
										<div className="font-medium text-[var(--text)]">{issue.studentName}</div>
									</div>
									<div>
										<div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Assigned To</div>
										<div className="font-medium text-[var(--text)]">{issue.assignedTo || 'Unassigned'}</div>
									</div>
									<div className="col-span-2">
										<div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Reported</div>
										<div className="font-medium text-[var(--text)]">{new Date(issue.createdAt).toLocaleString()}</div>
									</div>
								</div>
							</div>

							<div>
								<h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Description</h4>
								<div className="p-4 rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] text-sm leading-relaxed whitespace-pre-wrap">
									{issue.description}
								</div>
								{issue.submission?.id && (
									<Link
										to={`/teacher/results/${issue.examId}/grade/${issue.submission.id}`}
										className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
									>
										View Student Submission &rarr;
									</Link>
								)}
							</div>

							{issue.status !== 'resolved' && (
								<div>
									<h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Resolve Issue</h4>
									<form onSubmit={handleResolve} className="space-y-3">
										<textarea
											value={reply}
											onChange={e => setReply(e.target.value)}
											placeholder="Type your reply to the student..."
											rows={4}
											className="w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
											required
										/>
										<div className="flex justify-end">
											<button
												type="submit"
												disabled={isSaving}
												className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-6 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
											>
												<Send className="w-4 h-4" />
												{isSaving ? 'Resolving...' : 'Resolve Issue'}
											</button>
										</div>
									</form>
								</div>
							)}

							{issue.reply && (
								<div>
									<h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Resolution</h4>
									<div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
										<div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2">Reply to Student:</div>
										<div className="text-sm text-[var(--text)] whitespace-pre-wrap">{issue.reply}</div>
									</div>
								</div>
							)}

							<div>
								<h4 className="text-sm font-bold text-[var(--text)] uppercase tracking-wider mb-3">Internal Notes</h4>
								<div className="space-y-3 mb-4">
									{(issue.internalNotes || []).length === 0 ? (
										<p className="text-sm text-[var(--text-muted)] italic">No internal notes yet.</p>
									) : (
										(issue.internalNotes || []).map((n, i) => (
											<div key={i} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border)]">
												<div className="flex justify-between items-center mb-2">
													<strong className="text-xs text-[var(--text)]">{n.user?.fullname || 'User'}</strong>
													<span className="text-xs text-[var(--text-muted)]">{new Date(n.createdAt).toLocaleString()}</span>
												</div>
												<div className="text-sm text-[var(--text)] whitespace-pre-wrap">{n.note}</div>
											</div>
										))
									)}
								</div>
								<form onSubmit={handleAddNote} className="flex gap-2">
									<input
										value={note}
										onChange={e => setNote(e.target.value)}
										placeholder="Add a private note..."
										className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm"
									/>
									<button
										type="submit"
										disabled={isAddingNote || !note.trim()}
										className="px-4 rounded-xl bg-[var(--surface-light)] border border-[var(--border)] text-[var(--text)] font-bold hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-50 flex items-center justify-center"
									>
										<Plus className="w-4 h-4" />
									</button>
								</form>
							</div>
						</>
					) : null}
				</div>
			</div>
		</>
	);
};

const IssueRow = ({ issue, onSelect, onToggleSelect, isChecked, isSelected, onUpdate }) => {
	return (
		<tr
			className={`border-b border-[var(--border)] cursor-pointer transition-colors ${isSelected ? 'bg-indigo-50/50 dark:bg-indigo-500/10' : 'hover:bg-[var(--bg-secondary)]'}`}
			onClick={() => onSelect(issue)}
		>
			<td className="p-4" onClick={e => e.stopPropagation()}>
				<div className="flex items-center justify-center">
					<input
						type="checkbox"
						checked={isChecked}
						onChange={() => onToggleSelect(issue.id)}
						disabled={issue.status === 'resolved'}
						className="w-4 h-4 rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 disabled:opacity-50 cursor-pointer"
					/>
				</div>
			</td>
			<td className="p-4 py-5">
				<div className="flex items-center gap-3">
					<div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
						{issue.studentName?.charAt(0)?.toUpperCase() || 'S'}
					</div>
					<span className="font-bold text-[var(--text)]">{issue.studentName || 'N/A'}</span>
				</div>
			</td>
			<td className="p-4 font-medium text-[var(--text)]">{issue.examTitle}</td>
			<td className="p-4">
				<StatusDropdown
					currentStatus={issue.status}
					issueId={issue.id}
					onUpdate={onUpdate}
				/>
			</td>
			<td className="p-4 text-sm text-[var(--text-muted)]">
				{new Date(issue.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
			</td>
		</tr>
	);
};

const IssueCard = ({ issue, onSelect, onToggleSelect, isChecked, isSelected, onUpdate }) => {
	return (
		<div
			className={`glass-card rounded-2xl p-4 cursor-pointer transition-all ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'hover:shadow-md border-[var(--border)]'}`}
			onClick={() => onSelect(issue)}
		>
			<div className="flex items-start justify-between mb-3 gap-4">
				<div className="flex items-start gap-3">
					<input
						type="checkbox"
						checked={isChecked}
						onChange={e => { e.stopPropagation(); onToggleSelect(issue.id); }}
						disabled={issue.status === 'resolved'}
						className="mt-1 w-4 h-4 rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
					/>
					<div>
						<h4 className="font-bold text-[var(--text)] line-clamp-2 leading-snug">{issue.examTitle}</h4>
					</div>
				</div>
				<StatusDropdown
					currentStatus={issue.status}
					issueId={issue.id}
					onUpdate={onUpdate}
				/>
			</div>
			
			<div className="space-y-2 mt-4 text-sm">
				<div className="flex justify-between items-center bg-[var(--bg-secondary)] px-3 py-2 rounded-lg">
					<span className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">Student</span>
					<span className="font-bold text-[var(--text)] flex items-center gap-1.5">
						<User className="w-3.5 h-3.5" />
						{issue.studentName || 'N/A'}
					</span>
				</div>
				<div className="flex justify-between items-center bg-[var(--bg-secondary)] px-3 py-2 rounded-lg">
					<span className="text-[var(--text-muted)] font-medium text-xs uppercase tracking-wider">Reported</span>
					<span className="font-bold text-[var(--text)] flex items-center gap-1.5">
						<Clock className="w-3.5 h-3.5" />
						{new Date(issue.createdAt).toLocaleDateString()}
					</span>
				</div>
			</div>
		</div>
	);
};

const TeacherIssues = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [issues, setIssues] = useState([]);
	const [filter, setFilter] = useState('all');
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

	useEffect(() => {
		const fetchIssues = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await safeApiCall(getTeacherIssues);
				setIssues(data || []);
			} catch (err) {
				setError(err.message || 'Failed to fetch issues');
			} finally {
				setLoading(false);
			}
		};
		fetchIssues();
	}, []);

	const filteredIssues = issues.filter(issue => {
		if (filter === 'open') return issue.status === 'open';
		if (filter === 'resolved') return issue.status === 'resolved';
		return true;
	});

	const handleUpdateIssue = updated => {
		setIssues(prev => prev.map(issue => (issue.id === updated.id ? updated : issue)));
	};

	const toggleSelectAll = () => {
		const resolvable = filteredIssues.filter(i => i.status !== 'resolved');
		if (selectedIssueIds.length === resolvable.length) {
			setSelectedIssueIds([]);
		} else {
			setSelectedIssueIds(resolvable.map(i => i.id));
		}
	};

	const handleToggleSelect = id => {
		setSelectedIssueIds(prev =>
			prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id],
		);
	};

	const handleBulkResolve = async reply => {
		try {
			const res = await safeApiCall(bulkResolveIssues, selectedIssueIds, reply);
			toast.success(`Resolved ${res.modifiedCount} issues successfully!`);
			
			// Refresh issues
			const data = await safeApiCall(getTeacherIssues);
			setIssues(data || []);
			
			setSelectedIssueIds([]);
			setSelectedIssueId(null);
		} catch (err) {
			toast.error('Failed to resolve issues', { description: err.message });
		}
	};

	return (
		<div className="min-h-screen bg-[var(--bg)] pb-20 dash-enter">
			<PageHeader
				title="Issue Resolution"
				subtitle="Manage and respond to student reported issues."
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Issues' }
				]}
			/>

			<div className="px-4 sm:px-6 lg:px-8 mt-6">
				{error && <Alert type="error" className="mb-6">{error}</Alert>}

				{/* Toolbar */}
				<div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-[var(--surface)] p-2 rounded-2xl border border-[var(--border)] shadow-sm">
					<div className="flex rounded-xl bg-[var(--bg-secondary)] p-1 overflow-x-auto w-full sm:w-auto hide-scrollbar">
						{['all', 'open', 'resolved'].map(f => (
							<button
								key={f}
								onClick={() => setFilter(f)}
								className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap capitalize ${
									filter === f 
										? 'bg-[var(--surface)] text-[var(--text)] shadow-sm border border-[var(--border)]' 
										: 'text-[var(--text-muted)] hover:text-[var(--text)]'
								}`}
							>
								{f}
							</button>
						))}
					</div>
				</div>

				<div className="flex items-start gap-6 relative">
					{/* Main List */}
					<div className="flex-1 min-w-0">
						<div className="glass-card rounded-3xl overflow-hidden border border-[var(--border)]">
							{loading ? (
								<div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)]">
									<div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
									<p className="font-medium">Loading issues...</p>
								</div>
							) : filteredIssues.length === 0 ? (
								<div className="flex flex-col items-center justify-center p-20 text-[var(--text-muted)]">
									<AlertCircle className="w-12 h-12 mb-4 opacity-50" />
									<h3 className="text-lg font-bold text-[var(--text)] mb-1">No Issues Found</h3>
									<p>You're all caught up!</p>
								</div>
							) : isMobile ? (
								<div className="flex flex-col gap-4 p-4 bg-[var(--bg)]">
									{filteredIssues.map(issue => (
										<IssueCard
											key={issue.id}
											issue={issue}
											onSelect={i => setSelectedIssueId(i.id)}
											onToggleSelect={handleToggleSelect}
											isChecked={selectedIssueIds.includes(issue.id)}
											isSelected={selectedIssueId === issue.id}
											onUpdate={handleUpdateIssue}
										/>
									))}
								</div>
							) : (
								<div className="overflow-x-auto">
									<table className="w-full text-left border-collapse">
										<thead>
											<tr className="bg-[var(--bg-secondary)] border-b border-[var(--border)] text-[var(--text-muted)] text-xs uppercase tracking-wider font-bold">
												<th className="p-4 w-12">
													<div className="flex items-center justify-center">
														<input
															type="checkbox"
															onChange={toggleSelectAll}
															checked={
																filteredIssues.length > 0 &&
																filteredIssues.filter(i => i.status !== 'resolved').length > 0 &&
																selectedIssueIds.length === filteredIssues.filter(i => i.status !== 'resolved').length
															}
															className="w-4 h-4 rounded border-[var(--border)] text-indigo-600 focus:ring-indigo-500"
														/>
													</div>
												</th>
												<th className="p-4 py-5">Student</th>
												<th className="p-4 py-5">Exam</th>
												<th className="p-4 py-5">Status</th>
												<th className="p-4 py-5">Reported</th>
											</tr>
										</thead>
										<tbody>
											{filteredIssues.map(issue => (
												<IssueRow
													key={issue.id}
													issue={issue}
													onSelect={i => setSelectedIssueId(i.id)}
													onToggleSelect={handleToggleSelect}
													isChecked={selectedIssueIds.includes(issue.id)}
													isSelected={selectedIssueId === issue.id}
													onUpdate={handleUpdateIssue}
												/>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>

					{/* Detail Panel */}
					{selectedIssueId && (
						<IssueDetailPanel
							issueId={selectedIssueId}
							onClose={() => setSelectedIssueId(null)}
							onUpdate={handleUpdateIssue}
							isMobile={isMobile}
						/>
					)}
				</div>
			</div>

			{/* Bulk Toolbar */}
			{selectedIssueIds.length > 0 && (
				<div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[var(--surface)] border border-[var(--border)] shadow-[0_10px_40px_rgba(0,0,0,0.15)] rounded-full px-6 py-3 flex items-center gap-6 z-50 animate-slideUp">
					<div className="flex items-center gap-3">
						<span className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xs font-bold shadow-md">
							{selectedIssueIds.length}
						</span>
						<span className="font-bold text-[var(--text)] text-sm uppercase tracking-wider">Selected</span>
					</div>
					<div className="flex items-center gap-2">
						<button
							onClick={() => {
								const reply = window.prompt(`Enter a single reply to resolve all ${selectedIssueIds.length} selected issues:`);
								if (reply && reply.trim()) handleBulkResolve(reply);
							}}
							className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
						>
							Resolve All
						</button>
						<button
							onClick={() => setSelectedIssueIds([])}
							className="text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--bg-secondary)] font-bold px-4 py-2 rounded-xl text-sm transition-colors"
						>
							Cancel
						</button>
					</div>
				</div>
			)}
		</div>
	);
};

export default TeacherIssues;
