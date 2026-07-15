import React, { useMemo } from 'react';
import { X, Send, Wifi, WifiOff } from 'lucide-react';

const ExamSidebar = ({
	questions = [],
	answers = [],
	markedForReview = [],
	currentIndex = 0,
	onNavigate = () => {},
	isOpen = false,
	onClose = () => {},
	isOnline = true,
	lastSaved = null,
	saving = false,
	violations = { count: 0, lastType: '' },
	onSubmit = () => {},
}) => {
	const v = violations || { count: 0, lastType: '' };

	// Calculate stats
	const stats = useMemo(() => {
		const qList = Array.isArray(questions) ? questions : [];
		const aList = Array.isArray(answers) ? answers : [];
		const marked = Array.isArray(markedForReview) ? markedForReview.map(String) : [];
		let answered = 0;
		const statusMap = qList.map(q => {
			const qid = String(q?.id ?? q?._id ?? '');
			const ans = aList.find(a => String(a.question) === qid);
			const isAnswered = !!((ans?.responseText && String(ans.responseText).trim().length > 0) || ans?.responseOption);
			const isMarked = marked.includes(qid);

			if (isAnswered) answered++;

			if (isMarked && isAnswered) return 'answered-review';
			if (isMarked) return 'review';
			if (isAnswered) return 'answered';
			return 'unanswered';
		});

		return { statusMap, answered, total: qList.length };
	}, [questions, answers, markedForReview]);

	const statusColor = status => {
		switch (status) {
			case 'answered': return { bg: 'bg-emerald-500', text: 'text-white', border: 'border-emerald-600', ring: 'ring-emerald-500' };
			case 'review': return { bg: 'bg-amber-500', text: 'text-white', border: 'border-amber-600', ring: 'ring-amber-500' };
			case 'answered-review': return { bg: 'bg-indigo-500', text: 'text-white', border: 'border-indigo-600', ring: 'ring-indigo-500' };
			default: return { bg: 'bg-[var(--bg-secondary)]', text: 'text-[var(--text-muted)]', border: 'border-[var(--border)]', ring: 'ring-gray-400' };
		}
	};

	const lastSavedText = saving
		? 'Saving...'
		: lastSaved
			? lastSaved instanceof Date
				? lastSaved.toLocaleTimeString()
				: (() => { try { return new Date(lastSaved).toLocaleTimeString(); } catch { return String(lastSaved); } })()
			: '--';

	const progressPct = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;

	return (
		<>
			{/* Mobile Backdrop */}
			<div
				className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
				onClick={onClose}
				aria-hidden={!isOpen}
			/>

			<aside 
				className={`fixed lg:static top-[72px] lg:top-0 right-0 bottom-0 w-[320px] sm:w-[360px] lg:w-[320px] bg-[var(--surface)] backdrop-blur-xl border-l border-[var(--border)] flex flex-col z-40 transition-transform duration-300 shadow-2xl lg:shadow-none lg:translate-x-0 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
				aria-label="Question palette"
			>
				<div className="flex items-center justify-between p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--surface)]">
					<span className="font-black text-[var(--text)] text-lg">Question Palette</span>
					<button 
						className="lg:hidden p-2 rounded-full hover:bg-[var(--bg-secondary)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors"
						onClick={onClose} 
						aria-label="Close palette"
					>
						<X className="w-5 h-5" />
					</button>
				</div>

				<div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-6 custom-scrollbar">
					{/* Progress bar */}
					<div>
						<div className="flex justify-between items-center mb-2 text-xs font-black">
							<span className="text-[var(--text-muted)] uppercase tracking-wider">Progress</span>
							<span className={progressPct === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-[var(--text)]'}>
								{stats.answered} / {stats.total} ({progressPct}%)
							</span>
						</div>
						<div className="h-2 rounded-full bg-[var(--border)] overflow-hidden">
							<div 
								className={`h-full rounded-full transition-all duration-300 ${progressPct === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
								style={{ width: `${progressPct}%` }}
							/>
						</div>
					</div>

					{/* Question grid */}
					<div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-5 gap-2" role="list">
						{stats.statusMap.map((status, i) => {
							const s = statusColor(status);
							const isCurrent = i === currentIndex;
							return (
								<button
									key={i}
									className={`aspect-square rounded-xl border flex items-center justify-center text-sm font-bold transition-all ${s.bg} ${s.text} ${s.border} hover:-translate-y-[1px] hover:shadow-md ${isCurrent ? `ring-2 ring-offset-2 ring-offset-[var(--surface)] ${s.ring} scale-[1.05]` : ''}`}
									onClick={() => {
										onNavigate(i);
										if (window.innerWidth < 1024) onClose();
									}}
									aria-current={isCurrent}
									role="listitem"
									aria-label={`Question ${i + 1} ${status}`}
								>
									{i + 1}
								</button>
							);
						})}
					</div>

					{/* Legend */}
					<div className="flex flex-wrap gap-3 text-xs font-bold text-[var(--text-muted)]">
						{[
							{ bg: 'bg-emerald-500', label: 'Answered' },
							{ bg: 'bg-amber-500', label: 'Review' },
							{ bg: 'bg-indigo-500', label: 'Ans & Review' },
							{ bg: 'bg-[var(--bg-secondary)] border border-[var(--border)]', label: 'Unanswered' },
						].map(item => (
							<div key={item.label} className="flex items-center gap-1.5">
								<span className={`w-2.5 h-2.5 rounded-full ${item.bg}`} aria-hidden="true" />
								{item.label}
							</div>
						))}
					</div>

					{/* Status panel */}
					<div className="mt-auto">
						<div className="bg-[var(--bg-secondary)] p-4 rounded-2xl text-xs font-bold flex flex-col gap-3 border border-[var(--border)]">
							<div className="flex justify-between items-center">
								<span className="text-[var(--text-muted)] uppercase tracking-wider">Connection</span>
								<span className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
									{isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
									{isOnline ? 'Online' : 'Offline'}
								</span>
							</div>
							<div className="flex justify-between items-center">
								<span className="text-[var(--text-muted)] uppercase tracking-wider">Last Saved</span>
								<span className={saving ? 'text-indigo-600 dark:text-indigo-400' : 'text-[var(--text)]'}>{lastSavedText}</span>
							</div>
							<div className={`flex justify-between items-center ${v.count > 0 ? 'text-rose-600 dark:text-rose-400' : ''}`}>
								<span className={v.count > 0 ? '' : 'text-[var(--text-muted)] uppercase tracking-wider'}>Violations</span>
								<span className={v.count > 0 ? 'font-black' : ''}>{v.count} / 5</span>
							</div>
						</div>
					</div>
				</div>

				<div className="p-4 sm:p-5 border-t border-[var(--border)] bg-[var(--surface)]">
					<button
						className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
						onClick={onSubmit}
						aria-label="Submit exam"
					>
						<Send className="w-4 h-4" />
						Submit Exam
					</button>
				</div>
			</aside>
		</>
	);
};

export default ExamSidebar;
