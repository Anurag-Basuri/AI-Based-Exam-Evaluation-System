import React from 'react';

export default class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { err: null };
	}
	static getDerivedStateFromError(err) {
		return { err };
	}
	componentDidCatch(err, info) {
		console.error('Route error boundary caught:', err, info);
	}
	reset = () => this.setState({ err: null });
	render() {
		const { err } = this.state;
		if (!err) return this.props.children;
		return (
			<div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', padding: 24 }}>
				<div
					style={{
						maxWidth: 560,
						width: '100%',
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						borderRadius: 16,
						boxShadow: '0 12px 28px rgba(15,23,42,0.10)',
						padding: 20,
						color: 'var(--text)',
					}}
				>
					<h2 style={{ marginTop: 0 }}>Something went wrong</h2>
					<p style={{ color: 'var(--text-muted)' }}>
						The page failed to load. Try again or go back.
					</p>
					<pre
						style={{
							whiteSpace: 'pre-wrap',
							background: 'var(--elev)',
							border: '1px solid var(--border)',
							padding: 10,
							borderRadius: 8,
							color: 'var(--text-muted)',
							maxHeight: 200,
							overflow: 'auto',
							fontSize: 12,
						}}
					>
						{String(err?.message || err)}
					</pre>
					<div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
						<button
							onClick={this.reset}
							style={{
								padding: '8px 12px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--surface)',
								color: 'var(--text)',
								cursor: 'pointer',
								fontWeight: 700,
							}}
						>
							Try again
						</button>
						<a
							href="/"
							style={{
								padding: '8px 12px',
								borderRadius: 8,
								border: 'none',
								background: 'var(--primary-strong)',
								color: '#fff',
								fontWeight: 700,
								textDecoration: 'none',
							}}
						>
							Go home
						</a>
					</div>
				</div>
			</div>
		);
	}
}
