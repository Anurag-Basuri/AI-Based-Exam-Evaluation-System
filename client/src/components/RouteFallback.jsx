import React from 'react';

const LoadingSpinner = ({ size = 20 }) => (
	<div
		style={{
			width: size,
			height: size,
			borderRadius: '50%',
			border: `2px solid var(--border-light)`,
			borderTopColor: 'var(--primary)',
			animation: 'spin 0.8s linear infinite',
			display: 'inline-block',
		}}
	/>
);

const RouteFallback = ({ message = 'Loading...', fullscreen = false, minimal = false }) => {
	const [dots, setDots] = React.useState('');
	const [loadTime, setLoadTime] = React.useState(0);

	React.useEffect(() => {
		const startTime = Date.now();

		const interval = setInterval(() => {
			setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
			setLoadTime(Math.floor((Date.now() - startTime) / 1000));
		}, 500);

		return () => clearInterval(interval);
	}, []);

	if (minimal) {
		return (
			<div
				style={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
					padding: '20px',
					gap: '10px',
					color: 'var(--text-muted)',
					fontSize: '14px',
				}}
			>
				<LoadingSpinner size={16} />
				<span>{message}</span>
			</div>
		);
	}

	const containerStyle = {
		minHeight: fullscreen ? '100vh' : '40vh',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '32px 20px',
		background: fullscreen
			? 'radial-gradient(ellipse at center, rgba(59,130,246,0.05) 0%, transparent 70%)'
			: 'transparent',
	};

	return (
		<div style={containerStyle}>
			<div
				style={{
					background:
						'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(248,250,252,0.8))',
					backdropFilter: 'saturate(180%) blur(20px)',
					WebkitBackdropFilter: 'saturate(180%) blur(20px)',
					borderRadius: 20,
					padding: '40px 32px',
					border: '1px solid rgba(59,130,246,0.1)',
					boxShadow: '0 20px 40px rgba(59,130,246,0.1)',
					textAlign: 'center',
					maxWidth: 400,
					width: '100%',
					position: 'relative',
					overflow: 'hidden',
				}}
				aria-label="Loading content"
				role="status"
			>
				{/* Animated background */}
				<div
					style={{
						position: 'absolute',
						top: '-50%',
						left: '-50%',
						width: '200%',
						height: '200%',
						background:
							'conic-gradient(from 0deg, transparent, rgba(59,130,246,0.03), transparent)',
						animation: 'spin 15s linear infinite',
					}}
				/>

				<div style={{ position: 'relative', zIndex: 1 }}>
					{/* Main spinner */}
					<div
						style={{
							width: 60,
							height: 60,
							margin: '0 auto 24px',
							position: 'relative',
						}}
					>
						<LoadingSpinner size={60} />

						{/* Progress ring */}
						<div
							style={{
								position: 'absolute',
								top: -8,
								left: -8,
								width: 76,
								height: 76,
								borderRadius: '50%',
								border: '2px solid transparent',
								borderTopColor: 'rgba(59,130,246,0.2)',
								animation: 'spin 2s linear infinite reverse',
							}}
						/>
					</div>

					{/* Loading text */}
					<h3
						style={{
							margin: '0 0 12px 0',
							fontSize: '18px',
							fontWeight: 700,
							color: 'var(--text)',
						}}
					>
						{message}
						{dots}
					</h3>

					{/* Progress indicators */}
					<div
						style={{
							display: 'flex',
							justifyContent: 'center',
							gap: '6px',
							marginBottom: '16px',
						}}
					>
						{[0, 1, 2].map(i => (
							<div
								key={i}
								style={{
									width: 8,
									height: 8,
									borderRadius: '50%',
									background: 'var(--primary)',
									opacity: dots.length > i ? 1 : 0.3,
									animation: `pulse 1.5s ease-in-out ${i * 0.2}s infinite`,
								}}
							/>
						))}
					</div>

					<p
						style={{
							color: 'var(--text-muted)',
							fontSize: '14px',
							margin: 0,
							opacity: 0.8,
						}}
					>
						{loadTime > 3
							? `Taking longer than usual... (${loadTime}s)`
							: 'Please wait while we prepare your content'}
					</p>

					{loadTime > 10 && (
						<button
							onClick={() => window.location.reload()}
							style={{
								marginTop: '16px',
								padding: '8px 16px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text-muted)',
								cursor: 'pointer',
								fontSize: '12px',
								fontWeight: 600,
								transition: 'all 0.2s ease',
							}}
							onMouseEnter={e => {
								e.target.style.background = 'var(--bg-secondary)';
							}}
							onMouseLeave={e => {
								e.target.style.background = 'var(--bg)';
							}}
						>
							🔄 Refresh if stuck
						</button>
					)}
				</div>
			</div>

			<style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.2); opacity: 1; }
                }
            `}</style>
		</div>
	);
};

export default RouteFallback;
