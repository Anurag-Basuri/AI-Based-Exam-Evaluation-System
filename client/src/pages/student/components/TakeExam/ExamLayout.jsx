import React from 'react';
import '../../TakeExam.css';

const ExamLayout = ({ children, violationCount = 0 }) => {
    let className = 'exam-container';
    if (violationCount >= 4) className += ' violations-critical';
    else if (violationCount >= 2) className += ' violations-high';

    return (
        <div className={className}>
            {children}
        </div>
    );
};

export default ExamLayout;
