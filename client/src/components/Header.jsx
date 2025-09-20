import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(window.innerWidth < 768);
    React.useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    return isMobile;
};

const Header = () => {
    const navigate = useNavigate();
    const isMobile = useIsMobile();
    const { user, isAuthenticated, role, logoutStudent, logoutTeacher } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef(null);

    // Handle logout based on user role
    const handleLogout = async () => {
        if (role === 'student') {
            await logoutStudent();
        } else if (role === 'teacher') {
            await logoutTeacher();
        }
        setShowDropdown(false);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Navigate to role-specific login
    const navigateToLogin = (role) => {
        navigate(`/${role}/login`);
    };

    // Navigate to role-specific signup
    const navigateToSignup = (role) => {
        navigate(`/${role}/signup`);
    };

    // Navigate to dashboard based on role
    const navigateToDashboard = () => {
        if (role === 'student') {
            navigate('/student/dashboard');
        } else if (role === 'teacher') {
            navigate('/teacher/dashboard');
        }
        setShowDropdown(false);
    };

    // Navigate to home
    const navigateToHome = () => {
        navigate('/');
    };

    // Generate initials from name
    const getInitials = (name) => {
        if (!name) return 'U';
        return name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <header style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isMobile ? '1rem' : '1rem 3rem',
            backgroundColor: 'white',
            boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            {/* Logo and Site Name */}
            <div 
                style={{ 
                    display: 'flex', 
                    alignItems: 'center',
                    cursor: 'pointer'
                }}
                onClick={navigateToHome}
            >
                <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #a5b4fc)',
                    marginRight: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '1.2rem'
                }}>A</div>
                <h1 style={{
                    fontSize: isMobile ? '1.2rem' : '1.5rem',
                    margin: 0,
                    fontWeight: 700,
                    color: '#1e293b'
                }}>
                    AI Exam System
                </h1>
            </div>

            {/* Right side - Auth buttons or User profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {isAuthenticated && user ? (
                    // Authenticated user profile
                    <div style={{ position: 'relative' }} ref={dropdownRef}>
                        <div 
                            style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '0.5rem',
                                cursor: 'pointer'
                            }}
                            onClick={() => setShowDropdown(!showDropdown)}
                        >
                            {user.profileImage ? (
                                <img
                                    src={user.profileImage}
                                    alt={user.name}
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: '50%',
                                        objectFit: 'cover',
                                        background: '#e5e7eb'
                                    }}
                                />
                            ) : (
                                <div style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '50%',
                                    background: role === 'student' ? '#6366f1' : '#f59e42',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}>
                                    {getInitials(user.name)}
                                </div>
                            )}
                            <span style={{
                                fontWeight: 500,
                                color: '#374151',
                                fontSize: isMobile ? '0.95rem' : '1.05rem'
                            }}>
                                {user.name}
                            </span>
                            <svg 
                                width="16" 
                                height="16" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                                style={{
                                    color: '#64748b',
                                    transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                                    transition: 'transform 0.2s'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>

                        {/* User dropdown menu */}
                        {showDropdown && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                marginTop: '0.5rem',
                                background: 'white',
                                borderRadius: '0.5rem',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                width: '200px',
                                zIndex: 101,
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    padding: '1rem',
                                    borderBottom: '1px solid #e5e7eb',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ fontWeight: 600 }}>{user.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
                                        {role === 'student' ? 'Student' : 'Teacher'}
                                    </div>
                                </div>

                                <div style={{ padding: '0.5rem' }}>
                                    <button 
                                        onClick={navigateToDashboard}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem',
                                            width: '100%',
                                            border: 'none',
                                            background: 'transparent',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            color: '#1e293b',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="3" y1="9" x2="21" y2="9"></line>
                                            <line x1="9" y1="21" x2="9" y2="9"></line>
                                        </svg>
                                        Dashboard
                                    </button>
                                    
                                    <button 
                                        onClick={handleLogout}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem',
                                            padding: '0.5rem',
                                            width: '100%',
                                            border: 'none',
                                            background: 'transparent',
                                            borderRadius: '0.25rem',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            color: '#ef4444',
                                            transition: 'background-color 0.2s'
                                        }}
                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                            <polyline points="16 17 21 12 16 7"></polyline>
                                            <line x1="21" y1="12" x2="9" y2="12"></line>
                                        </svg>
                                        Logout
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Login/Signup buttons for unauthenticated users
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {/* If not on mobile, show the full buttons */}
                        {!isMobile ? (
                            <>
                                <div style={{ position: 'relative' }} ref={dropdownRef}>
                                    <button 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'transparent',
                                            color: '#6366f1',
                                            border: '1px solid #6366f1',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}
                                    >
                                        Login
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            style={{
                                                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>

                                    {/* Login dropdown */}
                                    {showDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '0.5rem',
                                            background: 'white',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            width: '150px',
                                            zIndex: 101,
                                            overflow: 'hidden'
                                        }}>
                                            <button 
                                                onClick={() => navigateToLogin('student')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.75rem 1rem',
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    color: '#1e293b',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                As Student
                                            </button>
                                            <button 
                                                onClick={() => navigateToLogin('teacher')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.75rem 1rem',
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    color: '#1e293b',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                As Teacher
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div style={{ position: 'relative' }} ref={dropdownRef}>
                                    <button 
                                        onClick={() => setShowDropdown(!showDropdown)}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#6366f1',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            fontWeight: 500,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}
                                    >
                                        Sign Up
                                        <svg 
                                            width="16" 
                                            height="16" 
                                            viewBox="0 0 24 24" 
                                            fill="none" 
                                            stroke="currentColor" 
                                            strokeWidth="2" 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round"
                                            style={{
                                                color: 'white',
                                                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0)',
                                                transition: 'transform 0.2s'
                                            }}
                                        >
                                            <polyline points="6 9 12 15 18 9"></polyline>
                                        </svg>
                                    </button>

                                    {/* Signup dropdown */}
                                    {showDropdown && (
                                        <div style={{
                                            position: 'absolute',
                                            top: '100%',
                                            right: 0,
                                            marginTop: '0.5rem',
                                            background: 'white',
                                            borderRadius: '0.5rem',
                                            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                            width: '150px',
                                            zIndex: 101,
                                            overflow: 'hidden'
                                        }}>
                                            <button 
                                                onClick={() => navigateToSignup('student')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.75rem 1rem',
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    color: '#1e293b',
                                                    borderBottom: '1px solid #f1f5f9',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                As Student
                                            </button>
                                            <button 
                                                onClick={() => navigateToSignup('teacher')}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem',
                                                    padding: '0.75rem 1rem',
                                                    width: '100%',
                                                    border: 'none',
                                                    background: 'transparent',
                                                    cursor: 'pointer',
                                                    textAlign: 'left',
                                                    color: '#1e293b',
                                                    transition: 'background-color 0.2s'
                                                }}
                                                onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                                onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                As Teacher
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // On mobile, show a single menu button
                            <div style={{ position: 'relative' }} ref={dropdownRef}>
                                <button 
                                    onClick={() => setShowDropdown(!showDropdown)}
                                    style={{
                                        padding: '0.5rem',
                                        backgroundColor: 'transparent',
                                        border: 'none',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="3" y1="12" x2="21" y2="12"></line>
                                        <line x1="3" y1="6" x2="21" y2="6"></line>
                                        <line x1="3" y1="18" x2="21" y2="18"></line>
                                    </svg>
                                </button>

                                {/* Mobile menu dropdown */}
                                {showDropdown && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        right: 0,
                                        marginTop: '0.5rem',
                                        background: 'white',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                                        width: '200px',
                                        zIndex: 101,
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderBottom: '1px solid #e5e7eb',
                                            fontWeight: 600,
                                            color: '#1e293b'
                                        }}>
                                            Login
                                        </div>
                                        <button 
                                            onClick={() => navigateToLogin('student')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1rem',
                                                width: '100%',
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                color: '#1e293b',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            As Student
                                        </button>
                                        <button 
                                            onClick={() => navigateToLogin('teacher')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1rem',
                                                width: '100%',
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                color: '#1e293b',
                                                borderBottom: '1px solid #e5e7eb',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            As Teacher
                                        </button>

                                        <div style={{
                                            padding: '0.75rem 1rem',
                                            borderBottom: '1px solid #e5e7eb',
                                            fontWeight: 600,
                                            color: '#1e293b'
                                        }}>
                                            Sign Up
                                        </div>
                                        <button 
                                            onClick={() => navigateToSignup('student')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1rem',
                                                width: '100%',
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                color: '#1e293b',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            As Student
                                        </button>
                                        <button 
                                            onClick={() => navigateToSignup('teacher')}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '0.75rem 1rem',
                                                width: '100%',
                                                border: 'none',
                                                background: 'transparent',
                                                cursor: 'pointer',
                                                textAlign: 'left',
                                                color: '#1e293b',
                                                transition: 'background-color 0.2s'
                                            }}
                                            onMouseOver={e => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                                            onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                        >
                                            As Teacher
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
