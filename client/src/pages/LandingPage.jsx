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

    // Responsive breakpoints
    const isMobile = windowWidth < 640;
    const isTablet = windowWidth >= 640 && windowWidth < 1024;

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

    // Dynamic background image animation
    const backgroundImages = [
        { src: image5, top: '10%', left: '5%', size: 80, delay: 0 },
        { src: image6, top: '15%', right: '8%', size: 70, delay: 2 },
        { src: image7, bottom: '25%', left: '8%', size: 65, delay: 1 },
        { src: image8, bottom: '10%', right: '5%', size: 75, delay: 3 }
    ];

    return (
        <div style={{ 
            fontFamily: "'Segoe UI', 'Roboto', sans-serif",
            overflowX: 'hidden'
        }}>
            {/* Hero Section */}
            <section style={{
                background: 'linear-gradient(135deg, #e0e7ff 0%, #f8fafc 100%)',
                padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
                display: 'flex',
                flexDirection: isMobile || isTablet ? 'column' : 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '2.5rem',
                position: 'relative',
                overflow: 'hidden',
                minHeight: isMobile ? 'auto' : '80vh'
            }}>
                {/* Animated background elements */}
                {backgroundImages.map((img, index) => (
                    <div 
                        key={index} 
                        style={{
                            position: 'absolute',
                            top: img.top,
                            left: img.left,
                            right: img.right,
                            bottom: img.bottom,
                            width: img.size,
                            height: img.size,
                            zIndex: 0,
                            animation: `float ${3 + index * 0.5}s ease-in-out infinite alternate`,
                            animationDelay: `${img.delay}s`,
                            display: isMobile && index > 1 ? 'none' : 'block' // Show fewer on mobile
                        }}
                    >
                        <img 
                            src={img.src} 
                            alt="" 
                            style={{
                                width: '100%',
                                height: '100%',
                                borderRadius: '50%',
                                opacity: 0.15,
                                objectFit: 'cover',
                                boxShadow: '0 10px 30px rgba(0,0,0,0.05)'
                            }}
                        />
                    </div>
                ))}

                {/* Hero content */}
                <div style={{ 
                    flex: '1', 
                    zIndex: 1,
                    maxWidth: isMobile || isTablet ? '100%' : '45%',
                    animation: 'fadeInLeft 1s ease-out'
                }}>
                    <h1 style={{
                        fontSize: isMobile ? '2.2rem' : isTablet ? '2.5rem' : '3.2rem',
                        fontWeight: 800,
                        color: '#1e293b',
                        marginBottom: '1.5rem',
                        lineHeight: 1.2,
                        background: 'linear-gradient(to right, #1e293b, #334155)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
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
                            boxShadow: '0 4px 14px rgba(99,102,241,0.25)',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.transform = 'translateY(-2px)';
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.3)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.25)';
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
                            fontWeight: 500,
                            transition: 'background-color 0.2s, color 0.2s',
                        }}
                        onMouseOver={e => {
                            e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)';
                        }}
                        onMouseOut={e => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                        }}>
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Hero image grid */}
                <div style={{ 
                    flex: isMobile || isTablet ? '1' : '0.8',
                    display: 'flex',
                    justifyContent: 'center',
                    zIndex: 1,
                    marginTop: isMobile ? '2rem' : 0,
                    animation: 'fadeInRight 1s ease-out'
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gridTemplateRows: 'repeat(2, 1fr)',
                        gap: isMobile ? '0.8rem' : '1.2rem',
                        maxWidth: isMobile ? '300px' : isTablet ? '400px' : '500px',
                        width: '100%',
                        perspective: '1000px'
                    }}>
                        <div style={{ 
                            transform: 'rotateY(-5deg) rotateX(5deg)',
                            transition: 'transform 0.5s',
                            boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
                            borderRadius: '1rem',
                            overflow: 'hidden'
                        }}>
                            <img src={image1} alt="" style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                borderRadius: '1rem'
                            }} />
                        </div>
                        <div style={{ 
                            transform: 'rotateY(5deg) rotateX(-5deg)',
                            transition: 'transform 0.5s',
                            boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
                            borderRadius: '1rem',
                            overflow: 'hidden'
                        }}>
                            <img src={image2} alt="" style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                borderRadius: '1rem'
                            }} />
                        </div>
                        <div style={{ 
                            transform: 'rotateY(5deg) rotateX(5deg)',
                            transition: 'transform 0.5s',
                            boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
                            borderRadius: '1rem',
                            overflow: 'hidden'
                        }}>
                            <img src={image3} alt="" style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                borderRadius: '1rem'
                            }} />
                        </div>
                        <div style={{ 
                            transform: 'rotateY(-5deg) rotateX(-5deg)',
                            transition: 'transform 0.5s',
                            boxShadow: '0 20px 30px rgba(0,0,0,0.07)',
                            borderRadius: '1rem',
                            overflow: 'hidden'
                        }}>
                            <img src={image4} alt="" style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover',
                                borderRadius: '1rem'
                            }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section style={{
                padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
                backgroundColor: 'white',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background decor */}
                <div style={{
                    position: 'absolute',
                    width: '300px',
                    height: '300px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(224,231,255,0.5) 0%, rgba(248,250,252,0) 70%)',
                    top: '-100px',
                    left: '-100px',
                    zIndex: 0
                }}></div>
                <div style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(224,231,255,0.5) 0%, rgba(248,250,252,0) 70%)',
                    bottom: '-200px',
                    right: '-150px',
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{
                        fontSize: isMobile ? '1.8rem' : isTablet ? '2rem' : '2.3rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        textAlign: 'center',
                        marginBottom: '1.5rem'
                    }}>
                        How Our Platform Works
                    </h2>
                    <p style={{
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        color: '#64748b',
                        textAlign: 'center',
                        maxWidth: '700px',
                        margin: '0 auto 3rem',
                        lineHeight: 1.6
                    }}>
                        Our AI-powered system streamlines the exam process from creation to evaluation, providing benefits for both teachers and students.
                    </p>

                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                        gap: isMobile ? '1.5rem' : '2rem',
                        maxWidth: '1200px',
                        margin: '0 auto'
                    }}>
                        {features.map((feature, index) => (
                            <div 
                                key={index} 
                                style={{
                                    padding: '2rem',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '1rem',
                                    boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
                                    textAlign: 'center',
                                    transition: 'transform 0.3s, box-shadow 0.3s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseOver={e => {
                                    if (!isMobile) {
                                        e.currentTarget.style.transform = 'translateY(-5px)';
                                        e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.08)';
                                    }
                                }}
                                onMouseOut={e => {
                                    if (!isMobile) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.05)';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '80px',
                                    height: '80px',
                                    margin: '0 auto 1.5rem',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        width: '100%',
                                        height: '100%',
                                        borderRadius: '1rem',
                                        background: 'rgba(99,102,241,0.1)',
                                        position: 'absolute',
                                        transform: 'rotate(10deg)'
                                    }}></div>
                                    <img 
                                        src={feature.icon} 
                                        alt={feature.title} 
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            borderRadius: '1rem',
                                            objectFit: 'cover',
                                            position: 'relative',
                                            border: '2px solid rgba(99,102,241,0.3)'
                                        }}
                                    />
                                </div>
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
                </div>
            </section>

            {/* Role Selection Section */}
            <section style={{
                padding: isMobile ? '3rem 1rem' : isTablet ? '4rem 2rem' : '5rem 3rem',
                background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%)',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Decorative background elements */}
                <div style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    background: 'url(' + image8 + ')',
                    backgroundSize: 'cover',
                    opacity: 0.03,
                    zIndex: 0
                }}></div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{
                        fontSize: isMobile ? '1.8rem' : isTablet ? '2rem' : '2.3rem',
                        fontWeight: 700,
                        color: '#1e293b',
                        marginBottom: '1rem'
                    }}>
                        Choose Your Role
                    </h2>
                    <p style={{
                        fontSize: isMobile ? '1rem' : '1.1rem',
                        color: '#64748b',
                        marginBottom: '3rem',
                        maxWidth: '700px',
                        margin: '0 auto 3rem',
                        lineHeight: 1.6
                    }}>
                        Our platform serves both students and teachers with specialized features for each role.
                    </p>

                    <div style={{
                        display: 'flex',
                        gap: isMobile ? '2rem' : '3rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap'
                    }}>
                        {/* Student Card */}
                        <div style={{
                            background: 'white',
                            borderRadius: '1.5rem',
                            boxShadow: '0 10px 30px rgba(30,41,59,0.08)',
                            padding: isMobile ? '1.5rem' : '2rem',
                            textAlign: 'center',
                            width: isMobile ? '100%' : isTablet ? '45%' : '320px',
                            maxWidth: '100%',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '30%',
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(224,231,255,0.1) 100%)',
                                zIndex: 0
                            }}></div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <img
                                    src={studentImg}
                                    alt="Student"
                                    style={{
                                        width: isMobile ? '90px' : '110px',
                                        height: isMobile ? '90px' : '110px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        marginBottom: '1.5rem',
                                        border: '3px solid #6366f1',
                                        boxShadow: '0 5px 15px rgba(99,102,241,0.2)'
                                    }}
                                />
                                <h3 style={{
                                    fontSize: isMobile ? '1.4rem' : '1.5rem',
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
                                            fontWeight: 500,
                                            transition: 'background-color 0.2s, color 0.2s'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.backgroundColor = 'rgba(99,102,241,0.1)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
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
                                            boxShadow: '0 4px 14px rgba(99,102,241,0.2)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.3)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(99,102,241,0.2)';
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Teacher Card */}
                        <div style={{
                            background: 'white',
                            borderRadius: '1.5rem',
                            boxShadow: '0 10px 30px rgba(30,41,59,0.08)',
                            padding: isMobile ? '1.5rem' : '2rem',
                            textAlign: 'center',
                            width: isMobile ? '100%' : isTablet ? '45%' : '320px',
                            maxWidth: '100%',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '30%',
                                background: 'linear-gradient(135deg, rgba(245,158,66,0.1) 0%, rgba(254,240,221,0.1) 100%)',
                                zIndex: 0
                            }}></div>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <img
                                    src={teacherImg}
                                    alt="Teacher"
                                    style={{
                                        width: isMobile ? '90px' : '110px',
                                        height: isMobile ? '90px' : '110px',
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        marginBottom: '1.5rem',
                                        border: '3px solid #f59e42',
                                        boxShadow: '0 5px 15px rgba(245,158,66,0.2)'
                                    }}
                                />
                                <h3 style={{
                                    fontSize: isMobile ? '1.4rem' : '1.5rem',
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
                                            fontWeight: 500,
                                            transition: 'background-color 0.2s, color 0.2s'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.backgroundColor = 'rgba(245,158,66,0.1)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.backgroundColor = 'transparent';
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
                                            boxShadow: '0 4px 14px rgba(245,158,66,0.2)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseOver={e => {
                                            e.currentTarget.style.transform = 'translateY(-2px)';
                                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,66,0.3)';
                                        }}
                                        onMouseOut={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 14px rgba(245,158,66,0.2)';
                                        }}
                                    >
                                        Sign Up
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#1e293b',
                color: 'white',
                padding: isMobile ? '2rem 1rem' : '3rem',
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Background pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: `url(${image7})`,
                    backgroundSize: 'cover',
                    opacity: 0.02,
                    zIndex: 0
                }}></div>

                <div style={{
                    position: 'relative',
                    zIndex: 1,
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
                    color: '#94a3b8',
                    position: 'relative',
                    zIndex: 1
                }}>
                    © {new Date().getFullYear()} AI Exam System. All rights reserved.
                </div>
            </footer>

            {/* CSS Animations */}
            <style>
                {`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    100% { transform: translateY(-15px); }
                }
                @keyframes fadeInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                `}
            </style>
        </div>
    );
};

export default LandingPage;