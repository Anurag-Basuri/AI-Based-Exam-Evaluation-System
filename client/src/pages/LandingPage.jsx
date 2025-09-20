import React from 'react';
import { useNavigate } from 'react-router-dom';
import studentImg from '../assets/student.jpg';
import teacherImg from '../assets/teacher.jpg';
import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.jpg';
import image4 from '../assets/image4.jpg';
import image5 from '../assets/image5.jpg';
import image6 from '../assets/image6.jpg';
import image7 from '../assets/image7.jpg';
import image8 from '../assets/image8.jpg';

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
                src={image4}
                alt=""
                style={{
                    position: 'absolute',
                    top: 30,
                    left: 30,
                    width: 70,
                    height: 70,
                    opacity: 0.13,
                    borderRadius: '20px',
                    zIndex: 0
                }}
            />
            <img
                src={image5}
                alt=""
                style={{
                    position: 'absolute',
                    bottom: 40,
                    right: 40,
                    width: 90,
                    height: 90,
                    opacity: 0.13,
                    borderRadius: '20px',
                    zIndex: 0
                }}
            />
            <img
                src={image6}
                alt=""
                style={{
                    position: 'absolute',
                    top: '60%',
                    left: '10%',
                    width: 60,
                    height: 60,
                    opacity: 0.10,
                    borderRadius: '50%',
                    zIndex: 0
                }}
            />
            <img
                src={image7}
                alt=""
                style={{
                    position: 'absolute',
                    bottom: '15%',
                    left: '50%',
                    width: 80,
                    height: 80,
                    opacity: 0.10,
                    borderRadius: '50%',
                    zIndex: 0,
                    transform: 'translateX(-50%)'
                }}
            />
            <img
                src={image8}
                alt=""
                style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10%',
                    width: 60,
                    height: 60,
                    opacity: 0.10,
                    borderRadius: '50%',
                    zIndex: 0
                }}
            />

            <div style={{ zIndex: 1, width: '100%', maxWidth: 950, margin: '0 auto' }}>
                <h1
                    style={{
                        fontSize: '2.8rem',
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
                        fontSize: '1.3rem',
                        color: '#334155',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}
                >
                    Welcome to a smarter way to conduct and evaluate exams! Our platform uses advanced AI to automate exam grading, provide instant feedback, and empower both students and teachers with powerful tools.
                </p>
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '1rem',
                        boxShadow: '0 2px 16px rgba(30,41,59,0.07)',
                        padding: '1.7rem 2.2rem',
                        marginBottom: '2.5rem',
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: '1.12rem',
                        lineHeight: 1.7
                    }}
                >
                    <strong>How does it work?</strong>
                    <ul style={{ textAlign: 'left', margin: '1rem auto', maxWidth: 650 }}>
                        <li>
                            <b>Teachers:</b> Effortlessly create exams, add and organize questions, and monitor student progress. After submission, answers are evaluated by AI for speed and fairness, but teachers can review and adjust marks or feedback as needed.
                        </li>
                        <li>
                            <b>Students:</b> Join exams, answer questions, and submit your work. Get instant results and feedback powered by AI, and raise issues if you need clarification or help.
                        </li>
                        <li>
                            Both roles have dedicated dashboards for managing exams, viewing results, and communicating about issues or feedback.
                        </li>
                        <li>
                            <b>Why AI?</b> Our system ensures unbiased, consistent grading and saves time for teachers, while giving students immediate insights into their performance.
                        </li>
                    </ul>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                        <img src={image1} alt="" style={{ width: 36, height: 36, borderRadius: '8px', opacity: 0.22 }} />
                        <img src={image2} alt="" style={{ width: 36, height: 36, borderRadius: '8px', opacity: 0.22 }} />
                        <img src={image3} alt="" style={{ width: 36, height: 36, borderRadius: '8px', opacity: 0.22 }} />
                    </div>
                    <span style={{ color: '#6366f1', fontWeight: 500, display: 'block', marginTop: '1rem' }}>
                        Experience seamless, transparent, and intelligent exam management!
                    </span>
                </div>
                <p
                    style={{
                        fontSize: '1.18rem',
                        color: '#64748b',
                        marginBottom: '2.5rem',
                        textAlign: 'center'
                    }}
                >
                    Select your role to get started:
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
                            Take exams, submit answers, and view instant results and feedback.
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
                            Create exams, manage questions, and review or adjust AI evaluations.
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