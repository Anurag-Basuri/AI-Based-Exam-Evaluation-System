import { Route, Routes, Navigate } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
        </Routes>
    );
};

export default AppRoutes;