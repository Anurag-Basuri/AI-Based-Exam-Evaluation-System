import React from 'react';
import { CSSTransition } from 'react-transition-group';
import { io } from 'socket.io-client';
import { useToast } from '../../components/ui/Toaster.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { API_BASE_URL } from '../../services/api.js';
import {
	safeApiCall,
	getMyIssues,
	createIssue,
	getMySubmissionsForIssues,
	deleteIssue,
} from '../../services/studentServices.js';

const statusStyles = {
	open: {
		bg: 'var(--warning-bg)',
		border: 'var(--warning-border)',
		color: 'var(--warning-text)',
		label: 'Open',
		icon: '🔴',
	},
	'in-progress': {
		bg: 'var(--info-bg)',
		border: 'var(--info-border)',
		color: 'var(--info-text)',
		label: 'In Progress',
		icon: '🟡',
	},
	resolved: {
		bg: 'var(--success-bg)',
		border: 'var(--success-border)',
		color: 'var(--success-text)',
		label: 'Resolved',
		icon: '🟢',
	},
};

const IssueCard = ({ issue, onDelete }) => {
	const config = statusStyles[issue.status] || statusStyles.open;

	return (
		<article
			className="hover-card"
			style={{
				background: 'var(--surface)',
				borderRadius: '16px',
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: 'clamp(16px, 4vw, 24px)',
				transition: 'transform 0.2s ease, box-shadow 0.2s ease',
			}}
		>
			<header style={{ marginBottom: '16px' }}>
				<div
					style={{
						display: 'flex',
						alignItems: 'center',
						gap: '12px',
						marginBottom: '8px',
						flexWrap: 'wrap',
					}}
				>
					<h3
						style={{
							margin: 0,
							fontSize: 'clamp(16px, 3vw, 18px)',
							fontWeight: 700,
							color: 'var(--text)',
							flex: '1 1 200px',
							wordBreak: 'break-word',
						}}
					>
						{issue.examTitle}
					</h3>
					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							fontSize: '12px',
							padding: '6px 12px',
							borderRadius: '20px',
							border: `1px solid ${config.border}`,
							background: config.bg,
							color: config.color,
							fontWeight: 700,
							flexShrink: 0,
							whiteSpace: 'nowrap',
						}}
					>
						<span>{config.icon}</span>
						{config.label}
					</span>
				</div>

				<div
					style={{
						display: 'flex',
						gap: 'clamp(12px, 3vw, 16px)',
						color: 'var(--text-muted)',
						fontSize: 'clamp(12px, 2.5vw, 13px)',
						flexWrap: 'wrap',
					}}
				>
					<div>
						<strong style={{ color: 'var(--text)' }}>Type:</strong> {issue.issueType}
					</div>
					{issue.createdAt && (
						<div>
							<strong style={{ color: 'var(--text)' }}>Created:</strong>{' '}
							{issue.createdAt}
						</div>
					)}
				</div>
			</header>

			<div
				style={{
					background: 'var(--bg-secondary)',
					borderRadius: '12px',
					padding: 'clamp(12px, 3vw, 16px)',
					border: '1px solid var(--border)',
					marginBottom: '16px',
				}}
			>
				<div
					style={{
						fontWeight: 600,
						color: 'var(--text)',
						marginBottom: '8px',
						fontSize: '14px',
					}}
				>
					Issue Description
				</div>
				<p
					style={{
						margin: 0,
						color: 'var(--text-muted)',
						lineHeight: 1.5,
						fontSize: 'clamp(13px, 2.5vw, 14px)',
					}}
				>
					{issue.description}
				</p>
			</div>

			{issue.reply ? (
				<div
					style={{
						background: statusStyles.resolved.bg,
						borderRadius: '12px',
						padding: 'clamp(12px, 3vw, 16px)',
						border: `1px solid ${statusStyles.resolved.border}`,
					}}
				>
					<div
						style={{
							fontWeight: 600,
							color: statusStyles.resolved.color,
							marginBottom: '8px',
							fontSize: '14px',
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
						}}
					>
						👨‍🏫 Teacher Response
					</div>
					<p
						style={{
							margin: 0,
							color: statusStyles.resolved.color,
							lineHeight: 1.5,
							fontSize: 'clamp(13px, 2.5vw, 14px)',
						}}
					>
						{issue.reply}
					</p>
					{issue.resolvedAt && (
						<div
							style={{
								marginTop: '8px',
								fontSize: '12px',
								color: statusStyles.resolved.color,
								fontWeight: 500,
							}}
						>
							Resolved on {issue.resolvedAt}
						</div>
					)}
				</div>
			) : (
				<div
					style={{
						color: config.color,
						fontSize: 'clamp(13px, 2.5vw, 14px)',
						fontWeight: 500,
						textAlign: 'center',
						padding: '12px',
						background: config.bg,
						borderRadius: '8px',
						border: `1px solid ${config.border}`,
					}}
				>
					{issue.status === 'in-progress'
						? '⏳ A teacher is looking into your issue.'
						: '⏳ Awaiting teacher response.'}
				</div>
			)}

			{issue.status !== 'resolved' && (
				<div
					style={{
						marginTop: '16px',
						borderTop: '1px solid var(--border)',
						paddingTop: '12px',
						textAlign: 'right',
					}}
				>
					<button
						onClick={() => onDelete(issue.id)}
						title="Withdraw this issue"
						style={{
							background: 'transparent',
							border: 'none',
							color: 'var(--error)',
							cursor: 'pointer',
							fontSize: 'clamp(12px, 2.5vw, 13px)',
							fontWeight: 600,
							display: 'inline-flex',
							alignItems: 'center',
							gap: '6px',
							padding: '6px 8px',
							borderRadius: '8px',
							transition: 'background 0.2s ease',
						}}
						onMouseEnter={(e) => e.target.style.background = 'var(--danger-bg)'}
						onMouseLeave={(e) => e.target.style.background = 'transparent'}
					>
						🗑️ Withdraw Issue
					</button>
				</div>
			)}
		</article>
	);
};

const StudentIssues = () => {
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [issues, setIssues] = React.useState([]);
	const [showForm, setShowForm] = React.useState(false);
	const [saving, setSaving] = React.useState(false);
	const [submissions, setSubmissions] = React.useState([]);
	const toast = useToast();
	const { user } = useAuth();

	const [form, setForm] = React.useState({
		submissionId: '',
		issueType: 'evaluation',
		description: '',
	});

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const [issuesData, submissionsData] = await Promise.all([
				safeApiCall(getMyIssues),
				safeApiCall(getMySubmissionsForIssues),
			]);
			setIssues(Array.isArray(issuesData) ? issuesData : []);
			setSubmissions(Array.isArray(submissionsData) ? submissionsData : []);
			if (submissionsData?.length > 0) {
				setForm(f => ({ ...f, submissionId: submissionsData[0].id }));
			}
		} catch (e) {
			setError(e?.message || 'Failed to load data');
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	React.useEffect(() => {
		if (!user?.id) return;

		const socket = io(API_BASE_URL, {
			query: { userId: user.id, role: 'student' },
			withCredentials: true,
		});

		socket.on('connect_error', err => {
			toast.error('Live updates unavailable', { description: err?.message || '' });
		});

		socket.on('issue-update', updatedIssue => {
			setIssues(prev =>
				prev.map(issue => (issue.id === updatedIssue.id ? updatedIssue : issue)),
			);
			toast.info(`Status for "${updatedIssue.examTitle}" is now ${updatedIssue.status}.`);
		});

		socket.on('new-issue', newIssue => {
			if (newIssue.student?._id === user.id) {
				setIssues(prev => {
					if (prev.some(issue => issue.id === newIssue.id)) {
						return prev;
					}
					return [newIssue, ...prev];
				});
			}
		});

		return () => socket.disconnect();
	}, [user, toast]);

	const handleDelete = async issueId => {
		// Safety check: Confirm with the user before this destructive action
		const isConfirmed = window.confirm(
			'Are you sure you want to withdraw this issue? This action cannot be undone.',
		);

		if (!isConfirmed) {
			return;
		}

		try {
			await safeApiCall(deleteIssue, issueId);
			// Optimistically remove the issue from the UI
			setIssues(prevIssues => prevIssues.filter(issue => issue.id !== issueId));
			toast.success('Issue withdrawn successfully.');
		} catch (e) {
			toast.error('Deletion Failed', { description: e.message });
		}
	};

	const handleSubmit = async e => {
		e.preventDefault();
		if (!form.submissionId || !form.issueType || !form.description) {
			toast.error('Please fill all required fields.');
			return;
		}

		setSaving(true);
		setError('');
		try {
			const newIssue = await safeApiCall(createIssue, form);
			setIssues(prevIssues => [newIssue, ...prevIssues]);
			setForm({
				submissionId: submissions[0]?.id || '',
				issueType: 'evaluation',
				description: '',
			});
			setShowForm(false);
			toast.success('Your issue has been submitted successfully!');
		} catch (e) {
			// IMPROVEMENT: Display the specific error message from the backend.
			setError(e.message || 'An unexpected error occurred while submitting your issue.');
			toast.error('Submission Failed', { description: e.message });
		} finally {
			setSaving(false);
		}
	};

	const hasSubmissions = submissions.length > 0;

	return (
		<div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(16px, 4vw, 24px)', minHeight: '100vh' }}>
			<style>{`
				.hover-card {
					transition: transform 0.2s, box-shadow 0.2s;
				}
				.hover-card:hover {
					transform: translateY(-2px);
					box-shadow: var(--shadow-lg);
				}
				@media (max-width: 768px) {
					.hover-card:hover {
						transform: none;
					}
				}
				button:not(:disabled):hover {
					filter: brightness(1.05);
				}
				button:not(:disabled):active {
					transform: translateY(1px);
				}
			`}</style>

			<header
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: '32px',
					flexWrap: 'wrap',
					gap: '16px',
				}}
			>
				<div>
					<h1 style={{ 
						margin: 0, 
						fontSize: 'clamp(24px, 5vw, 32px)', 
						fontWeight: 800, 
						color: 'var(--text)' 
					}}>
						Support & Issues
					</h1>
					<p style={{ 
						margin: '6px 0 0', 
						fontSize: 'clamp(14px, 3vw, 16px)', 
						color: 'var(--text-muted)' 
					}}>
						Raise concerns about exam sessions or evaluations.
					</p>
				</div>
				<button
					onClick={() => setShowForm(true)}
					disabled={!hasSubmissions || loading}
					title={
						!hasSubmissions
							? 'You must have at least one submitted exam to create an issue.'
							: 'Create a new support issue'
					}
					style={{
						padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
						borderRadius: '12px',
						border: 'none',
						background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
						color: 'white',
						fontSize: 'clamp(14px, 3vw, 16px)',
						fontWeight: 700,
						cursor: !hasSubmissions || loading ? 'not-allowed' : 'pointer',
						boxShadow: 'var(--shadow-md)',
						opacity: !hasSubmissions || loading ? 0.6 : 1,
						transition: 'all 0.2s ease',
					}}
				>
					➕ Create New Issue
				</button>
			</header>

			{error && (
				<div
					style={{
						padding: 'clamp(12px, 3vw, 14px)',
						borderRadius: '12px',
						background: 'var(--danger-bg)',
						border: '1px solid var(--danger-border)',
						color: 'var(--danger-text)',
						fontWeight: 600,
						marginBottom: '16px',
						fontSize: 'clamp(13px, 2.5vw, 14px)',
					}}
				>
					❌ {error}
				</div>
			)}

			{showForm && (
				<IssueFormModal
					isOpen={showForm}
					onClose={() => setShowForm(false)}
					onSubmit={handleSubmit}
					form={form}
					setForm={setForm}
					submissions={submissions}
					saving={saving}
				/>
			)}

			{loading && (
				<div style={{ 
					textAlign: 'center', 
					padding: 'clamp(40px, 8vw, 60px) 20px',
					background: 'var(--surface)',
					borderRadius: '24px',
					border: '2px dashed var(--border)',
				}}>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
					<p style={{ 
						color: 'var(--text-muted)', 
						fontSize: 'clamp(14px, 3vw, 16px)',
						margin: 0,
					}}>
						Loading your issues…
					</p>
				</div>
			)}

			{!loading && !issues.length && (
				<div
					style={{
						padding: 'clamp(40px, 8vw, 60px) 20px',
						borderRadius: '24px',
						border: '2px dashed var(--border)',
						textAlign: 'center',
						background: 'var(--surface)',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
					<h3 style={{ 
						margin: '0 0 8px 0', 
						fontSize: 'clamp(18px, 4vw, 20px)', 
						fontWeight: 700, 
						color: 'var(--text)' 
					}}>
						No Issues Found
					</h3>
					<p style={{ 
						margin: 0, 
						fontSize: 'clamp(14px, 3vw, 16px)', 
						color: 'var(--text-muted)' 
					}}>
						You haven't created any issues yet. Use the button above to create one.
					</p>
				</div>
			)}

			{!loading && issues.length > 0 && (
				<div
					style={{
						display: 'grid',
						gap: 'clamp(16px, 4vw, 24px)',
						gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
					}}
				>
					{issues.map(issue => (
						<IssueCard key={issue.id} issue={issue} onDelete={handleDelete} />
					))}
				</div>
			)}
		</div>
	);
};

// New Modal Component for the Form
const IssueFormModal = ({ isOpen, onClose, onSubmit, form, setForm, submissions, saving }) => {
	const modalRef = React.useRef();

	React.useEffect(() => {
		const handleEsc = e => {
			if (e.key === 'Escape') onClose();
		};
		document.addEventListener('keydown', handleEsc);
		return () => document.removeEventListener('keydown', handleEsc);
	}, [onClose]);

	if (!isOpen) return null;

	return (
		<div
			ref={modalRef}
			onClick={e => {
				if (modalRef.current === e.target) onClose();
			}}
			style={{
				position: 'fixed',
				inset: 0,
				background: 'rgba(0,0,0,0.6)',
				backdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
				padding: 'clamp(16px, 4vw, 24px)',
			}}
		>
			<form
				onSubmit={onSubmit}
				style={{
					background: 'var(--surface)',
					borderRadius: '16px',
					border: '1px solid var(--border)',
					boxShadow: 'var(--shadow-xl)',
					padding: 'clamp(20px, 4vw, 24px)',
					width: '100%',
					maxWidth: 'min(500px, 95vw)',
					display: 'grid',
					gap: 'clamp(12px, 3vw, 16px)',
				}}
			>
				<h2 style={{ 
					margin: 0, 
					fontSize: 'clamp(20px, 4vw, 24px)', 
					fontWeight: 700, 
					color: 'var(--text)' 
				}}>
					Create New Issue
				</h2>
				
				<div style={{ display: 'grid', gap: '8px' }}>
					<label
						htmlFor="issue-submission"
						style={{ 
							fontWeight: 700, 
							fontSize: 'clamp(13px, 2.5vw, 14px)', 
							color: 'var(--text)' 
						}}
					>
						Related Exam
					</label>
					<select
						id="issue-submission"
						value={form.submissionId}
						onChange={e => setForm(s => ({ ...s, submissionId: e.target.value }))}
						style={{
							padding: 'clamp(10px, 2vw, 12px)',
							borderRadius: '10px',
							border: '1px solid var(--border)',
							background: 'var(--bg-secondary)',
							color: 'var(--text)',
							fontSize: 'clamp(13px, 2.5vw, 14px)',
							outline: 'none',
							transition: 'border-color 0.2s ease',
						}}
						required
					>
						<option value="">Select an exam submission</option>
						{submissions.map(s => (
							<option key={s.id} value={s.id}>
								{s.label}
							</option>
						))}
					</select>
				</div>

				<div style={{ display: 'grid', gap: '8px' }}>
					<label 
						htmlFor="issue-type" 
						style={{ 
							fontWeight: 700, 
							fontSize: 'clamp(13px, 2.5vw, 14px)', 
							color: 'var(--text)' 
						}}
					>
						Issue Type
					</label>
					<select
						id="issue-type"
						value={form.issueType}
						onChange={e => setForm(s => ({ ...s, issueType: e.target.value }))}
						style={{
							padding: 'clamp(10px, 2vw, 12px)',
							borderRadius: '10px',
							border: '1px solid var(--border)',
							background: 'var(--bg-secondary)',
							color: 'var(--text)',
							fontSize: 'clamp(13px, 2.5vw, 14px)',
							outline: 'none',
							transition: 'border-color 0.2s ease',
						}}
						required
					>
						<option value="evaluation">Evaluation/Grading Issue</option>
						<option value="question">Problem with a Question</option>
						<option value="technical">Technical Problem</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div style={{ display: 'grid', gap: '8px' }}>
					<label 
						htmlFor="issue-desc" 
						style={{ 
							fontWeight: 700, 
							fontSize: 'clamp(13px, 2.5vw, 14px)', 
							color: 'var(--text)' 
						}}
					>
						Description
					</label>
					<textarea
						id="issue-desc"
						value={form.description}
						onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
						placeholder="Please describe the problem in detail."
						rows={5}
						style={{
							padding: 'clamp(10px, 2vw, 12px)',
							borderRadius: '10px',
							border: '1px solid var(--border)',
							background: 'var(--bg-secondary)',
							color: 'var(--text)',
							fontSize: 'clamp(13px, 2.5vw, 14px)',
							outline: 'none',
							resize: 'vertical',
							fontFamily: 'inherit',
							lineHeight: 1.5,
							transition: 'border-color 0.2s ease',
						}}
						required
					/>
				</div>

				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: '10px',
						marginTop: '8px',
						flexWrap: 'wrap',
					}}
				>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
							borderRadius: '10px',
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontSize: 'clamp(14px, 3vw, 16px)',
							cursor: 'pointer',
							fontWeight: 600,
							transition: 'all 0.2s ease',
						}}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={saving}
						style={{
							padding: 'clamp(10px, 2vw, 12px) clamp(16px, 3vw, 20px)',
							borderRadius: '10px',
							border: 'none',
							background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
							color: 'white',
							fontSize: 'clamp(14px, 3vw, 16px)',
							cursor: saving ? 'not-allowed' : 'pointer',
							fontWeight: 700,
							boxShadow: 'var(--shadow-md)',
							opacity: saving ? 0.7 : 1,
							transition: 'all 0.2s ease',
						}}
					>
						{saving ? 'Submitting…' : 'Submit Issue'}
					</button>
				</div>
			</form>
		</div>
	);
};

export default StudentIssues;
