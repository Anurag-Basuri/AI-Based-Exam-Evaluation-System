import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({
	header = null,
	items = [],
	footer = null,
	width = 280,
	style = {},
	theme = 'light',
	expanded: controlledExpanded,
	defaultExpanded = true,
	onToggle,
	mobileBreakpoint = 1024,
	overlay = false, // new prop: when true, treat as overlay (useful when parent forces drawer)
}) => {
	const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
	const isControlled = typeof controlledExpanded === 'boolean';

	// Mobile detection for overlay behavior
	const [isMobile, setIsMobile] = useState(
		typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false,
	);
	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth < mobileBreakpoint);
		window.addEventListener('resize', onResize);
		onResize();
		return () => window.removeEventListener('resize', onResize);
	}, [mobileBreakpoint]);

	// treat as drawer when mobile OR overlay requested by parent
	const isDrawer = isMobile || overlay;

	// When in drawer mode, expansion can be controlled; on desktop always expanded
	const expanded = isDrawer ? (isControlled ? controlledExpanded : internalExpanded) : true;

	const palette =
		theme === 'dark'
			? {
					bg: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
					card: 'rgba(30,41,59,0.7)',
					cardHover: 'rgba(51,65,85,0.8)',
					border: 'rgba(148,163,184,0.2)',
					borderStrong: 'rgba(148,163,184,0.3)',
					fg: '#f1f5f9',
					fgMuted: '#94a3b8',
					accent: '#22c55e',
					accentStrong: '#16a34a',
					hover: 'rgba(34,197,94,0.10)',
					activeBg:
						'linear-gradient(135deg, rgba(34,197,94,0.18), rgba(16,185,129,0.12))',
					activeGlow: '0 0 20px rgba(34,197,94,0.25)',
					shadow: '0 20px 40px rgba(15,23,42,0.4)',
			  }
			: {
					bg: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
					card: 'rgba(255,255,255,0.9)',
					cardHover: 'rgba(248,250,252,0.95)',
					border: 'rgba(15,23,42,0.08)',
					borderStrong: 'rgba(15,23,42,0.12)',
					fg: '#0f172a',
					fgMuted: '#64748b',
					accent: '#0ea5e9',
					accentStrong: '#0284c7',
					hover: 'rgba(2,132,199,0.08)',
					activeBg:
						'linear-gradient(135deg, rgba(2,132,199,0.12), rgba(59,130,246,0.08))',
					activeGlow: '0 0 20px rgba(2,132,199,0.2)',
					shadow: '0 20px 40px rgba(15,23,42,0.1)',
			  };

	const navWidth = isDrawer ? Math.min(width, 320) : width;
	const safeItems = useMemo(() => (Array.isArray(items) ? items : []), [items]);

	const NavItem = ({ item }) => {
		const baseItemStyle = {
			position: 'relative',
			display: 'flex',
			alignItems: 'center',
			gap: expanded ? 12 : 0,
			justifyContent: expanded ? 'flex-start' : 'center',
			width: '100%',
			textDecoration: 'none',
			textAlign: 'left',
			padding: expanded ? '12px 14px' : '12px 8px',
			borderRadius: 12,
			border: '1px solid transparent',
			transition: 'all 0.18s ease',
			overflow: 'hidden',
			fontSize: 14,
		};

		if (item.to) {
			return (
				<NavLink
					to={item.to}
					end={item.end}
					aria-label={typeof item.label === 'string' ? item.label : undefined}
					title={!expanded && typeof item.label === 'string' ? item.label : undefined}
					style={({ isActive }) => ({
						...baseItemStyle,
						background: isActive ? palette.activeBg : 'transparent',
						color: isActive ? palette.accent : palette.fg,
						border: isActive ? `1px solid ${palette.accent}` : '1px solid transparent',
						boxShadow: isActive ? palette.activeGlow : 'none',
						fontWeight: isActive ? 700 : 600,
					})}
				>
					{({ isActive }) => (
						<>
							{isActive && (
								<div
									style={{
										position: 'absolute',
										left: 0,
										top: '18%',
										width: 4,
										height: '64%',
										borderRadius: '0 4px 4px 0',
										background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
										boxShadow: `0 0 10px ${palette.accent}22`,
									}}
								/>
							)}
							<div
								style={{
									fontSize: 18,
									width: 22,
									height: 22,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
									borderRadius: 6,
									background: isActive
										? `linear-gradient(135deg, ${palette.accent}22, ${palette.accentStrong}12)`
										: 'transparent',
								}}
							>
								{item.icon ?? '●'}
							</div>
							{expanded && (
								<span style={{ fontWeight: isActive ? 700 : 600, flex: 1 }}>
									{item.label}
								</span>
							)}
							{expanded && item.badge != null && (
								<span
									style={{
										background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
										color: '#fff',
										padding: '2px 8px',
										fontSize: 11,
										borderRadius: 10,
										fontWeight: 800,
										minWidth: 18,
										textAlign: 'center',
										boxShadow: '0 2px 8px rgba(2,132,199,0.18)',
									}}
								>
									{item.badge}
								</span>
							)}
						</>
					)}
				</NavLink>
			);
		}

		// Button fallback
		return (
			<button
				type="button"
				disabled={item.disabled}
				title={!expanded && typeof item.label === 'string' ? item.label : undefined}
				style={{
					...baseItemStyle,
					cursor: item.disabled ? 'not-allowed' : 'pointer',
					color: item.disabled ? palette.fgMuted : palette.fg,
					background: 'transparent',
				}}
				onClick={item.onClick}
			>
				<div
					style={{
						fontSize: 18,
						width: 22,
						height: 22,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: 6,
					}}
				>
					{item.icon ?? '●'}
				</div>
				{expanded && <span style={{ flex: 1, fontWeight: 600 }}>{item.label}</span>}
			</button>
		);
	};

	// Drawer (mobile or overlay) vs Sticky (desktop)
	const topOffset = isDrawer ? 'var(--header-h, 64px)' : 'calc(var(--header-h, 64px) + 12px)';

	return (
		<>
			{/* Mobile overlay drawer backdrop */}
			{isDrawer && expanded && (
				<div
					onClick={() => closeDrawer()}
					style={{
						position: 'fixed',
						top: 'var(--header-h, 64px)',
						left: 0,
						right: 0,
						bottom: 0,
						background: 'rgba(0,0,0,0.45)',
						zIndex: 999,
					}}
				/>
			)}

			<nav
				style={{
					position: isDrawer ? 'fixed' : 'sticky',
					top: topOffset,
					left: isDrawer ? 0 : 'auto',
					height: isDrawer ? `calc(100dvh - var(--header-h, 64px))` : 'auto',
					maxHeight: isDrawer
						? `calc(100dvh - var(--header-h, 64px))`
						: 'calc(100dvh - var(--header-h, 64px) - 24px)',
					width: isDrawer ? navWidth : '100%',
					display: 'flex',
					flexDirection: 'column',
					background: palette.bg,
					border: `1px solid ${palette.borderStrong}`,
					color: palette.fg,
					boxShadow: isDrawer ? '0 30px 60px rgba(2,6,23,0.45)' : palette.shadow,
					zIndex: isDrawer ? 1000 : 1,
					transition: 'transform 0.22s ease, width 0.2s ease',
					transform: isDrawer
						? expanded
							? 'translateX(0)'
							: 'translateX(-105%)'
						: 'none',
					borderRadius: isDrawer ? '0 12px 12px 0' : 12,
					overflow: 'hidden',
					...style,
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: '14px 14px',
						minHeight: 60,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: `1px solid ${palette.border}`,
						background: palette.card,
						backdropFilter: 'blur(6px)',
					}}
				>
					{header ? <div style={{ flex: 1, minWidth: 0 }}>{header}</div> : <div />}
					{/* collapse button removed for consistent UI */}
				</div>

				{/* Items */}
				<div
					style={{
						flex: 1,
						padding: '12px',
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
						overflowY: 'auto',
						background: 'transparent',
					}}
				>
					{safeItems.map(item => (
						<NavItem key={item.key ?? item.to ?? item.label} item={item} />
					))}
				</div>

				{/* Footer */}
				{footer && (
					<div
						style={{
							padding: '14px',
							borderTop: `1px solid ${palette.border}`,
							background: palette.card,
						}}
					>
						{footer}
					</div>
				)}
			</nav>
		</>
	);
};

export default Sidebar;
