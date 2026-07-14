import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import { useSocket } from '../../hooks/useSocket.js';
import * as TeacherSvc from '../../services/teacherServices.js';
import {
	Eye,
	Plus,
	Search,
	RefreshCw,
	Clipboard,
	Rocket,
	StopCircle,
	Trash2,
	CheckCircle2,
	Copy as CopyIcon,
	MoreVertical,
	Clock,
	Users,
	FileText,
	Activity,
	CalendarClock,
	CheckCircle,
	AlertCircle
} from 'lucide-react';

const STATUS_LABELS = {
	active: 'Active',
	live: 'Live',
	scheduled: 'Scheduled',
	draft: 'Draft',
	completed: 'Completed',
	cancelled: 'Cancelled',
};

const formatDate = dateVal => {
	if (!dateVal || dateVal === '—') return '—';
	const d = new Date(dateVal);
	if (isNaN(d.getTime())) return '—';
	return d.toLocaleString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
};

function Spinner({ className = "h-4 w-4" }) {
	return (
		<svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
			<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	);
}

function ConfirmModal({ isOpen, onClose, onConfirm, config, loading }) {
	const [inputValue, setInputValue] = useState('');

	if (!isOpen) return null;
	const { title, message, actionLabel, actionColor = 'red', isInput = false } = config;

	const btnColorClass = actionColor === 'indigo' 
		? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
		: actionColor === 'blue'
		? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
		: actionColor === 'amber'
		? 'bg-amber-500 hover:bg-amber-600 text-white shadow-md'
		: 'bg-rose-600 hover:bg-rose-700 text-white shadow-md';

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
			<div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-800 transform transition-all dash-enter">
				<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
					{title}
				</h3>
				<p className="text-sm text-gray-500 dark:text-gray-400 mb-5 leading-relaxed">
					{message}
				</p>
				{isInput && (
					<input
						type="number"
						autoFocus
						placeholder="Minutes (e.g., 10)"
						value={inputValue}
						onChange={e => setInputValue(e.target.value)}
						className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
					/>
				)}
				<div className="flex justify-end gap-3">
					<button
						onClick={onClose}
						disabled={loading}
						className="px-4 py-2 rounded-xl font-semibold text-sm border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
					>
						Cancel
					</button>
					<button
						onClick={() => onConfirm(isInput ? inputValue : null)}
						disabled={loading || (isInput && !inputValue)}
						className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-colors ${btnColorClass}`}
					>
						{loading && <Spinner />}
						{actionLabel}
					</button>
				</div>
			</div>
		</div>
	);
}

function ExamCard({ exam, onAction, openModal }) {
	const navigate = useNavigate();
	const [menuOpen, setMenuOpen] = useState(false);
	const [copied, setCopied] = useState(false);
	const status = exam.derivedStatus || exam.status || 'draft';

	const isDraft = status === 'draft';
	const isScheduled = status === 'scheduled';
	const isLive = status === 'live' || status === 'active';
	const isCompleted = status === 'completed';
	const isCancelled = status === 'cancelled';

	useEffect(() => {
		if (!menuOpen) return;
		const close = () => setMenuOpen(false);
		window.addEventListener('click', close);
		return () => window.removeEventListener('click', close);
	}, [menuOpen]);

	const handleCopy = e => {
		e.stopPropagation();
		if (exam.searchId) {
			navigator.clipboard.writeText(exam.searchId);
			setCopied(true);
			setTimeout(() => setCopied(false), 1500);
		}
	};

	let primaryAction = null;
	if (isDraft) {
		primaryAction = {
			label: 'Publish Exam',
			icon: <Rocket className="h-4 w-4" />,
			id: 'publish',
			style: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20",
		};
	} else if (isScheduled) {
		primaryAction = {
			label: 'View / Edit',
			icon: <Eye className="h-4 w-4" />,
			id: 'view',
			style: "bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20",
		};
	} else if (isLive) {
		primaryAction = {
			label: 'Live Monitoring',
			icon: <Activity className="h-4 w-4" />,
			id: 'results',
			style: "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20",
		};
	} else {
		primaryAction = {
			label: 'View Results',
			icon: <FileText className="h-4 w-4" />,
			id: 'results',
			style: "bg-violet-50 text-violet-600 hover:bg-violet-100 dark:bg-violet-500/10 dark:text-violet-400 dark:hover:bg-violet-500/20",
		};
	}

	const executePrimary = () => {
		if (primaryAction.id === 'view') navigate(`/teacher/exams/edit/${exam.id}`);
		else if (primaryAction.id === 'results') navigate(`/teacher/results/${exam.id}`);
		else if (primaryAction.id === 'publish') openModal('publish', exam);
	};

	const getStatusBadge = (s) => {
		switch (s) {
			case 'live':
			case 'active':
				return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-500/30"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span> {STATUS_LABELS[s]}</span>;
			case 'scheduled':
				return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 text-xs font-bold border border-blue-200 dark:border-blue-500/30"><CalendarClock className="h-3 w-3" /> {STATUS_LABELS[s]}</span>;
			case 'completed':
				return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400 text-xs font-bold border border-violet-200 dark:border-violet-500/30"><CheckCircle className="h-3 w-3" /> {STATUS_LABELS[s]}</span>;
			case 'cancelled':
				return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-700"><AlertCircle className="h-3 w-3" /> {STATUS_LABELS[s]}</span>;
			default:
				return <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 text-xs font-bold border border-gray-200 dark:border-gray-700"><FileText className="h-3 w-3" /> {STATUS_LABELS[s]}</span>;
		}
	}

	return (
		<div className="glass-card flex flex-col hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-all group overflow-visible relative h-full">
			<div className="p-5 flex-1 flex flex-col">
				<div className="flex justify-between items-start mb-4">
					<div className="flex-1 pr-2">
						<div className="mb-2">
							{getStatusBadge(status)}
						</div>
						<h3
							onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)}
							className="text-lg font-bold text-gray-900 dark:text-white cursor-pointer group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2"
							title={exam.title}
						>
							{exam.title}
						</h3>
						{exam.searchId && (
							<div
								onClick={handleCopy}
								className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded cursor-pointer hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-colors text-xs font-mono font-semibold border border-sky-100 dark:border-sky-500/20"
								title="Copy exam code"
							>
								<Clipboard className="h-3 w-3" /> {exam.searchId} {copied && <span className="text-green-500 ml-1">✓</span>}
							</div>
						)}
					</div>

					<div className="relative">
						<button
							onClick={e => {
								e.stopPropagation();
								setMenuOpen(!menuOpen);
							}}
							className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 rounded-lg transition-colors"
						>
							<MoreVertical className="h-5 w-5" />
						</button>
						{menuOpen && (
							<div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-xl py-1 transform origin-top-right transition-all">
								<MenuItem
									icon={<Eye className="h-4 w-4" />}
									label="View / Edit"
									onClick={() => navigate(`/teacher/exams/edit/${exam.id}`)}
								/>

								{isDraft && (
									<MenuItem
										icon={<Rocket className="h-4 w-4" />}
										label="Publish Exam"
										onClick={() => openModal('publish', exam)}
										colorClass="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10"
									/>
								)}

								{(isScheduled || isLive) && (
									<MenuItem
										icon={<RefreshCw className="h-4 w-4" />}
										label="Extend Time"
										onClick={() => openModal('extend', exam)}
									/>
								)}

								{(isScheduled || isLive) && (
									<MenuItem
										icon={<StopCircle className="h-4 w-4" />}
										label={isLive ? 'End Now' : 'Cancel Exam'}
										onClick={() => openModal(isLive ? 'end' : 'cancel', exam)}
										colorClass="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
									/>
								)}

								{(isDraft || isScheduled) && (
									<MenuItem
										icon={<RefreshCw className="h-4 w-4" />}
										label="Regenerate Code"
										onClick={() => openModal('regenerate', exam)}
									/>
								)}

								<MenuItem
									icon={<CopyIcon className="h-4 w-4" />}
									label="Duplicate"
									onClick={() => openModal('duplicate', exam)}
								/>

								{!(isLive || isScheduled) && (
									<>
										<div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
										<MenuItem
											icon={<Trash2 className="h-4 w-4" />}
											label="Delete"
											onClick={() => openModal('delete', exam)}
											colorClass="text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
										/>
									</>
								)}
							</div>
						)}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-3 mb-4">
					<div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
						<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
							<Clock className="h-4 w-4" />
							<span className="text-xs font-semibold">Duration</span>
						</div>
						<div className="font-bold text-gray-900 dark:text-white">
							{exam.duration} mins
						</div>
					</div>
					<div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
						<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1">
							<FileText className="h-4 w-4" />
							<span className="text-xs font-semibold">Questions</span>
						</div>
						<div className="font-bold text-gray-900 dark:text-white">
							{exam.questions?.length || 0}
						</div>
					</div>
					<div className="col-span-2 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
						<div className="flex justify-between items-center">
							<div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
								<Users className="h-4 w-4" />
								<span className="text-xs font-semibold">Submissions</span>
							</div>
							<div className="font-bold text-gray-900 dark:text-white">
								{exam.submissions || 0}
							</div>
						</div>
					</div>
				</div>

				<div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-auto mb-4 bg-gray-100/50 dark:bg-gray-800/30 px-3 py-2 rounded-lg inline-flex items-center gap-2">
					<CalendarClock className="h-3.5 w-3.5" /> Begins: {formatDate(exam.startAt)}
				</div>

				<button
					onClick={executePrimary}
					className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${primaryAction.style}`}
				>
					{primaryAction.icon}
					{primaryAction.label}
				</button>
			</div>
		</div>
	);
}

function MenuItem({ icon, label, onClick, colorClass = "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800" }) {
	return (
		<button
			onClick={e => {
				e.stopPropagation();
				onClick();
			}}
			className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm font-medium transition-colors ${colorClass}`}
		>
			{icon}
			{label}
		</button>
	);
}

function StatsCard({ stats, loading }) {
	const items = [
		{ label: 'Total Exams', value: stats?.total ?? 0, color: 'indigo', icon: <CheckCircle2 className="h-6 w-6 text-indigo-500" />, bg: "bg-indigo-50 dark:bg-indigo-500/10", border: "border-indigo-100 dark:border-indigo-500/20" },
		{ label: 'Drafts', value: stats?.draft ?? 0, color: 'gray', icon: <Rocket className="h-6 w-6 text-gray-500" />, bg: "bg-gray-50 dark:bg-gray-800", border: "border-gray-200 dark:border-gray-700" },
		{ label: 'Scheduled', value: stats?.scheduled ?? 0, color: 'blue', icon: <CalendarClock className="h-6 w-6 text-blue-500" />, bg: "bg-blue-50 dark:bg-blue-500/10", border: "border-blue-100 dark:border-blue-500/20" },
		{ label: 'Live Now', value: stats?.live ?? 0, color: 'rose', icon: <Activity className="h-6 w-6 text-rose-500" />, bg: "bg-rose-50 dark:bg-rose-500/10", border: "border-rose-100 dark:border-rose-500/20" },
	];
	return (
		<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			{items.map(item => (
				<div
					key={item.label}
					className={`glass-card p-5 border-l-4 rounded-2xl flex flex-col gap-3 relative overflow-hidden group hover:-translate-y-1 transition-transform`}
					style={{ borderLeftColor: `var(--${item.color}-500)` }}
				>
					<div className={`absolute top-0 right-0 p-4 -mr-2 -mt-2 rounded-bl-3xl opacity-50 group-hover:opacity-100 transition-opacity ${item.bg}`}>
						{item.icon}
					</div>
					<div className="text-sm font-bold text-gray-500 dark:text-gray-400">
						{item.label}
					</div>
					<div className="text-3xl font-black text-gray-900 dark:text-white">
						{loading ? <Spinner className="h-6 w-6 mt-1 text-gray-400" /> : item.value}
					</div>
				</div>
			))}
		</div>
	);
}

export default function TeacherExams() {
	const [exams, setExams] = useState([]);
	const [loading, setLoading] = useState(true);
	const [stats, setStats] = useState(null);
	const [statsLoading, setStatsLoading] = useState(true);
	const [search, setSearch] = useState('');
	const [filter, setFilter] = useState('all');

	const [modalConfig, setModalConfig] = useState({ isOpen: false });
	const [actionLoading, setActionLoading] = useState(false);

	const navigate = useNavigate();
	const { toast } = useToast();

	const loadStats = useCallback(async () => {
		setStatsLoading(true);
		try {
			const res = await TeacherSvc.getExamStats();
			setStats(res || {});
		} catch (err) {
		} finally {
			setStatsLoading(false);
		}
	}, []);

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const res = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams, {
				limit: 1000,
				q: search,
			});
			setExams(res?.items || []);
		} catch (err) {
			toast?.error?.(err?.message || 'Failed to load exams');
		} finally {
			setLoading(false);
		}
	}, [search, toast]);

	const { socket } = useSocket();

	useEffect(() => {
		loadData();
		loadStats();
	}, [loadData, loadStats]);

	useEffect(() => {
		if (!socket) return;
		const onExamEvent = () => {
			loadData();
			loadStats();
		};
		socket.on('exam-updated', onExamEvent);
		socket.on('exam-created', onExamEvent);
		socket.on('exam-deleted', onExamEvent);
		return () => {
			socket.off('exam-updated', onExamEvent);
			socket.off('exam-created', onExamEvent);
			socket.off('exam-deleted', onExamEvent);
		};
	}, [socket, loadData, loadStats]);

	const handleActionConfirm = async inputValue => {
		const { action, exam } = modalConfig;
		setActionLoading(true);
		try {
			if (action === 'publish') {
				await TeacherSvc.safeApiCall(TeacherSvc.publishTeacherExam, exam.id);
				toast.success?.('Exam published successfully!');
			} else if (action === 'end') {
				await TeacherSvc.safeApiCall(TeacherSvc.endExamNow, exam.id);
				toast.success?.('Exam ended. Students can no longer submit.');
			} else if (action === 'cancel') {
				await TeacherSvc.safeApiCall(TeacherSvc.cancelExam, exam.id);
				toast.success?.('Exam cancelled.');
			} else if (action === 'extend') {
				const minutes = Number(inputValue);
				await TeacherSvc.safeApiCall(TeacherSvc.extendExamEnd, exam.id, { minutes });
				toast.success?.(`Exam extended by ${minutes} minutes.`);
			} else if (action === 'regenerate') {
				const res = await TeacherSvc.safeApiCall(
					TeacherSvc.regenerateExamShareCode,
					exam.id,
				);
				if (res?.searchId) {
					toast.success?.(`New Code: ${res.searchId}`);
				}
			} else if (action === 'duplicate') {
				await TeacherSvc.safeApiCall(TeacherSvc.duplicateTeacherExam, exam.id);
				toast.success?.('Exam duplicated. You can now edit the draft.');
			} else if (action === 'delete') {
				await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
				toast.success?.('Exam deleted forever.');
			}
			setModalConfig({ isOpen: false });
			await loadData();
			await loadStats();
		} catch (err) {
			toast?.error?.(err?.message || 'Action failed');
		} finally {
			setActionLoading(false);
		}
	};

	const openModal = (action, exam) => {
		const m = { isOpen: true, action, exam };
		if (action === 'publish') {
			m.title = 'Publish Exam?';
			m.message = `Are you sure you want to publish "${exam.title}"? Once published, the exam will be accessible to students based on its start time.`;
			m.actionLabel = 'Publish Exam';
			m.actionColor = 'indigo';
		} else if (action === 'end') {
			m.title = 'End Exam Now?';
			m.message = `This will instantly terminate "${exam.title}" and auto-submit all in-progress student exams. This cannot be undone.`;
			m.actionLabel = 'End Exam';
			m.actionColor = 'red';
		} else if (action === 'cancel') {
			m.title = 'Cancel Exam?';
			m.message = `Are you sure you want to cancel "${exam.title}"?`;
			m.actionLabel = 'Cancel Exam';
			m.actionColor = 'red';
		} else if (action === 'extend') {
			m.title = 'Extend Exam Time';
			m.message = `How many minutes would you like to extend "${exam.title}" by?`;
			m.actionLabel = 'Extend Time';
			m.actionColor = 'blue';
			m.isInput = true;
		} else if (action === 'regenerate') {
			m.title = 'Regenerate Code?';
			m.message = `This will generate a new share code for "${exam.title}". The old code will no longer work.`;
			m.actionLabel = 'Regenerate Code';
			m.actionColor = 'amber';
		} else if (action === 'duplicate') {
			m.title = 'Duplicate Exam?';
			m.message = `Create an exact copy of "${exam.title}"? The copy will be saved as a Draft.`;
			m.actionLabel = 'Duplicate';
			m.actionColor = 'indigo';
		} else if (action === 'delete') {
			m.title = 'Delete Exam?';
			m.message = `Are you absolutely sure you want to delete "${exam.title}"? This will also delete all associated grades and submissions. This is permanent.`;
			m.actionLabel = 'Delete Forever';
			m.actionColor = 'red';
		}
		setModalConfig(m);
	};

	const filteredExams = useMemo(() => {
		return exams.filter(exam => {
			const status = exam.derivedStatus || exam.status || 'draft';
			if (filter === 'all') return true;
			if (filter === 'active') return status === 'active' || status === 'live';
			if (filter === 'scheduled') return status === 'scheduled';
			if (filter === 'draft') return status === 'draft';
			if (filter === 'completed') return status === 'completed' || status === 'cancelled';
			return true;
		});
	}, [exams, filter]);

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen dash-enter">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
				<div className="flex items-center gap-4">
					<div className="hidden sm:flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-600 dark:text-indigo-400">
						<FileText className="h-7 w-7" />
					</div>
					<div>
						<h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
							Exam Management
						</h1>
						<p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
							Create, schedule, and monitor your assessments in real-time.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3">
					<Link
						to="/teacher/exams/ai-generator"
						className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-500/30 transition-all hover:scale-105 active:scale-95"
					>
						<Rocket className="h-4 w-4" />
						<span className="hidden sm:inline">Generate with AI</span>
						<span className="sm:hidden">AI Gen</span>
					</Link>
					<Link
						to="/teacher/exams/create"
						className="flex items-center gap-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-5 py-2.5 rounded-xl font-bold shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
					>
						<Plus className="h-4 w-4" />
						<span>New Exam</span>
					</Link>
				</div>
			</div>

			<StatsCard stats={stats} loading={statsLoading} />

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4 mb-8">
				<div className="relative flex-1">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
					<input
						type="text"
						placeholder="Search exams by title or code..."
						value={search}
						onChange={e => setSearch(e.target.value)}
						className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm transition-shadow font-medium"
					/>
				</div>
				<div className="flex gap-3">
					<select
						value={filter}
						onChange={e => setFilter(e.target.value)}
						className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-sm"
					>
						<option value="all">All Exams</option>
						<option value="active">Live & Active</option>
						<option value="scheduled">Scheduled</option>
						<option value="draft">Drafts</option>
						<option value="completed">Completed</option>
					</select>
					<button
						onClick={() => {
							loadData();
							loadStats();
						}}
						disabled={loading}
						className="px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors shadow-sm flex items-center justify-center"
					>
						{loading ? <Spinner className="h-5 w-5 text-indigo-500" /> : <RefreshCw className="h-5 w-5" />}
					</button>
				</div>
			</div>

			{/* Grid */}
			{loading && filteredExams.length === 0 ? (
				<div className="py-20 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
					<Spinner className="h-10 w-10 text-indigo-500 mb-4" />
					<p className="font-medium animate-pulse">Loading your exams...</p>
				</div>
			) : filteredExams.length === 0 ? (
				<div className="py-24 px-6 flex flex-col items-center text-center bg-white/50 dark:bg-gray-800/30 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
					<div className="h-20 w-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
						<FileText className="h-10 w-10 text-gray-400" />
					</div>
					<h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No exams found</h3>
					<p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm">
						{search ? 'No exams match your search criteria. Try a different term or clear the filter.' : 'You haven\'t created any exams yet. Start by generating one with AI or creating one from scratch.'}
					</p>
					{!search && (
						<Link
							to="/teacher/exams/create"
							className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all hover:-translate-y-0.5"
						>
							Create First Exam
						</Link>
					)}
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
					{filteredExams.map(exam => (
						<ExamCard key={exam.id} exam={exam} openModal={openModal} />
					))}
				</div>
			)}

			<ConfirmModal
				isOpen={modalConfig.isOpen}
				onClose={() => setModalConfig({ isOpen: false })}
				onConfirm={handleActionConfirm}
				config={modalConfig}
				loading={actionLoading}
			/>
		</div>
	);
}
