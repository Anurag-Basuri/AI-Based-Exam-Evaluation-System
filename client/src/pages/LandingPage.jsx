import React, { useEffect, useState } from 'react';
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
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    // Handle window resize for responsiveness
    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Responsive values
    const isMobile = windowWidth < 768;
    const mainPadding = isMobile ? '1rem' : '2rem';
    const mainWidth = isMobile ? '100%' : '90%';
    const headingSize = isMobile ? '2rem' : '2.8rem';
    const cardWidth = isMobile ? '100%' : '260px';
    const cardGap = isMobile ? '2rem' : '3rem';

    // Create image bubbles in a more organized way
    const decorativeImages = [
        { src: image1, size: 60, opacity: 0.15, top: '15%', left: '5%' },
        { src: image2, size: 80, opacity: 0.12, top: '85%', left: '85%' },
        { src: image3, size: 70, opacity: 0.10, top: '75%', left: '10%' },
        { src: image4, size: 65, opacity: 0.13, top: '10%', right: '8%' },
        { src: image5, size: 55, opacity: 0.12, top: '60%', left: '90%' },
        { src: image6, size: 90, opacity: 0.08, top: '90%', left: '50%' },
        { src: image7, size: 50, opacity: 0.14, top: '25%', left: '80%' },
        { src: image8, size: 75, opacity: 0.11, top: '40%', left: '3%' },
    ];

    // Feature icons shown in info box
    const featureIcons = [
        { src: image1, title: "AI Evaluation" },
        { src: image2, title: "Instant Results" },
        { src: image3, title: "Secure Exams" },
        { src: image4, title: "Fair Grading" }
    ];

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
                overflow: 'hidden',
                padding: mainPadding
            }}
        >
            {/* Decorative Image Bubbles */}
            {decorativeImages.map((img, index) => (
                <img
                    key={index}
                    src={img.src}
                    alt=""
                    style={{
                        position: 'absolute',
                        width: img.size,
                        height: img.size,
                        borderRadius: '50%',
                        opacity: img.opacity,
                        zIndex: 0,
                        top: img.top,
                        left: img.left,
                        right: img.right,
                        transform: img.left === '50%' ? 'translateX(-50%)' : 'none',
                        transition: 'opacity 0.5s ease',
                        display: isMobile && index > 3 ? 'none' : 'block' // Show fewer on mobile
                    }}
                />
            ))}

            <div style={{ 
                zIndex: 1, 
                width: mainWidth, 
                maxWidth: 950, 
                margin: '0 auto',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(8px)',
                borderRadius: '1.5rem',
                padding: isMobile ? '1.5rem' : '2.5rem',
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
            }}>
                <h1
                    style={{
                        fontSize: headingSize,
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
                        fontSize: isMobile ? '1.1rem' : '1.3rem',
                        color: '#334155',
                        marginBottom: '1.5rem',
                        textAlign: 'center'
                    }}
                >
                    Welcome to a smarter way to conduct and evaluate exams! Our platform uses advanced AI to automate exam grading, provide instant feedback, and empower both students and teachers.
                </p>
                <div
                    style={{
                        background: '#fff',
                        borderRadius: '1rem',
                        boxShadow: '0 2px 16px rgba(30,41,59,0.07)',
                        padding: isMobile ? '1.2rem' : '1.7rem 2.2rem',
                        marginBottom: '2.5rem',
                        textAlign: 'center',
                        color: '#475569',
                        fontSize: isMobile ? '1rem' : '1.12rem',
                        lineHeight: 1.7
                    }}
                >
                    <strong>How does it work?</strong>
                    <ul style={{ 
                        textAlign: 'left', 
                        margin: '1rem auto', 
                        maxWidth: 650,
                        paddingLeft: isMobile ? '1.5rem' : '2rem'
                    }}>
                        <li>
                            <b>Teachers:</b> Create exams, add questions, and monitor student progress. After submission, AI evaluates answers but teachers can review and adjust marks.
                        </li>
                        <li>
                            <b>Students:</b> Join exams, answer questions, and submit your work. Get instant results and feedback powered by AI.
                        </li>
                        <li>
                            <b>Why AI?</b> Our system ensures unbiased, consistent grading and saves time while providing immediate insights.
                        </li>
                    </ul>
                    
                    {/* Feature Icons with Labels */}
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        flexWrap: 'wrap',
                        gap: '1rem', 
                        marginTop: '1.5rem' 
                    }}>
                        {featureIcons.map((icon, idx) => (
                            <div key={idx} style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                margin: '0 0.5rem'
                            }}>
                                <img 
                                    src={icon.src} 
                                    alt={icon.title} 
                                    style={{ 
                                        width: 45, 
                                        height: 45, 
                                        borderRadius: '12px', 
                                        marginBottom: '0.3rem',
                                        border: '2px solid rgba(99, 102, 241, 0.2)' 
                                    }} 
                                />
                                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{icon.title}</span>
                            </div>
                        ))}
                    </div>
                    
                    <span style={{ color: '#6366f1', fontWeight: 500, display: 'block', marginTop: '1rem' }}>
                        Experience seamless, transparent, and intelligent exam management!
                    </span>
                </div>
                <p
                    style={{
                        fontSize: isMobile ? '1.05rem' : '1.18rem',
                        color: '#64748b',
                        marginBottom: '2rem',
                        textAlign: 'center'
                    }}
                >
                    Select your role to get started:
                </p>
                <div
                    style={{
                        display: 'flex',
                        gap: cardGap,
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        flexDirection: isMobile ? 'column' : 'row'
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
                            width: cardWidth,
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
                        <button
                            style={{
                                backgroundColor: '#6366f1',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 1rem',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Login as Student
                        </button>
                    </div>
                    {/* Teacher Card */}
                    <div
                        style={{
                            background: '#fff',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
                            padding: '2rem 2rem 1.5rem 2rem',
                            textAlign: 'center',
                            width: cardWidth,
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
                        <button
                            style={{
                                backgroundColor: '#f59e42',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                padding: '0.5rem 1rem',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Login as Teacher
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingPage;