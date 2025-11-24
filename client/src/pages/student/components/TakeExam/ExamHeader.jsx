import React from 'react';

const ExamHeader = ({ title, timer, onToggleSidebar }) => {
    const { remaining, remainingMs } = timer;
    
    // Determine timer color class
    let timerClass = 'exam-timer';
    if (remainingMs < 300000) timerClass += ' warning'; // < 5 mins
    if (remainingMs < 60000) timerClass += ' danger';   // < 1 min

    return (
        <header className="exam-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <h1 className="exam-title">{title}</h1>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
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
