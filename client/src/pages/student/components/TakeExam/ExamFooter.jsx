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
}) => {
	return (
		<footer className="exam-footer" role="contentinfo" aria-label="Exam navigation">
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

			<div className="nav-group" style={{ alignItems: 'center', gap: 12 }}>
				<button
					className={`nav-btn review ${isReviewing ? 'active' : ''}`}
					onClick={onReview}
					disabled={disabled || autoSubmitting}
					aria-pressed={isReviewing}
				>
					<span className="icon">{isReviewing ? '★' : '☆'}</span>
					<span>{isReviewing ? 'Marked' : 'Mark for Review'}</span>
				</button>

				{/* Save & Next */}
				<button
					className="nav-btn primary"
					onClick={onNext}
					disabled={isLast || disabled || autoSubmitting}
					aria-label={isLast ? 'Save current answer' : 'Save and go to next question'}
				>
					<span>{isLast ? 'Save' : 'Save & Next'}</span>
					<span className="icon">→</span>
				</button>

				{/* Submit button (prominent) */}
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

			<div className="nav-group" style={{ minWidth: 160, textAlign: 'right' }}>
				<div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
					{saving ? 'Saving...' : autoSubmitting ? 'Submitting...' : ''}
				</div>
			</div>
		</footer>
	);
};

export default ExamFooter;
