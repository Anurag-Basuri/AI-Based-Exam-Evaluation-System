import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
	safeApiCall,
	getMySubmissions,
	searchExamByCode,
	startExam,
} from '../../services/studentServices.js';

const statusStyles = {
	'in-progress': {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#f59e0b',
		label: 'In Progress',
		icon: '🟡',
	},
	started: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#f59e0b',
		label: 'Started',
		icon: '🟡',
	},
	submitted: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#3b82f6',
		label: 'Submitted',
		icon: '📋',
	},
	evaluated: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: '#10b981',
		label: 'Evaluated',
		icon: '✅',
	},
	pending: {
		bg: 'var(--surface)',
		border: 'var(--border)',
		color: 'var(--text-muted)',
		label: 'Pending',
		icon: '⏳',
	},
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
	const config = statusStyles[submission.status] || statusStyles.pending;
	const canContinue = ['in-progress', 'started'].includes(submission.status);
	const hasScore = submission.score !== null && submission.score !== undefined;
	const pct =
		hasScore && submission.maxScore > 0
			? Math.round((submission.score / submission.maxScore) * 100)
			: null;
	return (
		<article
			style={{
				background: 'var(--surface)',
				borderRadius: 16,
				border: '1px solid var(--border)',
				boxShadow: 'var(--shadow-md)',
				padding: '20px',
				transition: 'all 0.2s ease',
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
							fontSize: '16px',
							fontWeight: 700,
							color: 'var(--text)',
							flex: 1,
						}}
					>
						{submission.examTitle}
					</h3>
					<span
						style={{
							display: 'flex',
							alignItems: 'center',
							gap: '6px',
							fontSize: '12px',
							padding: '4px 10px',
							borderRadius: '16px',
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
					{submission.startedAt && (
						<div>
							<strong style={{ color: 'var(--text)' }}>Started:</strong>{' '}
							{submission.startedAt}
						</div>
					)}
					{submission.submittedAt && (
						<div>
							<strong style={{ color: 'var(--text)' }}>Submitted:</strong>{' '}
							{submission.submittedAt}
						</div>
					)}
				</div>
			</header>

			{hasScore && (
				<div
					style={{
						background: 'var(--surface)',
						borderRadius: 12,
						padding: '12px',
						border: '1px solid var(--border)',
						marginBottom: '16px',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
						<span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
							{submission.score}
						</span>
						<span style={{ color: 'var(--text-muted)' }}>
							/ {submission.maxScore ?? 0}
						</span>
						{pct !== null && (
							<span
								style={{
									marginLeft: 'auto',
									color: pct >= 70 ? '#10b981' : '#ef4444',
									fontWeight: 600,
								}}
							>
								{pct}%
							</span>
						)}
					</div>
				</div>
			)}

			<footer>
				<div
					style={{
						display: 'flex',
						gap: '12px',
						flexWrap: 'wrap',
						justifyContent: 'flex-end',
					}}
				>
					{canContinue && !isContinuing && (
						<button
							onClick={onContinue}
							style={{
								padding: '10px 16px',
								borderRadius: '8px',
								border: 'none',
								background: 'linear-gradient(135deg, #10b981, #059669)',
								color: '#ffffff',
								cursor: 'pointer',
								fontWeight: 600,
								fontSize: '14px',
								flex: '1 1 120px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '6px',
							}}
						>
							▶️ Continue Exam
						</button>
					)}
					{!canContinue && (
						<button
							disabled
							style={{
								padding: '10px 16px',
								borderRadius: '8px',
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text-muted)',
								cursor: 'not-allowed',
								fontWeight: 600,
								fontSize: '14px',
								flex: '1 1 120px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '6px',
							}}
						>
							⏳ Waiting to Continue
						</button>
					)}
					{hasScore && (
						<button
							onClick={onContinue}
							style={{
								padding: '10px 16px',
								borderRadius: '8px',
								border: 'none',
								background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
								color: '#ffffff',
								cursor: 'pointer',
								fontWeight: 600,
								fontSize: '14px',
								flex: '1 1 120px',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '6px',
							}}
						>
							📊 View Results
						</button>
					)}
				</div>
			</footer>
		</article>
	);
};

const StudentExams = () => {
	const navigate = useNavigate();
	const [submissions, setSubmissions] = React.useState([]);
	const [searchCode, setSearchCode] = React.useState('');
	const [foundExam, setFoundExam] = React.useState(null);
	const [error, setError] = React.useState('');
	const [message, setMessage] = React.useState('');
	const [searching, setSearching] = React.useState(false);

	const CODE_LENGTH = 8;

	React.useEffect(() => {
		const fetchData = async () => {
			const result = await getMySubmissions();
			setSubmissions(result);
		};

		fetchData();
	}, []);

	const handleSearch = async e => {
		e.preventDefault();
		const cleaned = (searchCode || '').trim().toUpperCase();
		if (!cleaned || cleaned.length !== CODE_LENGTH) {
			setError(`Please enter a valid ${CODE_LENGTH}-character exam code.`);
			return;
		}

		setError('');
		setSearching(true);

		const result = await searchExamByCode(cleaned);

		setSearching(false);

		if (result?.length === 1) {
			setFoundExam(result[0]);
			setMessage('');
		} else if (result?.length > 1) {
			setFoundExam(null);
			setMessage('Multiple exams found. Please contact support.');
		} else {
			setFoundExam(null);
			setMessage('No exam found with this code.');
		}
	};

	const handleContinue = async submission => {
		if (submission.status === 'in-progress' || submission.status === 'started') {
			navigate(`/student/exam/${submission.examId}`);
		}
	};

	return (
		<section style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
			<h1
				style={{
					fontSize: '28px',
					fontWeight: 800,
					color: 'var(--text)',
					marginBottom: '24px',
				}}
			>
				My Exams
			</h1>

			<form
				onSubmit={handleSearch}
				style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}
			>
				<div style={{ flex: 1, minWidth: 260 }}>
					<label
						style={{
							display: 'block',
							marginBottom: 6,
							fontWeight: 600,
							color: 'var(--text)',
						}}
					>
						Exam Search Code
					</label>
					<input
						value={searchCode}
						onChange={e =>
							setSearchCode(
								e.target.value
									.toUpperCase()
									.replace(/[^A-Z0-9]/g, '')
									.slice(0, CODE_LENGTH),
							)
						}
						placeholder={`Enter your ${CODE_LENGTH}-char exam code…`}
						pattern={`^[A-Z0-9]{${CODE_LENGTH}}$`}
						maxLength={CODE_LENGTH}
						title={`Enter exactly ${CODE_LENGTH} characters: A–Z and 0–9`}
						required
						style={{
							width: '100%',
							padding: '12px 16px',
							borderRadius: 12,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							outline: 'none',
							fontSize: '14px',
							fontWeight: 500,
						}}
					/>
				</div>
				<button
					type="submit"
					disabled={searching}
					style={{
						padding: '12px 16px',
						borderRadius: '8px',
						border: 'none',
						background: searching
							? '#9ca3af'
							: 'linear-gradient(135deg, #10b981, #059669)',
						color: '#ffffff',
						cursor: searching ? 'not-allowed' : 'pointer',
						fontWeight: 600,
						fontSize: '14px',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						gap: '6px',
					}}
				>
					{searching ? '⏳ Searching...' : '🔍 Search Exam'}
				</button>
				<button
					type="button"
					onClick={() => {
						setSearchCode('');
						setFoundExam(null);
						setMessage('');
						setError('');
					}}
					disabled={searching}
					style={{
						padding: '12px 16px',
						borderRadius: '8px',
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						cursor: searching ? 'not-allowed' : 'pointer',
						fontWeight: 600,
						fontSize: '14px',
					}}
				>
					✨ Clear
				</button>
			</form>

			{error && (
				<div
					style={{
						background: '#fee2e2',
						color: '#b91c1c',
						padding: '12px',
						borderRadius: 8,
						border: '1px solid #fca5a5',
						marginTop: '16px',
					}}
				>
					{error}
				</div>
			)}
			{message && (
				<div
					style={{
						background: '#d1fae5',
						color: '#15803d',
						padding: '12px',
						borderRadius: 8,
						border: '1px solid #6ee7b7',
						marginTop: '16px',
					}}
				>
					{message}
				</div>
			)}

			{foundExam && (
				<div
					style={{
						background: 'var(--surface)',
						borderRadius: 12,
						padding: '16px',
						border: '1px solid var(--border)',
						marginTop: '24px',
					}}
				>
					<h3
						style={{
							margin: 0,
							fontSize: '18px',
							fontWeight: 700,
							color: 'var(--text)',
							marginBottom: '12px',
						}}
					>
						Exam Details
					</h3>
					<div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
						<strong style={{ color: 'var(--text)' }}>Code:</strong> {foundExam.code}
					</div>
					<div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
						<strong style={{ color: 'var(--text)' }}>Title:</strong> {foundExam.title}
					</div>
					<div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
						<strong style={{ color: 'var(--text)' }}>Instructor:</strong>{' '}
						{foundExam.instructor}
					</div>
					<div style={{ marginBottom: '12px', color: 'var(--text-muted)' }}>
						<strong style={{ color: 'var(--text)' }}>Schedule:</strong>{' '}
						{foundExam.schedule}
					</div>
					<div style={{ marginBottom: '16px', color: 'var(--text-muted)' }}>
						<strong style={{ color: 'var(--text)' }}>Status:</strong>{' '}
						<span
							style={{
								color:
									foundExam.status === 'completed'
										? '#10b981'
										: foundExam.status === 'in-progress'
										? '#f59e0b'
										: '#ef4444',
							}}
						>
							{foundExam.status.replace('-', ' ')}
						</span>
					</div>

					{foundExam.status === 'in-progress' && (
						<button
							onClick={() => handleContinue(foundExam)}
							style={{
								padding: '12px 16px',
								borderRadius: '8px',
								border: 'none',
								background: 'linear-gradient(135deg, #10b981, #059669)',
								color: '#ffffff',
								cursor: 'pointer',
								fontWeight: 600,
								fontSize: '14px',
								width: '100%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '6px',
							}}
						>
							▶️ Continue Exam
						</button>
					)}
				</div>
			)}

			{submissions.length === 0 && !searching && (
				<div
					style={{
						background: 'var(--surface)',
						borderRadius: 12,
						padding: '16px',
						border: '1px solid var(--border)',
						marginTop: '24px',
						textAlign: 'center',
					}}
				>
					<p style={{ color: 'var(--text-muted)', marginBottom: '12px' }}>
						No exams found. Take one of the following actions:
					</p>
					<button
						onClick={() => navigate('/student/exams/create')}
						style={{
							padding: '12px 16px',
							borderRadius: '8px',
							border: 'none',
							background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
							color: '#ffffff',
							cursor: 'pointer',
							fontWeight: 600,
							fontSize: '14px',
							marginRight: '8px',
						}}
					>
						➕ Create New Exam
					</button>
					<button
						onClick={() => navigate('/student/exams/join')}
						style={{
							padding: '12px 16px',
							borderRadius: '8px',
							border: 'none',
							background: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#ffffff',
							cursor: 'pointer',
							fontWeight: 600,
							fontSize: '14px',
						}}
					>
						📚 Join Existing Exam
					</button>
				</div>
			)}

			{submissions.length > 0 && (
				<div style={{ marginTop: '24px' }}>
					<h2
						style={{
							fontSize: '22px',
							fontWeight: 700,
							color: 'var(--text)',
							marginBottom: '16px',
						}}
					>
						Previous Exams
					</h2>
					<div style={{ display: 'grid', gap: '16px' }}>
						{submissions.map(submission => (
							<PreviousExamCard
								key={submission.id}
								submission={submission}
								onContinue={() => handleContinue(submission)}
								isContinuing={false}
							/>
						))}
					</div>
				</div>
			)}
		</section>
	);
};

export default StudentExams;
