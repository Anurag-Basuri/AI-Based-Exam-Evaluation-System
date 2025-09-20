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

    // Features for the feature section
    const features = [
        {
            title: "AI-Powered Evaluation",
            description: "Our system uses advanced AI to evaluate answers accurately and consistently.",
            icon: image1
        },
        {
            title: "Instant Feedback",
            description: "Students receive immediate results and feedback after submitting their exams.",
            icon: image2
        },
        {
            title: "Teacher Review",
            description: "Teachers can review and adjust AI evaluations for complete control.",
            icon: image3
        },
        {
            title: "Secure Exams",
            description: "Exams are conducted in a secure environment with time management.",
            icon: image4
        }
    ];

    return (
        <div style={{ fontFamily: "'Segoe UI', 'Roboto', sans-serif" }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(120deg, #e0e7ff 0%, #f8fafc 100%)',
                padding: isMobile ? '3rem 1rem' : '5rem 3rem',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '2rem',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background images */}
                <img src={image5} alt="" style={{ 
                    position: 'absolute', 
                    top: '10%', 
                    right: '5%', 
                    width: 70, 
                    height: 70, 
                    opacity: 0.1,
                    borderRadius: '50%',
                    zIndex: 0
                }} />
                <img src={image6} alt="" style={{ 
                    position: 'absolute', 
                    bottom: '10%', 
                    left: '5%', 
                    width: 80, 
                    height: 80, 
                    opacity: 0.1,
                    borderRadius: '50%',
                    zIndex: 0
                }} />

                {/* Hero content */}
                <div style={{ 
                    flex: '1', 
                    zIndex: 1,
                    maxWidth: isMobile ? '100%' : '550px'
                }}>
                    <h1 style={{
                        fontSize: isMobile ? '2.2rem' : '3rem',
                        fontWeight: 800,
                        color: '#1e293b',
                        marginBottom: '1.5rem',
                        lineHeight: 1.2
                    }}>
                        AI-Based Exam Evaluation System
                    </h1>
                    <p style={{
                        fontSize: isMobile ? '1.1rem' : '1.25rem',
                        color: '#475569',
                        marginBottom: '2rem',
                        lineHeight: 1.6
                    }}>
                        Transform your exam experience with our AI-powered platform. Create, take, and evaluate exams with unprecedented efficiency and fairness.
                    </p>
                    <div style={{ 
                        display: 'flex', 
                        gap: '1rem',
                        flexWrap: 'wrap'
                    }}>
                        <button onClick={() => navigate('/signup')} style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: '#6366f1',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 500,
                            boxShadow: '0 4px 14px rgba(99,102,241,0.25)'
                        }}>
                            Get Started
                        </button>
                        <button onClick={() => navigate('/about')} style={{
                            padding: '0.75rem 1.5rem',
                            backgroundColor: 'transparent',
                            color: '#6366f1',
                            border: '1px solid #6366f1',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontSize: '1rem',
                            fontWeight: 500
                        }}>
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Hero image */}
                <div style={{ 
                    flex: '1',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 1
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1rem',
                        maxWidth: '400px'
                    }}>
                        <img src={image1} alt="" style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <img src={image2} alt="" style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <img src={image3} alt="" style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                        <img src={image4} alt="" style={{ width: '100%', borderRadius: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{
                padding: isMobile ? '3rem 1rem' : '5rem 3rem',
                backgroundColor: 'white'
            }}>
                <h2 style={{
                    fontSize: isMobile ? '1.8rem' : '2.2rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    textAlign: 'center',
                    marginBottom: '3rem'
                }}>
                    How Our Platform Works
                </h2>

                <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '2rem',
                    maxWidth: '1200px',
                    margin: '0 auto'
                }}>
                    {features.map((feature, index) => (
                        <div key={index} style={{
                            padding: '2rem',
                            backgroundColor: '#f8fafc',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                            textAlign: 'center'
                        }}>
                            <img 
                                src={feature.icon} 
                                alt={feature.title} 
                                style={{
                                    width: '64px',
                                    height: '64px',
                                    borderRadius: '16px',
                                    marginBottom: '1rem',
                                    border: '2px solid rgba(99,102,241,0.2)'
                                }}
                            />
                            <h3 style={{
                                fontSize: '1.3rem',
                                fontWeight: 600,
                                color: '#1e293b',
                                marginBottom: '0.75rem'
                            }}>
                                {feature.title}
                            </h3>
                            <p style={{
                                color: '#64748b',
                                fontSize: '1rem',
                                lineHeight: 1.6
                            }}>
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Role Selection Section */}
            <section style={{
                padding: isMobile ? '3rem 1rem' : '5rem 3rem',
                backgroundColor: '#f8fafc',
                textAlign: 'center'
            }}>
                <h2 style={{
                    fontSize: isMobile ? '1.8rem' : '2.2rem',
                    fontWeight: 700,
                    color: '#1e293b',
                    marginBottom: '1rem'
                }}>
                    Choose Your Role
                </h2>
                <p style={{
                    fontSize: '1.1rem',
                    color: '#64748b',
                    marginBottom: '3rem',
                    maxWidth: '700px',
                    margin: '0 auto 3rem'
                }}>
                    Our platform serves both students and teachers with specialized features for each role.
                </p>

                <div style={{
                    display: 'flex',
                    gap: '3rem',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                }}>
                    {/* Student Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
                        padding: '2rem',
                        textAlign: 'center',
                        width: isMobile ? '100%' : '320px',
                        maxWidth: '100%'
                    }}>
                        <img
                            src={studentImg}
                            alt="Student"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginBottom: '1.5rem',
                                border: '3px solid #6366f1',
                                boxShadow: '0 2px 8px rgba(99,102,241,0.15)'
                            }}
                        />
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: '#6366f1',
                            marginBottom: '1rem'
                        }}>
                            Student
                        </h3>
                        <p style={{
                            color: '#64748b',
                            fontSize: '1rem',
                            marginBottom: '1.5rem',
                            lineHeight: 1.6
                        }}>
                            Take exams, submit answers, and receive instant feedback from our AI-powered evaluation system.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center'
                        }}>
                            <button 
                                onClick={() => navigate('/student/login')}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    backgroundColor: 'transparent',
                                    color: '#6366f1',
                                    border: '1px solid #6366f1',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => navigate('/student/signup')}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    backgroundColor: '#6366f1',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    boxShadow: '0 4px 14px rgba(99,102,241,0.2)'
                                }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>

                    {/* Teacher Card */}
                    <div style={{
                        background: 'white',
                        borderRadius: '1rem',
                        boxShadow: '0 4px 24px rgba(30,41,59,0.10)',
                        padding: '2rem',
                        textAlign: 'center',
                        width: isMobile ? '100%' : '320px',
                        maxWidth: '100%'
                    }}>
                        <img
                            src={teacherImg}
                            alt="Teacher"
                            style={{
                                width: '100px',
                                height: '100px',
                                borderRadius: '50%',
                                objectFit: 'cover',
                                marginBottom: '1.5rem',
                                border: '3px solid #f59e42',
                                boxShadow: '0 2px 8px rgba(245,158,66,0.15)'
                            }}
                        />
                        <h3 style={{
                            fontSize: '1.5rem',
                            fontWeight: 600,
                            color: '#f59e42',
                            marginBottom: '1rem'
                        }}>
                            Teacher
                        </h3>
                        <p style={{
                            color: '#64748b',
                            fontSize: '1rem',
                            marginBottom: '1.5rem',
                            lineHeight: 1.6
                        }}>
                            Create exams, manage questions, review AI evaluations, and provide feedback to students.
                        </p>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            justifyContent: 'center'
                        }}>
                            <button 
                                onClick={() => navigate('/teacher/login')}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    backgroundColor: 'transparent',
                                    color: '#f59e42',
                                    border: '1px solid #f59e42',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 500
                                }}
                            >
                                Login
                            </button>
                            <button 
                                onClick={() => navigate('/teacher/signup')}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    backgroundColor: '#f59e42',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontWeight: 500,
                                    boxShadow: '0 4px 14px rgba(245,158,66,0.2)'
                                }}
                            >
                                Sign Up
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#1e293b',
                color: 'white',
                padding: isMobile ? '2rem 1rem' : '3rem',
                textAlign: 'center'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    justifyContent: 'space-between',
                    alignItems: isMobile ? 'center' : 'flex-start',
                    maxWidth: '1200px',
                    margin: '0 auto',
                    gap: isMobile ? '2rem' : '1rem'
                }}>
                    <div style={{
                        textAlign: isMobile ? 'center' : 'left',
                        maxWidth: isMobile ? '100%' : '300px'
                    }}>
                        <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>AI Exam System</h3>
                        <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>
                            Transforming the way exams are conducted and evaluated with advanced AI technology.
                        </p>
                    </div>

                    <div>
                        <h4 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Contact</h4>
                        <p style={{ color: '#cbd5e1', lineHeight: 1.6, fontSize: '0.95rem' }}>
                            Email: support@aiexamsystem.com<br />
                            Phone: (123) 456-7890
                        </p>
                    </div>
                </div>
                <div style={{ 
                    borderTop: '1px solid #475569', 
                    marginTop: '2rem',
                    paddingTop: '2rem',
                    fontSize: '0.9rem',
                    color: '#94a3b8'
                }}>
                    © {new Date().getFullYear()} AI Exam System. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;