import React from 'react';

export default class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = {
			err: null,
			errorInfo: null,
			retryCount: 0,
		};
	}

	static getDerivedStateFromError(err) {
		return { err };
	}

	componentDidCatch(err, errorInfo) {
		console.error('ErrorBoundary caught error:', err, errorInfo);
		this.setState({ errorInfo });

		// Optional: Send error to monitoring service
		if (window.gtag) {
			window.gtag('event', 'exception', {
				description: err.message,
				fatal: false,
			});
		}
	}

	reset = () => {
		this.setState({
			err: null,
			errorInfo: null,
			retryCount: this.state.retryCount + 1,
		});
	};

	render() {
		const { err, retryCount } = this.state;
		const { children, fallback } = this.props;

		if (!err) return children;

		// Custom fallback if provided
		if (fallback && typeof fallback === 'function') {
			return fallback(err, this.reset);
		}

		return (
			<div
				style={{
					minHeight: '60vh',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '32px 20px',
					color: 'var(--text)',
				}}
			>
				<div
					role="alert"
					style={{
						background:
							'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.8))',
						backdropFilter: 'saturate(180%) blur(20px)',
						WebkitBackdropFilter: 'saturate(180%) blur(20px)',
						border: '1px solid rgba(239,68,68,0.2)',
						borderRadius: 20,
						padding: '40px 32px',
						boxShadow: '0 20px 40px rgba(239,68,68,0.1)',
						textAlign: 'center',
						maxWidth: 600,
						width: '100%',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					{/* Animated background pattern */}
					<div
						style={{
							position: 'absolute',
							top: '-50%',
							left: '-50%',
							width: '200%',
							height: '200%',
							background:
								'conic-gradient(from 0deg, transparent, rgba(239,68,68,0.02), transparent)',
							animation: 'spin 20s linear infinite',
						}}
					/>

					<div style={{ position: 'relative', zIndex: 1 }}>
						<div
							style={{
								width: 80,
								height: 80,
								margin: '0 auto 24px',
								background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
								borderRadius: '50%',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								fontSize: '32px',
								border: '1px solid rgba(239,68,68,0.2)',
							}}
						>
							⚠️
						</div>

						<h1
							style={{
								margin: '0 0 16px 0',
								fontSize: '24px',
								fontWeight: 800,
								background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								backgroundClip: 'text',
							}}
						>
							Oops! Something went wrong
						</h1>

						<p
							style={{
								color: 'var(--text-muted)',
								margin: '0 0 24px 0',
								fontSize: '16px',
								lineHeight: 1.5,
							}}
						>
							{err?.message ||
								'An unexpected error occurred. Please try again or contact support if the problem persists.'}
						</p>

						{retryCount < 3 && (
							<button
								onClick={this.reset}
								style={{
									padding: '12px 24px',
									borderRadius: 12,
									border: 'none',
									background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
									color: '#ffffff',
									cursor: 'pointer',
									fontWeight: 700,
									fontSize: '14px',
									marginRight: '12px',
									boxShadow: '0 8px 20px rgba(220,38,38,0.3)',
									transition: 'all 0.2s ease',
								}}
								onMouseEnter={e => {
									e.target.style.transform = 'translateY(-2px)';
									e.target.style.boxShadow = '0 12px 28px rgba(220,38,38,0.4)';
								}}
								onMouseLeave={e => {
									e.target.style.transform = 'translateY(0)';
									e.target.style.boxShadow = '0 8px 20px rgba(220,38,38,0.3)';
								}}
							>
								🔄 Try Again
							</button>
						)}

						<button
							onClick={() => window.location.reload()}
							style={{
								padding: '12px 24px',
								borderRadius: 12,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								cursor: 'pointer',
								fontWeight: 600,
								fontSize: '14px',
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={e => {
								e.target.style.background = 'var(--bg-secondary)';
								e.target.style.transform = 'translateY(-1px)';
							}}
							onMouseLeave={e => {
								e.target.style.background = 'var(--bg)';
								e.target.style.transform = 'translateY(0)';
							}}
						>
							🔃 Refresh Page
						</button>

						{process.env.NODE_ENV === 'development' && (
							<details
								style={{
									marginTop: '24px',
									padding: '16px',
									background: 'rgba(239,68,68,0.05)',
									borderRadius: 12,
									border: '1px solid rgba(239,68,68,0.1)',
									textAlign: 'left',
								}}
							>
								<summary
									style={{
										cursor: 'pointer',
										fontWeight: 600,
										marginBottom: '8px',
										color: '#dc2626',
									}}
								>
									🔍 Error Details (Development)
								</summary>
								<pre
									style={{
										fontSize: '12px',
										color: '#7f1d1d',
										overflow: 'auto',
										margin: 0,
										whiteSpace: 'pre-wrap',
										wordBreak: 'break-word',
									}}
								>
									{err?.stack || 'No stack trace available'}
								</pre>
							</details>
						)}
					</div>
				</div>
			</div>
		);
	}
}
