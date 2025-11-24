import React, { useMemo } from 'react';

const ExamSidebar = ({ 
    questions, 
    answers, 
    markedForReview, 
    currentIndex, 
    onNavigate, 
    isOpen, 
    onClose,
    isOnline,
    lastSaved,
    saving,
    violations,
    onSubmit 
}) => {
    // Calculate stats
    const stats = useMemo(() => {
        let answered = 0;
        const statusMap = questions.map(q => {
            const ans = answers.find(a => String(a.question) === String(q.id));
            const isAnswered = (ans?.responseText?.trim().length > 0) || ans?.responseOption;
            const isMarked = markedForReview.includes(q.id);
            
            if (isAnswered) answered++;
            
            if (isMarked && isAnswered) return 'answered-review';
            if (isMarked) return 'review';
            if (isAnswered) return 'answered';
            return 'unanswered';
        });
        
        return { statusMap, answered, total: questions.length };
    }, [questions, answers, markedForReview]);

    return (
        <>
            {/* Mobile Backdrop */}
            <div 
                className={`overlay-backdrop ${isOpen ? '' : 'mobile-only'}`} 
                style={{ display: isOpen ? 'block' : 'none', zIndex: 9 }}
                onClick={onClose}
            />

            <aside className={`exam-sidebar ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <span>Question Palette</span>
                    <button className="nav-btn mobile-only" onClick={onClose}>×</button>
                </div>

                <div className="sidebar-content">
                    <div className="palette-grid">
                        {stats.statusMap.map((status, i) => (
                            <button
                                key={i}
                                className={`palette-btn ${status} ${i === currentIndex ? 'current' : ''}`}
                                onClick={() => {
                                    onNavigate(i);
                                    if (window.innerWidth < 1024) onClose();
                                }}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <div className="palette-legend">
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}></span>
                            Answered
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}></span>
                            Review
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: '#e0e7ff', border: '1px solid #a5b4fc' }}></span>
                            Ans & Review
                        </div>
                        <div className="legend-item">
                            <span className="legend-dot" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}></span>
                            Unanswered
                        </div>
                    </div>

                    <div style={{ marginTop: 'auto' }}>
                        <div className="status-info" style={{ 
                            background: 'var(--bg-secondary)', 
                            padding: 12, 
                            borderRadius: 8, 
                            fontSize: '0.8rem',
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: 4 
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Status:</span>
                                <span style={{ color: isOnline ? 'var(--success)' : 'var(--error)', fontWeight: 600 }}>
                                    {isOnline ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span>Last Saved:</span>
                                <span>{saving ? 'Saving...' : lastSaved ? lastSaved.toLocaleTimeString() : '--'}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: violations.count > 0 ? 'var(--warning)' : 'inherit' }}>
                                <span>Violations:</span>
                                <strong>{violations.count} / 5</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sidebar-footer">
                    <button 
                        className="nav-btn primary" 
                        style={{ width: '100%', background: 'var(--error)', justifyContent: 'center' }}
                        onClick={onSubmit}
                    >
                        Submit Exam
                    </button>
                </div>
            </aside>
        </>
    );
};

export default ExamSidebar;
