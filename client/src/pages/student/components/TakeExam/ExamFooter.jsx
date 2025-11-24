import React from 'react';

const ExamFooter = ({ 
    onPrev, 
    onNext, 
    onReview, 
    isFirst, 
    isLast, 
    isReviewing, 
    disabled 
}) => {
    return (
        <footer className="exam-footer">
            <div className="nav-group">
                <button 
                    className="nav-btn" 
                    onClick={onPrev} 
                    disabled={isFirst || disabled}
                >
                    <span className="icon">←</span>
                    <span>Previous</span>
                </button>
            </div>

            <div className="nav-group">
                <button 
                    className={`nav-btn review ${isReviewing ? 'active' : ''}`}
                    onClick={onReview}
                    disabled={disabled}
                >
                    <span className="icon">{isReviewing ? '★' : '☆'}</span>
                    <span>{isReviewing ? 'Marked' : 'Mark for Review'}</span>
                </button>

                <button 
                    className="nav-btn primary" 
                    onClick={onNext}
                    disabled={isLast || disabled}
                >
                    <span>{isLast ? 'Save' : 'Save & Next'}</span>
                    <span className="icon">→</span>
                </button>
            </div>
        </footer>
    );
};

export default ExamFooter;
