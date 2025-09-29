import React, { createContext, useEffect, useMemo, useState } from 'react';

export const ThemeContext = createContext({ theme: 'light', toggleTheme: () => {} });

const getMediaQuery = () => {
	if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
		try {
			return window.matchMedia('(prefers-color-scheme: dark)');
		} catch {
			return null;
		}
	}
	return null;
};

const getPreferredTheme = () => {
	try {
		if (typeof localStorage !== 'undefined') {
			const stored = localStorage.getItem('eduai-theme');
			if (stored) return stored;
		}
	} catch {
		// ignore storage read failure
	}
	const mq = getMediaQuery();
	return mq && mq.matches ? 'dark' : 'light';
};

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(getPreferredTheme);

	useEffect(() => {
		try {
			const root = typeof document !== 'undefined' ? document.documentElement : null;
			if (root) root.dataset.theme = theme;
			if (typeof localStorage !== 'undefined') localStorage.setItem('eduai-theme', theme);
		} catch {
			// ignore storage or DOM write failure
		}
	}, [theme]);

	useEffect(() => {
		const mq = getMediaQuery();
		if (!mq) return;
		const handler = e => {
			// Only react to system changes if you introduce 'auto' mode later
			// Kept here for future extensibility
			// no-op for now
		};
		// Modern and legacy
		mq.addEventListener?.('change', handler);
		mq.addListener?.(handler);
		return () => {
			mq.removeEventListener?.('change', handler);
			mq.removeListener?.(handler);
		};
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