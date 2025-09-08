import React, { useState, useEffect } from 'react';
import { getStudentResults } from '../services/apiServices';
import { Award, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const StudentResult = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    useEffect(() => {
        const fetchResults = async () => {
            try {
                const response = await getStudentResults();
                setResults(response.data || []);
            } catch (err) {
                setError('Failed to load results.');
            } finally {
                setLoading(false);
            }
        };
        fetchResults();
    }, []);

    const toggleExpand = (id) => {
        setExpandedId(prev => (prev === id ? null : id));
    };

    if (loading) return <div className="text-center p-10">Loading results...</div>;
    if (error) return <div className="text-center p-10 text-red-500">{error}</div>;

    return (
        <div>
            <div className="flex items-center gap-4 mb-8">
                <div className="bg-indigo-100 p-3 rounded-xl"><Award className="w-8 h-8 text-indigo-600" /></div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Results</h1>
                    <p className="text-gray-500">View your scores and feedback for completed exams.</p>
                </div>
            </div>

            {results.length === 0 ? (
                <p className="text-center text-gray-500 mt-16 bg-white p-10 rounded-xl shadow-sm">You have no published results yet.</p>
            ) : (
                <div className="space-y-4">
                    {results.map(result => (
                        (result && result.exam) ? (
                            <div key={result._id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                                <button onClick={() => toggleExpand(result._id)} className="w-full p-5 flex items-center justify-between text-left">
                                    <div>
                                        <p className="font-bold text-lg text-gray-800">{result.exam.title}</p>
                                        <p className="text-sm text-gray-500">
                                            Evaluated by Prof. {result.exam.createdBy?.firstName} {result.exam.createdBy?.lastName}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {/* ✅ MODIFIED: This now uses the accurate total marks from the exam object. */}
                                        <p className="font-bold text-xl text-indigo-600">{result.totalMarks} / {result.exam.totalMarks}</p>
                                        {expandedId === result._id ? <ChevronUp /> : <ChevronDown />}
                                    </div>
                                </button>

                                <AnimatePresence>
                                    {expandedId === result._id && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                                            <div className="p-6 border-t border-gray-200 bg-gray-50 space-y-4">
                                                {result.exam.questions && result.answers.map((ans, i) => {
                                                    const question = result.exam.questions.find(q => q._id === ans.question);
                                                    if (!question) return null;

                                                    return (
                                                        <div key={ans._id || i} className="bg-white p-4 rounded-lg border border-gray-200">
                                                            <p className="font-semibold text-gray-800">Q{i+1}: {question.text}</p>
                                                            
                                                            {question.type === 'MCQ' && (
                                                                <div className="text-sm mt-2 pl-4">
                                                                    <p><span className="font-semibold">Your Answer:</span> {ans.response}</p>
                                                                    <p className="text-green-600"><span className="font-semibold">Correct Answer:</span> {question.options.find(o=>o.isCorrect)?.text}</p>
                                                                </div>
                                                            )}

                                                            {question.type === 'Subjective' && (
                                                                <div className="mt-2 pl-4 space-y-3">
                                                                    <div>
                                                                        <p className="font-semibold text-gray-600">Your Answer:</p>
                                                                        <blockquote className="p-3 bg-gray-100 rounded-md border-l-4 border-gray-300 text-gray-700 italic">
                                                                            {ans.response || "Not answered"}
                                                                        </blockquote>
                                                                    </div>
                                                                    {ans.feedback && (
                                                                        <div className="mt-2 p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                                                                            <p className="font-semibold text-indigo-800 flex items-center gap-2">
                                                                                <MessageCircle size={16}/> AI Feedback:
                                                                            </p>
                                                                            <p className="text-indigo-700 mt-1">{ans.feedback}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            <p className="text-right font-bold text-gray-700 mt-2">Score: {ans.marksAwarded} / {question.marks}</p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : null
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentResult;
