import React from 'react';

const ExamLayout = ({ children, violationCount = 0 }) => {
	let className = 'flex flex-col h-screen bg-[var(--bg)] text-[var(--text)] overflow-hidden font-sans select-none transition-all duration-300 ';
	
	if (violationCount >= 4) {
		className += 'ring-4 ring-rose-500/50 bg-rose-50/10 dark:bg-rose-900/10';
	} else if (violationCount >= 2) {
		className += 'ring-2 ring-amber-500/50 bg-amber-50/10 dark:bg-amber-900/10';
	}

	return (
		<div className={className}>
			{children}
		</div>
	);
};

export default ExamLayout;
