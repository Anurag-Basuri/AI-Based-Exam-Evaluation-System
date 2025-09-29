import React, { useState } from "react";
import Sidebar from '../components/Sidebar.jsx';

const TeacherDash = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    const headerEl = (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo192.png" alt="Teacher" style={{ width: 32, height: 32, borderRadius: 8 }} />
            <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Teacher Portal</div>
        </div>
    );

    return (
        <div className="teacher-dash">
            <Sidebar
                useOutlet
                header={headerEl}
                width={268}
                collapsedWidth={80}
                theme="light"
                items={[
                    { key: 'home', label: 'Overview', icon: '📋', to: '.' },
                    { key: 'exams', label: 'Exams', icon: '📝', to: 'exams' },
                    { key: 'results', label: 'Submissions', icon: '📊', to: 'results' },
                    { key: 'issues', label: 'Issues', icon: '🛠️', to: 'issues' },
                    { key: 'settings', label: 'Settings', icon: '⚙️', to: 'settings' },
                ]}
            />
        </div>
    );
};

export default TeacherDash;
