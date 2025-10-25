import React from 'react';

const ToastCtx = React.createContext(null);

let idSeq = 1;
const defaultTimeout = { success: 3000, info: 3500, error: 5000 };

export function ToastProvider({ children }) {
	const [toasts, setToasts] = React.useState([]);

	const push = React.useCallback((type, message, opts = {}) => {
		const id = idSeq++;
		const timeout = opts.timeout ?? defaultTimeout[type] ?? 3000;
		const item = { id, type, message };
		setToasts(prev => [...prev, item]);
		if (timeout > 0) {
			setTimeout(() => {
				setToasts(prev => prev.filter(t => t.id !== id));
			}, timeout);
		}
		return id;
	}, []);

	const api = React.useMemo(
		() => ({
			success: (msg, opts) => push('success', msg, opts),
			info: (msg, opts) => push('info', msg, opts),
			error: (msg, opts) => push('error', msg, opts),
			dismiss: id => setToasts(prev => prev.filter(t => t.id !== id)),
		}),
		[push],
	);

	return (
		<ToastCtx.Provider value={api}>
			{children}
			<ToastViewport toasts={toasts} onClose={id => api.dismiss(id)} />
		</ToastCtx.Provider>
	);
}

export function useToast() {
	const ctx = React.useContext(ToastCtx);
	if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
	return ctx;
}

function ToastViewport({ toasts, onClose }) {
	const color = t =>
		t === 'success'
			? ['#10b981', '#064e3b']
			: t === 'error'
				? ['#ef4444', '#7f1d1d']
				: ['#3b82f6', '#1e3a8a'];

	return (
		<div
			aria-live="polite"
			aria-atomic="true"
			style={{
				position: 'fixed',
				right: 16,
				top: 16,
				display: 'grid',
				gap: 10,
				zIndex: 1000,
				maxWidth: 'min(420px, 90vw)',
			}}
		>
			{toasts.map(t => {
				const [fg, bg] = color(t.type);
				return (
					<div
						key={t.id}
						role="status"
						style={{
							color: fg,
							background: bg,
							borderRadius: 10,
							padding: '10px 12px',
							boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
							display: 'flex',
							alignItems: 'center',
							gap: 10,
						}}
					>
						<div style={{ flex: 1, color: '#fff' }}>{t.message}</div>
						<button
							onClick={() => onClose(t.id)}
							aria-label="Dismiss notification"
							style={{
								background: 'transparent',
								border: 'none',
								color: '#fff',
								cursor: 'pointer',
								fontSize: 16,
								lineHeight: 1,
							}}
						>
							×
						</button>
					</div>
				);
			})}
		</div>
	);
}
