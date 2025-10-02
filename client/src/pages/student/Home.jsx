import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const Home = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const username = user?.username || 'Student';

	return (
		<section style={{ color: 'var(--text)' }}>
			<div
				style={{
					border: '1px solid var(--border)',
					borderRadius: 16,
					padding: 16,
					background:
						'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), color-mix(in srgb, var(--primary) 4%, transparent))',
					boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
					marginBottom: 16,
				}}
			>
				<h1 style={{ marginTop: 0, marginBottom: 6, color: 'var(--text)' }}>
					Welcome, {username}
				</h1>
				<p style={{ color: 'var(--text-muted)', margin: 0 }}>
					Track exams, continue active sessions, and view your results.
				</p>
				<div
					style={{
						display: 'flex',
						gap: 12,
						marginTop: 14,
						flexWrap: 'wrap',
					}}
				>
					<button
						onClick={() => navigate('exams')}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: 'none',
							background: 'var(--primary-strong)',
							color: '#fff',
							cursor: 'pointer',
							fontWeight: 700,
							boxShadow: '0 10px 18px rgba(99,102,241,0.25)',
						}}
					>
						Go to Exams
					</button>
					<button
						onClick={() => navigate('settings')}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							cursor: 'pointer',
							fontWeight: 700,
						}}
					>
						Settings
					</button>
				</div>
			</div>

			<div
				style={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
					gap: 12,
				}}
			>
				{[
					{ k: 'Active Exams', v: 1, i: '🟣' },
					{ k: 'Upcoming', v: 2, i: '🟡' },
					{ k: 'Completed', v: 7, i: '🟢' },
				].map((s, i) => (
					<div
						key={i}
						style={{
							background: 'var(--surface)',
							border: '1px solid var(--border)',
							borderRadius: 14,
							padding: 14,
							boxShadow: '0 8px 24px rgba(15,23,42,0.04)',
							display: 'grid',
							alignItems: 'start',
							gap: 6,
						}}
					>
						<div
							style={{
								color: 'var(--text-muted)',
								fontSize: 13,
								display: 'flex',
								gap: 8,
								alignItems: 'center',
							}}
						>
							<span aria-hidden>{s.i}</span>
							{s.k}
						</div>
						<div
							style={{
								fontWeight: 800,
								fontSize: 28,
								lineHeight: 1.2,
								color: 'var(--text)',
							}}
						>
							{s.v}
						</div>
					</div>
				))}
			</div>
		</section>
	);
};

export default Home;
