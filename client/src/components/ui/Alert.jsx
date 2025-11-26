import React from 'react';

const colors = {
	error: { fg: '#ef4444', icon: '⛔' },
	warn: { fg: '#f59e0b', icon: '⚠️' },
	info: { fg: '#3b82f6', icon: 'ℹ️' },
};

const Alert = ({ type = 'info', children, onClose, dense = false }) => {
	const c = colors[type] || colors.info;
	return (
		<div
			role="alert"
			style={{
				padding: dense ? '8px 10px' : '10px 12px',
				borderRadius: 12,
				border: `1px solid ${c.fg}40`,
				background: 'var(--surface)',
				color: 'var(--text)',
				fontWeight: 600,
				display: 'flex',
				alignItems: 'center',
				gap: 10,
			}}
		>
			<span style={{ fontSize: 18 }}>{c.icon}</span>
			<div style={{ flex: 1 }}>{children}</div>
			{onClose && (
				<button
					onClick={onClose}
					aria-label="Dismiss alert"
					style={{
						border: 'none',
						background: 'transparent',
						color: c.fg,
						cursor: 'pointer',
						fontWeight: 900,
						fontSize: 16,
					}}
				>
					×
				</button>
			)}
		</div>
	);
};

export default Alert;
