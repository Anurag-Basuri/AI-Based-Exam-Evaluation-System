import React, { useState } from 'react';
import { evaluateAnswerWithAI } from '../services/apiServices';
import { User, ChevronLeft, Sparkles, Check, X } from 'lucide-react';
import { motion } from 'framer-motion';

const TeacherEvaluate = ({ submission, onBack }) => {
    const [currentSubmission, setCurrentSubmission] = useState(submission);
    const [evaluating, setEvaluating] = useState(null); // Holds the ID of the question being evaluated

    // ✅ MODIFIED: The catch block now logs the detailed error to the console.
    const handleAiEvaluate = async (questionId) => {
        setEvaluating(questionId);
        try {
            const response = await evaluateAnswerWithAI(currentSubmission._id, questionId);
            setCurrentSubmission(response.data); // Update the state with the new data from the backend
        } catch (err) {
            // Log the detailed error for easier debugging
            console.error("AI Evaluation API Error:", err.response?.data?.message || err.message);
            alert(`AI evaluation failed. Reason: ${err.response?.data?.message || 'Please try again.'}`);
        } finally {
            setEvaluating(null);
        }
    };

    return (
        <div>
            <button onClick={onBack} className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-indigo-600 mb-6">
                <ChevronLeft size={18} /> Back to Submissions List
            </button>

            <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 rounded-full"><User className="w-6 h-6 text-indigo-600" /></div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{currentSubmission.student.firstName} {currentSubmission.student.lastName}</h2>
                        <p className="text-gray-500">Submission for "{currentSubmission.exam.title}"</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {currentSubmission.exam.questions.map((q, index) => {
                    const answer = currentSubmission.answers.find(a => a.question === q._id);
                    return (
                        <div key={q._id} className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
                            <p className="font-bold text-gray-700">Q{index + 1}: {q.text} ({q.marks} Marks)</p>
                            
                            {q.type === 'MCQ' && (
                                <div className="mt-4">
                                    <p className="text-sm font-semibold text-gray-500">Student's Answer:</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        {answer.response === q.options.find(o => o.isCorrect)?.text ? (
                                            <Check className="w-5 h-5 text-green-500" />
                                        ) : (
                                            <X className="w-5 h-5 text-red-500" />
                                        )}
                                        <p className="text-gray-800">{answer.response || "Not Answered"}</p>
                                    </div>
                                    <p className="text-sm text-green-600 mt-2">Correct Answer: {q.options.find(o => o.isCorrect)?.text}</p>
                                </div>
                            )}

                            {q.type === 'Subjective' && (
                                <div className="mt-4 space-y-4">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-500">Student's Answer:</p>
                                        <p className="text-gray-800 bg-gray-50 p-3 rounded-md mt-1">{answer.response || "Not Answered"}</p>
                                    </div>
                                    
                                    {answer.feedback ? (
                                        <div className="bg-indigo-50 p-4 rounded-lg border-l-4 border-indigo-500">
                                            <p className="font-semibold text-indigo-800">AI Evaluation:</p>
                                            <p className="text-sm text-indigo-700 mt-1">{answer.feedback}</p>
                                            <p className="font-bold text-lg text-indigo-800 mt-2">Score: {answer.marksAwarded} / {q.marks}</p>
                                        </div>
                                    ) : (
                                        <div className="text-right">
                                            <motion.button
                                                onClick={() => handleAiEvaluate(q._id)}
                                                disabled={evaluating === q._id}
                                                className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <Sparkles size={16} />
                                                {evaluating === q._id ? 'Evaluating...' : 'Evaluate with AI'}
                                            </motion.button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default TeacherEvaluate;