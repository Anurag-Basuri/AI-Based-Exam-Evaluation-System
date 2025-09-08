import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getTeacherIssues, replyToIssue } from '../services/apiServices';

export default function TeacherIssue() {
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);
    const [replyInputs, setReplyInputs] = useState({});

    const fetchIssues = async () => {
        try {
            setLoading(true);
            const response = await getTeacherIssues();
            setIssues(response.data || []);
        } catch (err) {
            setError('Failed to load issues.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIssues();
    }, []);

    const toggleDropdown = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    const handleReplyChange = (id, value) => {
        setReplyInputs(prev => ({ ...prev, [id]: value }));
    };

    const handleReplySubmit = async (id) => {
        try {
            await replyToIssue(id, replyInputs[id]);
            setExpandedId(null);
            fetchIssues(); // Refresh the list to show the "Resolved" status
        } catch (err) {
            alert('Failed to submit reply.');
        }
    };

    if (loading) return <p>Loading issues...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="w-full p-6 md:p-10">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2 mb-6">
                <AlertCircle className="text-red-500" size={28} />
                Reported Issues
            </h2>
            <div className="space-y-6">
                {issues.length > 0 ? issues.map((issue) => (
                    <div key={issue._id} className="bg-white shadow-md border border-gray-200 rounded-xl p-6">
                        <div className="flex justify-between items-start flex-wrap gap-4">
                            <div className="flex items-start gap-4">
                                <div className="bg-blue-600 text-white w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shadow">
                                    {issue.student.firstName.charAt(0)}{issue.student.lastName.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-lg font-semibold text-gray-800">{issue.student.firstName} {issue.student.lastName}</p>
                                    <p className="text-sm text-gray-500">{issue.student.rollNumber}</p>
                                    <p className="font-medium text-gray-700 mt-2">{issue.subject}</p>
                                    <p className="text-gray-600 text-sm mt-1">{issue.description}</p>
                                    <p className="text-gray-400 text-xs mt-1">Reported on: {new Date(issue.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row md:items-center gap-2">
                                <span className={`text-sm font-medium px-3 py-1 rounded-full ${issue.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{issue.status}</span>
                                {issue.status === 'Pending' && (
                                    <button className="flex items-center gap-1 text-blue-600 hover:underline text-sm" onClick={() => toggleDropdown(issue._id)}>
                                        Reply {expandedId === issue._id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                )}
                            </div>
                        </div>
                        {issue.status === 'Resolved' && (
                            <div className="mt-3 bg-green-50 text-green-700 p-3 rounded-md text-sm border-l-4 border-green-400">
                                <strong>Your Reply:</strong> {issue.reply}
                            </div>
                        )}
                        <AnimatePresence>
                            {expandedId === issue._id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                                    <div className="mt-4">
                                        <textarea rows={3} className="w-full border border-gray-300 rounded-md p-3 text-sm" placeholder="Type your reply here..." value={replyInputs[issue._id] || ''} onChange={(e) => handleReplyChange(issue._id, e.target.value)} />
                                        <div className="text-right mt-2">
                                            <button onClick={() => handleReplySubmit(issue._id)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow transition">Submit Reply</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )) : <p>No issues have been assigned to you.</p>}
            </div>
        </div>
    );
}
