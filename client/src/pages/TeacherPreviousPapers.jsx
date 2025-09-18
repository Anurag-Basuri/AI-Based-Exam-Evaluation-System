import React, { useState, useEffect } from 'react';
import { getTeacherExams, getExamDetails, deleteExam } from '../services/apiServices';
import { Archive, Clock, Users, ChevronRight, Trash2, X, AlertTriangle, Key, Copy, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TeacherPreviousPapers = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [copiedCode, setCopiedCode] = useState(null);
    const [selectedExam, setSelectedExam] = useState(null);
    const [examToDelete, setExamToDelete] = useState(null);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const response = await getTeacherExams();
            setExams(response.data || []);
        } catch (err) {
            setError('Failed to load previously created exams.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExams();
    }, []);

    const handleViewDetails = async (examId) => {
        try {
            const response = await getExamDetails(examId);
            setSelectedExam(response.data);
        } catch (err) {
            setError('Could not fetch exam details.');
        }
    };

    const handleDelete = async () => {
        if (!examToDelete) return;
        try {
            await deleteExam(examToDelete._id);
            setExams(prev => prev.filter(exam => exam._id !== examToDelete._id));
            setExamToDelete(null);
        } catch (err) {
            setError('Failed to delete the exam.');
        }
    };

    const handleCopyCode = (code) => {
        const tempInput = document.createElement('input');
        tempInput.value = code;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading) return <div className="text-center p-10">Loading previous exams...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-100 p-3 rounded-xl"><Archive className="w-8 h-8 text-indigo-600" /></div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Previous Papers</h1>
                    <p className="text-gray-500">A list of all the exams you have created.</p>
                </div>
            </div>

            {exams.length === 0 ? (
                <p className="text-center text-gray-500 mt-16 bg-white p-10 rounded-xl shadow-sm">You have not created any exams yet.</p>
            ) : (
                <div className="space-y-4">
                    {exams.map(exam => (
                        <motion.div 
                            key={exam._id} 
                            layout
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-50 rounded-lg"><Users className="w-5 h-5 text-indigo-500" /></div>
                                <div>
                                    <p className="font-bold text-gray-800">{exam.title}</p>
                                    <p className="text-sm text-gray-500">{exam.department} - Year {exam.year}, Sem {exam.semester}</p>
                                </div>
                            </div>
                            <div className="w-full sm:w-auto flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                                    <Key size={16} className="text-gray-500" />
                                    <span className="font-mono font-bold text-gray-700 tracking-widest">{exam.accessCode}</span>
                                    <button onClick={() => handleCopyCode(exam.accessCode)} className="p-1 text-gray-500 hover:text-indigo-600">
                                        {copiedCode === exam.accessCode ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setExamToDelete(exam)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-full transition-colors" aria-label="Delete Exam"><Trash2 className="w-5 h-5" /></button>
                                    <button onClick={() => handleViewDetails(exam._id)} className="p-2 rounded-full bg-gray-100 hover:bg-gray-200" aria-label="View Details"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}

            <AnimatePresence>
                {selectedExam && <DetailsModal exam={selectedExam} onClose={() => setSelectedExam(null)} />}
                {examToDelete && <DeleteConfirmModal exam={examToDelete} onConfirm={handleDelete} onCancel={() => setExamToDelete(null)} />}
            </AnimatePresence>
        </div>
    );
};

const DetailsModal = ({ exam, onClose }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <header className="p-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">{exam.title}</h3>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><X size={20} /></button>
            </header>
            <main className="p-6 space-y-4 overflow-y-auto">
                {exam.questions.map((q, i) => (
                    // ✅ FIXED: Using a guaranteed unique key
                    <div key={q._id || `q-${i}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <p className="font-semibold text-gray-700">Q{i+1}: {q.text} ({q.marks} Marks)</p>
                        <p className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full inline-block my-2">{q.type}</p>
                        {q.type === 'MCQ' && (
                            <ul className="space-y-1 mt-2 text-sm">
                                {q.options.map((opt, j) => 
                                    // ✅ FIXED: Using a guaranteed unique key
                                    <li key={opt._id || `opt-${j}`} className={`${opt.isCorrect ? 'font-bold text-green-600' : 'text-gray-600'}`}>
                                        {opt.text} {opt.isCorrect && '(Correct)'}
                                    </li>
                                )}
                            </ul>
                        )}
                        {q.type === 'Subjective' && q.modelAnswer && (
                            <div className="mt-2 text-sm">
                                <p className="font-semibold text-gray-500">Model Answer:</p>
                                <p className="text-gray-600 italic">{q.modelAnswer}</p>
                            </div>
                        )}
                    </div>
                ))}
            </main>
        </motion.div>
    </motion.div>
);

const DeleteConfirmModal = ({ exam, onConfirm, onCancel }) => (
     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 text-center">
            <div className="mx-auto bg-red-100 w-12 h-12 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mt-4">Delete Exam</h3>
            <p className="text-sm text-gray-500 mt-2">Are you sure you want to delete the exam "{exam.title}"? This will also delete all associated questions. This action cannot be undone.</p>
            <div className="mt-6 flex justify-center gap-4">
                <button onClick={onCancel} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 font-semibold">Cancel</button>
                <button onClick={onConfirm} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-semibold">Delete</button>
            </div>
        </motion.div>
    </motion.div>
);

export default TeacherPreviousPapers;
