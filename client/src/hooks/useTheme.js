import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext.jsx';

export const useTheme = () => {
    const ctx = useContext(ThemeContext);
    // Fallback to avoid crashes if somehow used outside provider
    if (!ctx) return { theme: 'light', toggleTheme: () => {} };
    return ctx;
};