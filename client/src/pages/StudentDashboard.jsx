import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, Calendar, AlertCircle, BookOpen, Award, Menu, X } from 'lucide-react';
import Footer from '../components/Footer';

// Import Page Components
import StudentProfile from './StudentProfile';
import StudentTimetable from './StudentTimetable';
import StudentExam from './StudentExam';
import StudentResult from './StudentResult';
import StudentIssue from './StudentIssue';

// Configuration for sidebar items
const sidebarItems = [
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'exam', label: 'Take Exam', icon: BookOpen },
    { id: 'result', label: 'Results', icon: Award },
    { id: 'issue', label: 'Raise an Issue', icon: AlertCircle },
];

// Map IDs to components for easy rendering
const pageComponents = {
    profile: StudentProfile,
    timetable: StudentTimetable,
    exam: StudentExam,
    result: StudentResult,
    issue: StudentIssue,
};

export default function StudentDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('profile');
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const ActiveComponent = pageComponents[activeTab];
    const activeLabel = sidebarItems.find(item => item.id === activeTab)?.label || 'Dashboard';

    const handleTabClick = (tabId) => {
        setActiveTab(tabId);
        if (isSidebarOpen) {
            setSidebarOpen(false);
        }
    };

    // Sidebar Component for better organization
    const Sidebar = () => (
        <aside 
            className={`bg-white w-64 flex-shrink-0 flex flex-col border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 
            md:sticky md:top-0 md:h-screen 
            ${isSidebarOpen ? 'translate-x-0 fixed h-full' : '-translate-x-full fixed h-full md:relative md:translate-x-0'}`}
        >
            <div className="px-6 py-5 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-indigo-600">Student Portal</h1>
            </div>
            {/* ✅ EDITED: Adjusted padding and spacing for better vertical distribution */}
            <nav className="flex-grow p-4 pt-6 space-y-3">
                {sidebarItems.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleTabClick(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 font-medium text-sm 
                            ${isActive ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-gray-200">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                    <img 
                        src={user?.profilePicture || `https://i.pravatar.cc/150?u=${user?.email}`} 
                        alt="User Avatar" 
                        className="w-10 h-10 rounded-full" 
                    />
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm text-gray-800 truncate">{user?.firstName} {user?.lastName}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.rollNumber}</p>
                    </div>
                    <button 
                        onClick={logout} 
                        className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors"
                        aria-label="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </div>
            </div>
        </aside>
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <Sidebar />
            
            {/* Main Content Area with independent scrolling */}
            <div className="flex-1 flex flex-col overflow-y-auto">
                {/* Sticky Header */}
                <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
                    <h2 className="text-xl font-bold text-gray-800">{activeLabel}</h2>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 md:hidden">
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </header>

                {/* Content with Animation */}
                <main className="flex-1 p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            {React.createElement(pageComponents[activeTab])}
                        </motion.div>
                    </AnimatePresence>
                </main>

                <Footer />
            </div>
        </div>
    );
}
