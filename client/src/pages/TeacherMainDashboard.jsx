import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ClipboardList, Users, CheckSquare, PlusCircle, Calendar, Bell, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getDashboardStats, getRecentActivity, getTodos, addTodo, toggleTodo, deleteTodo } from '../services/apiServices';

const TeacherMainDashboard = ({ setActiveTab }) => {
    const { user } = useAuth();
    const [stats, setStats] = useState({ activeExams: 0, pendingEvaluation: 0 });
    const [activity, setActivity] = useState({ upcomingExams: [], recentSubmissions: [], newIssues: [] });
    const [todos, setTodos] = useState([]);
    const [newTodo, setNewTodo] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsData, activityData, todosData] = await Promise.all([
                    getDashboardStats(),
                    getRecentActivity(),
                    getTodos()
                ]);
                setStats(statsData.data);
                setActivity(activityData.data);
                setTodos(todosData.data);
            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            }
        };
        fetchData();
    }, []);

    const handleAddTodo = async (e) => {
        e.preventDefault();
        if (!newTodo.trim()) return;
        try {
            const response = await addTodo(newTodo);
            setTodos([response.data, ...todos]);
            setNewTodo('');
        } catch (error) {
            console.error("Failed to add todo", error);
        }
    };

    const handleToggleTodo = async (id) => {
        try {
            const response = await toggleTodo(id);
            setTodos(todos.map(todo => todo._id === id ? response.data : todo));
        } catch (error) {
            console.error("Failed to toggle todo", error);
        }
    };

    const handleDeleteTodo = async (id) => {
        try {
            await deleteTodo(id);
            setTodos(todos.filter(todo => todo._id !== id));
        } catch (error) {
            console.error("Failed to delete todo", error);
        }
    };


    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div
            className="space-y-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Welcome Header */}
            <motion.div variants={itemVariants}>
                <h2 className="text-3xl font-bold text-gray-800">Welcome back, Prof. {user?.lastName}!</h2>
                <p className="text-gray-500 mt-1">Here's a summary of your teaching activities today.</p>
            </motion.div>

            {/* Stats Cards */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard icon={ClipboardList} label="Active Exams" value={stats.activeExams} color="blue" />
                <StatCard icon={Users} label="Pending Evaluation" value={stats.pendingEvaluation} color="yellow" />
                <TodoCard
                    todos={todos}
                    newTodo={newTodo}
                    setNewTodo={setNewTodo}
                    onAddTodo={handleAddTodo}
                    onToggleTodo={handleToggleTodo}
                    onDeleteTodo={handleDeleteTodo}
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Quick Actions */}
                <motion.div variants={itemVariants} className="lg:col-span-1 space-y-6">
                     <h3 className="text-xl font-bold text-gray-700">Quick Actions</h3>
                     <div className="space-y-4">
                        <ActionCard icon={PlusCircle} title="Create New Exam" description="Design and publish a new test." onClick={() => setActiveTab('exam')} />
                        <ActionCard icon={Calendar} title="Schedule Timetable" description="Set dates for upcoming exams." onClick={() => setActiveTab('timetable')} />
                     </div>
                </motion.div>

                {/* Recent Activity */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-700 mb-4">Recent Activity</h3>
                    <div className="space-y-4">
                        {activity.newIssues.map(item => (
                            <ActivityItem key={item._id} icon={Bell} color="red" text={<><strong>{item.student.firstName} {item.student.lastName}</strong> raised a new issue: "{item.subject}"</>} time={new Date(item.createdAt).toLocaleString()} />
                        ))}
                        {activity.recentSubmissions.map(item => (
                            <ActivityItem key={item._id} icon={CheckSquare} color="green" text={<><strong>{item.student.firstName} {item.student.lastName}</strong> submitted their exam.</>} time={new Date(item.submittedAt).toLocaleString()} />
                        ))}
                        {activity.upcomingExams.map(item => (
                            <ActivityItem key={item._id} icon={Calendar} color="blue" text={<>Upcoming Exam: <strong>{item.title}</strong></>} time={new Date(item.startTime).toLocaleString()} />
                        ))}
                        {activity.newIssues.length === 0 && activity.recentSubmissions.length === 0 && activity.upcomingExams.length === 0 && (
                            <p className="text-center text-gray-500 py-8">No recent activity.</p>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

// --- Child Components ---

const StatCard = ({ icon: Icon, label, value, color }) => {
    const colorClasses = {
        blue: { bg: 'bg-blue-100', text: 'text-blue-600' },
        yellow: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    };
    return (
        <div className={`bg-white rounded-xl shadow-lg p-6 flex items-center gap-6 border border-gray-200`}>
            <div className={`p-4 rounded-full ${colorClasses[color].bg}`}>
                <Icon className={`w-8 h-8 ${colorClasses[color].text}`} />
            </div>
            <div>
                <p className="text-3xl font-bold text-gray-800">{value}</p>
                <p className="text-sm font-medium text-gray-500">{label}</p>
            </div>
        </div>
    );
};

const TodoCard = ({ todos, newTodo, setNewTodo, onAddTodo, onToggleTodo, onDeleteTodo }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h4 className="font-bold text-gray-700 mb-3">To-Do List</h4>
        <form onSubmit={onAddTodo} className="flex gap-2 mb-3">
            <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="Add a new task..."
                className="flex-grow p-2 border rounded-md text-sm"
            />
            <button type="submit" className="p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                <PlusCircle size={20} />
            </button>
        </form>
        <div className="space-y-2 max-h-24 overflow-y-auto">
            {todos.map(todo => (
                <div key={todo._id} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-md">
                    <span
                        className={`cursor-pointer ${todo.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}
                        onClick={() => onToggleTodo(todo._id)}
                    >
                        {todo.text}
                    </span>
                    <button onClick={() => onDeleteTodo(todo._id)} className="text-gray-400 hover:text-red-500">
                        <Trash2 size={16} />
                    </button>
                </div>
            ))}
        </div>
    </div>
);

const ActionCard = ({ icon: Icon, title, description, onClick }) => (
    <motion.button
        onClick={onClick}
        className="w-full bg-white rounded-xl shadow-lg p-6 text-left flex items-center gap-6 border border-gray-200 hover:border-indigo-500 hover:shadow-xl transition-all"
        whileHover={{ y: -5 }}
    >
        <div className="p-4 bg-indigo-100 text-indigo-600 rounded-full">
            <Icon className="w-8 h-8" />
        </div>
        <div>
            <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
            <p className="text-sm text-gray-500 mt-1">{description}</p>
        </div>
    </motion.button>
);

const ActivityItem = ({ icon: Icon, color, text, time }) => {
    const colorClasses = {
        red: { bg: 'bg-red-100', text: 'text-red-500' },
        green: { bg: 'bg-green-100', text: 'text-green-600' },
        blue: { bg: 'bg-blue-100', text: 'text-blue-500' },
    };
    return (
        <div className="flex items-start gap-4 p-3 rounded-lg hover:bg-gray-50">
            <div className={`p-2 ${colorClasses[color].bg} rounded-full mt-1`}>
                <Icon className={`w-5 h-5 ${colorClasses[color].text}`} />
            </div>
            <div>
                <p className="text-sm text-gray-800">{text}</p>
                <p className="text-xs text-gray-400">{time}</p>
            </div>
        </div>
    );
};

export default TeacherMainDashboard;