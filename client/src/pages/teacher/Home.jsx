import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { useSocket } from '../../hooks/useSocket.js';
import { getTeacherDashboardStats } from '../../services/teacherServices.js';
import { ScoreHistogram, PerformanceLine } from '../../components/charts/AnalyticsCharts.jsx';
import { BookOpen, Activity, CheckCircle, AlertCircle, Plus, Users, Layout, Clock, FileText, Settings, Star } from 'lucide-react';

// Defaults & Utils
const DEFAULT_DASH = {
	exams: { total: 0, live: 0, scheduled: 0, draft: 0, totalEnrolled: 0 },
	issues: { open: 0 },
	submissions: { pending: 0 },
	examsToReview: [],
	recentSubmissions: [],
	teacher: null,
};

const formatDate = v => {
	if (!v) return '—';
	try {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	} catch {
		return String(v);
	}
};

const formatDateTime = v => {
	if (!v) return '—';
	try {
		const d = new Date(v);
		if (Number.isNaN(d.getTime())) return String(v);
		return d.toLocaleString(undefined, {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	} catch {
		return String(v);
	}
};

const getInitials = t => {
	const name = (t?.fullname || t?.username || 'T').trim();
	const parts = name.split(/\s+/).filter(Boolean);
	return (
		parts
			.map(p => p[0])
			.slice(0, 2)
			.join('')
			.toUpperCase() || 'T'
	);
};

const getGreeting = () => {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
};

// Skeleton loader
const Skeleton = ({ className = '' }) => (
	<div className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 rounded-lg bg-[length:200%_100%] ${className}`} />
);

// Status badge
const STATUS_MAP = {
	pending: { label: 'Pending', icon: '⏳', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
	submitted: { label: 'Submitted', icon: '📥', bg: 'bg-blue-100 dark:bg-blue-500/20', text: 'text-blue-700 dark:text-blue-400' },
	evaluated: { label: 'Evaluated', icon: '🤖', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
	published: { label: 'Published', icon: '✅', bg: 'bg-violet-100 dark:bg-violet-500/20', text: 'text-violet-700 dark:text-violet-400' },
	'in-progress': { label: 'In Progress', icon: '⏳', bg: 'bg-amber-100 dark:bg-amber-500/20', text: 'text-amber-700 dark:text-amber-400' },
	graded: { label: 'Graded', icon: '✅', bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400' },
	review: { label: 'Review', icon: '🔍', bg: 'bg-red-100 dark:bg-red-500/20', text: 'text-red-700 dark:text-red-400' },
};

const StatusBadge = ({ status }) => {
	const s = String(status ?? 'pending').toLowerCase();
	const cfg = STATUS_MAP[s] || STATUS_MAP.pending;
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text}`}>
			<span>{cfg.icon}</span>
			{cfg.label}
		</span>
	);
};

const TeacherHome = () => {
	const navigate = useNavigate();
	const { user } = useAuth();

	const [data, setData] = React.useState(DEFAULT_DASH);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const resp = await getTeacherDashboardStats();
			setData(resp && typeof resp === 'object' ? { ...DEFAULT_DASH, ...resp } : DEFAULT_DASH);
		} catch (e) {
			console.warn('Dashboard load failed', e);
			setError(e?.message ?? 'Failed to load dashboard');
			setData(DEFAULT_DASH);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		loadData();
	}, [loadData]);

	const { socket } = useSocket();

	React.useEffect(() => {
		if (!socket) return;
		const onNewSubmission = s =>
			setData(curr => ({
				...curr,
				recentSubmissions: [s, ...(curr.recentSubmissions || [])].slice(0, 5),
				submissions: {
					...(curr.submissions || {}),
					pending: (curr.submissions?.pending || 0) + 1,
				},
			}));
		const onSubmissionUpdated = () => loadData();

		socket.on('new-submission', onNewSubmission);
		socket.on('submission-updated', onSubmissionUpdated);
		return () => {
			socket.off('new-submission', onNewSubmission);
			socket.off('submission-updated', onSubmissionUpdated);
		};
	}, [socket, loadData]);

	const teacher =
		(data.teacher && Object.keys(data.teacher).length ? data.teacher : null) ||
		(user
			? {
					id: user.id,
					fullname: user.fullname,
					username: user.username,
					email: user.email,
					phonenumber: user.phonenumber,
					department: user.department,
					createdAt: user.createdAt,
				}
			: null);

	return (
		<div className="max-w-[1200px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
			{/* Hero Banner */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 text-white shadow-xl shadow-indigo-500/20 dash-enter-1">
				<div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23fff\' fill-opacity=\'0.05\'%3E%3Ccircle cx=\'30\' cy=\'30\' r=\'1.5\'/%3E%3C/g%3E%3C/svg%3E')] opacity-50 mix-blend-overlay"></div>
				
				<div className="relative z-10 flex flex-col sm:flex-row justify-between items-start gap-6">
					<div className="space-y-2 max-w-xl">
						<p className="text-indigo-100 font-medium tracking-wide text-sm uppercase">{getGreeting()},</p>
						<h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
							{loading ? <Skeleton className="h-10 w-48 bg-white/20" /> : (teacher?.fullname ?? 'Teacher')}
						</h1>
						<p className="text-indigo-200 text-sm sm:text-base leading-relaxed">
							{loading ? <Skeleton className="h-5 w-64 bg-white/20 mt-2" /> : (teacher?.department || 'Manage your exams, review submissions, and track performance.')}
						</p>
					</div>

					<div className="flex items-center gap-3 w-full sm:w-auto">
						<button
							onClick={() => navigate('/teacher/exams/create')}
							className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg"
						>
							<Star className="w-4 h-4 text-amber-300" />
							New Exam
						</button>
						<button
							onClick={loadData}
							disabled={loading}
							className="flex items-center justify-center bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/10 text-white p-2.5 rounded-xl transition-all disabled:opacity-50 hover:scale-105 active:scale-95"
						>
							<svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
							</svg>
						</button>
					</div>
				</div>

				{!loading && teacher && (
					<div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-indigo-100">
						<div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-lg text-white shadow-inner">
							{getInitials(teacher)}
						</div>
						<div className="flex flex-wrap gap-x-6 gap-y-2">
							<span className="flex items-center gap-1.5"><Users className="w-4 h-4 opacity-70"/> @{teacher?.username || '—'}</span>
							<span className="flex items-center gap-1.5"><svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> {teacher?.email || '—'}</span>
							{teacher?.phonenumber && <span className="flex items-center gap-1.5"><svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg> {teacher.phonenumber}</span>}
							<span className="flex items-center gap-1.5"><Clock className="w-4 h-4 opacity-70"/> Joined {formatDate(teacher?.createdAt)}</span>
						</div>
					</div>
				)}
			</div>

			{error && (
				<div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-2xl flex justify-between items-center shadow-sm dash-enter-1">
					<div className="flex items-center gap-3">
						<AlertCircle className="w-5 h-5" />
						<span className="font-medium">{error}</span>
					</div>
					<button onClick={() => setError('')} className="hover:bg-red-100 dark:hover:bg-red-500/20 p-1 rounded-lg transition-colors">
						<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>
			)}

			{/* KPI Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 dash-enter-2">
				{[
					{ label: 'Total Exams', value: data.exams?.total, sub: `${data.exams?.totalEnrolled ?? 0} students enrolled`, icon: BookOpen, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/20', border: 'border-indigo-200 dark:border-indigo-500/30' },
					{ label: 'Live Exams', value: data.exams?.live, sub: 'Currently running', icon: Activity, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-500/20', border: 'border-emerald-200 dark:border-emerald-500/30' },
					{ label: 'Pending Reviews', value: data.submissions?.pending, sub: 'Needs attention', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/20', border: 'border-amber-200 dark:border-amber-500/30' },
					{ label: 'Open Issues', value: data.issues?.open, sub: 'Reported by students', icon: AlertCircle, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-500/20', border: 'border-rose-200 dark:border-rose-500/30' },
				].map((kpi, i) => (
					<div key={i} className={`glass-card p-5 border-l-4 ${kpi.border} hover:scale-[1.02] transition-transform duration-200 cursor-default flex items-center gap-4`}>
						<div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${kpi.bg} ${kpi.color}`}>
							<kpi.icon className="w-7 h-7" />
						</div>
						<div>
							<div className="text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">{kpi.label}</div>
							<div className="text-3xl font-black text-gray-900 dark:text-white leading-none">
								{loading ? <Skeleton className="h-8 w-16" /> : (kpi.value ?? 0)}
							</div>
							<div className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">{kpi.sub}</div>
						</div>
					</div>
				))}
			</div>

			{/* Quick Actions */}
			<div className="flex flex-wrap gap-3 dash-enter-3">
				{[
					{ label: 'Create Exam', icon: Plus, to: '/teacher/exams/create', primary: true },
					{ label: 'Question Bank', icon: Layout, to: '/teacher/exams' },
					{ label: 'Results', icon: CheckCircle, to: '/teacher/results' },
					{ label: 'Issues', icon: AlertCircle, to: '/teacher/issues' },
					{ label: 'Settings', icon: Settings, to: '/teacher/settings' },
				].map((action, i) => (
					<button
						key={i}
						onClick={() => navigate(action.to)}
						className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95 shadow-sm ${
							action.primary 
								? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white border-transparent hover:shadow-indigo-500/30 hover:shadow-lg' 
								: 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
						}`}
					>
						<action.icon className="w-4 h-4" />
						{action.label}
					</button>
				))}
			</div>

			{/* Content Panels */}
			<div className="grid grid-cols-1 lg:grid-cols-5 gap-6 dash-enter-4">
				{/* Recent Submissions */}
				<div className="lg:col-span-3 glass-card p-6 flex flex-col">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
							<div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
							Recent Submissions
						</h3>
						<button onClick={() => navigate('/teacher/results')} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 transition-colors">
							View all &rarr;
						</button>
					</div>

					<div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar" style={{ maxHeight: '380px' }}>
						{loading ? (
							[...Array(4)].map((_, i) => (
								<div key={i} className="flex items-center gap-4 p-3 border border-gray-100 dark:border-gray-800 rounded-xl">
									<Skeleton className="h-11 w-11 rounded-xl" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-1/3" />
										<Skeleton className="h-3 w-1/4" />
									</div>
								</div>
							))
						) : (data.recentSubmissions || []).length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
								<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mb-4">📭</div>
								<h4 className="font-bold text-gray-900 dark:text-white">No submissions yet</h4>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Publish an exam to start receiving submissions.</p>
							</div>
						) : (
							(data.recentSubmissions || []).map(s => (
								<div key={s._id || s.id} onClick={() => navigate(`/teacher/grade/${s._id || s.id}`)} className="group flex items-center gap-4 p-3 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all cursor-pointer">
									<div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-400 flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform">
										{(s.student?.fullname || s.student?.username || 'S')[0].toUpperCase()}
									</div>
									<div className="flex-1 min-w-0">
										<div className="font-bold text-sm text-gray-900 dark:text-white truncate">
											{s.student?.fullname ?? s.student?.username ?? 'Student'}
										</div>
										<div className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
											{s.exam?.title ?? s.examTitle ?? 'Exam'} • {formatDateTime(s.createdAt)}
										</div>
									</div>
									<div className="flex flex-col items-end gap-1.5">
										<StatusBadge status={s.status ?? s.grade ?? 'pending'} />
										<span className="font-black text-sm text-gray-900 dark:text-white">
											{s.grade ?? (s.score !== undefined ? String(s.score) : '—')}
										</span>
									</div>
								</div>
							))
						)}
					</div>
				</div>

				{/* Exams Needing Review */}
				<div className="lg:col-span-2 glass-card p-6 flex flex-col">
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
							<div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
							Needs Review
						</h3>
					</div>

					<div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
						{loading ? (
							[...Array(2)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)
						) : (data.examsToReview || []).length === 0 ? (
							<div className="h-full flex flex-col items-center justify-center text-center py-10 opacity-70">
								<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-3xl mb-4">🎉</div>
								<h4 className="font-bold text-gray-900 dark:text-white">All caught up!</h4>
								<p className="text-sm text-gray-500 dark:text-gray-400 mt-1">No pending reviews right now.</p>
							</div>
						) : (
							(data.examsToReview || []).map(e => {
								const pending = e.pendingCount ?? Math.max(0, (e.submissionsCount || 0) - (e.evaluatedCount || 0));
								return (
									<div key={e._id || e.id} onClick={() => navigate(`/teacher/results/${e._id || e.id}`)} className="flex items-center gap-4 p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-solid hover:border-gray-400 dark:hover:border-gray-500 transition-all cursor-pointer group">
										<div className="flex-1 min-w-0">
											<div className="font-bold text-sm text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
												{e.title}
											</div>
											<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												{e.submissionsCount ?? 0} submissions total
											</div>
										</div>
										<div className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 font-bold text-xs whitespace-nowrap">
											{pending} pending
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>
			</div>

			{/* Analytics Charts */}
			{!loading && (
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 dash-enter-5">
					<div className="glass-card overflow-hidden">
						<ScoreHistogram data={data?.analytics?.scoreDistribution || []} />
					</div>
					<div className="glass-card overflow-hidden">
						<PerformanceLine data={data?.analytics?.examPerformance || []} />
					</div>
				</div>
			)}
		</div>
	);
};

export default TeacherHome;
