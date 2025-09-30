import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header';
import { useTheme } from './hooks/useTheme.js';

const App = () => {
	const { toggleTheme, theme } = useTheme();

	const [atTop, setAtTop] = useState(true);
	const [visible, setVisible] = useState(true);
	const [headerHeight, setHeaderHeight] = useState(64);

	const location = useLocation();
	const isAuthPage = location.pathname.toLowerCase().startsWith('/auth');

	const headerWrapRef = useRef(null);
	const prevScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
	const tickingRef = useRef(false);

	// Measure header height and keep spacer accurate (prevents content jump)
	useLayoutEffect(() => {
		const measure = () => {
			if (headerWrapRef.current) {
				setHeaderHeight(headerWrapRef.current.offsetHeight || 64);
			}
		};
		measure();

		// Keep header height in sync on resize and when Header reflows
		const ro = new ResizeObserver(measure);
		if (headerWrapRef.current) ro.observe(headerWrapRef.current);
		window.addEventListener('resize', measure, { passive: true });

		return () => {
			ro.disconnect();
			window.removeEventListener('resize', measure);
		};
	}, []);

	// Scroll logic: hide on scroll-down, show on scroll-up (disabled on auth page)
	useEffect(() => {
		if (isAuthPage) return; // no header scroll behavior on auth

		const delta = 6; // minimal scroll delta to avoid jitter

		const onScroll = () => {
			const currentY = window.scrollY || window.pageYOffset;

			if (!tickingRef.current) {
				window.requestAnimationFrame(() => {
					const prevY = prevScrollYRef.current;
					const diff = currentY - prevY;

					setAtTop(currentY <= 2);

					if (Math.abs(diff) > delta) {
						if (diff > 0) {
							// Scrolling down
							setVisible(false);
						} else {
							// Scrolling up
							setVisible(true);
						}
						prevScrollYRef.current = currentY;
					}

					// Always show near the top
					if (currentY < 80) setVisible(true);

					tickingRef.current = false;
				});
				tickingRef.current = true;
			}
		};

		window.addEventListener('scroll', onScroll, { passive: true });
		return () => window.removeEventListener('scroll', onScroll);
	}, [isAuthPage]); // updated deps

	const headerStyle = {
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		transform: visible ? 'translate3d(0,0,0)' : 'translate3d(0,-100%,0)',
		transition: 'transform 260ms ease',
		zIndex: 1000,
		willChange: 'transform',
	};

	return (
		<div className="app-shell" style={{ minHeight: '100vh' }}>
			{!isAuthPage && (
				<header
					className="glass-card"
					style={{
						position: 'sticky',
						top: 0,
						zIndex: 20,
						margin: 16,
						padding: '12px 18px',
						display: 'flex',
						alignItems: 'center',
						gap: 16,
						justifyContent: 'space-between',
					}}
				>
					<div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
						<img
							src="/logo192.png"
							alt="AI Exam"
							width={32}
							height={32}
							style={{ borderRadius: 10 }}
						/>
						<div>
							<div style={{ fontWeight: 800, letterSpacing: 0.2 }}>
								AI Exam Evaluation
							</div>
							<div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
								Insight-driven assessment suite
							</div>
						</div>
					</div>
				</header>
			)}

			<main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
				<AppRoutes />
			</main>

			{/* Global theme toggle (visible on all pages) */}
			<button
				type="button"
				onClick={toggleTheme}
				title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
				aria-label="Toggle theme"
				style={{
					position: 'fixed',
					right: 16,
					bottom: 16,
					padding: '10px 14px',
					borderRadius: 999,
					border: '1px solid var(--border, rgba(0,0,0,0.12))',
					background: 'var(--surface, #fff)',
					color: 'var(--text, #111827)',
					fontWeight: 700,
					display: 'flex',
					alignItems: 'center',
					gap: 8,
					boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
					cursor: 'pointer',
					zIndex: 1000,
				}}
			>
				<span aria-hidden>{theme === 'light' ? '🌞' : '🌙'}</span>
				{theme === 'light' ? 'Light' : 'Dark'}
			</button>
		</div>
	);
};

export default App;
