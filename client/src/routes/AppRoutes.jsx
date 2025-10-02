import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RouteFallback from '../components/RouteFallback.jsx';
import ProtectedRoutes from './ProtectedRoutes.jsx';
import StudentDash from '../pages/StudentDash.jsx';
import TeacherDash from '../pages/TeacherDash.jsx';
import StudentHome from '../pages/student/Home.jsx';
import StudentExams from '../pages/student/Exams.jsx';
import StudentResults from '../pages/student/result.jsx';
import StudentIssues from '../pages/student/issue.jsx';
import StudentSettings from '../pages/student/Settings.jsx';
import TeacherHome from '../pages/teacher/Home.jsx';
import TeacherExams from '../pages/teacher/Exams.jsx';
import TeacherResults from '../pages/teacher/result.jsx';
import TeacherIssues from '../pages/teacher/issue.jsx';
import TeacherSettings from '../pages/teacher/Settings.jsx';
import LandingPage from '../pages/LandingPage.jsx';
import AuthPage from '../pages/auth.jsx';

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
			<Route path="/" element={<LandingPage />} />
			<Route path="/auth" element={<AuthPage />} />

			{/* Student */}
			<Route element={<ProtectedRoutes requireRole="student" />}>
				<Route path="/student" element={<StudentDash />}>
					<Route index element={<StudentHome />} />
					<Route path="exams" element={<StudentExams />} />
					<Route path="results" element={<StudentResults />} />
					<Route path="issues" element={<StudentIssues />} />
					<Route path="settings" element={<StudentSettings />} />
					<Route path="*" element={<Navigate to="/student" replace />} />
				</Route>
			</Route>

			{/* Teacher */}
			<Route element={<ProtectedRoutes requireRole="teacher" />}>
				<Route path="/teacher" element={<TeacherDash />}>
					<Route index element={<TeacherHome />} />
					<Route path="exams" element={<TeacherExams />} />
					<Route path="results" element={<TeacherResults />} />
					<Route path="issues" element={<TeacherIssues />} />
					<Route path="settings" element={<TeacherSettings />} />
					<Route path="*" element={<Navigate to="/teacher" replace />} />
				</Route>
			</Route>

			{/* Catch-all */}
			<Route path="*" element={<NotFound />} />
		</Routes>
	</Suspense>
);

export default AppRoutes;
