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
			<div
				style={{
					minHeight: '40vh',
					display: 'grid',
					placeItems: 'center',
					color: 'var(--text)',
				}}
			>
				<div
					role="alert"
					style={{
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						borderRadius: 16,
						padding: 24,
						boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
						textAlign: 'center',
						maxWidth: 600,
					}}
				>
					<h1 style={{ marginTop: 0 }}>Something went wrong</h1>
					<p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
						{err?.message || 'An unexpected error occurred.'}
					</p>
					<button
						onClick={this.reset}
						style={{
							marginTop: 14,
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							cursor: 'pointer',
							fontWeight: 700,
						}}
					>
						Try again
					</button>
				</div>
			</div>
		);
	}
}
