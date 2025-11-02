import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Boundaries & Fallbacks
import ErrorBoundary from '../components/ErrorBoundary.jsx';
import RouteFallback from '../components/RouteFallback.jsx';

// Route guard
import ProtectedRoutes from './ProtectedRoutes.jsx';

// Layouts
const StudentDash = lazy(() => import('../pages/StudentDash.jsx'));
const TeacherDash = lazy(() => import('../pages/TeacherDash.jsx'));

// Public pages
const LandingPage = lazy(() => import('../pages/LandingPage.jsx'));
const AuthPage = lazy(() => import('../pages/auth.jsx'));

// Student pages
const StudentHome = lazy(() => import('../pages/student/Home.jsx'));
const StudentExams = lazy(() => import('../pages/student/Exams.jsx'));
const StudentResults = lazy(() => import('../pages/student/result.jsx'));
const StudentIssues = lazy(() => import('../pages/student/issue.jsx'));
const StudentSettings = lazy(() => import('../pages/student/Settings.jsx'));
const TakeExam = lazy(() => import('../pages/student/TakeExam.jsx'));

// Teacher pages
const TeacherHome = lazy(() => import('../pages/teacher/Home.jsx'));
const TeacherExams = lazy(() => import('../pages/teacher/Exams.jsx'));
const TeacherExamCreate = lazy(() => import('../pages/teacher/ExamCreate.jsx'));
const TeacherExamEdit = lazy(() => import('../pages/teacher/ExamEdit.jsx'));
const TeacherResults = lazy(() => import('../pages/teacher/result.jsx'));
const TeacherSubmissionGrade = lazy(() => import('../pages/teacher/SubmissionGrade.jsx'));
const TeacherIssues = lazy(() => import('../pages/teacher/issue.jsx'));
const TeacherSettings = lazy(() => import('../pages/teacher/Settings.jsx'));

const withBoundary = node => <ErrorBoundary>{node}</ErrorBoundary>;

const NotFound = () => (
	<div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center', color: 'var(--text)' }}>
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
			<h1 style={{ margin: '0 0 8px' }}>404 — Not Found</h1>
			<p style={{ margin: 0, color: 'var(--text-muted)' }}>
				The page you’re looking for doesn’t exist.
			</p>
		</div>
	</div>
);

const AppRoutes = () => (
	<Suspense fallback={<RouteFallback />}>
		<Routes>
			{/* Public */}
			<Route path="/" element={withBoundary(<LandingPage />)} />
			<Route path="/auth" element={withBoundary(<AuthPage />)} />

			{/* Student */}
			<Route element={<ProtectedRoutes requireRole="student" />}>
				<Route path="/student" element={withBoundary(<StudentDash />)}>
					<Route index element={withBoundary(<StudentHome />)} />
					<Route path="exams" element={withBoundary(<StudentExams />)} />
					<Route path="results" element={withBoundary(<StudentResults />)} />
					<Route path="issues" element={withBoundary(<StudentIssues />)} />
					<Route path="settings" element={withBoundary(<StudentSettings />)} />
					{/* FIX: The path should be 'take/:submissionId' to match the navigation URL */}
					<Route path="take/:submissionId" element={withBoundary(<TakeExam />)} />
					{/* REMOVED redundant and confusing routes that pointed to the same component */}
					<Route path="*" element={<Navigate to="/student" replace />} />
				</Route>
			</Route>

			{/* Teacher */}
			<Route element={<ProtectedRoutes requireRole="teacher" />}>
				<Route path="/teacher" element={withBoundary(<TeacherDash />)}>
					<Route index element={withBoundary(<TeacherHome />)} />
					<Route path="exams" element={withBoundary(<TeacherExams />)} />
					<Route path="exams/create" element={withBoundary(<TeacherExamCreate />)} />
					<Route path="exams/edit/:id" element={withBoundary(<TeacherExamEdit />)} />
					<Route path="results/:examId?" element={withBoundary(<TeacherResults />)} />

					<Route
						path="results/:examId/grade/:submissionId"
						element={withBoundary(<TeacherSubmissionGrade />)}
					/>
					<Route path="issues" element={withBoundary(<TeacherIssues />)} />
					<Route path="settings" element={withBoundary(<TeacherSettings />)} />
					<Route path="*" element={<Navigate to="/teacher" replace />} />
				</Route>
			</Route>

			{/* Catch-all */}
			<Route path="*" element={withBoundary(<NotFound />)} />
		</Routes>
	</Suspense>
);

export default AppRoutes;
