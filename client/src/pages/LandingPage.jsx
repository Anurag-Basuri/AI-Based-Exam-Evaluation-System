import React from 'react';
import { useNavigate } from 'react-router-dom';
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)'
        }}>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1.5rem', color: '#1e293b' }}>
                AI-Based Exam Evaluation System
            </h1>
            <p style={{ fontSize: '1.2rem', color: '#334155', marginBottom: '2.5rem' }}>
                Welcome! Please choose your role to continue.
            </p>
            <div style={{
                display: 'flex',
                gap: '3rem',
                justifyContent: 'center',
                alignItems: 'center'
            }}>
                {/* Student Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 24px rgba(30,41,59,0.08)',
                        padding: '2rem',
                        textAlign: 'center',
                        width: '260px',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s'
                    }}
                    onClick={() => navigate('/student/login')}
                >
                    <img
                        src={studentImg}
                        alt="Student"
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginBottom: '1rem',
                            border: '2px solid #6366f1'
                        }}
                    />
                    <h2 style={{ fontSize: '1.3rem', color: '#6366f1', marginBottom: '0.5rem' }}>Student</h2>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>
                        Take exams, submit answers, and view results.
                    </p>
                </div>
                {/* Teacher Card */}
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 24px rgba(30,41,59,0.08)',
                        padding: '2rem',
                        textAlign: 'center',
                        width: '260px',
                        cursor: 'pointer',
                        transition: 'box-shadow 0.2s'
                    }}
                    onClick={() => navigate('/teacher/login')}
                >
                    <img
                        src={teacherImg}
                        alt="Teacher"
                        style={{
                            width: '80px',
                            height: '80px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            marginBottom: '1rem',
                            border: '2px solid #f59e42'
                        }}
                    />
                    <h2 style={{ fontSize: '1.3rem', color: '#f59e42', marginBottom: '0.5rem' }}>Teacher</h2>
                    <p style={{ color: '#64748b', fontSize: '1rem' }}>
                        Create exams, manage questions, and review submissions.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;