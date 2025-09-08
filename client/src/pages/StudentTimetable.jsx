import React, { useState, useEffect } from 'react';
import { getStudentTimetable } from '../services/apiServices';
import { Book, FlaskConical, Beaker, Landmark, Calendar, Clock, User, Star } from 'lucide-react';
import { motion } from 'framer-motion';

// Helper to get a subject-specific icon and color
const getSubjectStyle = (subject) => {
    const s = subject.toLowerCase();
    if (s.includes('math')) return { icon: <Book />, color: 'blue' };
    if (s.includes('bio')) return { icon: <FlaskConical />, color: 'green' };
    if (s.includes('chem')) return { icon: <Beaker />, color: 'red' };
    if (s.includes('hist')) return { icon: <Landmark />, color: 'yellow' };
    return { icon: <Book />, color: 'indigo' };
};

// Helper function to group exams by date
const groupExamsByDate = (exams) => {
    return exams.reduce((acc, exam) => {
        const examDate = new Date(exam.date).toISOString().split('T')[0];
        if (!acc[examDate]) acc[examDate] = [];
        acc[examDate].push(exam);
        return acc;
    }, {});
};

const StudentTimetable = () => {
    const [groupedTimetable, setGroupedTimetable] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [upcomingExamId, setUpcomingExamId] = useState(null);

    useEffect(() => {
        const fetchTimetable = async () => {
            try {
                setLoading(true);
                const response = await getStudentTimetable();
                const sortedExams = response.data.sort((a, b) => new Date(a.date) - new Date(b.date));
                
                const now = new Date();
                const nextExam = sortedExams.find(exam => new Date(exam.endTime) >= now);
                setUpcomingExamId(nextExam ? nextExam._id : null);
                
                setGroupedTimetable(groupExamsByDate(sortedExams));
            } catch (err) {
                setError('Failed to load timetable. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        fetchTimetable();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
    };

    if (loading) return <div className="text-center p-10">Loading timetable...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible">
            <motion.div variants={itemVariants} className="flex items-center gap-4 mb-8">
                 <div className="bg-indigo-100 p-3 rounded-xl">
                    <Calendar className="w-8 h-8 text-indigo-600" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Exam Timetable</h1>
                    <p className="text-gray-500">Your personalized exam schedule.</p>
                </div>
            </motion.div>
            
            {Object.keys(groupedTimetable).length === 0 ? (
                <motion.div variants={itemVariants} className="text-center text-gray-500 mt-16 bg-white p-10 rounded-xl shadow-sm">
                    <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-700">All Clear!</h3>
                    <p>No exams have been scheduled for your class yet.</p>
                </motion.div>
            ) : (
                <div className="space-y-10">
                    {Object.keys(groupedTimetable).map(date => (
                        <motion.div key={date} variants={itemVariants}>
                            <h2 className="text-xl font-bold text-gray-700 mb-4 pb-2 border-b-2 border-gray-200">
                                {new Date(date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                            </h2>
                            <div className="space-y-4">
                                {groupedTimetable[date].map(entry => (
                                    <TimetableCard 
                                        key={entry._id} 
                                        entry={entry} 
                                        isUpcoming={entry._id === upcomingExamId} 
                                    />
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    );
};

const TimetableCard = ({ entry, isUpcoming }) => {
    const style = getSubjectStyle(entry.title);
    const startTime = new Date(entry.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(entry.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const colorClasses = {
        blue: { bg: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-600', iconBg: 'bg-blue-500' },
        green: { bg: 'bg-green-50', border: 'border-green-500', text: 'text-green-600', iconBg: 'bg-green-500' },
        red: { bg: 'bg-red-50', border: 'border-red-500', text: 'text-red-600', iconBg: 'bg-red-500' },
        yellow: { bg: 'bg-yellow-50', border: 'border-yellow-500', text: 'text-yellow-600', iconBg: 'bg-yellow-500' },
        indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600', iconBg: 'bg-indigo-500' },
    };

    const currentStyle = colorClasses[style.color];

    return (
        <motion.div 
            className={`bg-white rounded-xl shadow-lg border-l-4 ${currentStyle.border} flex flex-col sm:flex-row transition-all duration-300 ${isUpcoming ? 'scale-105 shadow-2xl' : 'hover:shadow-xl'}`}
            whileHover={{ y: -5 }}
        >
            <div className={`w-full sm:w-24 flex sm:flex-col items-center justify-between sm:justify-center text-center p-3 ${currentStyle.bg} rounded-t-lg sm:rounded-l-lg sm:rounded-t-none`}>
                <div className={`${currentStyle.iconBg} p-2 rounded-full text-white`}>
                    {React.cloneElement(style.icon, { size: 20 })}
                </div>
                <div className="text-right sm:text-center">
                    <p className={`text-2xl font-bold ${currentStyle.text}`}>{new Date(entry.date).getDate()}</p>
                    <p className={`font-semibold text-sm ${currentStyle.text}`}>{new Date(entry.date).toLocaleString('default', { month: 'short' })}</p>
                </div>
            </div>
            <div className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg text-gray-900">{entry.title}</h3>
                        <p className="text-gray-500 text-sm">{entry.description}</p>
                    </div>
                    {isUpcoming && (
                        <div className="flex items-center gap-2 bg-indigo-100 text-indigo-600 text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                            <Star className="w-4 h-4" />
                            <span>UPCOMING</span>
                        </div>
                    )}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center text-gray-600 text-sm">
                        <Clock className="w-4 h-4 mr-2 text-gray-400" />
                        <span>{startTime} - {endTime}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span>Prof. {entry.createdBy.firstName} {entry.createdBy.lastName}</span>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default StudentTimetable;


