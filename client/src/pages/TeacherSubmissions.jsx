import React, { useState, useEffect } from 'react';
import { getExamSubmissions } from '../services/apiServices';
import { Users, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const TeacherSubmissions = ({ exam, onViewSubmission }) => {
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSubmissions = async () => {
            if (!exam?._id) return;
            try {
                setLoading(true);
                const response = await getExamSubmissions(exam._id);
                setSubmissions(response.data || []);
            } catch (err) {
                setError('Failed to load submissions.');
            } finally {
                setLoading(false);
            }
        };
        fetchSubmissions();
    }, [exam]);

    if (loading) return <div className="text-center p-10">Loading submissions...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Submissions for "{exam.title}"</h2>
                    <p className="text-gray-500">Select a student to view and evaluate their submission.</p>
                </div>
            </div>

            {submissions.length === 0 ? (
                <p className="text-center text-gray-500 mt-16 bg-white p-10 rounded-xl shadow-sm">No students have submitted this exam yet.</p>
            ) : (
                <div className="space-y-3">
                    {submissions.map(sub => (
                        <motion.button
                            key={sub._id}
                            onClick={() => onViewSubmission(sub)}
                            className="w-full bg-white rounded-xl shadow-lg p-4 flex items-center justify-between border border-gray-200 hover:shadow-xl hover:border-indigo-500 transition-all text-left"
                            whileHover={{ y: -5 }}
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-lg"><Users className="w-5 h-5 text-indigo-500" /></div>
                                <div>
                                    <p className="font-bold text-gray-800">{sub.student.firstName} {sub.student.lastName}</p>
                                    <p className="text-sm text-gray-500">Roll No: {sub.student.rollNumber}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                                    sub.status === 'published' ? 'bg-green-100 text-green-700' :
                                    sub.status === 'evaluated' ? 'bg-blue-100 text-blue-700' :
                                    sub.status === 'submitted' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
                                }`}>{sub.status}</span>
                                <ChevronRight className="w-5 h-5 text-gray-400" />
                            </div>
                        </motion.button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeacherSubmissions;