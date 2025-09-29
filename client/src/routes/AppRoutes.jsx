import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage.jsx';
import AuthPage from '../pages/auth.jsx';
import StudentDashboard from '../pages/StudentDash.jsx';
import TeacherDashboard from '../pages/TeacherDash.jsx';
import ProtectedRoute from './ProtectedRoutes.jsx';
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

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />

            {/* Protected dashboards */}
            <Route
                path="/student"
                element={
                    <ProtectedRoute roles={['student']}>
                        <StudentDashboard />
                    </ProtectedRoute>
                }
            >
                <Route index element={<StudentHome />} />
                <Route path="exams" element={<StudentExams />} />
                <Route path="results" element={<StudentResults />} />
                <Route path="issues" element={<StudentIssues />} />
                <Route path="settings" element={<StudentSettings />} />
            </Route>

            <Route
                path="/teacher"
                element={
                    <ProtectedRoute roles={['teacher']}>
                        <TeacherDashboard />
                    </ProtectedRoute>
                }
            >
                <Route index element={<TeacherHome />} />
                <Route path="exams" element={<TeacherExams />} />
                <Route path="results" element={<TeacherResults />} />
                <Route path="issues" element={<TeacherIssues />} />
                <Route path="settings" element={<TeacherSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;