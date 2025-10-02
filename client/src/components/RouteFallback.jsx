import React from 'react';

const RouteFallback = () => (
	<div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}>
		<div
			aria-label="Loading"
			style={{
				display: 'inline-flex',
				alignItems: 'center',
				gap: 10,
				color: 'var(--text-muted)',
			}}
		>
			<span
				style={{
					width: 16,
					height: 16,
					borderRadius: '50%',
					border: '2px solid var(--border)',
					borderTopColor: 'var(--primary)',
					animation: 'spin 0.8s linear infinite',
				}}
			/>
			<span>Loading…</span>
			<style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
		</div>
	</div>
);

export default RouteFallback;
