import React from 'react';
import { ShieldAlert, Clock, Menu } from 'lucide-react';

const ExamHeader = ({ title, timer, onToggleSidebar, violations = { count: 0 }, questionStats }) => {
	const { remaining, remainingMs } = timer;
	const vCount = violations?.count || 0;
	const MAX = 5;

	// Timer color class
	let timerClass = 'font-mono text-lg font-bold px-3 py-1.5 rounded-lg border shadow-sm flex items-center gap-2 ';
	if (remainingMs !== null && remainingMs < 60000) {
		// < 1 min - danger
		timerClass += 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-500/10 dark:border-rose-500/20 animate-pulse';
	} else if (remainingMs !== null && remainingMs < 300000) {
		// < 5 mins - warning
		timerClass += 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-500/10 dark:border-amber-500/20 animate-pulse';
	} else {
		timerClass += 'text-indigo-600 bg-indigo-50 border-indigo-200 dark:text-indigo-400 dark:bg-indigo-500/10 dark:border-indigo-500/20';
	}

	// Violation badge severity
	let badgeClass = 'flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border shadow-sm ';
	if (vCount >= 4) badgeClass += 'bg-rose-600 text-white border-rose-700 animate-pulse';
	else if (vCount >= 2) badgeClass += 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-500/20 dark:text-rose-400 dark:border-rose-500/30';
	else if (vCount >= 1) badgeClass += 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30';

	const stats = questionStats || {};

	return (
		<header className="h-[72px] lg:h-auto bg-[var(--surface)] backdrop-blur-md border-b border-[var(--border)] flex items-center justify-between px-4 sm:px-6 shadow-sm relative z-20 flex-wrap gap-2 py-2 lg:py-4">
			<div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
				<h1 className="text-lg sm:text-xl font-black text-[var(--text)] whitespace-nowrap overflow-hidden text-ellipsis">
					{title}
				</h1>
				{/* Progress mini indicator */}
				{stats.total > 0 && (
					<div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-secondary)] px-3 py-1 rounded-lg shrink-0">
						<span className="text-emerald-600 dark:text-emerald-400 font-black">{stats.answered || 0}</span>
						<span>/</span>
						<span>{stats.total}</span>
						<span className="text-[10px] uppercase tracking-wider opacity-70 ml-0.5">answered</span>
					</div>
				)}
			</div>
			
			<div className="flex items-center gap-2 sm:gap-3">
				{/* Violation badge */}
				{vCount > 0 && (
					<div
						className={badgeClass}
						title={`${vCount} violation${vCount !== 1 ? 's' : ''} — ${MAX - vCount} remaining before auto-submit`}
					>
						<ShieldAlert className="w-4 h-4" />
						<span>{vCount}/{MAX}</span>
					</div>
				)}

				<div className={timerClass}>
					<Clock className="w-5 h-5" />
					{remaining.mm}:{remaining.ss}
				</div>
				<button 
					className="lg:hidden flex items-center justify-center p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
					onClick={onToggleSidebar}
					aria-label="Toggle Question Palette"
				>
					<Menu className="w-5 h-5" />
				</button>
			</div>
		</header>
	);
};

export default ExamHeader;
