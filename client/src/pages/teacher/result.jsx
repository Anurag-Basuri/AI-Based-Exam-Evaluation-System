import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';
import * as TeacherSvc from '../../services/teacherServices.js';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from 'recharts';

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

const ScoreDistributionChart = ({ submissions }) => {
	const data = React.useMemo(() => {
		const bins = Array(10).fill(0);
		let total = 0;
		submissions.forEach(s => {
			if (s.score !== null && s.maxScore > 0) {
				const percentage = (s.score / s.maxScore) * 100;
				// Clamp to 0-9 index
				const binIndex = Math.min(9, Math.floor(percentage / 10));
				bins[binIndex]++;
				total++;
			}
		});

		return bins.map((count, i) => ({
			name: `${i * 10}-${i * 10 + 10}%`,
			count,
			label: `${count}`,
		}));
	}, [submissions]);

	const hasData = data.some(d => d.count > 0);

	if (!hasData) {
		return (
			<div className="p-6 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-500 h-[300px]">
				<div className="text-4xl mb-2">📊</div>
				<p>No graded submissions to display yet.</p>
			</div>
		);
	}

	return (
		<div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm h-[350px] flex flex-col">
			<h4 className="text-lg font-bold text-gray-900 mb-4">Score Distribution</h4>
			<div className="flex-1 w-full min-h-0">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
						<XAxis
							dataKey="name"
							axisLine={false}
							tickLine={false}
							tick={{ fill: '#64748b', fontSize: 11 }}
							dy={10}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fill: '#64748b', fontSize: 11 }}
							allowDecimals={false}
						/>
						<Tooltip
							cursor={{ fill: '#f8fafc' }}
							contentStyle={{
								borderRadius: '8px',
								border: 'none',
								boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
							}}
						/>
						<Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={40}>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={`hsl(250, 95%, ${75 - index * 3}%)`} // Gradient effect across bars
								/>
							))}
						</Bar>
					</BarChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
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
				const res = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams, {
					hasSubmissions: true,
				});
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
	const [filters, setFilters] = React.useState({ status: 'all', sortBy: 'name_asc' });

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

	const filteredAndSortedSubmissions = React.useMemo(() => {
		let items = [...submissions];
		// Filter
		if (filters.status !== 'all') {
			items = items.filter(s => s.status === filters.status);
		}
		// Sort
		switch (filters.sortBy) {
			case 'name_asc':
				items.sort((a, b) => a.studentName.localeCompare(b.studentName));
				break;
			case 'name_desc':
				items.sort((a, b) => b.studentName.localeCompare(a.studentName));
				break;
			case 'score_asc':
				items.sort((a, b) => (a.score ?? 0) - (b.score ?? 0));
				break;
			case 'score_desc':
				items.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
				break;
			default:
				break;
		}
		return items;
	}, [submissions, filters]);

	const stats = React.useMemo(() => {
		const scoredSubs = submissions.filter(s => s.score !== null);
		if (scoredSubs.length === 0) {
			return { avg: 'N/A', high: 'N/A', low: 'N/A' };
		}
		const scores = scoredSubs.map(s => s.score);
		const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
		const high = Math.max(...scores).toFixed(1);
		const low = Math.min(...scores).toFixed(1);
		return { avg, high, low };
	}, [submissions]);

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
			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
					gap: 16,
					marginBottom: 16,
				}}
			>
				<ScoreDistributionChart submissions={submissions} />
				<div style={{ display: 'grid', gap: 16 }}>
					<StatCard label="Average Score" value={stats.avg} icon="📊" color="#3b82f6" />
					<StatCard label="Highest Score" value={stats.high} icon="🔼" color="#10b981" />
					<StatCard label="Lowest Score" value={stats.low} icon="🔽" color="#f97316" />
				</div>
			</div>
			<div
				style={{
					display: 'flex',
					gap: 16,
					padding: '12px',
					background: 'var(--surface)',
					borderRadius: 12,
					border: '1px solid var(--border)',
					marginBottom: 16,
					flexWrap: 'wrap',
				}}
			>
				<select
					value={filters.status}
					onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
					style={{
						padding: '8px 12px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--bg)',
					}}
				>
					<option value="all">Filter by Status</option>
					<option value="in-progress">In Progress</option>
					<option value="submitted">Submitted</option>
					<option value="evaluated">Evaluated</option>
					<option value="published">Published</option>
				</select>
				<select
					value={filters.sortBy}
					onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
					style={{
						padding: '8px 12px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--bg)',
					}}
				>
					<option value="name_asc">Sort by Name (A-Z)</option>
					<option value="name_desc">Sort by Name (Z-A)</option>
					<option value="score_desc">Sort by Score (High-Low)</option>
					<option value="score_asc">Sort by Score (Low-High)</option>
				</select>
			</div>
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
					{filteredAndSortedSubmissions.map(sub => {
						const config = statusConfig[sub.status] || {};
						return (
							<div key={sub.id} className="sub-row">
								<div
									style={{
										fontWeight: 700,
										color: 'var(--text)',
										display: 'flex',
										alignItems: 'center',
										gap: 8,
									}}
								>
									{sub.studentName || 'Unknown Student'}
									{sub.violations?.length > 0 && (
										<span
											title={`${sub.violations.length} violation(s) logged`}
											style={{
												background: '#fef2f2',
												color: '#ef4444',
												padding: '2px 8px',
												borderRadius: 12,
												fontSize: 12,
												fontWeight: 800,
											}}
										>
											⚠️ {sub.violations.length}
										</span>
									)}
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
