import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import Alert from '../../components/ui/Alert.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import * as StudentSvc from '../../services/studentServices.js';

const statusStyles = {
	'in-progress': { color: '#f59e0b', label: 'In Progress', icon: '🟡' },
	started: { color: '#f59e0b', label: 'Started', icon: '🟡' },
	submitted: { color: '#3b82f6', label: 'Submitted', icon: '📋' },
	evaluated: { color: '#10b981', label: 'Evaluated', icon: '✅' },
	pending: { color: 'var(--text-muted)', label: 'Pending', icon: '⏳' },
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
	const cfg = statusStyles[submission.status] || statusStyles.pending;
	const hasScore = submission.score != null;
	const pct =
		hasScore && submission.maxScore > 0
			? Math.round((submission.score / submission.maxScore) * 100)
			: null;

	return (
		<article
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 14,
				padding: 14,
				boxShadow: 'var(--shadow-md)',
			}}
		>
			<div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
				<strong style={{ color: 'var(--text)', fontSize: 16, flex: 1 }}>
					{submission.examTitle}
				</strong>
				<span
					style={{
						display: 'inline-flex',
						alignItems: 'center',
						gap: 6,
						fontSize: 12,
						padding: '6px 10px',
						borderRadius: 20,
						border: '1px solid var(--border)',
						background: 'var(--bg)',
						color: cfg.color,
						fontWeight: 800,
					}}
				>
					<span>{cfg.icon}</span>
					{cfg.label}
				</span>
			</div>
			{hasScore && (
				<div
					style={{
						background: 'var(--bg)',
						border: '1px solid var(--border)',
						borderRadius: 12,
						padding: 8,
						marginBottom: 8,
						display: 'flex',
						alignItems: 'center',
						gap: 8,
					}}
				>
					<span style={{ fontWeight: 800, color: 'var(--text)' }}>
						{submission.score}
					</span>
					<span style={{ color: 'var(--text-muted)' }}>/ {submission.maxScore ?? 0}</span>
					{pct != null && (
						<span
							style={{
								marginLeft: 'auto',
								color: pct >= 70 ? '#10b981' : '#ef4444',
								fontWeight: 800,
								fontSize: 12,
							}}
						>
							{pct}%
						</span>
					)}
				</div>
			)}
			{['in-progress', 'started'].includes(submission.status) && (
				<div style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<button
						onClick={() => onContinue(submission)}
						disabled={isContinuing}
						className="tap"
						style={{
							padding: '8px 12px',
							borderRadius: 8,
							border: 'none',
							background: isContinuing
								? '#9ca3af'
								: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
							color: '#fff',
							fontWeight: 800,
							cursor: isContinuing ? 'not-allowed' : 'pointer',
						}}
					>
						{isContinuing ? 'Opening…' : 'Continue'}
					</button>
				</div>
			)}
		</article>
	);
};

const StudentExams = () => {
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();

	const CODE_LEN = 8;
	const [code, setCode] = React.useState('');
	const [searching, setSearching] = React.useState(false);
	const [found, setFound] = React.useState(null);
	const [submissions, setSubmissions] = React.useState([]);
	const [errorBanner, setErrorBanner] = React.useState('');
	const [continuingId, setContinuingId] = React.useState('');

	const loadMine = React.useCallback(async () => {
		try {
			const list = await StudentSvc.safeApiCall(StudentSvc.getMySubmissions);
			setSubmissions(Array.isArray(list) ? list : []);
		} catch (e) {
			setErrorBanner(e?.message || 'Failed to load your submissions');
		}
	}, []);

	React.useEffect(() => {
		loadMine();
	}, [loadMine]);

	const handleSearch = async e => {
		e?.preventDefault?.();
		setErrorBanner('');
		const cleaned = (code || '').trim().toUpperCase();
		if (!cleaned || cleaned.length !== CODE_LEN) {
			setErrorBanner(`Enter a valid ${CODE_LEN}-character code`);
			return;
		}
		setSearching(true);
		setFound(null);
		try {
			const exam = await StudentSvc.safeApiCall(StudentSvc.searchExamByCode, cleaned);
			setFound(exam || null);
			if (!exam) setErrorBanner('No exam found for this code');
		} catch (e) {
			setErrorBanner(e?.message || 'Search failed');
		} finally {
			setSearching(false);
		}
	};

	const handleStart = async () => {
		if (!found?.id) return;
		try {
			await StudentSvc.safeApiCall(StudentSvc.startExam, found.id);
			success('Exam started');
			navigate(`/student/take/${encodeURIComponent(found.id)}`);
		} catch (e) {
			setErrorBanner(e?.message || 'Unable to start exam');
		}
	};

	const handleContinue = async sub => {
		try {
			setContinuingId(sub.id);
			navigate(`/student/take/${encodeURIComponent(sub.examId)}`);
		} finally {
			setContinuingId('');
		}
	};

	return (
		<div style={{ maxWidth: 1100, margin: '0 auto' }}>
			<PageHeader
				title="Student Exams"
				subtitle="Search by code to join a live/scheduled exam. Continue where you left off."
				breadcrumbs={[{ label: 'Home', to: '/student' }, { label: 'Exams' }]}
				actions={[
					<button
						key="results"
						onClick={() => navigate('/student/results')}
						className="tap"
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 800,
						}}
					>
						📊 My Results
					</button>,
				]}
			/>

			{errorBanner && (
				<div style={{ marginBottom: 12 }}>
					<Alert type="error" onClose={() => setErrorBanner('')}>
						{errorBanner}
					</Alert>
				</div>
			)}

			<section
				style={{
					background: 'var(--surface)',
					border: '1px solid var(--border)',
					borderRadius: 16,
					padding: 16,
					marginBottom: 16,
				}}
			>
				<form
					onSubmit={handleSearch}
					style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}
				>
					<div style={{ position: 'relative', flex: '1 1 320px' }}>
						<label
							htmlFor="exam-code"
							style={{
								display: 'block',
								marginBottom: 6,
								fontWeight: 800,
								color: 'var(--text)',
							}}
						>
							Exam share code
						</label>
						<input
							id="exam-code"
							value={code}
							onChange={e =>
								setCode(
									e.target.value
										.toUpperCase()
										.replace(/[^A-Z0-9]/g, '')
										.slice(0, CODE_LEN),
								)
							}
							placeholder={`Enter ${CODE_LEN}-character code`}
							pattern={`^[A-Z0-9]{${CODE_LEN}}$`}
							maxLength={CODE_LEN}
							required
							style={{
								width: '100%',
								padding: '12px 16px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								fontWeight: 600,
							}}
						/>
					</div>
					<button
						type="submit"
						disabled={searching}
						className="tap"
						style={{
							padding: '12px 16px',
							borderRadius: 10,
							border: 'none',
							background: searching
								? '#9ca3af'
								: 'linear-gradient(135deg, #6366f1, #4f46e5)',
							color: '#fff',
							fontWeight: 900,
							cursor: searching ? 'not-allowed' : 'pointer',
						}}
					>
						{searching ? 'Searching…' : '🔍 Search'}
					</button>
					<button
						type="button"
						onClick={() => {
							setCode('');
							setFound(null);
							setErrorBanner('');
						}}
						className="tap"
						style={{
							padding: '12px 16px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 800,
						}}
					>
						✨ Clear
					</button>
				</form>

				{found && (
					<div
						style={{
							marginTop: 12,
							display: 'grid',
							gap: 10,
							borderTop: '1px solid var(--border)',
							paddingTop: 12,
						}}
					>
						<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
							<strong style={{ fontSize: 18, color: 'var(--text)' }}>
								{found.title}
							</strong>
							<span
								style={{
									marginLeft: 'auto',
									color: 'var(--text-muted)',
									fontWeight: 700,
								}}
							>
								Duration: {found.duration} min
							</span>
						</div>
						<p style={{ margin: 0, color: 'var(--text-muted)' }}>{found.description}</p>
						<div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
							<button
								onClick={handleStart}
								className="tap"
								style={{
									padding: '10px 14px',
									borderRadius: 10,
									border: 'none',
									background: 'linear-gradient(135deg, #10b981, #059669)',
									color: '#fff',
									fontWeight: 900,
									cursor: 'pointer',
								}}
							>
								🚀 Start exam
							</button>
						</div>
					</div>
				)}
			</section>

			<section>
				<h2 style={{ margin: '0 0 8px 0', color: 'var(--text)', fontSize: 18 }}>
					Previous
				</h2>
				{submissions.length === 0 ? (
					<div
						style={{
							padding: '40px 16px',
							textAlign: 'center',
							background: 'var(--surface)',
							borderRadius: 16,
							border: '2px dashed var(--border)',
						}}
					>
						<div style={{ fontSize: 36, marginBottom: 10 }}>📝</div>
						<div style={{ color: 'var(--text-muted)' }}>
							No submissions yet. Join an exam using a share code.
						</div>
					</div>
				) : (
					<div
						style={{
							display: 'grid',
							gap: 12,
							gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
						}}
					>
						{submissions.map(s => (
							<PreviousExamCard
								key={s.id}
								submission={s}
								onContinue={handleContinue}
								isContinuing={s.id === continuingId}
							/>
						))}
					</div>
				)}
			</section>
		</div>
	);
};

export default StudentExams;
