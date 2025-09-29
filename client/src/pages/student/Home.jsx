import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const Home = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const username = user?.username || 'Student';

    return (
        <section>
            <h1 style={{ marginTop: 0 }}>Welcome, {username}</h1>
            <p style={{ color: '#475569' }}>
                Track exams, continue active sessions, and view your results.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button
                    onClick={() => navigate('exams')}
                    style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: 'none',
                        background: '#6366f1',
                        color: '#fff',
                        cursor: 'pointer',
                        fontWeight: 700,
                        boxShadow: '0 10px 18px rgba(99,102,241,0.25)',
                    }}
                >
                    Go to Exams
                </button>
                <button
                    onClick={() => navigate('settings')}
                    style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        border: '1px solid #cbd5e1',
                        background: '#fff',
                        color: '#0f172a',
                        cursor: 'pointer',
                        fontWeight: 700,
                    }}
                >
                    Settings
                </button>
            </div>
        </section>
    );
};

export default Home;