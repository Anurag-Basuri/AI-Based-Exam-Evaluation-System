import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({
	header = null,
	items = [],
	footer = null,
	collapsible = true,
	width = 280,
	collapsedWidth = 80,
	style = {},
	theme = 'light',
	expanded: controlledExpanded,
	defaultExpanded = true,
	onToggle,
	mobileBreakpoint = 1024,
}) => {
	const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
	const isControlled = typeof controlledExpanded === 'boolean';
	const expanded = isControlled ? controlledExpanded : internalExpanded;

	// Mobile detection for overlay behavior
	const [isMobile, setIsMobile] = useState(
		typeof window !== 'undefined' ? window.innerWidth < mobileBreakpoint : false,
	);
	useEffect(() => {
		const onResize = () => setIsMobile(window.innerWidth < mobileBreakpoint);
		window.addEventListener('resize', onResize);
		return () => window.removeEventListener('resize', onResize);
	}, [mobileBreakpoint]);

	// Close sidebar when switching to mobile
	useEffect(() => {
		if (isMobile && expanded) {
			// keep user state; do nothing
		}
	}, [isMobile, expanded]);

	const toggle = () => {
		if (isControlled) {
			onToggle?.(!controlledExpanded);
		} else {
			setInternalExpanded(v => {
				const nv = !v;
				onToggle?.(nv);
				return nv;
			});
		}
	};

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
					accent: '#3b82f6',
					accentStrong: '#2563eb',
					hover: 'rgba(59,130,246,0.08)',
					activeBg:
						'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(99,102,241,0.12))',
					activeGlow: '0 0 20px rgba(59,130,246,0.25)',
					shadow: '0 20px 40px rgba(15,23,42,0.4)',
				}
			: {
					bg: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
					card: 'rgba(255,255,255,0.9)',
					cardHover: 'rgba(248,250,252,0.95)',
					border: 'rgba(15,23,42,0.1)',
					borderStrong: 'rgba(15,23,42,0.15)',
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

	const navWidth = isMobile ? width : expanded ? width : collapsedWidth;

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
			transition: 'all 0.25s ease',
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
						fontWeight: isActive ? 700 : 500,
					})}
					onMouseEnter={e => {
						e.currentTarget.style.transform = 'translateX(3px)';
						e.currentTarget.style.background = palette.hover;
					}}
					onMouseLeave={e => {
						e.currentTarget.style.transform = 'translateX(0)';
						const isActive = e.currentTarget.getAttribute('aria-current') === 'page';
						e.currentTarget.style.background = isActive
							? palette.activeBg
							: 'transparent';
					}}
				>
					{({ isActive }) => (
						<>
							{isActive && (
								<div
									style={{
										position: 'absolute',
										left: 0,
										top: '20%',
										width: 3,
										height: '60%',
										borderRadius: '0 4px 4px 0',
										background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
										boxShadow: `0 0 10px ${palette.accent}`,
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
										? `linear-gradient(135deg, ${palette.accent}20, ${palette.accentStrong}12)`
										: 'transparent',
								}}
							>
								{item.icon ?? '●'}
							</div>
							{expanded && (
								<span style={{ fontWeight: isActive ? 700 : 500, flex: 1 }}>
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
										fontWeight: 700,
										minWidth: 18,
										textAlign: 'center',
										boxShadow: '0 2px 8px rgba(2,132,199,0.25)',
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
				onMouseEnter={e => {
					if (!item.disabled) {
						e.currentTarget.style.transform = 'translateX(3px)';
						e.currentTarget.style.background = palette.hover;
					}
				}}
				onMouseLeave={e => {
					if (!item.disabled) {
						e.currentTarget.style.transform = 'translateX(0)';
						e.currentTarget.style.background = 'transparent';
					}
				}}
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
				{expanded && <span style={{ flex: 1 }}>{item.label}</span>}
			</button>
		);
	};

	return (
		<>
			{/* Mobile overlay */}
			{isMobile && expanded && (
				<div
					onClick={() => toggle()}
					style={{
						position: 'fixed',
						inset: 0,
						background: 'rgba(0,0,0,0.35)',
						zIndex: 999,
					}}
				/>
			)}

			<nav
				style={{
					position: 'fixed',
					left: 0,
					top: 0,
					height: '100vh',
					width: navWidth,
					display: 'flex',
					flexDirection: 'column',
					background: palette.bg,
					borderRight: `1px solid ${palette.borderStrong}`,
					color: palette.fg,
					backdropFilter: 'saturate(140%) blur(12px)',
					WebkitBackdropFilter: 'saturate(140%) blur(12px)',
					boxShadow: palette.shadow,
					zIndex: 1000,
					transition: 'width 0.25s ease, transform 0.25s ease',
					transform: isMobile
						? expanded
							? 'translateX(0)'
							: 'translateX(-100%)'
						: 'none',
					...style,
				}}
			>
				{/* Header */}
				<div
					style={{
						padding: expanded ? '16px' : '16px 10px',
						minHeight: 72,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: `1px solid ${palette.border}`,
						background: palette.card,
					}}
				>
					{expanded && header ? <div style={{ flex: 1 }}>{header}</div> : <div />}
					{collapsible && (
						<button
							type="button"
							onClick={toggle}
							aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
							title={expanded ? 'Collapse' : 'Expand'}
							style={{
								marginLeft: 10,
								border: `1px solid ${palette.border}`,
								background: palette.card,
								color: palette.fg,
								padding: '8px',
								borderRadius: 10,
								cursor: 'pointer',
								fontWeight: 700,
								fontSize: 12,
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={e => {
								e.currentTarget.style.background = palette.cardHover;
								e.currentTarget.style.transform = 'scale(1.05)';
							}}
							onMouseLeave={e => {
								e.currentTarget.style.background = palette.card;
								e.currentTarget.style.transform = 'scale(1)';
							}}
						>
							{isMobile ? '✖' : expanded ? '◀' : '▶'}
						</button>
					)}
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
