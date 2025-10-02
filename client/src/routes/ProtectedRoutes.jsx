import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

const Forbidden = () => (
	<div style={{ minHeight: '40vh', display: 'grid', placeItems: 'center', color: 'var(--text)' }}>
		<div
			style={{
				background: 'var(--surface)',
				border: '1px solid var(--border)',
				borderRadius: 16,
				padding: 24,
				boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
				textAlign: 'center',
				maxWidth: 520,
			}}
		>
			<h1 style={{ margin: '0 0 8px' }}>403 — Forbidden</h1>
			<p style={{ margin: 0, color: 'var(--text-muted)' }}>
				You don’t have permission to access this section.
			</p>
		</div>
	</div>
);

const ProtectedRoutes = ({ requireRole }) => {
	const location = useLocation();
	const { isAuthenticated, user, role } = useAuth();

	// Not logged in
	if (!isAuthenticated || !user) {
		return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
	}
	// Role mismatch
	if (requireRole && role !== requireRole) {
		return <Forbidden />;
	}
	return <Outlet />;
};

export default ProtectedRoutes;
