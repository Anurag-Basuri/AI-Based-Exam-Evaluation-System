import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');

const getPreferredTheme = () => {
    if (typeof localStorage !== 'undefined') {
        const stored = localStorage.getItem('eduai-theme');
        if (stored) return stored;
    }
    return mediaQuery?.matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(getPreferredTheme);

    useEffect(() => {
        const root = document.documentElement;
        root.dataset.theme = theme;
        localStorage.setItem('eduai-theme', theme);
    }, [theme]);

    useEffect(() => {
        if (!mediaQuery) return;
        const handleChange = e => setTheme(prev => (prev === 'auto' ? (e.matches ? 'dark' : 'light') : prev));
        mediaQuery.addEventListener?.('change', handleChange);
        return () => mediaQuery.removeEventListener?.('change', handleChange);
    }, []);

    const value = useMemo(
        () => ({
            theme,
            setTheme,
            toggleTheme: () => setTheme(curr => (curr === 'light' ? 'dark' : 'light')),
        }),
        [theme],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};