import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
	<div className="bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-3 shadow-sm">
		<div
			className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-lg font-bold shrink-0"
			style={{ background: color }}
		>
			{icon}
		</div>
		<div>
			<div className="text-xl font-extrabold text-[var(--text)] leading-tight">{value}</div>
			<div className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">
				{label}
			</div>
		</div>
	</div>
);

const statusConfig = {
	submitted: { label: 'Submitted', color: '#3b82f6', icon: '📥', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
	evaluated: { label: 'Evaluated', color: '#10b981', icon: '🤖', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
	published: { label: 'Published', color: '#8b5cf6', icon: '✅', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
	'in-progress': { label: 'In Progress', color: '#f59e0b', icon: '⏳', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
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
			<div className="p-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col items-center justify-center text-[var(--text-muted)] h-[350px]">
				<div className="text-5xl mb-4 opacity-50">📊</div>
				<p className="font-medium">No graded submissions to display yet.</p>
			</div>
		);
	}

	return (
		<div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 shadow-sm h-[400px] flex flex-col">
			<h4 className="text-lg font-bold text-[var(--text)] mb-6">Score Distribution</h4>
			<div className="flex-1 w-full min-h-0">
				<ResponsiveContainer width="100%" height="100%">
					<BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
						<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" opacity={0.5} />
						<XAxis
							dataKey="name"
							axisLine={false}
							tickLine={false}
							tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
							dy={10}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fill: 'var(--text-muted)', fontSize: 11, fontWeight: 500 }}
							allowDecimals={false}
						/>
						<Tooltip
							cursor={{ fill: 'var(--bg-secondary)', opacity: 0.5 }}
							contentStyle={{
								backgroundColor: 'var(--surface)',
								borderColor: 'var(--border)',
								borderRadius: '12px',
								boxShadow: 'var(--shadow-lg)',
								color: 'var(--text)',
							}}
							itemStyle={{ color: 'var(--text)' }}
						/>
						<Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
							{data.map((entry, index) => (
								<Cell
									key={`cell-${index}`}
									fill={`hsl(250, 95%, ${75 - index * 3}%)`}
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
		return (
			<div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
				<div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
				<p className="text-[var(--text-muted)] font-medium">Loading Exam Results...</p>
			</div>
		);
	if (error) return <Alert type="error">{error}</Alert>;

	return (
		<div className="space-y-6">
			<PageHeader
				title="Exam Results"
				subtitle="Select an exam to view and manage its submissions."
				breadcrumbs={[{ label: 'Home', to: '/teacher' }, { label: 'Results' }]}
			/>
			{exams.length === 0 ? (
				<Alert>No exams with submissions found.</Alert>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{exams.map(exam => (
						<article
							key={exam.id}
							className="group bg-[var(--surface)] border border-[var(--border)] rounded-2xl flex flex-col shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
						>
							<div className="p-6 flex-1">
								<h3 className="text-xl font-bold text-[var(--text)] mb-4 leading-snug group-hover:text-indigo-600 transition-colors">
									{exam.title}
								</h3>
								<div className="grid grid-cols-2 gap-3">
									<StatCard
										label="Submissions"
										value={exam.submissions}
										icon="📋"
										color="#3b82f6"
									/>
									<StatCard
										label="Evaluated"
										value={exam.evaluatedCount}
										icon="🤖"
										color="#10b981"
									/>
									<div className="col-span-2">
										<StatCard
											label="Published"
											value={exam.publishedCount}
											icon="✅"
											color="#8b5cf6"
										/>
									</div>
								</div>
							</div>
							<div className="p-6 pt-0">
								<button
									onClick={() => navigate(`/teacher/results/${exam.id}`)}
									className="w-full py-3 px-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl font-bold text-[var(--text)] hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700 transition-all flex items-center justify-center gap-2 group-hover:shadow-sm"
								>
									View Submissions <span className="text-lg">→</span>
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
			await loadSubmissions();
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
			await loadSubmissions();
		} catch (e) {
			toastError(e.message || 'Failed to publish all results.');
		} finally {
			setPublishing(p => ({ ...p, all: false }));
		}
	};

	const filteredAndSortedSubmissions = React.useMemo(() => {
		let items = [...submissions];
		if (filters.status !== 'all') {
			items = items.filter(s => s.status === filters.status);
		}
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
		return (
			<div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
				<div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
				<p className="text-[var(--text-muted)] font-medium">Loading Submissions...</p>
			</div>
		);
	if (error) return <Alert type="error">{error}</Alert>;

	const evaluatedCount = submissions.filter(s => s.status === 'evaluated').length;

	return (
		<div className="space-y-6">
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
						className={`
							px-5 py-2.5 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 
							transition-all active:scale-95 disabled:opacity-60 disabled:shadow-none disabled:cursor-not-allowed
							bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500
						`}
					>
						{publishing.all ? 'Publishing...' : `Publish All (${evaluatedCount})`}
					</button>,
				]}
			/>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<ScoreDistributionChart submissions={submissions} />
				</div>
				<div className="space-y-4">
					<StatCard label="Average Score" value={stats.avg} icon="📊" color="#3b82f6" />
					<StatCard label="Highest Score" value={stats.high} icon="🔼" color="#10b981" />
					<StatCard label="Lowest Score" value={stats.low} icon="🔽" color="#f97316" />
				</div>
			</div>

			<div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-sm overflow-hidden">
				{/* Filters Toolbar */}
				<div className="p-4 border-b border-[var(--border)] bg-[var(--bg-secondary)] flex flex-wrap gap-4">
					<select
						value={filters.status}
						onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}
						className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
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
						className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
					>
						<option value="name_asc">Sort by Name (A-Z)</option>
						<option value="name_desc">Sort by Name (Z-A)</option>
						<option value="score_desc">Sort by Score (High-Low)</option>
						<option value="score_asc">Sort by Score (Low-High)</option>
					</select>
				</div>

				{/* Submissions List */}
				{submissions.length === 0 ? (
					<div className="p-8">
						<Alert>No submissions found for this exam yet.</Alert>
					</div>
				) : (
					<div className="divide-y divide-[var(--border)]">
						{filteredAndSortedSubmissions.map(sub => {
							const config = statusConfig[sub.status] || {};
							// For badges, we might need to handle dark mode colors manually or use opacity
							// Using inline styles for badges to ensure they pop against the theme
							const badgeStyle = {
								backgroundColor: config.color + '20', // 20% opacity
								color: config.color,
								borderColor: config.color + '40',
							};

							return (
								<div
									key={sub.id}
									className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[var(--bg-secondary)] transition-colors"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center gap-3 mb-1">
											<span className="font-bold text-[var(--text)] text-lg truncate">
												{sub.studentName || 'Unknown Student'}
											</span>
											{sub.violations?.length > 0 && (
												<span
													className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200"
													title={`${sub.violations.length} violation(s) logged`}
												>
													⚠️ {sub.violations.length}
												</span>
											)}
										</div>
										<div className="text-sm text-[var(--text-muted)] flex items-center gap-2">
											<span>Submitted: {sub.submittedAt || 'N/A'}</span>
										</div>
									</div>

									<div className="flex items-center gap-6">
										<div className="text-right">
											<div className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
												Score
											</div>
											<div className="text-lg font-bold text-[var(--text)]">
												{(sub.score ?? 0).toFixed(1)}
												<span className="text-[var(--text-muted)] text-sm font-medium ml-1">
													/ {sub.maxScore ?? 'N/A'}
												</span>
											</div>
										</div>

										<div
											className="px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5"
											style={badgeStyle}
										>
											<span>{config.icon}</span>
											{config.label}
										</div>

										<div className="flex items-center gap-2">
											<button
												onClick={() =>
													navigate(`/teacher/results/${examId}/grade/${sub.id}`)
												}
												disabled={sub.status === 'in-progress'}
												className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
											>
												View/Grade
											</button>
											{sub.status === 'evaluated' && (
												<button
													onClick={() => handlePublishSingle(sub.id)}
													disabled={publishing.single === sub.id}
													className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-70"
												>
													{publishing.single === sub.id ? '...' : 'Publish'}
												</button>
											)}
										</div>
									</div>
								</div>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

const TeacherResults = () => {
	const { examId } = useParams();
	return examId ? <ExamSubmissionsDetail /> : <ExamResultsOverview />;
};

export default TeacherResults;
