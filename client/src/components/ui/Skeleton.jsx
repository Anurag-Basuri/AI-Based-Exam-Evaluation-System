import React from 'react';

const Skeleton = ({ className, style }) => {
	return (
		<div
			className={className}
			style={{
				...style,
				backgroundColor: 'var(--border)',
				animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			}}
		/>
	);
};

export default Skeleton;
