import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';

// Boundaries & Fallbacks
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';

// Route guard
import ProtectedRoutes from './ProtectedRoutes.jsx';

// Auth-aware redirect helper
import { useAuth } from '../hooks/useAuth.js';

// Layouts
const StudentDash = lazy(() => import('../pages/StudentDash.jsx'));
const TeacherDash = lazy(() => import('../pages/TeacherDash.jsx'));

// Public pages
const LandingPage = lazy(() => import('../pages/LandingPage.jsx'));
const AuthPage = lazy(() => import('../pages/auth.jsx'));
const ForgotPassword = lazy(() => import('../pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('../pages/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('../pages/VerifyEmail.jsx'));

// Student pages
const StudentHome = lazy(() => import('../pages/student/Home.jsx'));
const StudentExams = lazy(() => import('../pages/student/Exams.jsx'));
const StudentResults = lazy(() => import('../pages/student/result.jsx'));
const StudentIssues = lazy(() => import('../pages/student/issue.jsx'));
const StudentSettings = lazy(() => import('../pages/student/Settings.jsx'));
const StudentTakeExam = lazy(() => import('../pages/student/TakeExam.jsx'));

// Teacher pages
const TeacherHome = lazy(() => import('../pages/teacher/Home.jsx'));
const TeacherExams = lazy(() => import('../pages/teacher/Exams.jsx'));
const TeacherExamCreate = lazy(() => import('../pages/teacher/ExamCreate.jsx'));
const TeacherExamEdit = lazy(() => import('../pages/teacher/ExamEdit.jsx'));
const TeacherResults = lazy(() => import('../pages/teacher/result.jsx'));
const TeacherSubmissionGrade = lazy(() => import('../pages/teacher/SubmissionGrade.jsx'));
const TeacherIssues = lazy(() => import('../pages/teacher/issue.jsx'));
const TeacherSettings = lazy(() => import('../pages/teacher/Settings.jsx'));

// ── Helpers ───────────────────────────────────────────────────────
const withBoundary = node => <ErrorBoundary>{node}</ErrorBoundary>;

/**
 * Redirects authenticated users away from public pages (auth, landing)
 * to their role-specific dashboard.
 */
const RedirectIfAuth = ({ children }) => {
	const { isAuthenticated, role, loading } = useAuth();
	if (loading) return <RouteFallback />;
	if (isAuthenticated && role) {
		const dest = role === 'teacher' ? '/teacher' : '/student';
		return <Navigate to={dest} replace />;
	}
	return children;
};

/**
 * Redirects users who manually type the wrong role's URL
 * e.g. a teacher visiting /student → redirect to /teacher
 */
const getDashboardPath = role => (role === 'teacher' ? '/teacher' : '/student');

// ── 404 Page ──────────────────────────────────────────────────────
const NotFound = () => {
	const { isAuthenticated, role } = useAuth();
	const dashPath = isAuthenticated ? getDashboardPath(role) : '/';
	const dashLabel = isAuthenticated ? 'Back to Dashboard' : 'Back to Home';

	return (
		<div
			style={{
				minHeight: '80vh',
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
					padding: '48px 32px',
					boxShadow: '0 8px 24px rgba(15,23,42,0.08)',
					textAlign: 'center',
					maxWidth: 480,
					width: '100%',
				}}
			>
				<div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
				<h1 style={{ margin: '0 0 8px', fontSize: 28, fontWeight: 800 }}>
					404 — Page Not Found
				</h1>
				<p style={{ margin: '0 0 24px', color: 'var(--text-muted)', lineHeight: 1.6 }}>
					The page you're looking for doesn't exist or has been moved.
				</p>
				<div
					style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
				>
					<a
						href={dashPath}
						style={{
							padding: '10px 24px',
							borderRadius: 10,
							background: 'var(--primary)',
							color: '#fff',
							fontWeight: 700,
							fontSize: 14,
							textDecoration: 'none',
							border: 'none',
							cursor: 'pointer',
						}}
					>
						{dashLabel}
					</a>
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
};

// ── App Routes ────────────────────────────────────────────────────
const AppRoutes = () => (
	<Suspense fallback={<RouteFallback />}>
		<Routes>
			{/* ─── Public (redirect to dashboard if already logged in) ─── */}
			<Route
				path="/"
				element={<RedirectIfAuth>{withBoundary(<LandingPage />)}</RedirectIfAuth>}
			/>
			<Route
				path="/auth"
				element={<RedirectIfAuth>{withBoundary(<AuthPage />)}</RedirectIfAuth>}
			/>
			<Route path="/auth/forgot-password" element={withBoundary(<ForgotPassword />)} />
			<Route path="/auth/reset-password" element={withBoundary(<ResetPassword />)} />
			<Route path="/auth/verify-email" element={withBoundary(<VerifyEmail />)} />

			{/* ─── Student ─── */}
			<Route element={<ProtectedRoutes requireRole="student" />}>
				<Route path="/student" element={withBoundary(<StudentDash />)}>
					<Route index element={withBoundary(<StudentHome />)} />
					<Route path="exams" element={withBoundary(<StudentExams />)} />
					<Route path="take/:id" element={withBoundary(<StudentTakeExam />)} />
					<Route path="results" element={withBoundary(<StudentResults />)} />
					<Route path="results/view/:id" element={withBoundary(<StudentResults />)} />
					<Route path="issues" element={withBoundary(<StudentIssues />)} />
					<Route path="settings" element={withBoundary(<StudentSettings />)} />
					{/* Catch unmatched student URLs → redirect to student home */}
					<Route path="*" element={<Navigate to="/student" replace />} />
				</Route>
			</Route>

			{/* ─── Teacher ─── */}
			<Route element={<ProtectedRoutes requireRole="teacher" />}>
				<Route path="/teacher" element={withBoundary(<TeacherDash />)}>
					<Route index element={withBoundary(<TeacherHome />)} />
					<Route path="exams" element={withBoundary(<TeacherExams />)} />
					<Route path="exams/create" element={withBoundary(<TeacherExamCreate />)} />
					<Route path="exams/edit/:id" element={withBoundary(<TeacherExamEdit />)} />
					<Route path="results" element={withBoundary(<TeacherResults />)} />
					<Route path="results/:examId" element={withBoundary(<TeacherResults />)} />
					{/* Grade route: supports both /teacher/grade/:submissionId (shortcut)
					    and /teacher/results/:examId/grade/:submissionId (canonical) */}
					<Route
						path="grade/:submissionId"
						element={withBoundary(<TeacherSubmissionGrade />)}
					/>
					<Route
						path="results/:examId/grade/:submissionId"
						element={withBoundary(<TeacherSubmissionGrade />)}
					/>
					<Route path="issues" element={withBoundary(<TeacherIssues />)} />
					<Route path="settings" element={withBoundary(<TeacherSettings />)} />
					{/* Catch unmatched teacher URLs → redirect to teacher home */}
					<Route path="*" element={<Navigate to="/teacher" replace />} />
				</Route>
			</Route>

			{/* ─── Global Catch-all ─── */}
			<Route path="*" element={withBoundary(<NotFound />)} />
		</Routes>
	</Suspense>
);

export default AppRoutes;
