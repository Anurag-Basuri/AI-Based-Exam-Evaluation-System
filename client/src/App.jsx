import React, { useRef, useLayoutEffect, useEffect, useState } from 'react';
import AppRoutes from './routes/AppRoutes';
import Header from './components/Header';

const App = () => {
	const [atTop, setAtTop] = useState(true);
	const [visible, setVisible] = useState(true);
	const [headerHeight, setHeaderHeight] = useState(64);

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

	// Scroll logic: hide on scroll-down, show on scroll-up
	useEffect(() => {
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
	}, []);

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
		<>
			<div ref={headerWrapRef} className="header-animate" style={headerStyle}>
				<Header transparent={atTop} />
			</div>

			{/* Spacer so content isn't covered by the fixed header */}
			<div style={{ paddingTop: headerHeight }}>
				<AppRoutes />
			</div>
		</>
	);
};

export default App;
