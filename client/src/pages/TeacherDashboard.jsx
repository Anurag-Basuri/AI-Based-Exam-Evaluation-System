import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, LogOut, BarChart3, Home, FileText, Calendar, AlertCircle, Settings, Menu, X, Archive, CheckSquare } from 'lucide-react';
import Footer from '../components/Footer';

// Import All Page Components
import TeacherStatistics from './TeacherStatistics';
import TeacherMainDashboard from './TeacherMainDashboard';
import TeacherExam from './TeacherExam';
import TeacherTimetable from './TeacherTimetable';
import TeacherIssue from './TeacherIssue';
import TeacherProfile from './TeacherProfile';
import TeacherPreviousPapers from './TeacherPreviousPapers';
import TeacherEvaluation from './TeacherEvaluation';

// ✅ RESTORED: Sidebar now has separate buttons
const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'statistics', label: 'Statistics', icon: BarChart3 },
    { id: 'exam', label: 'Exam Management', icon: FileText },
    { id: 'previous-papers', label: 'Previous Papers', icon: Archive },
    { id: 'evaluation', label: 'Evaluation', icon: CheckSquare },
    { id: 'timetable', label: 'Timetable', icon: Calendar },
    { id: 'issue', label: 'Reported Issues', icon: AlertCircle },
    { id: 'profile', label: 'Profile', icon: Settings },
];

// ✅ RESTORED: Component map is updated
const pageComponents = {
    dashboard: TeacherMainDashboard,
    statistics: TeacherStatistics,
    exam: TeacherExam,
    'previous-papers': TeacherPreviousPapers,
    evaluation: TeacherEvaluation,
    timetable: TeacherTimetable,
    issue: TeacherIssue,
    profile: TeacherProfile,
};

export default function TeacherDashboard() {
    const { user, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
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
            className={`bg-white w-72 flex-shrink-0 flex flex-col border-r border-gray-200 transition-transform duration-300 ease-in-out z-40 
            md:sticky md:top-0 md:h-screen 
            ${isSidebarOpen ? 'translate-x-0 fixed h-full' : '-translate-x-full fixed h-full md:relative md:translate-x-0'}`}
        >
            <div className="px-6 py-5 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-indigo-600">Teacher Portal</h1>
            </div>
            <nav className="flex-grow p-4 space-y-2">
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
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                        {user?.firstName?.charAt(0) || 'T'}{user?.lastName?.charAt(0)}
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="font-semibold text-sm text-gray-800 truncate">{`${user?.firstName} ${user?.lastName}`}</p>
                        <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
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
            <div className="flex-1 flex flex-col overflow-y-auto">
                <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-30">
                    <h2 className="text-xl font-bold text-gray-800">{activeLabel}</h2>
                    <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 rounded-md hover:bg-gray-100 md:hidden">
                        {isSidebarOpen ? <X /> : <Menu />}
                    </button>
                </header>
                <main className="flex-1 p-6 md:p-8">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                           {/* Pass handleTabClick to the active component if it's the dashboard */}
                           {activeTab === 'dashboard' ? (
                                <ActiveComponent setActiveTab={handleTabClick} />
                            ) : (
                                <ActiveComponent />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
                <Footer />
            </div>
        </div>
    );
};
