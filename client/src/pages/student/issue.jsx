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

const IssueCard = ({ issue }) => {
	const config = statusStyles[issue.status] || statusStyles.open;

	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: '24px',
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
					}}
				>
					<h3
						style={{
							margin: 0,
							fontSize: '18px',
							fontWeight: 700,
							color: 'var(--text)',
							flex: 1,
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
						}}
					>
						<span>{config.icon}</span>
						{config.label}
					</span>
				</div>

				<div
					style={{
						display: 'flex',
						gap: '16px',
						color: 'var(--text-muted)',
						fontSize: '13px',
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
					background: 'var(--bg)',
					borderRadius: 12,
					padding: '16px',
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
						fontSize: '14px',
					}}
				>
					{issue.description}
				</p>
			</div>

			{issue.reply ? (
				<div
					style={{
						background: statusStyles.resolved.bg,
						borderRadius: 12,
						padding: '16px',
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
							fontSize: '14px',
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
						fontSize: '14px',
						fontWeight: 500,
						textAlign: 'center',
						padding: '12px',
						background: config.bg,
						borderRadius: 8,
						border: `1px solid ${config.border}`,
					}}
				>
					{issue.status === 'in-progress'
						? '⏳ A teacher is looking into your issue.'
						: '⏳ Awaiting teacher response.'}
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
			query: { userId: user.id },
			withCredentials: true,
		});

		socket.on('issue-update', updatedIssue => {
			setIssues(prevIssues =>
				prevIssues.map(issue => (issue.id === updatedIssue.id ? updatedIssue : issue)),
			);
			toast.info(`Status for "${updatedIssue.examTitle}" is now ${updatedIssue.status}.`);
		});

		socket.on('new-issue', newIssue => {
			if (newIssue.student?._id === user.id) {
				setIssues(prevIssues => [newIssue, ...prevIssues]);
			}
		});

		return () => {
			socket.disconnect();
		};
	}, [user, toast]);

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
			setError(e.message || 'Could not submit issue');
		} finally {
			setSaving(false);
		}
	};

	const hasSubmissions = submissions.length > 0;

	return (
		<section style={{ maxWidth: 1000, margin: '0 auto' }}>
			<header
				style={{
					background: 'var(--surface)',
					padding: '24px',
					borderRadius: 16,
					border: '1px solid var(--border)',
					boxShadow: 'var(--shadow-md)',
					marginBottom: '24px',
					display: 'flex',
					flexWrap: 'wrap',
					gap: 12,
					justifyContent: 'space-between',
					alignItems: 'center',
				}}
			>
				<div>
					<h1 style={{ margin: 0, fontSize: '24px', color: 'var(--text)' }}>
						Support & Issues
					</h1>
					<p style={{ margin: '6px 0 0', color: 'var(--text-muted)' }}>
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
						padding: '10px 16px',
						borderRadius: 12,
						border: 'none',
						background: 'var(--primary-gradient)',
						color: 'var(--primary-contrast)',
						fontWeight: 700,
						cursor: !hasSubmissions || loading ? 'not-allowed' : 'pointer',
						boxShadow: 'var(--shadow-lg)',
						opacity: !hasSubmissions || loading ? 0.6 : 1,
						transition: 'opacity 0.2s ease, transform 0.2s ease',
					}}
				>
					➕ Create New Issue
				</button>
			</header>

			{error && (
				<div
					style={{
						padding: '14px',
						borderRadius: 12,
						background: 'var(--danger-bg)',
						border: '1px solid var(--danger-border)',
						color: 'var(--danger-text)',
						fontWeight: 600,
						marginBottom: '16px',
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
				<div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '40px' }}>
					Loading your issues…
				</div>
			)}

			{!loading && !issues.length && (
				<div
					style={{
						padding: '40px',
						borderRadius: 16,
						border: '2px dashed var(--border)',
						textAlign: 'center',
						color: 'var(--text-muted)',
					}}
				>
					<div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
					<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>No Issues Found</h3>
					<p style={{ margin: 0 }}>
						You haven't created any issues yet. Use the button above to create one.
					</p>
				</div>
			)}

			{!loading && issues.length > 0 && (
				<div
					style={{
						display: 'grid',
						gap: '20px',
						// Make grid columns responsive: min 320px, max 1fr
						gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
					}}
				>
					{issues.map(issue => (
						<IssueCard key={issue.id} issue={issue} />
					))}
				</div>
			)}
		</section>
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
				background: 'rgba(0,0,0,0.5)',
				backdropFilter: 'blur(4px)',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				zIndex: 1000,
				padding: 16,
			}}
		>
			<form
				onSubmit={onSubmit}
				style={{
					background: 'var(--surface)',
					borderRadius: 16,
					border: '1px solid var(--border)',
					boxShadow: 'var(--shadow-xl)',
					padding: '24px',
					width: '100%',
					// Ensure modal does not exceed screen width on mobile
					maxWidth: 'min(500px, 95vw)',
					display: 'grid',
					gap: '16px',
				}}
			>
				<h2 style={{ margin: 0, color: 'var(--text)' }}>Create New Issue</h2>
				<div style={{ display: 'grid', gap: 8 }}>
					<label
						htmlFor="issue-submission"
						style={{ fontWeight: 700, color: 'var(--text)' }}
					>
						Related Exam
					</label>
					<select
						id="issue-submission"
						value={form.submissionId}
						onChange={e => setForm(s => ({ ...s, submissionId: e.target.value }))}
						style={{
							padding: '10px 12px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--bg)',
							color: 'var(--text)',
							outline: 'none',
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

				<div style={{ display: 'grid', gap: 8 }}>
					<label htmlFor="issue-type" style={{ fontWeight: 700, color: 'var(--text)' }}>
						Issue Type
					</label>
					<select
						id="issue-type"
						value={form.issueType}
						onChange={e => setForm(s => ({ ...s, issueType: e.target.value }))}
						style={{
							padding: '10px 12px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--bg)',
							color: 'var(--text)',
							outline: 'none',
						}}
						required
					>
						<option value="evaluation">Evaluation/Grading Issue</option>
						<option value="question">Problem with a Question</option>
						<option value="technical">Technical Problem</option>
						<option value="other">Other</option>
					</select>
				</div>

				<div style={{ display: 'grid', gap: 8 }}>
					<label htmlFor="issue-desc" style={{ fontWeight: 700, color: 'var(--text)' }}>
						Description
					</label>
					<textarea
						id="issue-desc"
						value={form.description}
						onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
						placeholder="Please describe the problem in detail."
						rows={5}
						style={{
							padding: '10px 12px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--bg)',
							color: 'var(--text)',
							outline: 'none',
							resize: 'vertical',
						}}
						required
					/>
				</div>

				<div
					style={{
						display: 'flex',
						justifyContent: 'flex-end',
						gap: 10,
						marginTop: '8px',
					}}
				>
					<button
						type="button"
						onClick={onClose}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							cursor: 'pointer',
							fontWeight: 700,
						}}
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={saving}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: 'none',
							background: 'var(--primary-gradient)',
							color: 'var(--primary-contrast)',
							cursor: 'pointer',
							fontWeight: 700,
							boxShadow: 'var(--shadow-lg)',
							opacity: saving ? 0.7 : 1,
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
