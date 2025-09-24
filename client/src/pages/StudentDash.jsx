import React, { useState } from 'react';
import Sidebar from '../components/Sidebar.jsx';

const StudentDash = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="student-dash">
            <Sidebar
                items={[
                    { label: 'Dashboard', onClick: () => setActiveTab('dashboard') },
                    { label: 'Exams', onClick: () => setActiveTab('exams') },
                ]}
            />
            {activeTab === 'dashboard' && <h1>Student Dashboard</h1>}
            {activeTab === 'exams' && <h1>Exams</h1>}
        </div>
    );
};

export default StudentDash;