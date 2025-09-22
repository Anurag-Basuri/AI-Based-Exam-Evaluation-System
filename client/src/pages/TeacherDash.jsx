import React, { useState } from "react";

const TeacherDash = () => {
    const [activeTab, setActiveTab] = useState('dashboard');

    return (
        <div className="teacher-dash">
            <h1>Teacher Dashboard</h1>
            <div className="tabs">
                <button onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                <button onClick={() => setActiveTab('classes')}>Classes</button>
            </div>
        </div>
    );
};

export default TeacherDash;
