import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
	safeApiCall,
	getMySubmissions,
	getSubmissionForResults,
} from '../../services/studentServices.js';
import {
	Search,
	RefreshCcw,
	CheckCircle,
	Clock,
	FileText,
	AlertCircle,
	X,
	Award,
	TrendingUp
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader.jsx';
import Alert from '../../components/ui/Alert.jsx';

// --- Theme-aware status styles ---
const statusStyles = {
	pending: {
		label: 'Pending',
		icon: <Clock className="w-4 h-4" />,
		colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20',
	},
	submitted: {
		label: 'Submitted',
		icon: <RefreshCcw className="w-4 h-4" />,
		colorClass: 'text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20',
	},
	evaluated: {
		label: 'Evaluated',
		icon: <CheckCircle className="w-4 h-4" />,
		colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
	},
	published: {
		label: 'Published',
		icon: <Award className="w-4 h-4" />,
		colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20',
	},
	flagged: {
		label: 'Flagged',
		icon: <AlertCircle className="w-4 h-4" />,
		colorClass: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20',
	},
};

// --- Detailed Answer Breakdown Component ---
const AnswerDetail = ({ answer, evaluation }) => {
	const question = answer.question;
	const isMCQ = question.type === 'multiple-choice';
	const marks = evaluation?.evaluation?.marks ?? 0;
	const remarks = evaluation?.evaluation?.remarks;

	let studentResponse;
	if (isMCQ) {
		const selectedOption = question.options.find(
			opt => String(opt._id) === String(answer.responseOption),
		);
		const correctOption = question.options.find(opt => opt.isCorrect);
		studentResponse = (
			<div className="space-y-2">
				<p className="text-[var(--text)]">
					<span className="font-bold text-[var(--text-muted)] mr-2">Your Answer:</span>
					{selectedOption ? (
						<span
							className={`font-semibold ${selectedOption.isCorrect ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
						>
							{selectedOption.text}
						</span>
					) : (
						<i className="text-gray-400">Not answered</i>
					)}
				</p>
				{!selectedOption?.isCorrect && (
					<p className="text-emerald-600 dark:text-emerald-400">
						<span className="font-bold mr-2 text-[var(--text-muted)]">Correct Answer:</span>
						<span className="font-semibold">{correctOption?.text}</span>
					</p>
				)}
			</div>
		);
	} else {
		studentResponse = (
			<p className="whitespace-pre-wrap text-[var(--text)] bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border)] font-medium">
				{answer.responseText || <i className="text-gray-400">Not answered</i>}
			</p>
		);
	}

	return (
		<div className="border-t border-[var(--border)] py-6 first:border-0">
			<div className="flex justify-between items-start mb-4 gap-4">
				<h5 className="font-bold text-lg text-[var(--text)] flex-1 leading-snug">{question.text}</h5>
				<div className="shrink-0 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg font-black text-sm flex items-center gap-1.5">
					<Award className="w-4 h-4" />
					<span>{marks} / {question.max_marks}</span>
				</div>
			</div>
			<div className="text-sm">
				{studentResponse}
			</div>
			{remarks && (
				<div className="mt-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-900 dark:text-amber-200 p-4 rounded-xl text-sm flex gap-3">
					<AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
					<div>
						<strong className="block mb-1 font-bold text-amber-800 dark:text-amber-300">Teacher Feedback</strong>
						<p className="leading-relaxed font-medium">{remarks}</p>
					</div>
				</div>
			)}
		</div>
	);
};

// --- Result Details Modal ---
const ResultDetailModal = ({ submissionId, onClose }) => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [submission, setSubmission] = useState(null);

	useEffect(() => {
		const loadDetails = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await getSubmissionForResults(submissionId);
				setSubmission(data);
			} catch (e) {
				setError(e?.message || 'Failed to load details.');
			} finally {
				setLoading(false);
			}
		};
		if (submissionId) loadDetails();
	}, [submissionId]);

	const answersMap = useMemo(() => {
		const arr = submission?.answers || [];
		const map = new Map();
		for (const a of arr) {
			const q = a?.question;
			const qid = q ? String(q._id ?? q.id ?? q) : null;
			if (qid) map.set(qid, a);
		}
		return map;
	}, [submission]);

	useEffect(() => {
		const onKey = e => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [onClose]);

	return (
		<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 dash-enter" onClick={onClose}>
			<div 
				className="glass-card bg-[var(--surface)] w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden relative border border-[var(--border)]"
				onClick={e => e.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className="flex items-center justify-between p-6 border-b border-[var(--border)] bg-[var(--bg-secondary)]">
					<div>
						<h3 className="text-xl font-black text-[var(--text)] flex items-center gap-2">
							<FileText className="w-5 h-5 text-indigo-500" />
							{submission ? (submission.exam?.title || submission.examTitle || 'Exam') : 'Details'} - Breakdown
						</h3>
					</div>
					<button 
						onClick={onClose}
						className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-[var(--text-muted)] hover:text-[var(--text)]"
					>
						<X className="w-6 h-6" />
					</button>
				</div>
				
				<div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
					{loading && (
						<div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)] gap-3">
							<RefreshCcw className="w-8 h-8 animate-spin text-indigo-500" />
							<p className="font-bold">Loading details...</p>
						</div>
					)}
					
					{error && (
						<Alert type="error" className="mb-4">
							{error}
						</Alert>
					)}
					
					{submission && (
						<div className="space-y-2">
							{Array.isArray(submission.evaluations) && submission.evaluations.length > 0 ? (
								submission.evaluations.map(ev => {
									const qid = String(ev.question);
									const answer = answersMap.get(qid) || answersMap.get(String(ev.question?._id));
									return answer ? (
										<AnswerDetail
											key={String(ev.question) + String(ev.evaluation?.evaluatedAt ?? ev._id)}
											answer={answer}
											evaluation={ev}
										/>
									) : null;
								})
							) : (
								<div className="flex flex-col items-center justify-center py-12 text-[var(--text-muted)]">
									<div className="w-16 h-16 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-4">
										<FileText className="w-8 h-8 text-gray-400" />
									</div>
									<p className="font-bold text-lg text-[var(--text)]">No evaluations available.</p>
									<p className="text-sm mt-1">Check back later once the teacher has published the results.</p>
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

const ResultCard = ({ result, onViewDetails }) => {
	const config = statusStyles[result.status] || statusStyles.pending;
	const isPublished = result.status === 'published';
	const hasScore = isPublished && result.score !== null && result.score !== undefined;

	const percentage = hasScore && result.maxScore > 0 
		? Math.round((result.score / result.maxScore) * 100) 
		: null;

	const isPassing = percentage !== null && percentage >= 40;
	const isExcellent = percentage !== null && percentage >= 80;

	return (
		<article className="glass-card rounded-2xl border border-[var(--border)] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col md:flex-row overflow-hidden group">
			<div className="flex-1 p-6 flex flex-col justify-between">
				<div>
					<div className="flex flex-wrap items-center gap-3 mb-3">
						<h3 className="text-xl font-bold text-[var(--text)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
							{result.examTitle}
						</h3>
						<span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${config.colorClass}`}>
							{config.icon} {config.label}
						</span>
					</div>
					
					{result.submittedAt && (
						<div className="text-sm font-medium text-[var(--text-muted)] flex items-center gap-2 mb-6">
							<Clock className="w-4 h-4" />
							Submitted: {new Date(result.submittedAt).toLocaleDateString(undefined, {
								year: 'numeric',
								month: 'short',
								day: 'numeric',
								hour: '2-digit',
								minute: '2-digit'
							})}
						</div>
					)}
				</div>

				<div className="mt-auto">
					{result.remarks && (
						<div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 p-4 rounded-xl mb-4">
							<div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold text-sm mb-1">
								<AlertCircle className="w-4 h-4" />
								Teacher Feedback
							</div>
							<p className="text-sm font-medium text-indigo-900 dark:text-indigo-200">{result.remarks}</p>
						</div>
					)}
				</div>
			</div>

			<div className="bg-[var(--bg-secondary)] p-6 flex flex-col justify-center items-center md:w-64 border-t md:border-t-0 md:border-l border-[var(--border)] shrink-0">
				<div className="mb-4 text-center">
					<div className="text-sm font-bold text-[var(--text-muted)] mb-2 uppercase tracking-wider">Performance</div>
					{hasScore ? (
						<div className="flex items-baseline justify-center gap-1">
							<span className="text-4xl font-black text-[var(--text)] tracking-tighter">
								{result.score.toFixed(1)}
							</span>
							<span className="text-lg font-bold text-[var(--text-muted)]">
								/ {result.maxScore || 100}
							</span>
						</div>
					) : (
						<div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-200 dark:border-amber-500/20">
							<Clock className="w-4 h-4" />
							{isPublished ? 'N/A' : 'Awaiting'}
						</div>
					)}
				</div>

				{hasScore && percentage != null && (
					<div className="mb-6 flex justify-center w-full">
						<div className={`px-4 py-2 rounded-xl text-lg font-black border flex items-center gap-2 w-full justify-center ${
							isExcellent ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
							isPassing ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 
							'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
						}`}>
							<TrendingUp className="w-5 h-5" />
							{percentage}%
						</div>
					</div>
				)}

				<button
					onClick={() => onViewDetails(result.id)}
					disabled={!isPublished}
					className="w-full bg-[var(--surface)] hover:bg-[var(--bg)] border border-[var(--border)] text-[var(--text)] font-bold py-2.5 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-md active:scale-95"
				>
					View Details
				</button>
			</div>
		</article>
	);
};

const StudentResults = () => {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [results, setResults] = useState([]);
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState('all');
	const [viewingResultId, setViewingResultId] = useState(null);

	const loadResults = useCallback(async (force = false) => {
		setLoading(true);
		setError('');
		try {
			const data = await safeApiCall(getMySubmissions, {}, force);
			setResults(Array.isArray(data) ? data : []);
		} catch (e) {
			setError(e?.message || 'Failed to load results');
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadResults();
	}, [loadResults]);

	const filteredResults = useMemo(() => {
		const q = query.toLowerCase();
		return results.filter(result => {
			const matchesStatus = status === 'all' || result.status === status;
			const matchesQuery = !q || result.examTitle.toLowerCase().includes(q);
			return matchesStatus && matchesQuery;
		});
	}, [results, status, query]);

	const statusCounts = useMemo(() => {
		const counts = {
			all: results.length,
			evaluated: 0,
			submitted: 0,
			pending: 0,
			flagged: 0,
			published: 0,
		};
		results.forEach(result => {
			counts[result.status] = (counts[result.status] || 0) + 1;
		});
		counts.evaluated += counts.published;
		return counts;
	}, [results]);

	const filterOptions = [
		{ key: 'all', label: 'All' },
		{ key: 'published', label: 'Published' },
		{ key: 'submitted', label: 'Submitted' },
	];

	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 dash-enter space-y-8">
			{viewingResultId && (
				<ResultDetailModal
					submissionId={viewingResultId}
					onClose={() => setViewingResultId(null)}
				/>
			)}
			
			<div className="glass-card p-6 sm:p-8 rounded-3xl border border-[var(--border)] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
				<div>
					<h1 className="text-3xl font-black text-[var(--text)] mb-2 tracking-tight">Results & Feedback</h1>
					<p className="text-[var(--text-muted)] font-medium text-lg">Review your exam scores and teacher feedback.</p>
				</div>
				<button
					onClick={() => loadResults(true)}
					disabled={loading}
					className="shrink-0 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-[var(--text)] px-5 py-2.5 rounded-xl font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
				>
					<RefreshCcw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
					Refresh
				</button>
			</div>

			<div className="glass-card p-4 sm:p-6 rounded-2xl border border-[var(--border)] flex flex-col md:flex-row gap-4 items-center">
				<div className="relative flex-1 w-full">
					<div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
						<Search className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						value={query}
						onChange={e => setQuery(e.target.value)}
						className="block w-full pl-11 pr-4 py-3 bg-[var(--bg)] border border-[var(--border)] rounded-xl text-[var(--text)] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium transition-all"
						placeholder="Search by exam title..."
					/>
				</div>
				<div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
					{filterOptions.map(option => (
						<button
							key={option.key}
							onClick={() => setStatus(option.key)}
							className={`whitespace-nowrap flex items-center gap-2 px-5 py-3 rounded-xl font-bold transition-all ${
								status === option.key
									? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-400'
									: 'bg-[var(--surface)] text-[var(--text-muted)] border-2 border-transparent hover:bg-[var(--bg-secondary)]'
							}`}
						>
							{option.label}
							<span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
								status === option.key 
									? 'bg-indigo-500 text-white' 
									: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
							}`}>
								{statusCounts[option.key] || 0}
							</span>
						</button>
					))}
				</div>
			</div>

			{error && <Alert type="error">{error}</Alert>}
			
			{loading && (
				<div className="flex flex-col items-center justify-center py-20 text-[var(--text-muted)] gap-4">
					<RefreshCcw className="w-10 h-10 animate-spin text-indigo-500" />
					<p className="font-bold text-lg text-[var(--text)]">Loading your results...</p>
				</div>
			)}
			
			{!loading && !error && filteredResults.length === 0 && (
				<div className="glass-card flex flex-col items-center justify-center py-20 px-4 text-center rounded-3xl border border-[var(--border)] border-dashed">
					<div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mb-6">
						<Award className="w-10 h-10 text-indigo-500" />
					</div>
					<h3 className="text-2xl font-black text-[var(--text)] mb-2">
						{query || status !== 'all' ? 'No matching results found' : 'No results yet'}
					</h3>
					<p className="text-[var(--text-muted)] font-medium max-w-md">
						{query || status !== 'all'
							? 'Try adjusting your search query or filters to find what you are looking for.'
							: 'You have not completed any exams yet, or results have not been published by your teachers.'}
					</p>
				</div>
			)}
			
			{!loading && !error && filteredResults.length > 0 && (
				<div className="grid gap-6">
					{filteredResults.map(result => (
						<ResultCard
							key={result.id}
							result={result}
							onViewDetails={setViewingResultId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default StudentResults;
