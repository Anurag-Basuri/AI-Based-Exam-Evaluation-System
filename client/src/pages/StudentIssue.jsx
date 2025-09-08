import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, Send, Clock, Mail, ChevronDown, ChevronUp, Search, Calendar } from 'lucide-react';
import { createIssue, getStudentIssues } from '../services/apiServices';
import { motion, AnimatePresence } from 'framer-motion';

export default function StudentIssue() {
    const [activeSection, setActiveSection] = useState('form'); // 'form' or 'list'
    const [issues, setIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    
    // Form state
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    
    // Filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        const fetchIssues = async () => {
            try {
                const response = await getStudentIssues();
                setIssues(response.data || []);
            } catch (err) {
                setError('Failed to load previous issues.');
            }
        };
        fetchIssues();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            await createIssue({ subject, description, teacherEmail });
            setSuccess('Your issue has been submitted successfully!');
            setSubject('');
            setDescription('');
            setTeacherEmail('');
            // Refresh issues list and switch view
            const response = await getStudentIssues();
            setIssues(response.data);
            setActiveSection('list'); 
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit issue.');
        } finally {
            setLoading(false);
        }
    };

    const filteredIssues = useMemo(() => {
        return issues
            .filter(issue => issue.subject.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
    }, [issues, searchTerm, sortOrder]);

    const sectionVariants = {
        hidden: { opacity: 0, height: 0, y: -20 },
        visible: { opacity: 1, height: 'auto', y: 0, transition: { duration: 0.4, ease: "easeInOut" } },
        exit: { opacity: 0, height: 0, y: 20, transition: { duration: 0.3, ease: "easeInOut" } }
    };

    return (
        <section id="issue" className="space-y-6">
            {/* Accordion Header for Raising an Issue */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                    onClick={() => setActiveSection(activeSection === 'form' ? '' : 'form')}
                    className="w-full flex justify-between items-center p-6 text-left"
                >
                    <h2 className="text-2xl font-bold text-gray-800">Raise a New Issue</h2>
                    {activeSection === 'form' ? <ChevronUp className="text-indigo-600" /> : <ChevronDown className="text-gray-500" />}
                </button>
                <AnimatePresence>
                    {activeSection === 'form' && (
                        <motion.div variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="p-8 pt-0">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg">{error}</p>}
                                    {success && <p className="text-green-500 bg-green-100 p-3 rounded-lg">{success}</p>}
                                    
                                    <InputField icon={<Mail />} id="teacher-email" label="Teacher's Email" type="email" value={teacherEmail} onChange={setTeacherEmail} placeholder="e.g., teacher.name@example.com" />
                                    <InputField icon={<AlertCircle />} id="issue-subject" label="Subject" type="text" value={subject} onChange={setSubject} placeholder="e.g., Error in result scorecard" />
                                    
                                    <div>
                                        <label htmlFor="issue-description" className="block text-sm font-medium text-gray-600 mb-2">Description</label>
                                        <textarea id="issue-description" rows="5" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Please describe your issue in detail..." required></textarea>
                                    </div>
                                    <div className="flex justify-end">
                                        <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 transition-all shadow-md hover:shadow-lg">
                                            <Send className="w-5 h-5" />
                                            {loading ? 'Submitting...' : 'Submit Issue'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Accordion Header for Previous Issues */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <button
                    onClick={() => setActiveSection(activeSection === 'list' ? '' : 'list')}
                    className="w-full flex justify-between items-center p-6 text-left"
                >
                    <h2 className="text-2xl font-bold text-gray-800">Previous Issues</h2>
                    {activeSection === 'list' ? <ChevronUp className="text-indigo-600" /> : <ChevronDown className="text-gray-500" />}
                </button>
                <AnimatePresence>
                    {activeSection === 'list' && (
                        <motion.div variants={sectionVariants} initial="hidden" animate="visible" exit="exit">
                            <div className="p-8 pt-0">
                                {/* Filter Controls */}
                                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                                    <InputField icon={<Search />} id="search" label="" type="text" value={searchTerm} onChange={setSearchTerm} placeholder="Search by subject..." />
                                    <div className="flex-1">
                                        <label htmlFor="sort-date" className="sr-only">Sort by Date</label>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <select id="sort-date" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white appearance-none">
                                                <option value="desc">Newest First</option>
                                                <option value="asc">Oldest First</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-4">
                                    {filteredIssues.length > 0 ? filteredIssues.map(issue => (
                                        <div key={issue._id} className="bg-gray-50 rounded-xl border border-gray-200 p-6">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold text-lg text-gray-800">{issue.subject}</p>
                                                <span className={`flex items-center gap-2 text-sm px-3 py-1 rounded-full ${issue.status === 'Resolved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                    <Clock className="w-4 h-4" />
                                                    {issue.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500 mt-1">To: {issue.teacher.firstName} {issue.teacher.lastName} on {new Date(issue.createdAt).toLocaleDateString()}</p>
                                            <p className="mt-2 text-gray-600">{issue.description}</p>
                                            {issue.status === 'Resolved' && (
                                                <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                                                    <p className="font-semibold text-green-800">Teacher's Reply:</p>
                                                    <p className="text-gray-700">{issue.reply}</p>
                                                </div>
                                            )}
                                        </div>
                                    )) : <p className="text-center text-gray-500 py-8">No issues found matching your criteria.</p>}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </section>
    );
}

// Helper component for consistent input fields
const InputField = ({ icon, id, label, type, value, onChange, placeholder }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-gray-600 mb-2">{label}</label>}
        <div className="relative">
            <input 
                type={type} 
                id={id} 
                value={value} 
                onChange={(e) => onChange(e.target.value)} 
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500" 
                placeholder={placeholder} 
                required 
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400">
                {icon}
            </div>
        </div>
    </div>
);
