import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import * as TeacherSvc from '../../services/teacherServices.js';

// --- Helper Components ---

const StatCard = ({ label, value, icon, color }) => (
	<div
		style={{
			background: 'var(--bg)',
			padding: '12px 16px',
			borderRadius: 12,
			border: '1px solid var(--border)',
			display: 'flex',
			alignItems: 'center',
			gap: 12,
		}}
	>
		<div
			style={{
				width: 36,
				height: 36,
				borderRadius: 8,
				background: color,
				color: '#fff',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: 16,
			}}
		>
			{icon}
		</div>
		<div>
			<div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{value}</div>
			<div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{label}</div>
		</div>
	</div>
);

const statusConfig = {
	submitted: { label: 'Submitted', color: '#3b82f6', icon: '📥' },
	evaluated: { label: 'Evaluated', color: '#10b981', icon: '🤖' },
	published: { label: 'Published', color: '#8b5cf6', icon: '✅' },
	'in-progress': { label: 'In Progress', color: '#f59e0b', icon: '⏳' },
};

// --- Main Views ---

// View 1: List of Exams with Submissions
const ExamResultsOverview = () => {
	const navigate = useNavigate();
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [exams, setExams] = React.useState([]);

	React.useEffect(() => {
		const loadExamsWithSubmissions = async () => {
			setLoading(true);
			try {
				// FIX: Pass the 'hasSubmissions: true' parameter to fetch only relevant exams.
				// This was the root cause of the invalid data issue.
				const res = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams, {
					hasSubmissions: true,
				});
				// The service now correctly returns only exams with submissions.
				setExams(res?.items || []);
			} catch (e) {
				setError(e.message || 'Failed to load exam results.');
			} finally {
				setLoading(false);
			}
		};
		loadExamsWithSubmissions();
	}, []);

	if (loading)
		return <div style={{ textAlign: 'center', padding: 40 }}>Loading Exam Results...</div>;
	if (error) return <Alert type="error">{error}</Alert>;

	return (
		<div>
			<PageHeader
				title="Exam Results"
				subtitle="Select an exam to view and manage its submissions."
				breadcrumbs={[{ label: 'Home', to: '/teacher' }, { label: 'Results' }]}
			/>
			{exams.length === 0 ? (
				<Alert>No exams with submissions found.</Alert>
			) : (
				<div
					style={{
						display: 'grid',
						gap: 20,
						gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 450px), 1fr))',
					}}
				>
					{exams.map(exam => (
						<article
							key={exam.id}
							style={{
								background: 'var(--surface)',
								border: '1px solid var(--border)',
								borderRadius: 16,
								display: 'flex',
								flexDirection: 'column',
								boxShadow: 'var(--shadow-sm)',
								transition: 'all .2s ease',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.transform = 'translateY(-2px)';
								e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
							}}
							onMouseLeave={e => {
								e.currentTarget.style.transform = 'translateY(0)';
								e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
							}}
						>
							<div style={{ padding: '20px 24px', flex: 1 }}>
								<h3
									style={{
										marginTop: 0,
										fontSize: 18,
										fontWeight: 800,
										lineHeight: 1.3,
									}}
								>
									{exam.title}
								</h3>
								<div
									style={{
										display: 'grid',
										gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
										gap: 12,
										marginTop: 16,
									}}
								>
									<StatCard
										label="Total Submissions"
										value={exam.submissions}
										icon="📋"
										color="#3b82f6"
									/>
									<StatCard
										label="Ready to Publish"
										value={exam.evaluatedCount}
										icon="🤖"
										color="#10b981"
									/>
									<StatCard
										label="Results Published"
										value={exam.publishedCount}
										icon="✅"
										color="#8b5cf6"
									/>
								</div>
							</div>
							<div style={{ padding: '0 24px 20px' }}>
								<button
									onClick={() => navigate(`/teacher/results/${exam.id}`)}
									className="tap"
									style={{
										width: '100%',
										padding: '12px',
										background: 'var(--bg)',
										border: '1px solid var(--border)',
										borderRadius: 10,
										fontWeight: 700,
										cursor: 'pointer',
										fontSize: 14,
									}}
								>
									View Submissions →
								</button>
							</div>
						</article>
					))}
				</div>
			)}
		</div>
	);
};

// View 2: List of Submissions for a Specific Exam
const ExamSubmissionsDetail = () => {
	const { examId } = useParams();
	const navigate = useNavigate();
	const { success, error: toastError } = useToast();
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [submissions, setSubmissions] = React.useState([]);
	const [examTitle, setExamTitle] = React.useState('');
	const [publishing, setPublishing] = React.useState({ all: false, single: null });

	const loadSubmissions = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			// Fetch both exam details and submissions
			const [examData, submissionsData] = await Promise.all([
				TeacherSvc.safeApiCall(TeacherSvc.getTeacherExamById, examId),
				TeacherSvc.safeApiCall(TeacherSvc.getTeacherSubmissions, examId),
			]);
			setExamTitle(examData?.title || 'Submissions');
			setSubmissions(submissionsData || []);
		} catch (e) {
			setError(e.message || 'Failed to load submissions.');
		} finally {
			setLoading(false);
		}
	}, [examId]);

	React.useEffect(() => {
		loadSubmissions();
	}, [loadSubmissions]);

	const handlePublishSingle = async submissionId => {
		setPublishing(p => ({ ...p, single: submissionId }));
		try {
			await TeacherSvc.safeApiCall(TeacherSvc.publishSingleResult, submissionId);
			success('Result published successfully!');
			await loadSubmissions(); // Refresh list
		} catch (e) {
			toastError(e.message || 'Failed to publish result.');
		} finally {
			setPublishing(p => ({ ...p, single: null }));
		}
	};

	const handlePublishAll = async () => {
		setPublishing(p => ({ ...p, all: true }));
		try {
			const res = await TeacherSvc.safeApiCall(TeacherSvc.publishAllResults, examId);
			success(`${res.modifiedCount} results published!`);
			await loadSubmissions(); // Refresh list
		} catch (e) {
			toastError(e.message || 'Failed to publish all results.');
		} finally {
			setPublishing(p => ({ ...p, all: false }));
		}
	};

	if (loading)
		return <div style={{ textAlign: 'center', padding: 40 }}>Loading Submissions...</div>;
	if (error) return <Alert type="error">{error}</Alert>;

	const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;

	return (
		<div>
			<PageHeader
				title={examTitle}
				subtitle={`Managing ${submissions.length} submissions`}
				breadcrumbs={[
					{ label: 'Home', to: '/teacher' },
					{ label: 'Results', to: '/teacher/results' },
					{ label: examTitle },
				]}
				actions={[
					<button
						key="publish"
						onClick={handlePublishAll}
						disabled={publishing.all || evaluatedCount === 0}
						className="tap"
						style={{
							padding: '10px 16px',
							background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
							color: 'white',
							border: 'none',
							borderRadius: 8,
							fontWeight: 700,
							cursor: 'pointer',
							opacity: publishing.all || evaluatedCount === 0 ? 0.6 : 1,
						}}
					>
						{publishing.all ? 'Publishing...' : `Publish All (${evaluatedCount})`}
					</button>,
				]}
			/>
			<style>{`
        .sub-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr auto;
          align-items: center;
          gap: 16px;
          padding: 12px 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
        }
        @media (max-width: 768px) {
          .sub-row {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 16px;
          }
          .sub-row-actions {
            display: flex;
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
          .sub-row-actions > button {
            width: 100%;
            padding: 10px;
          }
        }
      `}</style>

			{submissions.length === 0 ? (
				<Alert>No submissions found for this exam yet.</Alert>
			) : (
				<div style={{ display: 'grid', gap: 12 }}>
					{submissions.map(sub => {
						const config = statusConfig[sub.status] || {};
						return (
							<div key={sub.id} className="sub-row">
								<div style={{ fontWeight: 700, color: 'var(--text)' }}>
									{sub.studentName || 'Unknown Student'}
								</div>
								<div>
									Score:{' '}
									<strong style={{ color: 'var(--text)' }}>
										{(sub.score ?? 0).toFixed(1)} / {sub.maxScore ?? 'N/A'}
									</strong>
								</div>
								<div
									style={{
										display: 'inline-flex',
										alignItems: 'center',
										gap: 6,
										padding: '4px 10px',
										borderRadius: 20,
										background: config.color,
										color: 'white',
										fontSize: 12,
										fontWeight: 700,
									}}
								>
									{config.icon} {config.label}
								</div>
								<div
									className="sub-row-actions"
									style={{ display: 'flex', gap: 8 }}
								>
									<button
										onClick={() =>
											navigate(`/teacher/results/${examId}/grade/${sub.id}`)
										}
										disabled={sub.status === 'in-progress'}
										className="tap"
										style={{
											padding: '8px 12px',
											fontWeight: 600,
											borderRadius: 6,
											border: '1px solid var(--border)',
											background: 'var(--bg)',
										}}
									>
										View/Grade
									</button>
									{sub.status === 'evaluated' && (
										<button
											onClick={() => handlePublishSingle(sub.id)}
											disabled={publishing.single === sub.id}
											className="tap"
											style={{
												padding: '8px 12px',
												fontWeight: 600,
												borderRadius: 6,
												border: 'none',
												background: 'var(--primary-gradient)',
												color: '#fff',
											}}
										>
											{publishing.single === sub.id ? '...' : 'Publish'}
										</button>
									)}
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
};

// --- Router Component ---

const TeacherResults = () => {
	const { examId } = useParams(); // Use useParams to get the examId from the URL

	// If an examId is present in the URL, render the detail view.
	// Otherwise, render the overview of all exams with submissions.
	return examId ? <ExamSubmissionsDetail /> : <ExamResultsOverview />;
};

export default TeacherResults;
