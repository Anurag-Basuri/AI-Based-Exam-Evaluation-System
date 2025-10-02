import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Sidebar = ({
	items = [],
	defaultKey,
	selectedKey,
	onSelect,
	footer = null,
	collapsible = true,
	width = 256,
	collapsedWidth = 76,
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
					bg: 'color-mix(in srgb, #0b1220 78%, transparent)',
					card: 'color-mix(in srgb, #0f172a 86%, transparent)',
					border: 'rgba(148,163,184,0.18)',
					fg: '#e5e7eb',
					fgMuted: '#94a3b8',
					accent: 'var(--primary)',
					accentStrong: 'var(--primary-strong)',
					hover: 'rgba(148,163,184,0.08)',
					activeBg:
						'linear-gradient(135deg, rgba(129,140,248,0.18), rgba(99,102,241,0.12))',
					chipBg: '#111827',
					chipBd: '#334155',
					chipFg: '#cbd5e1',
				}
			: {
					bg: 'color-mix(in srgb, #ffffff 86%, transparent)',
					card: 'rgba(255,255,255,0.9)',
					border: 'rgba(15,23,42,0.08)',
					fg: '#0f172a',
					fgMuted: '#475569',
					accent: 'var(--primary)',
					accentStrong: 'var(--primary-strong)',
					hover: 'rgba(2,6,23,0.04)',
					activeBg:
						'linear-gradient(135deg, rgba(99,102,241,0.14), rgba(99,102,241,0.10))',
					chipBg: '#f1f5f9',
					chipBd: '#e2e8f0',
					chipFg: '#334155',
				};

	return (
		<div
			style={{
				display: 'grid',
				gridTemplateColumns: `${expanded ? width : collapsedWidth}px 1fr`,
				minHeight: '100vh',
				background: 'var(--bg)',
				transition: 'grid-template-columns 0.25s ease',
				...style,
			}}
		>
			<nav
				style={{
					position: 'sticky',
					top: 0,
					display: 'flex',
					flexDirection: 'column',
					background: palette.bg,
					borderRight: `1px solid ${palette.border}`,
					color: palette.fg,
					backdropFilter: 'saturate(140%) blur(14px)',
					WebkitBackdropFilter: 'saturate(140%) blur(14px)',
				}}
			>
				<div
					style={{
						padding: 12,
						minHeight: 64,
						display: 'flex',
						alignItems: 'center',
						gap: 10,
						borderBottom: `1px solid ${palette.border}`,
					}}
				>
					{collapsible && (
						<button
							type="button"
							onClick={() => setExpanded(v => !v)}
							style={{
								marginLeft: 'auto',
								border: `1px solid ${palette.border}`,
								background: palette.card,
								color: palette.fg,
								padding: '6px 10px',
								borderRadius: 999,
								cursor: 'pointer',
								fontWeight: 700,
							}}
							aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
							title={expanded ? 'Collapse' : 'Expand'}
						>
							{expanded ? '⟨' : '⟩'}
						</button>
					)}
				</div>

				<div
					style={{
						flex: 1,
						padding: 10,
						display: 'grid',
						gap: 8,
						overflowY: 'auto',
						scrollbarWidth: 'thin',
					}}
				>
					{safeItems.map(item => {
						const baseItemStyle = {
							position: 'relative',
							display: 'flex',
							alignItems: 'center',
							gap: 12,
							width: '100%',
							textDecoration: 'none',
							textAlign: 'left',
							padding: '10px 12px',
							borderRadius: 12,
							border: `1px solid transparent`,
							transition:
								'background 180ms ease, box-shadow 180ms ease, color 180ms ease, transform 120ms',
							willChange: 'transform',
						};

						// Use NavLink when "to" is provided, otherwise local select
						if (item.to) {
							return (
								<NavLink
									key={item.key}
									to={item.to}
									end={item.to === '.'}
									aria-label={
										typeof item.label === 'string' ? item.label : undefined
									}
									title={typeof item.label === 'string' ? item.label : undefined}
									style={({ isActive }) => ({
										...baseItemStyle,
										background: isActive ? palette.activeBg : 'transparent',
										color: isActive ? palette.fg : palette.fg,
										border: isActive
											? `1px solid ${palette.border}`
											: '1px solid transparent',
										boxShadow: isActive
											? 'inset 0 0 0 1px rgba(99,102,241,0.20)'
											: 'none',
									})}
									onMouseOver={e =>
										(e.currentTarget.style.transform = 'translateY(-1px)')
									}
									onMouseOut={e =>
										(e.currentTarget.style.transform = 'translateY(0)')
									}
								>
									{({ isActive }) => (
										<>
											<span
												aria-hidden="true"
												style={{
													fontSize: 18,
													width: 22,
													textAlign: 'center',
													opacity: isActive ? 1 : 0.9,
												}}
											>
												{item.icon ?? '•'}
											</span>
											{expanded && (
												<span
													style={{
														fontWeight: isActive ? 800 : 650,
														fontSize: 14,
													}}
												>
													{item.label}
												</span>
											)}
											{isActive && (
												<span
													aria-hidden="true"
													style={{
														position: 'absolute',
														left: 6,
														width: 4,
														height: '70%',
														borderRadius: 3,
														background: palette.accentStrong,
													}}
												/>
											)}
											{expanded && item.badge != null && (
												<span
													style={{
														marginLeft: 'auto',
														background: palette.chipBg,
														border: `1px solid ${palette.chipBd}`,
														color: palette.chipFg,
														padding: '2px 6px',
														fontSize: 12,
														borderRadius: 999,
														fontWeight: 800,
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
									color: item.disabled ? palette.fgMuted : palette.fg,
									border: active
										? `1px solid ${palette.border}`
										: '1px solid transparent',
									boxShadow: active
										? 'inset 0 0 0 1px rgba(99,102,241,0.20)'
										: 'none',
								}}
								onMouseOver={e =>
									(e.currentTarget.style.transform = 'translateY(-1px)')
								}
								onMouseOut={e =>
									(e.currentTarget.style.transform = 'translateY(0)')
								}
								title={typeof item.label === 'string' ? item.label : undefined}
							>
								{active && (
									<span
										aria-hidden="true"
										style={{
											position: 'absolute',
											left: 6,
											width: 4,
											height: '70%',
											borderRadius: 3,
											background: palette.accentStrong,
										}}
									/>
								)}
								<span
									aria-hidden="true"
									style={{ fontSize: 18, width: 22, textAlign: 'center' }}
								>
									{item.icon ?? '•'}
								</span>
								{expanded && (
									<span style={{ fontWeight: active ? 800 : 650, fontSize: 14 }}>
										{item.label}
									</span>
								)}
								{expanded && item.badge != null && (
									<span
										style={{
											marginLeft: 'auto',
											background: palette.chipBg,
											border: `1px solid ${palette.chipBd}`,
											color: palette.chipFg,
											padding: '2px 6px',
											fontSize: 12,
											borderRadius: 999,
											fontWeight: 800,
										}}
									>
										{item.badge}
									</span>
								)}
							</button>
						);
					})}
				</div>

				<div style={{ padding: 10, borderTop: `1px solid ${palette.border}` }}>
					{footer}
				</div>
			</nav>

			<main
				style={{
					padding: 22,
					background:
						resolvedTheme === 'dark'
							? 'radial-gradient(1200px 400px at 10% 0%, rgba(99,102,241,0.08), transparent 40%), var(--bg)'
							: 'radial-gradient(1200px 400px at 10% 0%, rgba(99,102,241,0.10), transparent 40%), var(--bg)',
					minHeight: '100vh',
					...contentStyle,
				}}
			>
				{renderContent()}
			</main>
		</div>
	);
};

export default Sidebar;
