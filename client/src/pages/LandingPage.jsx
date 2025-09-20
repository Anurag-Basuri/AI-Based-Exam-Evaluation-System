import React from 'react';
import { useNavigate } from 'react-router-dom';
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';
import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.jpg';

const LandingPage = () => {
    const navigate = useNavigate();

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                background: 'linear-gradient(120deg, #e0e7ff 0%, #f8fafc 100%)',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Decorative Images */}
            <img
                src={image1}
                alt=""
                style={{
                    position: 'absolute',
                    top: 40,
                    left: 40,
                    width: 80,
                    height: 80,
                    opacity: 0.12,
                    borderRadius: '20px',
                    zIndex: 0
                }}
            />
            <img
                src={image2}
                alt=""
                style={{
                    position: 'absolute',
                    bottom: 60,
                    right: 60,
                    width: 100,
                    height: 100,
                    opacity: 0.13,
                    borderRadius: '20px',
                    zIndex: 0
                }}
            />
            <img
                src={image3}
                alt=""
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 120,
                    height: 120,
                    opacity: 0.09,
                    borderRadius: '50%',
                    zIndex: 0
                }}
            />

            <div style={{ zIndex: 1, width: '100%' }}>
                <h1
                    style={{
                        fontSize: '2.7rem',
                        fontWeight: 800,
                        marginBottom: '1.2rem',
                        color: '#1e293b',
                        textAlign: 'center',
                        letterSpacing: '1px'
                    }}
                >
                    AI-Based Exam Evaluation System
                </h1>
                <p
                    style={{
                        fontSize: '1.25rem',
                        color: '#334155',
                        marginBottom: '2.5rem',
                        textAlign: 'center'
                    }}
                >
                    Welcome! Choose your role to get started.
                </p>
                <div
                    style={{
                        display: 'flex',
                        gap: '3rem',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap'
                    }}
                >
                    {/* Student Card */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
                            padding: '2rem 2rem 1.5rem 2rem',
                            textAlign: 'center',
                            width: '260px',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            position: 'relative'
                        }}
                        onClick={() => navigate('/student/login')}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
                                border: '2px solid #6366f1',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.08)'
                            }}
                        />
                        <h2 style={{ fontSize: '1.3rem', color: '#6366f1', marginBottom: '0.5rem' }}>Student</h2>
                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1rem' }}>
                            Take exams, submit answers, and view results.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <img src={image1} alt="" style={{ width: 32, height: 32, borderRadius: '8px', opacity: 0.25 }} />
                            <img src={image2} alt="" style={{ width: 32, height: 32, borderRadius: '8px', opacity: 0.25 }} />
                        </div>
                    </div>
                    {/* Teacher Card */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
                            padding: '2rem 2rem 1.5rem 2rem',
                            textAlign: 'center',
                            width: '260px',
                            cursor: 'pointer',
                            transition: 'box-shadow 0.2s, transform 0.2s',
                            position: 'relative'
                        }}
                        onClick={() => navigate('/teacher/login')}
                        onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.04)')}
                        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
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
                                border: '2px solid #f59e42',
                                boxShadow: '0 2px 8px rgba(245,158,66,0.08)'
                            }}
                        />
                        <h2 style={{ fontSize: '1.3rem', color: '#f59e42', marginBottom: '0.5rem' }}>Teacher</h2>
                        <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '1rem' }}>
                            Create exams, manage questions, and review submissions.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                            <img src={image3} alt="" style={{ width: 32, height: 32, borderRadius: '8px', opacity: 0.25 }} />
                            <img src={image2} alt="" style={{ width: 32, height: 32, borderRadius: '8px', opacity: 0.25 }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;