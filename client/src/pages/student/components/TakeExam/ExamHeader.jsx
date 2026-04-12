import React from 'react';

const ExamHeader = ({ title, timer, onToggleSidebar, violations = { count: 0 }, questionStats }) => {
    const { remaining, remainingMs } = timer;
    const vCount = violations?.count || 0;
    const MAX = 5;
    
    // Timer color class
    let timerClass = 'exam-timer';
    if (remainingMs !== null && remainingMs < 300000) timerClass += ' warning'; // < 5 mins
    if (remainingMs !== null && remainingMs < 60000) timerClass += ' danger';   // < 1 min

    // Violation badge severity
    let badgeClass = 'violation-badge';
    if (vCount >= 4) badgeClass += ' critical';
    else if (vCount >= 2) badgeClass += ' serious';
    else if (vCount >= 1) badgeClass += ' warning';

    const stats = questionStats || {};

    return (
        <header className="exam-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <h1 className="exam-title">{title}</h1>
                {/* Progress mini indicator */}
                {stats.total > 0 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 600, color: 'var(--text-muted)',
                        background: 'var(--bg-secondary)', padding: '4px 10px',
                        borderRadius: 6, flexShrink: 0,
                    }}>
                        <span style={{ color: 'var(--success)', fontWeight: 800 }}>{stats.answered || 0}</span>
                        <span>/</span>
                        <span>{stats.total}</span>
                        <span style={{ fontSize: 11, opacity: 0.7 }}>answered</span>
                    </div>
                )}
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Saving indicator */}
                
                {/* Violation badge */}
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
