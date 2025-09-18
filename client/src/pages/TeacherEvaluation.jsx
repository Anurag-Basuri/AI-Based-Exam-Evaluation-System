import React, { useState, useEffect } from 'react';
import { getTeacherExams, getExamDetails, deleteExam, publishResults } from '../services/apiServices';
import { CheckSquare, ChevronLeft, Trash2, X, AlertTriangle, ChevronRight, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TeacherSubmissions from './TeacherSubmissions';
import TeacherEvaluate from './TeacherEvaluate';

const TeacherEvaluation = () => {
    const [view, setView] = useState('list');
    const [exams, setExams] = useState([]);
    const [selectedExam, setSelectedExam] = useState(null);
    const [selectedSubmission, setSelectedSubmission] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [examToDelete, setExamToDelete] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const fetchExams = async () => {
        try {
            setLoading(true);
            const response = await getTeacherExams();
            setExams(response.data || []);
        } catch (err) {
            setError('Failed to load exams.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'list') {
            fetchExams();
        }
    }, [view, refreshKey]);

    const handlePublish = async (examId) => {
        setError('');
        setSuccess('');
        try {
            const response = await publishResults(examId);
            setSuccess(response.message || 'Results published successfully!');
            fetchExams(); // Refresh list to show updated status
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to publish results. There may be no evaluated submissions.');
        }
    };

    

    // --- Navigation Functions ---
    const handleViewSubmissions = (exam) => {
        setSelectedExam(exam);
        setView('submissions');
    };

    const handleViewEvaluation = (submission) => {
        setSelectedSubmission(submission);
        setView('evaluate');
    };

    const backToExamList = () => {
        setSelectedExam(null);
        setView('list');
        setRefreshKey(prevKey => prevKey + 1);
    };

    const backToSubmissions = () => {
        setSelectedSubmission(null);
        setView('submissions');
        setRefreshKey(prevKey => prevKey + 1);
    };

    if (loading && view === 'list') return <div className="text-center p-10">Loading Exams...</div>;

    return (
        <div>
            <AnimatePresence mode="wait">
                {view === 'list' && (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <ExamList
                            exams={exams}
                            onView={handleViewSubmissions}
                            onDelete={setExamToDelete}
                            onPublish={handlePublish}
                            error={error}
                            success={success}
                        />
                    </motion.div>
                )}
                {view === 'submissions' && selectedExam && (
                    <motion.div key="submissions" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <button onClick={backToExamList} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 mb-6">
                            <ChevronLeft size={18} /> Back to Exam List
                        </button>
                        <TeacherSubmissions key={refreshKey} exam={selectedExam} onViewSubmission={handleViewEvaluation} />
                    </motion.div>
                )}
                {view === 'evaluate' && selectedSubmission && (
                    <motion.div key="evaluate" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <TeacherEvaluate submission={selectedSubmission} onBack={backToSubmissions} />
                    </motion.div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {examToDelete && <DeleteConfirmModal exam={examToDelete} onConfirm={handleDelete} onCancel={() => setExamToDelete(null)} />}
            </AnimatePresence>
        </div>
    );
};

// Component to list the exams with the new Publish button
const ExamList = ({ exams, onView, onDelete, onPublish, error, success }) => {
    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-100 p-3 rounded-xl"><CheckSquare className="w-8 h-8 text-indigo-600" /></div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Evaluation Center</h1>
                    <p className="text-gray-500">Select an exam to view submissions, evaluate, and publish results.</p>
                </div>
            </div>
            {error && <p className="text-red-500 bg-red-100 p-3 rounded-lg mb-4">{error}</p>}
            {success && <p className="text-green-500 bg-green-100 p-3 rounded-lg mb-4">{success}</p>}

            {exams.length === 0 ? (
                <p className="text-center text-gray-500 mt-16 bg-white p-10 rounded-xl shadow-sm">You have not created any exams yet.</p>
            ) : (
                <div className="space-y-4">
                    {exams.map(exam => (
                        <div key={exam._id} className="bg-white rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-200">
                            <div className="flex-grow">
                                <p className="font-bold text-gray-800">{exam.title}</p>
                                <p className="text-sm text-gray-500">{exam.department}</p>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button onClick={() => onPublish(exam._id)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors">
                                    <Send size={16} /> Publish
                                </button>
                                <button onClick={() => onView(exam)} className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">
                                    View Submissions <ChevronRight size={16} />
                                </button>
                                
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// Modals are not included for brevity but should be kept as they are.
// ... (DetailsModal and DeleteConfirmModal)
export default TeacherEvaluation;