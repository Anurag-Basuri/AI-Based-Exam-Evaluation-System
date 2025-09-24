import React from 'react';
import Sidebar from '../components/Sidebar.jsx';

const StudentDash = () => {
    return (
        <div className="student-dash">
            <Sidebar
                useOutlet
                items={[
                    { key: 'home', label: 'Dashboard', icon: '🏠', to: '.' },
                    { key: 'exams', label: 'Exams', icon: '📝', to: 'exams' },
                    { key: 'settings', label: 'Settings', icon: '⚙️', to: 'settings' },
                ]}
            />
        </div>
    );
};

export default StudentDash;