import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Sidebar = ({
	header = null,
	items = [],
	defaultKey,
	selectedKey,
	onSelect,
	footer = null,
	collapsible = true,
	width = 280,
	collapsedWidth = 80,
	style = {},
	contentStyle = {},
	useOutlet = false,
	theme = 'light',
}) => {
	const safeItems = Array.isArray(items) ? items : [];
	const firstKey = useMemo(
		() => defaultKey ?? safeItems[0]?.key ?? null,
		[defaultKey, safeItems],
	);
	const [activeKey, setActiveKey] = useState(firstKey);
	const [expanded, setExpanded] = useState(true);

	// Keep activeKey in sync when items/defaultKey change (uncontrolled mode only)
	useEffect(() => {
		if (selectedKey == null) setActiveKey(firstKey);
	}, [firstKey, selectedKey]);

	const isControlled = selectedKey != null;
	const currentKey = isControlled ? selectedKey : activeKey;

	const activeItem = useMemo(
		() => safeItems.find(i => i.key === currentKey) || null,
		[currentKey, safeItems],
	);

	const renderActiveContent = () => {
		if (!activeItem) return null;
		if (typeof activeItem.render === 'function') {
			try {
				return activeItem.render(activeItem);
			} catch (err) {
				console.error('Sidebar item render failed:', err);
				return <div style={{ color: '#ef4444' }}>Failed to render content.</div>;
			}
		}
		return activeItem.content ?? null;
	};

	const renderContent = () => (useOutlet ? <Outlet /> : renderActiveContent());

	const handleSelect = key => {
		const item = safeItems.find(i => i.key === key);
		if (!item || item.disabled) return;
		if (!isControlled) setActiveKey(key);
		if (typeof onSelect === 'function') {
			try {
				onSelect(key, item);
			} catch (err) {
				console.error('Sidebar onSelect handler threw:', err);
			}
		}
	};

	const resolvedTheme = theme === 'dark' ? 'dark' : 'light';
	const palette =
		resolvedTheme === 'dark'
			? {
					bg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
					card: 'rgba(30, 41, 59, 0.8)',
					cardHover: 'rgba(51, 65, 85, 0.9)',
					border: 'rgba(148,163,184,0.2)',
					borderStrong: 'rgba(148,163,184,0.3)',
					fg: '#f1f5f9',
					fgMuted: '#94a3b8',
					accent: '#3b82f6',
					accentStrong: '#2563eb',
					hover: 'rgba(59,130,246,0.1)',
					activeBg:
						'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))',
					activeGlow: '0 0 20px rgba(59,130,246,0.3)',
					chipBg: '#334155',
					chipBd: '#475569',
					chipFg: '#e2e8f0',
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
					accent: '#3b82f6',
					accentStrong: '#2563eb',
					hover: 'rgba(59,130,246,0.08)',
					activeBg:
						'linear-gradient(135deg, rgba(59,130,246,0.12), rgba(99,102,241,0.08))',
					activeGlow: '0 0 20px rgba(59,130,246,0.2)',
					chipBg: '#f1f5f9',
					chipBd: '#e2e8f0',
					chipFg: '#475569',
					shadow: '0 20px 40px rgba(15,23,42,0.1)',
				};

	return (
		<div
			style={{
				display: 'flex',
				minHeight: '100vh',
				background: 'var(--bg)',
				...style,
			}}
		>
			<nav
				style={{
					position: 'fixed',
					left: 0,
					top: 0,
					height: '100vh',
					width: expanded ? width : collapsedWidth,
					display: 'flex',
					flexDirection: 'column',
					background: palette.bg,
					borderRight: `1px solid ${palette.borderStrong}`,
					color: palette.fg,
					backdropFilter: 'saturate(180%) blur(20px)',
					WebkitBackdropFilter: 'saturate(180%) blur(20px)',
					boxShadow: palette.shadow,
					zIndex: 1000,
					transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
				}}
			>
				{/* Header Section */}
				<div
					style={{
						padding: expanded ? '20px' : '20px 12px',
						minHeight: 80,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'space-between',
						borderBottom: `1px solid ${palette.border}`,
						background: palette.card,
						backdropFilter: 'blur(10px)',
					}}
				>
					{expanded && header && <div style={{ flex: 1 }}>{header}</div>}

					{collapsible && (
						<button
							type="button"
							onClick={() => setExpanded(v => !v)}
							style={{
								marginLeft: expanded ? 12 : 0,
								border: `1px solid ${palette.border}`,
								background: palette.card,
								color: palette.fg,
								padding: '8px',
								borderRadius: 12,
								cursor: 'pointer',
								fontWeight: 700,
								fontSize: '14px',
								transition: 'all 0.2s ease',
								boxShadow: '0 4px 12px rgba(15,23,42,0.1)',
							}}
							onMouseEnter={e => {
								e.target.style.background = palette.cardHover;
								e.target.style.transform = 'scale(1.05)';
							}}
							onMouseLeave={e => {
								e.target.style.background = palette.card;
								e.target.style.transform = 'scale(1)';
							}}
							aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
							title={expanded ? 'Collapse' : 'Expand'}
						>
							{expanded ? '◀' : '▶'}
						</button>
					)}
				</div>

				{/* Navigation Items */}
				<div
					style={{
						flex: 1,
						padding: '16px 12px',
						display: 'flex',
						flexDirection: 'column',
						gap: 8,
						overflowY: 'auto',
						scrollbarWidth: 'thin',
						scrollbarColor: `${palette.accent} transparent`,
					}}
				>
					{safeItems.map(item => {
						const baseItemStyle = {
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							gap: expanded ? 16 : 0,
							justifyContent: expanded ? 'flex-start' : 'center',
							width: '100%',
							textDecoration: 'none',
							textAlign: 'left',
							padding: expanded ? '14px 16px' : '14px 8px',
							borderRadius: 16,
							border: '1px solid transparent',
							transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
							willChange: 'transform, box-shadow',
							overflow: 'hidden',
						};

						// Use NavLink when "to" is provided
						if (item.to) {
							return (
								<NavLink
									key={item.key}
									to={item.to}
									end={item.end}
									aria-label={
										typeof item.label === 'string' ? item.label : undefined
									}
									title={
										!expanded && typeof item.label === 'string'
											? item.label
											: undefined
									}
									style={({ isActive }) => ({
										...baseItemStyle,
										background: isActive ? palette.activeBg : 'transparent',
										color: isActive ? palette.accent : palette.fg,
										border: isActive
											? `1px solid ${palette.accent}`
											: '1px solid transparent',
										boxShadow: isActive ? palette.activeGlow : 'none',
										fontWeight: isActive ? 700 : 500,
									})}
									onMouseEnter={e => {
										e.currentTarget.style.transform =
											'translateX(4px) scale(1.02)';
										e.currentTarget.style.background = palette.hover;
									}}
									onMouseLeave={e => {
										e.currentTarget.style.transform = 'translateX(0) scale(1)';
										const isActive =
											e.currentTarget.getAttribute('aria-current') === 'page';
										e.currentTarget.style.background = isActive
											? palette.activeBg
											: 'transparent';
									}}
								>
									{({ isActive }) => (
										<>
											{/* Active Indicator */}
											{isActive && (
												<div
													style={{
														position: 'absolute',
														left: 0,
														top: '20%',
														width: 4,
														height: '60%',
														borderRadius: '0 4px 4px 0',
														background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
														boxShadow: `0 0 10px ${palette.accent}`,
													}}
												/>
											)}

											{/* Icon */}
											<div
												style={{
													fontSize: 20,
													width: 24,
													height: 24,
													display: 'flex',
													alignItems: 'center',
													justifyContent: 'center',
													borderRadius: 8,
													background: isActive
														? `linear-gradient(135deg, ${palette.accent}20, ${palette.accentStrong}15)`
														: 'transparent',
													transition: 'all 0.2s ease',
												}}
											>
												{item.icon ?? '●'}
											</div>

											{/* Label */}
											{expanded && (
												<span
													style={{
														fontSize: 14,
														fontWeight: isActive ? 700 : 500,
														flex: 1,
														transition: 'all 0.2s ease',
													}}
												>
													{item.label}
												</span>
											)}

											{/* Badge */}
											{expanded && item.badge != null && (
												<span
													style={{
														background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
														color: '#ffffff',
														padding: '4px 8px',
														fontSize: 11,
														borderRadius: 12,
														fontWeight: 700,
														minWidth: 20,
														textAlign: 'center',
														boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
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

						// Fallback for button-style items
						const active = item.key === currentKey;
						return (
							<button
								key={item.key}
								type="button"
								aria-label={typeof item.label === 'string' ? item.label : undefined}
								onClick={() => handleSelect(item.key)}
								disabled={item.disabled}
								style={{
									...baseItemStyle,
									cursor: item.disabled ? 'not-allowed' : 'pointer',
									background: active ? palette.activeBg : 'transparent',
									color: item.disabled
										? palette.fgMuted
										: active
											? palette.accent
											: palette.fg,
									border: active
										? `1px solid ${palette.accent}`
										: '1px solid transparent',
									boxShadow: active ? palette.activeGlow : 'none',
									opacity: item.disabled ? 0.5 : 1,
								}}
								onMouseEnter={e => {
									if (!item.disabled) {
										e.currentTarget.style.transform =
											'translateX(4px) scale(1.02)';
										e.currentTarget.style.background = palette.hover;
									}
								}}
								onMouseLeave={e => {
									if (!item.disabled) {
										e.currentTarget.style.transform = 'translateX(0) scale(1)';
										e.currentTarget.style.background = active
											? palette.activeBg
											: 'transparent';
									}
								}}
								title={
									!expanded && typeof item.label === 'string'
										? item.label
										: undefined
								}
							>
								{active && (
									<div
										style={{
											position: 'absolute',
											left: 0,
											top: '20%',
											width: 4,
											height: '60%',
											borderRadius: '0 4px 4px 0',
											background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
											boxShadow: `0 0 10px ${palette.accent}`,
										}}
									/>
								)}

								<div
									style={{
										fontSize: 20,
										width: 24,
										height: 24,
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
										borderRadius: 8,
										background: active
											? `linear-gradient(135deg, ${palette.accent}20, ${palette.accentStrong}15)`
											: 'transparent',
									}}
								>
									{item.icon ?? '●'}
								</div>

								{expanded && (
									<span
										style={{
											fontSize: 14,
											fontWeight: active ? 700 : 500,
											flex: 1,
										}}
									>
										{item.label}
									</span>
								)}

								{expanded && item.badge != null && (
									<span
										style={{
											background: `linear-gradient(135deg, ${palette.accent}, ${palette.accentStrong})`,
											color: '#ffffff',
											padding: '4px 8px',
											fontSize: 11,
											borderRadius: 12,
											fontWeight: 700,
											minWidth: 20,
											textAlign: 'center',
											boxShadow: '0 2px 8px rgba(59,130,246,0.3)',
										}}
									>
										{item.badge}
									</span>
								)}
							</button>
						);
					})}
				</div>

				{/* Footer */}
				{footer && (
					<div
						style={{
							padding: '16px',
							borderTop: `1px solid ${palette.border}`,
							background: palette.card,
							backdropFilter: 'blur(10px)',
						}}
					>
						{footer}
					</div>
				)}
			</nav>

			{/* Main Content Area */}
			<main
				style={{
					marginLeft: expanded ? width : collapsedWidth,
					flex: 1,
					minHeight: '100vh',
					background:
						resolvedTheme === 'dark'
							? 'radial-gradient(ellipse at top, rgba(59,130,246,0.05) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139,92,246,0.05) 0%, transparent 50%), var(--bg)'
							: 'radial-gradient(ellipse at top, rgba(59,130,246,0.08) 0%, transparent 50%), radial-gradient(ellipse at bottom, rgba(139,92,246,0.08) 0%, transparent 50%), var(--bg)',
					transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
					position: 'relative',
					...contentStyle,
				}}
			>
				{/* Animated Background Pattern */}
				<div
					style={{
						position: 'fixed',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: `
                            radial-gradient(circle at 20% 50%, rgba(59,130,246,0.03) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(139,92,246,0.03) 0%, transparent 50%),
                            radial-gradient(circle at 40% 80%, rgba(16,185,129,0.03) 0%, transparent 50%)
                        `,
						pointerEvents: 'none',
						zIndex: -1,
					}}
				/>

				<div style={{ padding: '32px', position: 'relative', zIndex: 1 }}>
					{renderContent()}
				</div>
			</main>
		</div>
	);
};

export default Sidebar;
