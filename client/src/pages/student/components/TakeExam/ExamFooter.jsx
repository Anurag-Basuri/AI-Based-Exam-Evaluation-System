import React from 'react';
import { ArrowLeft, ArrowRight, Star, Send } from 'lucide-react';

const ExamFooter = ({
	currentIndex = 0,
	totalQuestions = 0,
	onPrev,
	onNext,
	onToggleReview,
	isReviewing,
	onSubmit,
	disabled,
	saving,
	autoSubmitting,
	questionStats,
}) => {
	const isFirst = currentIndex === 0;
	const isLast = currentIndex === totalQuestions - 1;
	const stats = questionStats || {};

	return (
		<footer 
			className="fixed bottom-0 left-0 right-0 bg-[var(--surface)] backdrop-blur-md border-t border-[var(--border)] px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:pb-4 gap-2 flex-wrap sm:flex-nowrap" 
			role="contentinfo" 
			aria-label="Exam navigation"
		>
			{/* Left: Previous */}
			<div className="flex gap-2">
				<button
					className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-sm border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
					onClick={onPrev}
					disabled={isFirst || disabled}
					aria-label="Previous question"
				>
					<ArrowLeft className="w-4 h-4" />
					<span className="hidden sm:inline">Previous</span>
				</button>
			</div>

			{/* Center: Review + Save & Next + Submit */}
			<div className="flex items-center justify-center gap-2 flex-1 min-w-max">
				<button
					className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-sm border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
						isReviewing 
							? 'bg-warning-bg text-warning-text border-warning-border dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30' 
							: 'bg-[var(--surface)] text-[var(--text)] border-[var(--border)] hover:bg-[var(--bg-secondary)]'
					}`}
					onClick={onToggleReview}
					disabled={disabled || autoSubmitting}
					aria-pressed={isReviewing}
				>
					<Star className={`w-4 h-4 ${isReviewing ? 'fill-current' : ''}`} />
					<span className="hidden sm:inline">{isReviewing ? 'Marked' : 'Review'}</span>
				</button>

				<button
					className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm border-none bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
					onClick={onNext}
					disabled={isLast || disabled || autoSubmitting}
					aria-label={isLast ? 'Save current answer' : 'Save and go to next question'}
				>
					<span className="hidden sm:inline">{isLast ? 'Save' : 'Save & Next'}</span>
					<ArrowRight className="w-4 h-4" />
				</button>

				<button
					className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold text-sm border-none bg-rose-600 hover:bg-rose-500 text-white shadow-md hover:-translate-y-[1px] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ml-0 sm:ml-2"
					onClick={onSubmit}
					disabled={autoSubmitting || disabled}
					aria-label="Submit exam"
					title="Submit exam"
				>
					<Send className="w-4 h-4" />
					<span className="hidden sm:inline">{autoSubmitting ? 'Submitting…' : 'Submit'}</span>
				</button>
			</div>

			{/* Right: Save status */}
			<div className="hidden sm:flex flex-col items-end justify-center min-w-[140px] text-xs font-bold gap-0.5">
				{saving && (
					<span className="text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
						<span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 animate-pulse" />
						Saving...
					</span>
				)}
				{autoSubmitting && <span className="text-rose-600 dark:text-rose-400">Submitting...</span>}
				{!saving && !autoSubmitting && stats.total > 0 && (
					<span className="text-[var(--text-muted)]">{stats.answered}/{stats.total} answered</span>
				)}
			</div>
		</footer>
	);
};

export default ExamFooter;
