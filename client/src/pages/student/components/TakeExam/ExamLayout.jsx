import React from 'react';
import '../../TakeExam.css';

const ExamLayout = ({ children }) => {
    return (
        <div className="exam-container">
            {children}
        </div>
    );
};

export default ExamLayout;
