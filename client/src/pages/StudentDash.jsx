import React, { useState } from 'react';

const StudentDash = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="student-dash">
            <h1>Student Dashboard</h1>
            <div className="tabs">
                <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button onClick={() => setActiveTab('exams')}>Exams</button>
            </div>
        </div>
    );
};

export default StudentDash;