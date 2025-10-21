import React from 'react';
import Skeleton from '../../../components/ui/Skeleton.jsx';

const TakeExamSkeleton = () => {
	return (
		<div style={styles.examLayout} className="examLayout">
			{/* Question Panel Skeleton */}
			<div style={styles.questionPanel}>
				<div style={{ flexGrow: 1 }}>
					<Skeleton style={{ height: '40px', width: '80%', marginBottom: '24px' }} />
					<Skeleton style={{ height: '20px', width: '100%', marginBottom: '12px' }} />
					<Skeleton style={{ height: '20px', width: '100%', marginBottom: '12px' }} />
					<Skeleton style={{ height: '150px', width: '100%', marginTop: '24px' }} />
				</div>
				<div style={styles.navigationControls}>
					<Skeleton style={{ height: '40px', width: '100px' }} />
					<Skeleton style={{ height: '40px', width: '150px' }} />
					<Skeleton style={{ height: '40px', width: '100px' }} />
				</div>
			</div>

			{/* Sidebar Skeleton */}
			<div style={styles.statusBar} className="statusBar">
				<Skeleton style={{ height: '30px', width: '70%', marginBottom: '16px' }} />
				<Skeleton style={{ height: '60px', width: '100%', marginBottom: '24px' }} />
				<div style={{ flex: 1, overflow: 'hidden' }}>
					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(5, 1fr)',
							gap: '8px',
						}}
					>
						{Array.from({ length: 15 }).map((_, i) => (
							<Skeleton key={i} style={{ aspectRatio: '1', borderRadius: '4px' }} />
						))}
					</div>
				</div>
				<Skeleton style={{ height: '50px', width: '100%', marginTop: '24px' }} />
			</div>
		</div>
	);
};

const styles = {
	examLayout: {
		display: 'grid',
		gridTemplateColumns: '1fr 320px',
		gap: '16px',
		height: '100vh',
		background: 'var(--bg)',
		padding: '16px',
	},
	questionPanel: {
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		padding: '24px',
		background: 'var(--surface)',
		borderRadius: '12px',
		border: '1px solid var(--border)',
	},
	statusBar: {
		position: 'sticky',
		top: '16px',
		height: 'calc(100vh - 32px)',
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: '12px',
		padding: '16px',
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	},
	navigationControls: {
		display: 'flex',
		justifyContent: 'space-between',
		marginTop: 'auto',
		paddingTop: '16px',
		borderTop: '1px solid var(--border)',
	},
};

export default TakeExamSkeleton;
