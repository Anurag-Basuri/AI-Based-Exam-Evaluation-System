import React from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import RouteFallback from '../components/RouteFallback.jsx';

const getDashboardPath = role => (role === 'teacher' ? '/teacher' : '/student');

const Forbidden = ({ correctDashboard }) => (
	<div
		style={{
			minHeight: '60vh',
			display: 'flex',
			alignItems: 'center',
			justifyContent: 'center',
			padding: 24,
			color: 'var(--text)',
		}}
	>
		<div
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 20,
				padding: '40px 32px',
				boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
				textAlign: 'center',
				maxWidth: 480,
				width: '100%',
			}}
		>
			<div style={{ fontSize: 48, marginBottom: 16 }}>🚫</div>
			<h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800 }}>Access Denied</h1>
			<p style={{ margin: '0 0 24px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
				You don't have permission to access this section. It looks like you're trying to
				access a page meant for a different role.
			</p>
			<div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
				<Link
					to={correctDashboard}
					style={{
						padding: '10px 24px',
						borderRadius: 10,
						background: 'var(--primary)',
						color: '#fff',
						fontWeight: 700,
						fontSize: 14,
						textDecoration: 'none',
					}}
				>
					Go to Your Dashboard
				</Link>
				<button
					onClick={() => window.history.back()}
					style={{
						padding: '10px 24px',
						borderRadius: 10,
						background: 'var(--surface)',
						color: 'var(--text)',
						fontWeight: 600,
						fontSize: 14,
						cursor: 'pointer',
						border: '1px solid var(--border)',
					}}
				>
					← Go Back
				</button>
			</div>
		</div>
	</div>
);

const ProtectedRoutes = ({ requireRole }) => {
	const location = useLocation();
	const { isAuthenticated, user, role, loading } = useAuth();

	// Wait for auth to hydrate to avoid redirect loops during HMR/refresh
	if (loading) return <RouteFallback />;

	// Not logged in → redirect to auth with return URL
	if (!isAuthenticated || !user) {
		return <Navigate to={`/auth?redirect=${encodeURIComponent(location.pathname)}`} replace />;
	}

	// Wrong role → show 403 with link to their correct dashboard
	if (requireRole && role !== requireRole) {
		return <Forbidden correctDashboard={getDashboardPath(role)} />;
	}

	return <Outlet />;
};

export default ProtectedRoutes;
