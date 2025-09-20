import React, { useState, useEffect } from "react";
import AppRoutes from './routes/AppRoutes';
import Header from "./components/Header";

const App = () => {
    const [prevScrollPos, setPrevScrollPos] = useState(0);
    const [visible, setVisible] = useState(true);
    const [atTop, setAtTop] = useState(true);

    // Handle scroll behavior for the header
    useEffect(() => {
        const handleScroll = () => {
            const currentScrollPos = window.pageYOffset;
            
            // Check if at the top of the page
            setAtTop(currentScrollPos === 0);

            // Determine visibility based on scroll direction
            // Show header when scrolling up, hide when scrolling down
            const isVisible = prevScrollPos > currentScrollPos || currentScrollPos < 10;

            setPrevScrollPos(currentScrollPos);
            setVisible(isVisible);
        };

        // Add scroll listener
        window.addEventListener('scroll', handleScroll);

        // Clean up the event listener
        return () => window.removeEventListener('scroll', handleScroll);
    }, [prevScrollPos]);

    return (
        <>
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    transform: visible ? 'translateY(0)' : 'translateY(-100%)',
                    transition: 'transform 0.5s ease-in-out',
                    zIndex: 1000,
                    boxShadow: atTop ? 'none' : '0 2px 10px rgba(0,0,0,0.1)',
                    backgroundColor: atTop ? 'transparent' : 'white'
                }}
            >
                <Header transparent={atTop} />
            </div>
            
            {/* Add padding to prevent content from hiding behind the fixed header */}
            <div style={{ paddingTop: '64px' }}>
                <AppRoutes />
            </div>
        </>
    );
};

export default App;