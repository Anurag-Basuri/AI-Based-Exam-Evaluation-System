import React, { useEffect, useState } from 'react';
import '../pages/Auth.css';

export const classifyError = (err) => {
    const status = err?.response?.status || err?.status;
    const data = err?.response?.data || err?.data;
    const message = data?.message || err?.message || '';

    // Cross-role conflict
    if (status === 409) {
        return {
            type: 'warning',
            icon: '⚠️',
            title: 'Role Conflict',
            message: message,
            hint: 'Switch to the other role tab above to continue.'
        };
    }
    // Google-only account trying to login with password
    if (message.toLowerCase().includes('google sign-in')) {
        return {
            type: 'info',
            icon: '🔗',
            title: 'Google Account',
            message: message,
            hint: 'Use the Google button below to sign in.'
        };
    }
    // Invalid credentials
    if (message.toLowerCase().includes('invalid') || status === 401) {
        return {
            type: 'error',
            icon: '🔐',
            title: 'Authentication Failed',
            message: message || 'Wrong username/email or password.',
            hint: 'Double-check your credentials or reset your password.'
        };
    }
    // Network Error
    if (err?.code === 'ERR_NETWORK') {
        return {
            type: 'error',
            icon: '📡',
            title: 'Connection Failed',
            message: 'Network error. Check your connection.',
            hint: 'Ensure you are connected to the internet and try again.'
        };
    }
    
    // Array of validation errors (express-validator)
    if (Array.isArray(data?.errors)) {
        return {
            type: 'error',
            icon: '❌',
            title: 'Validation Error',
            message: data.errors.map(e => e?.msg || e?.message || String(e)).join(' '),
            hint: 'Please correct the highlighted fields and try again.'
        };
    }

    // Generic fallback
    return {
        type: 'error',
        icon: '❗',
        title: 'Something went wrong',
        message: message || 'An unexpected error occurred.',
        hint: 'Please try again or contact support if the issue persists.'
    };
};

const AuthAlert = ({ type = 'error', icon, title, children, onDismiss, autoDismiss = 0 }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        if (autoDismiss > 0) {
            const timer = setTimeout(() => {
                handleDismiss();
            }, autoDismiss);
            return () => clearTimeout(timer);
        }
    }, [autoDismiss]);

    const handleDismiss = () => {
        setVisible(false);
        setTimeout(() => {
            if (onDismiss) onDismiss();
        }, 300); // Wait for fade out
    };

    if (!visible) return null;

    return (
        <div className={`auth-alert auth-alert--${type}`} role="alert" aria-live="assertive">
            <div className="auth-alert-icon">{icon}</div>
            <div className="auth-alert-content">
                <div className="auth-alert-title">{title}</div>
                <div className="auth-alert-message">{children}</div>
            </div>
            {onDismiss && (
                <button type="button" className="auth-alert-close" onClick={handleDismiss} aria-label="Dismiss alert">
                    ×
                </button>
            )}
        </div>
    );
};

export default AuthAlert;
