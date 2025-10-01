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
			if (stored === 'light' || stored === 'dark') return stored;
		}
	} catch {}
	const mq = getMediaQuery();
	return mq && mq.matches ? 'dark' : 'light';
};

const lightPalette = {
	'--bg': '#ffffff',
	'--surface': '#ffffff',
	'--elev': '#f8fafc',
	'--text': '#0f172a',
	'--text-muted': '#475569',
	'--border': '#e2e8f0',
	'--primary': '#6366f1',
	'--primary-strong': '#4f46e5',
	'--ring': 'rgba(99,102,241,0.35)',
};

const darkPalette = {
	'--bg': '#0b1120',
	'--surface': '#0f172a',
	'--elev': '#111827',
	'--text': '#e5e7eb',
	'--text-muted': '#94a3b8',
	'--border': 'rgba(148,163,184,0.18)',
	'--primary': '#818cf8',
	'--primary-strong': '#6366f1',
	'--ring': 'rgba(129,140,248,0.32)',
};

const applyPalette = theme => {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	const palette = theme === 'dark' ? darkPalette : lightPalette;
	Object.entries(palette).forEach(([k, v]) => root.style.setProperty(k, v));
	root.dataset.theme = theme;
};

export const ThemeProvider = ({ children }) => {
	const [theme, setTheme] = useState(getPreferredTheme);

	useEffect(() => {
		try {
			applyPalette(theme);
			if (typeof localStorage !== 'undefined') localStorage.setItem('eduai-theme', theme);
		} catch {}
	}, [theme]);

	// Keep for future "auto" mode support
	useEffect(() => {
		const mq = getMediaQuery();
		if (!mq) return;
		const handler = () => {};
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
			toggleTheme: () => setTheme(t => (t === 'light' ? 'dark' : 'light')),
		}),
		[theme],
	);

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};
