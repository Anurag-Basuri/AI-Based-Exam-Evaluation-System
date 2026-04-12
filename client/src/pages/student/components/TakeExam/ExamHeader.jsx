import React from 'react';

const ExamHeader = ({ title, timer, onToggleSidebar, violations = { count: 0 } }) => {
    const { remaining, remainingMs } = timer;
    const vCount = violations?.count || 0;
    const MAX = 5;
    
    // Determine timer color class
    let timerClass = 'exam-timer';
    if (remainingMs < 300000) timerClass += ' warning'; // < 5 mins
    if (remainingMs < 60000) timerClass += ' danger';   // < 1 min

    // Determine violation badge severity
    let badgeClass = 'violation-badge';
    if (vCount >= 4) badgeClass += ' critical';
    else if (vCount >= 2) badgeClass += ' serious';
    else if (vCount >= 1) badgeClass += ' warning';

    return (
        <header className="exam-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, minWidth: 0 }}>
                <h1 className="exam-title">{title}</h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* Violation badge — always visible once violations start */}
                {vCount > 0 && (
                    <div
                        className={badgeClass}
                        title={`${vCount} violation${vCount !== 1 ? 's' : ''} — ${MAX - vCount} remaining before auto-submit`}
                    >
                        <span className="violation-badge-icon">🛡️</span>
                        <span className="violation-badge-count">{vCount}/{MAX}</span>
                    </div>
                )}

                <div className={timerClass}>
                    <span>⏳</span>
                    {remaining.mm}:{remaining.ss}
                </div>
                <button 
                    className="nav-btn mobile-only" 
                    onClick={onToggleSidebar}
                    aria-label="Toggle Question Palette"
                >
                    ☰
                </button>
            </div>
        </header>
    );
};

export default ExamHeader;
