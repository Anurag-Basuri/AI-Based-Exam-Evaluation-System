import React, { useMemo, useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';

const Sidebar = ({
    items = [],
    defaultKey,
    selectedKey, // optional controlled mode
    onSelect, // (key, item) => void
    header = null, // ReactNode
    footer = null, // ReactNode
    collapsible = true,
    width = 240,
    collapsedWidth = 72,
    style = {},
    contentStyle = {},
    useOutlet = false, // render nested routes instead of local content
    theme = 'light', // 'light' | 'dark'
}) => {
    const safeItems = Array.isArray(items) ? items : [];
    const firstKey = useMemo(() => defaultKey ?? safeItems[0]?.key ?? null, [defaultKey, safeItems]);
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

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `${expanded ? width : collapsedWidth}px 1fr`,
                minHeight: '100vh',
                background: 'var(--surface, transparent)',
                transition: 'grid-template-columns 0.25s ease',
                ...style,
            }}
        >
            <nav
                style={{
                    background: 'var(--sidebar-bg, #0f172a)',
                    borderRight: '1px solid rgba(148, 163, 184, 0.25)',
                    color: 'var(--text, #e2e8f0)',
                    display: 'flex',
                    flexDirection: 'column',
                    backdropFilter: 'blur(12px)',
                }}
            >
                <div style={{ padding: 12, minHeight: 56, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {header ?? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div
                                aria-hidden
                                style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: 8,
                                    background:
                                        'linear-gradient(135deg, rgba(99,102,241,0.95), rgba(99,102,241,0.6))',
                                    boxShadow: '0 6px 16px rgba(99,102,241,0.25)',
                                }}
                            />
                            {expanded && <div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Student</div>}
                        </div>
                    )}
                </div>

                <div
                    style={{
                        flex: 1,
                        padding: 8,
                        display: 'grid',
                        gap: 6,
                        overflowY: 'auto',
                        scrollbarWidth: 'thin',
                    }}
                >
                    {safeItems.map(item => {
                        const baseItemStyle = {
                            position: 'relative',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            width: '100%',
                            textAlign: 'left',
                            padding: '10px 12px',
                            borderRadius: 10,
                            border: '1px solid transparent',
                            transition: 'background 180ms ease, box-shadow 180ms ease, color 180ms ease, transform 120ms',
                        };

                        // Use NavLink when "to" is provided, otherwise local select
                        if (item.to) {
                            return (
                                <NavLink
                                    key={item.key}
                                    to={item.to}
                                    aria-label={typeof item.label === 'string' ? item.label : undefined}
                                    end={item.to === '.'}
                                    title={typeof item.label === 'string' ? item.label : undefined}
                                    style={({ isActive }) => ({
                                        ...baseItemStyle,
                                        textDecoration: 'none',
                                        background: isActive
                                            ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.12))'
                                            : 'transparent',
                                        color: isActive ? '#ffffff' : '#e2e8f0',
                                        boxShadow: isActive ? 'inset 0 0 0 1px rgba(99,102,241,0.45)' : 'none',
                                    })}
                                    onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                    onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <span
                                                    aria-hidden="true"
                                                    style={{
                                                        position: 'absolute',
                                                        left: 6,
                                                        width: 3,
                                                        height: '70%',
                                                        borderRadius: 2,
                                                        background: '#6366f1',
                                                    }}
                                                />
                                            )}
                                            <span aria-hidden="true" style={{ fontSize: 18, width: 22, textAlign: 'center' }}>
                                                {item.icon ?? '•'}
                                            </span>
                                            {expanded && <span style={{ fontWeight: 700, fontSize: 14 }}>{item.label}</span>}
                                            {expanded && item.badge != null && (
                                                <span
                                                    style={{
                                                        marginLeft: 'auto',
                                                        background: '#1f2937',
                                                        border: '1px solid #334155',
                                                        color: '#cbd5e1',
                                                        padding: '2px 6px',
                                                        fontSize: 12,
                                                        borderRadius: 999,
                                                        fontWeight: 700,
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
                                    background: active
                                        ? 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.12))'
                                        : 'transparent',
                                    color: item.disabled ? '#64748b' : active ? '#ffffff' : '#e2e8f0',
                                    boxShadow: active ? 'inset 0 0 0 1px rgba(99,102,241,0.45)' : 'none',
                                }}
                                onMouseOver={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
                                onMouseOut={e => (e.currentTarget.style.transform = 'translateY(0)')}
                                title={typeof item.label === 'string' ? item.label : undefined}
                            >
                                {active && (
                                    <span
                                        aria-hidden="true"
                                        style={{
                                            position: 'absolute',
                                            left: 6,
                                            width: 3,
                                            height: '70%',
                                            borderRadius: 2,
                                            background: '#6366f1',
                                        }}
                                    />
                                )}
                                <span aria-hidden="true" style={{ fontSize: 18, width: 22, textAlign: 'center' }}>
                                    {item.icon ?? '•'}
                                </span>
                                {expanded && (
                                    <span style={{ fontWeight: active ? 800 : 600, fontSize: 14 }}>{item.label}</span>
                                )}
                                {expanded && item.badge != null && (
                                    <span
                                        style={{
                                            marginLeft: 'auto',
                                            background: '#1f2937',
                                            border: '1px solid #334155',
                                            color: '#cbd5e1',
                                            padding: '2px 6px',
                                            fontSize: 12,
                                            borderRadius: 999,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {item.badge}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>

                <div style={{ padding: 8, borderTop: '1px solid #1f2937' }}>
                    {footer}
                    {collapsible && (
                        <button
                            type="button"
                            onClick={() => setExpanded(v => !v)}
                            style={{
                                width: '100%',
                                padding: '8px 10px',
                                borderRadius: 10,
                                border: '1px solid #334155',
                                background: 'transparent',
                                color: '#cbd5e1',
                                cursor: 'pointer',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 6,
                            }}
                            aria-label={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
                        >
                            <span aria-hidden="true">{expanded ? '⟨' : '⟩'}</span>
                            {expanded ? 'Collapse' : ''}
                        </button>
                    )}
                </div>
            </nav>
            <main
                style={{
                    padding: 20,
                    background:
                        resolvedTheme === 'light'
                            ? 'linear-gradient(180deg, #f8fafc, #e2e8f0)'
                            : 'linear-gradient(180deg, #0b1120, #111827)',
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
