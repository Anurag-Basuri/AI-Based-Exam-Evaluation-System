import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import { safeApiCall, getMySubmissions, getStudentProfile } from '../../services/studentServices.js';
import { BookOpen, Search, User, Mail, Phone, Calendar, RefreshCcw, Activity, FileText, CheckCircle, BarChart3, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';

// ── Utilities ─────────────────────────────────────────────────────
const formatDate = v => {
	if (!v) return '—';
	try {
		const d = typeof v === 'string' || typeof v === 'number' ? new Date(v) : v;
		if (!d || Number.isNaN(d.getTime())) return '—';
		return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
	} catch {
		return '—';
	}
};

const getInitials = user => {
	const name = (user?.fullname || user?.username || 'S').trim();
	const parts = name.split(/\s+/).filter(Boolean);
	return parts.map(p => p[0]).slice(0, 2).join('').toUpperCase() || 'S';
};

const getGreeting = () => {
	const h = new Date().getHours();
	if (h < 12) return 'Good morning';
	if (h < 17) return 'Good afternoon';
	return 'Good evening';
};

// ── Skeleton loader ───────────────────────────────────────────────
const Skeleton = ({ className }) => (
	<div className={`animate-pulse bg-gray-200 dark:bg-gray-700/50 rounded-lg ${className}`} />
);

// ── Status helpers ────────────────────────────────────────────────
const STATUS_MAP = {
	'in-progress': { label: 'In Progress', icon: '⏳', colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' },
	started:       { label: 'In Progress', icon: '⏳', colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800' },
	submitted:     { label: 'Submitted',   icon: '📋', colorClass: 'text-blue-700 dark:text-blue-400 bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800' },
	evaluated:     { label: 'Evaluated',   icon: '✅', colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' },
	published:     { label: 'Published',   icon: '🎉', colorClass: 'text-violet-700 dark:text-violet-400 bg-violet-50 border-violet-200 dark:bg-violet-900/30 dark:border-violet-800' },
	pending:       { label: 'Pending',     icon: '📝', colorClass: 'text-gray-700 dark:text-gray-400 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700' },
};

const StatusBadge = ({ status }) => {
	const s = String(status ?? 'pending').toLowerCase();
	const cfg = STATUS_MAP[s] || STATUS_MAP.pending;
	return (
		<span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border uppercase tracking-wider ${cfg.colorClass}`}>
			<span>{cfg.icon}</span>{cfg.label}
		</span>
	);
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
const StudentHome = () => {
	const navigate = useNavigate();
	const { user, setUser } = useAuth();

	const [profileData, setProfileData] = React.useState(null);
	const [stats, setStats] = React.useState({ inProgress: 0, submitted: 0, evaluated: 0, total: 0 });
	const [recentSubmissions, setRecentSubmissions] = React.useState([]);
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');

	const loadData = React.useCallback(async () => {
		setLoading(true);
		setError('');
		try {
			const [profile, submissions] = await Promise.all([
				safeApiCall(getStudentProfile),
				safeApiCall(getMySubmissions),
			]);

			if (profile) {
				setProfileData(profile);
				if (setUser) setUser(prev => ({ ...(prev || {}), ...profile }));
			}

			const counts = Array.isArray(submissions)
				? submissions.reduce((acc, s) => {
						const st = s.status?.toLowerCase() || 'pending';
						if (st === 'in-progress' || st === 'started') acc.inProgress += 1;
						else if (st === 'submitted') acc.submitted += 1;
						else if (st === 'evaluated' || st === 'published') acc.evaluated += 1;
						acc.total += 1;
						return acc;
				  }, { inProgress: 0, submitted: 0, evaluated: 0, total: 0 })
				: { inProgress: 0, submitted: 0, evaluated: 0, total: 0 };

			setStats(counts);
			const sorted = Array.isArray(submissions)
				? [...submissions].sort((a, b) => new Date(b.startedAt || b.createdAt || 0) - new Date(a.startedAt || a.createdAt || 0))
				: [];
			setRecentSubmissions(sorted.slice(0, 5));
		} catch (e) {
			console.error('Dashboard load error:', e);
			setError(e?.message || 'Failed to load dashboard data');
		} finally {
			setLoading(false);
		}
	}, [setUser]);

	React.useEffect(() => { loadData(); }, [loadData]);

	const displayUser = profileData || user || {};

	// ── Render ─────────────────────────────────────────────────────
	return (
		<div className="min-h-screen px-4 sm:px-6 lg:px-8 py-8 dash-enter max-w-7xl mx-auto space-y-8">
			
			{/* ─── Error ─── */}
			{error && (
				<Alert type="error" onClose={() => setError('')}>
					{error}
				</Alert>
			)}

			{/* ─── Hero Banner ─── */}
			<div className="glass-card overflow-hidden rounded-3xl relative p-8 sm:p-12 text-white shadow-xl">
				<div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-400 opacity-90 z-0"></div>
				<div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==')] opacity-30 z-0"></div>
				
				<div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
					<div className="flex-1">
						<div className="text-emerald-100 font-medium tracking-wide mb-2 flex items-center gap-2">
							{getGreeting()}
						</div>
						<h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 leading-tight">
							{loading ? 'Welcome back...' : `${displayUser.fullname || displayUser.username || 'Student'} 👋`}
						</h1>
						<p className="text-emerald-50 text-base sm:text-lg max-w-2xl font-medium leading-relaxed opacity-90">
							Track your exams, view results, and manage your academic progress.
						</p>
					</div>
					<div className="flex flex-wrap gap-3 mt-4 md:mt-0 shrink-0">
						<button
							onClick={() => navigate('/student/exams')}
							className="flex items-center gap-2 bg-white/20 hover:bg-white/30 border border-white/30 text-white px-5 py-2.5 rounded-xl font-bold shadow-sm backdrop-blur-md transition-all active:scale-95"
						>
							<Search className="w-4 h-4" /> Find Exam
						</button>
						<button
							onClick={loadData}
							disabled={loading}
							className="flex items-center gap-2 bg-black/10 hover:bg-black/20 text-white p-2.5 rounded-xl border border-white/10 backdrop-blur-md transition-all active:scale-95 disabled:opacity-50"
							title="Refresh data"
						>
							<RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
						</button>
					</div>
				</div>

				{/* Mini profile strip inside hero */}
				{!loading && (
					<div className="relative z-10 mt-8 pt-6 border-t border-white/20 flex flex-wrap items-center gap-6 text-sm font-medium text-emerald-50">
						<div className="flex items-center gap-3">
							<div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black text-lg border border-white/20 shadow-inner">
								{getInitials(displayUser)}
							</div>
							<div className="flex flex-wrap gap-x-6 gap-y-2 opacity-90">
								<span className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {displayUser.email || 'No email provided'}</span>
								{displayUser.phonenumber && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {displayUser.phonenumber}</span>}
								<span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> Joined {formatDate(displayUser.createdAt)}</span>
							</div>
						</div>
					</div>
				)}
			</div>

			{/* ─── KPI Grid ─── */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				{[
					{ label: 'In Progress', value: loading ? '—' : stats.inProgress, sub: 'Active exams', icon: <Activity className="w-6 h-6 text-amber-500" />, bg: 'bg-amber-100 dark:bg-amber-500/20' },
					{ label: 'Submitted', value: loading ? '—' : stats.submitted, sub: 'Awaiting grading', icon: <FileText className="w-6 h-6 text-blue-500" />, bg: 'bg-blue-100 dark:bg-blue-500/20' },
					{ label: 'Evaluated', value: loading ? '—' : stats.evaluated, sub: 'Results ready', icon: <CheckCircle className="w-6 h-6 text-emerald-500" />, bg: 'bg-emerald-100 dark:bg-emerald-500/20' },
					{ label: 'Total Attempts', value: loading ? '—' : stats.total, sub: 'All time', icon: <BarChart3 className="w-6 h-6 text-indigo-500" />, bg: 'bg-indigo-100 dark:bg-indigo-500/20' },
				].map((kpi, idx) => (
					<div key={idx} className="glass-card p-5 rounded-2xl border-b-4 border-b-transparent hover:border-b-indigo-500 transition-all flex items-center gap-4 group">
						<div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg} group-hover:scale-110 transition-transform`}>
							{kpi.icon}
						</div>
						<div>
							<div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{kpi.label}</div>
							<div className="text-2xl font-black text-gray-900 dark:text-white my-0.5">{kpi.value}</div>
							<div className="text-xs font-medium text-gray-400">{kpi.sub}</div>
						</div>
					</div>
				))}
			</div>

			{/* ─── Quick Actions ─── */}
			<div className="flex flex-wrap gap-3">
				<button onClick={() => navigate('/student/exams')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95">
					<Search className="w-4 h-4" /> Find Exam
				</button>
				<button onClick={() => navigate('/student/results')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all active:scale-95">
					<BarChart3 className="w-4 h-4" /> View Results
				</button>
				<button onClick={() => navigate('/student/issues')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all active:scale-95">
					<AlertCircle className="w-4 h-4" /> Report Issue
				</button>
			</div>

			{/* ─── Content Panels ─── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
				{/* Recent Activity */}
				<div className="lg:col-span-2 glass-card rounded-2xl p-6 h-full border-t-4 border-t-emerald-500">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
							<Activity className="w-5 h-5 text-emerald-500" /> Recent Activity
						</h2>
						<button
							onClick={() => navigate('/student/results')}
							className="text-sm font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 transition-colors"
						>
							View all →
						</button>
					</div>

					<div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
						{loading ? (
							[...Array(3)].map((_, i) => (
								<div key={i} className="flex gap-4 p-4 items-center bg-gray-50 dark:bg-gray-800/50 rounded-xl">
									<Skeleton className="h-11 w-11 rounded-lg" />
									<div className="flex-1 space-y-2">
										<Skeleton className="h-4 w-1/2" />
										<Skeleton className="h-3 w-1/4" />
									</div>
								</div>
							))
						) : recentSubmissions.length === 0 ? (
							<div className="py-12 flex flex-col items-center justify-center text-center">
								<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
									<BookOpen className="w-8 h-8 text-gray-400" />
								</div>
								<h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">No exams yet</h3>
								<p className="text-gray-500 dark:text-gray-400">Use an exam code to get started!</p>
							</div>
						) : (
							recentSubmissions.map(sub => {
								const examTitle = sub.examTitle || sub.exam?.title || 'Untitled Exam';
								const subDate = sub.submittedAt || sub.startedAt || sub.createdAt;
								const hasScore = sub.score !== null && sub.score !== undefined;
								const isOngoing = sub.status?.toLowerCase() === 'in-progress' || sub.status?.toLowerCase() === 'started';

								return (
									<div
										key={sub.id}
										onClick={() => {
											if (isOngoing) navigate(`/student/take-exam/${sub.id}`);
											else navigate('/student/results');
										}}
										className="group flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:shadow-md transition-all cursor-pointer"
									>
										<div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
											<FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
										</div>
										<div className="flex-1 min-w-0">
											<h4 className="font-bold text-gray-900 dark:text-white text-sm truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
												{examTitle}
											</h4>
											<p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
												{formatDate(subDate)}
											</p>
										</div>
										<div className="flex items-center sm:flex-col sm:items-end gap-3 sm:gap-1.5 mt-2 sm:mt-0 justify-between">
											<StatusBadge status={sub.status} />
											{hasScore && (
												<span className="font-black text-sm text-gray-900 dark:text-white">
													{sub.score}<span className="text-gray-400">/{sub.maxScore || '?'}</span>
												</span>
											)}
										</div>
									</div>
								);
							})
						)}
					</div>
				</div>

				{/* Profile Summary Card */}
				<div className="lg:col-span-1 glass-card rounded-2xl p-6 h-full flex flex-col border-t-4 border-t-indigo-500">
					<div className="flex justify-between items-center mb-6">
						<h2 className="text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
							<User className="w-5 h-5 text-indigo-500" /> Profile
						</h2>
					</div>

					{loading ? (
						<div className="space-y-6">
							<div className="flex items-center gap-4">
								<Skeleton className="h-16 w-16 rounded-2xl" />
								<div className="space-y-2 flex-1">
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							</div>
							<div className="space-y-4">
								<Skeleton className="h-10 w-full rounded-lg" />
								<Skeleton className="h-10 w-full rounded-lg" />
								<Skeleton className="h-10 w-full rounded-lg" />
							</div>
						</div>
					) : (
						<div className="flex flex-col h-full justify-between">
							<div>
								<div className="flex items-center gap-4 mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800">
									<div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-lg shadow-indigo-500/20 shrink-0">
										{getInitials(displayUser)}
									</div>
									<div className="min-w-0">
										<h3 className="font-bold text-gray-900 dark:text-white truncate">
											{displayUser.fullname || displayUser.username || 'Student'}
										</h3>
										<p className="text-sm text-gray-500 dark:text-gray-400 truncate">
											@{displayUser.username || '—'}
										</p>
									</div>
								</div>

								<div className="space-y-4">
									{[
										{ label: 'Email', value: displayUser.email, icon: <Mail className="w-4 h-4 text-gray-400" /> },
										{ label: 'Phone', value: displayUser.phonenumber, icon: <Phone className="w-4 h-4 text-gray-400" /> },
										{ label: 'Gender', value: displayUser.gender, icon: <User className="w-4 h-4 text-gray-400" /> },
										{ label: 'Member Since', value: formatDate(displayUser.createdAt), icon: <Calendar className="w-4 h-4 text-gray-400" /> },
									].filter(item => item.value).map((item, idx) => (
										<div key={idx} className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center shrink-0">
												{item.icon}
											</div>
											<div className="min-w-0 flex-1">
												<div className="text-xs font-bold text-gray-400 uppercase tracking-wider">{item.label}</div>
												<div className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.value}</div>
											</div>
										</div>
									))}
								</div>
							</div>

							<button
								onClick={() => navigate('/student/settings')}
								className="mt-8 w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
							>
								Edit Profile
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default StudentHome;
