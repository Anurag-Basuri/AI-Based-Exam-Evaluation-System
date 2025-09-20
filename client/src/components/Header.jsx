import React from 'react';
import { useNavigate } from 'react-router-dom';

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

    // Dummy user data
    const user = {
        name: 'John Doe',
        image: 'https://via.placeholder.com/40?text=JD'
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
            <div style={{ display: 'flex', alignItems: 'center' }}>
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

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {/* User profile with dummy image and name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <img
                        src={user.image}
                        alt={user.name}
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            objectFit: 'cover',
                            background: '#e5e7eb'
                        }}
                    />
                    <span style={{
                        fontWeight: 500,
                        color: '#374151',
                        fontSize: isMobile ? '0.95rem' : '1.05rem'
                    }}>
                        {user.name}
                    </span>
                </div>
            </div>
        </header>
    );
};

export default Header;
