import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';

const StudentDash = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="student-dash">
            <Sidebar />
            <h1>Student Dashboard</h1>
            <div className="tabs">
                <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button onClick={() => setActiveTab('exams')}>Exams</button>
            </div>
        </div>
    );
};

export default StudentDash;