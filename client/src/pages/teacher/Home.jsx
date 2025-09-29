import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const StudentHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const name = user?.fullname || user?.username || 'Student';

    const quickLinks = [
        { label: 'View Courses', icon: '📚', onClick: () => navigate('courses') },
        { label: 'Check Grades', icon: '📝', onClick: () => navigate('grades') },
        { label: 'Submit Assignment', icon: '📤', onClick: () => navigate('assignments') },
    ];

    const insights = [
        { label: 'Enrolled Courses', value: 3, tone: '🟣' },
        { label: 'Pending Assignments', value: 5, tone: '🟠' },
        { label: 'Upcoming Exams', value: 2, tone: '🟢' },
        { label: 'Total Grades', value: 85, tone: '🔵' },
    ];

    return (
        <section>
            <div
                style={{
                    display: 'grid',
                    gap: 18,
                    marginBottom: 20,
                    background: 'linear-gradient(135deg, rgba(14,165,233,0.18), rgba(99,102,241,0.12))',
                    padding: 22,
                    borderRadius: 18,
                    boxShadow: '0 16px 40px rgba(15,23,42,0.10)',
                    border: '1px solid rgba(59,130,246,0.15)',
                }}
            >
                <div>
                    <h1 style={{ margin: 0 }}>Welcome back, {name}</h1>
                    <p style={{ margin: '8px 0 0', color: '#1e293b', fontSize: 15 }}>
                        Access your courses, check grades, and manage assignments all in one place.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {quickLinks.map(link => (
                        <button
                            key={link.label}
                            onClick={link.onClick}
                            style={{
                                flex: '1 1 180px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 10,
                                padding: '12px 16px',
                                borderRadius: 12,
                                border: 'none',
                                background: '#0ea5e9',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontWeight: 700,
                                boxShadow: '0 14px 28px rgba(14,165,233,0.26)',
                            }}
                        >
                            <span aria-hidden>{link.icon}</span>
                            {link.label}
                        </button>
                    ))}
                </div>
            </div>

            <div
                style={{
                    display: 'grid',
                    gap: 14,
                    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                }}
            >
                {insights.map(card => (
                    <div
                        key={card.label}
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            padding: 18,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 12px 28px rgba(15,23,42,0.06)',
                            display: 'grid',
                            gap: 10,
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b' }}>
                            <span aria-hidden>{card.tone}</span>
                            {card.label}
                        </div>
                        <div style={{ fontSize: 30, fontWeight: 800, color: '#0f172a' }}>{card.value}</div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default StudentHome;