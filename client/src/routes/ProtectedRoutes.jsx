import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const ProtectedRoute = ({ roles, children }) => {
    const { isAuthenticated, role } = useAuth();
    const location = useLocation();

    // Not logged in -> go to login, keep return URL
    if (!isAuthenticated) {
        return (
            <Navigate
                to={`/auth?mode=login`}
                replace
                state={{ from: location.pathname + location.search }}
            />
        );
    }

    // Logged in but wrong role -> send to their dashboard
    if (Array.isArray(roles) && roles.length && !roles.includes(role)) {
        const target = role === 'teacher' ? '/teacher' : '/student';
        return <Navigate to={target} replace />;
    }

    return children;
};

export default ProtectedRoute;