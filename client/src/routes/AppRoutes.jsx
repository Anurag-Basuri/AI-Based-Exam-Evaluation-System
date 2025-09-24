import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage.jsx';
import AuthPage from '../pages/auth.jsx';
import StudentDashboard from '../pages/StudentDash.jsx';
import TeacherDashboard from '../pages/TeacherDash.jsx';
import ProtectedRoute from './ProtectedRoutes.jsx';
import StudentHome from '../pages/student/Home.jsx';
import StudentExams from '../pages/student/Exams.jsx';
import StudentSettings from '../pages/student/Settings.jsx';

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
                <Route path="settings" element={<StudentSettings />} />
            </Route>

            <Route
                path="/teacher"
                element={
                    <ProtectedRoute roles={['teacher']}>
                        <TeacherDashboard />
                    </ProtectedRoute>
                }
            />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default AppRoutes;