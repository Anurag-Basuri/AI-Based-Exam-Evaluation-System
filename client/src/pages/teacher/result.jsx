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
				// We use getMyExams which now returns submission counts
				const res = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams);
				// Filter to only show exams that have at least one submission
				const examsWithSubmissions = (res?.items || []).filter(e => e.submissionCount > 0);
				setExams(examsWithSubmissions);
			} catch (e) {
				setError(e.message || 'Failed to load exam results.');
			} finally {
				setLoading(false);
			}
		};
		loadExamsWithSubmissions();
	}, []);

	if (loading) return <div>Loading Exam Results...</div>;
	if (error) return <Alert type="error">{error}</Alert>;

	return (
		<div>
			<PageHeader
				title="Exam Results"
				subtitle="Select an exam to view and manage its submissions."
			/>
			{exams.length === 0 ? (
				<Alert>No exams with submissions found.</Alert>
			) : (
				<div style={{ display: 'grid', gap: 24 }}>
					{exams.map(exam => (
						<article
							key={exam._id}
							style={{
								background: 'var(--surface)',
								border: '1px solid var(--border)',
								borderRadius: 16,
								padding: 24,
								boxShadow: 'var(--shadow-sm)',
							}}
						>
							<h3 style={{ marginTop: 0, fontSize: 20, fontWeight: 800 }}>
								{exam.title}
							</h3>
							<div
								style={{
									display: 'grid',
									gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
									gap: 16,
									marginBottom: 24,
								}}
							>
								<StatCard
									label="Total Submissions"
									value={exam.submissionCount}
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
							<button
								onClick={() => navigate(`/teacher/results/${exam._id}`)}
								style={{
									width: '100%',
									padding: '12px',
									background: 'var(--bg)',
									border: '1px solid var(--border)',
									borderRadius: 10,
									fontWeight: 700,
									cursor: 'pointer',
								}}
							>
								View Submissions →
							</button>
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
		try {
			const data = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherSubmissions, examId);
			setSubmissions(data || []);
			if (data.length > 0) {
				setExamTitle(data[0].exam?.title || 'Submissions');
			}
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

	if (loading) return <div>Loading Submissions...</div>;
	if (error) return <Alert type="error">{error}</Alert>;

	const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;

	return (
		<div>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<PageHeader
					title={examTitle}
					subtitle={`Managing ${submissions.length} submissions`}
				/>
				<button
					onClick={handlePublishAll}
					disabled={publishing.all || evaluatedCount === 0}
					style={{
						padding: '10px 16px',
						background: '#8b5cf6',
						color: 'white',
						border: 'none',
						borderRadius: 8,
						fontWeight: 700,
						cursor: 'pointer',
						opacity: publishing.all || evaluatedCount === 0 ? 0.5 : 1,
					}}
				>
					{publishing.all ? 'Publishing...' : `Publish All (${evaluatedCount})`}
				</button>
			</div>

			<div style={{ display: 'grid', gap: 16 }}>
				{submissions.map(sub => {
					const config = statusConfig[sub.status] || {};
					const totalScore = (sub.evaluations || []).reduce(
						(acc, e) => acc + (e.evaluation?.marks || 0),
						0,
					);
					// Calculate the maximum possible score for the submission
					const maxScore = (sub.answers || []).reduce(
						(acc, a) => acc + (a.question?.max_marks || 0),
						0,
					);
					return (
						<div
							key={sub._id}
							style={{
								display: 'grid',
								gridTemplateColumns: '1fr 1fr auto auto',
								alignItems: 'center',
								gap: 16,
								padding: '12px 20px',
								background: 'var(--surface)',
								border: '1px solid var(--border)',
								borderRadius: 12,
							}}
						>
							<strong>{sub.student?.fullname || 'Unknown Student'}</strong>
							<div>
								{/* Show score relative to max score */}
								Score:{' '}
								<strong>
									{totalScore.toFixed(1)} / {maxScore}
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
							<div style={{ display: 'flex', gap: 8 }}>
								<button
									onClick={() =>
										navigate(`/teacher/results/${examId}/grade/${sub._id}`)
									}
									disabled={sub.status === 'in-progress'}
								>
									View/Grade
								</button>
								{sub.status === 'evaluated' && (
									<button
										onClick={() => handlePublishSingle(sub._id)}
										disabled={publishing.single === sub._id}
									>
										{publishing.single === sub._id ? '...' : 'Publish'}
									</button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
};

// --- Router Component ---

const TeacherResults = () => {
	const location = useLocation();
	// Check if the URL has an ID param to decide which view to show
	const isDetailView = /^\/teacher\/results\/.+/.test(location.pathname);

	return isDetailView ? <ExamSubmissionsDetail /> : <ExamResultsOverview />;
};

export default TeacherResults;
