import React from 'react';

const ExamFooter = ({
	onPrev,
	onNext,
	onReview,
	onSubmit,
	isFirst,
	isLast,
	isReviewing,
	disabled,
	saving,
	autoSubmitting,
	questionStats,
}) => {
	const stats = questionStats || {};

	return (
		<footer className="exam-footer" role="contentinfo" aria-label="Exam navigation">
			{/* Left: Previous */}
			<div className="nav-group">
				<button
					className="nav-btn"
					onClick={onPrev}
					disabled={isFirst || disabled}
					aria-label="Previous question"
				>
					<span className="icon">←</span>
					<span>Previous</span>
				</button>
			</div>

			{/* Center: Review + Save & Next + Submit */}
			<div className="nav-group" style={{ alignItems: 'center', gap: 10 }}>
				<button
					className={`nav-btn review ${isReviewing ? 'active' : ''}`}
					onClick={onReview}
					disabled={disabled || autoSubmitting}
					aria-pressed={isReviewing}
				>
					<span className="icon">{isReviewing ? '★' : '☆'}</span>
					<span>{isReviewing ? 'Marked' : 'Review'}</span>
				</button>

				<button
					className="nav-btn primary"
					onClick={onNext}
					disabled={isLast || disabled || autoSubmitting}
					aria-label={isLast ? 'Save current answer' : 'Save and go to next question'}
				>
					<span>{isLast ? 'Save' : 'Save & Next'}</span>
					<span className="icon">→</span>
				</button>

				<button
					className="nav-btn danger"
					onClick={onSubmit}
					disabled={autoSubmitting || disabled}
					aria-label="Submit exam"
					title="Submit exam"
					style={{ marginLeft: 4 }}
				>
					{autoSubmitting ? 'Submitting…' : 'Submit'}
				</button>
			</div>

			{/* Right: Save status */}
			<div className="nav-group" style={{ minWidth: 140, justifyContent: 'flex-end', textAlign: 'right' }}>
				<div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
					{saving && (
						<span style={{ color: 'var(--primary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
							<span className="save-dot" style={{
								width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)',
								animation: 'pulse 1s infinite',
							}} />
							Saving...
						</span>
					)}
					{autoSubmitting && <span style={{ color: 'var(--error)', fontWeight: 600 }}>Submitting...</span>}
					{!saving && !autoSubmitting && stats.total > 0 && (
						<span>{stats.answered}/{stats.total} answered</span>
					)}
				</div>
			</div>
		</footer>
	);
};

export default ExamFooter;
