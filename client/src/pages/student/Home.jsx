import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';

const Home = () => {
	const navigate = useNavigate();
	const { user } = useAuth();
	const username = user?.username || 'Student';

	const card = {
		border: '1px solid var(--border)',
		borderRadius: 16,
		padding: 18,
		background:
			'linear-gradient(135deg, color-mix(in srgb, var(--primary) 10%, transparent), color-mix(in srgb, var(--primary) 4%, transparent))',
		boxShadow: '0 10px 28px rgba(15,23,42,0.08)',
		marginBottom: 16,
	};

	const tile = {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 14,
		padding: 16,
		boxShadow: '0 8px 24px rgba(15,23,42,0.06)',
		display: 'grid',
		alignItems: 'start',
		gap: 6,
		transition: 'transform .15s ease, box-shadow .2s ease',
	};

	return (
		<section style={{ color: 'var(--text)' }}>
			<div style={card}>
				<h1 style={{ marginTop: 0, marginBottom: 6, color: 'var(--text)' }}>
					Welcome, {username}
				</h1>
				<p style={{ color: 'var(--text-muted)', margin: 0 }}>
					Track exams, continue active sessions, and view your results.
				</p>
				<div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
					<button
						onClick={() => navigate('exams')}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: 'none',
							background: 'var(--primary-strong)',
							color: '#fff',
							cursor: 'pointer',
							fontWeight: 800,
							boxShadow: '0 12px 24px rgba(99,102,241,0.25)',
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
							fontWeight: 800,
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
					gap: 14,
				}}
			>
				{[
					{ k: 'Active Exams', v: 1, i: '🟣' },
					{ k: 'Upcoming', v: 2, i: '🟡' },
					{ k: 'Completed', v: 7, i: '🟢' },
				].map((s, i) => (
					<div
						key={i}
						style={tile}
						onMouseOver={e => {
							e.currentTarget.style.transform = 'translateY(-2px)';
							e.currentTarget.style.boxShadow = '0 14px 28px rgba(15,23,42,0.10)';
						}}
						onMouseOut={e => {
							e.currentTarget.style.transform = 'translateY(0)';
							e.currentTarget.style.boxShadow = '0 8px 24px rgba(15,23,42,0.06)';
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
								fontWeight: 900,
								fontSize: 30,
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
