import React, { useState } from 'react';
import { Plus, Trash2, ChevronLeft, ChevronRight, CheckCircle, FileText, Settings, ListPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createExamWithQuestions } from '../services/apiServices'; 

const TeacherExam = () => {
    const [step, setStep] = useState(1);
    const [examDetails, setExamDetails] = useState({
        title: '',
        department: 'Computer Science',
        year: '1',
        semester: '1',
        section: 'A',
        batch: '2024-2028',
        date: '',
        startTime: '',
        endTime: '',
        durationMinutes: 60,
    });
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleDetailChange = (e) => {
        const { name, value } = e.target;
        setExamDetails(prev => ({ ...prev, [name]: value }));
    };

    const addQuestion = () => {
        setQuestions(prev => [...prev, {
            type: 'Subjective',
            text: '',
            marks: 5,
            modelAnswer: '',
            options: [
                { text: '', isCorrect: true }, 
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false }
            ]
        }]);
    };

    const handleQuestionChange = (index, field, value) => {
        const newQuestions = [...questions];
        newQuestions[index][field] = value;
        setQuestions(newQuestions);
    };
    
    const handleOptionChange = (qIndex, oIndex, field, value) => {
        const newQuestions = [...questions];
        if (field === 'isCorrect') {
            newQuestions[qIndex].options.forEach((opt, i) => opt.isCorrect = i === oIndex);
        } else {
            newQuestions[qIndex].options[oIndex][field] = value;
        }
        setQuestions(newQuestions);
    };

    const removeQuestion = (index) => {
        setQuestions(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setError('');
        setSuccess('');
        setLoading(true);

        if (questions.length === 0) {
            setError('Please add at least one question.');
            setLoading(false);
            return;
        }
        
        const payload = {
            examDetails: {
                ...examDetails,
                description: `Exam for ${examDetails.department}, Semester ${examDetails.semester}`,
                startTime: `${examDetails.date}T${examDetails.startTime}:00`,
                endTime: `${examDetails.date}T${examDetails.endTime}:00`,
            },
            questions: questions.map(q => {
                const { options, ...rest } = q;
                if (q.type === 'MCQ') {
                    // Filter out empty options before sending
                    const nonEmptyOptions = options.slice(0, 4).filter(opt => opt.text.trim() !== '');
                    return { ...rest, options: nonEmptyOptions };
                }
                return { ...rest, options: [] };
            })
        };

        try {
            await createExamWithQuestions(payload);
            setSuccess('Exam created successfully!');
            setTimeout(() => {
                setStep(1);
                setExamDetails({ title: '', department: 'Computer Science', year: '1', semester: '1', section: 'A', batch: '2024-2028', date: '', startTime: '', endTime: '', durationMinutes: 60 });
                setQuestions([]);
                setSuccess('');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create exam.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center gap-4">
                <div className="bg-indigo-100 p-3 rounded-xl"><FileText className="w-8 h-8 text-indigo-600" /></div>
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Exam Management</h1>
                    <p className="text-gray-500">Create and configure new exams for your students.</p>
                </div>
            </div>
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div key="step1" initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 50 }}>
                            <ExamDetailsForm details={examDetails} handleChange={handleDetailChange} nextStep={() => setStep(2)} />
                        </motion.div>
                    )}
                    {step === 2 && (
                        <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                            <QuestionBuilder questions={questions} addQuestion={addQuestion} handleQuestionChange={handleQuestionChange} handleOptionChange={handleOptionChange} removeQuestion={removeQuestion} prevStep={() => setStep(1)} handleSubmit={handleSubmit} loading={loading} />
                        </motion.div>
                    )}
                </AnimatePresence>
                {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
                {success && <p className="text-green-500 text-sm mt-4 text-center">{success}</p>}
            </div>
        </div>
    );
};

const ExamDetailsForm = ({ details, handleChange, nextStep }) => (
    <div className="space-y-6">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><Settings size={20}/></div>
            <h3 className="text-xl font-bold text-gray-700">Exam Details</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField label="Exam Title" name="title" value={details.title} onChange={handleChange} required />
            <InputField label="Department" name="department" value={details.department} onChange={handleChange} as="select">
                <option>Computer Science</option><option>Information Technology</option><option>Electronics</option>
            </InputField>
            <InputField label="Year" name="year" value={details.year} onChange={handleChange} as="select">
                <option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option>
            </InputField>
            <InputField label="Semester" name="semester" value={details.semester} onChange={handleChange} as="select">
                {[...Array(8).keys()].map(i => <option key={i+1} value={i+1}>Semester {i+1}</option>)}
            </InputField>
            <InputField label="Section" name="section" value={details.section} onChange={handleChange} required />
            <InputField label="Batch" name="batch" value={details.batch} onChange={handleChange} placeholder="e.g., 2024-2028" required />
            <InputField label="Duration (Minutes)" name="durationMinutes" type="number" value={details.durationMinutes} onChange={handleChange} required />
            <InputField label="Date" name="date" type="date" value={details.date} onChange={handleChange} required />
            <div className="grid grid-cols-2 gap-4">
                <InputField label="Start Time" name="startTime" type="time" value={details.startTime} onChange={handleChange} required />
                <InputField label="End Time" name="endTime" type="time" value={details.endTime} onChange={handleChange} required />
            </div>
        </div>
        <div className="flex justify-end pt-4">
            <button onClick={nextStep} className="flex items-center gap-2 px-6 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition shadow-md">
                Add Questions <ChevronRight size={18} />
            </button>
        </div>
    </div>
);

const QuestionBuilder = ({ questions, addQuestion, handleQuestionChange, handleOptionChange, removeQuestion, prevStep, handleSubmit, loading }) => (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full"><ListPlus size={20}/></div>
                <h3 className="text-xl font-bold text-gray-700">Build Questions</h3>
            </div>
            <button onClick={addQuestion} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-100 rounded-lg hover:bg-indigo-200 transition">
                <Plus size={16} /> Add Question
            </button>
        </div>
        <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-2">
            {questions.length > 0 ? questions.map((q, i) => (
                <QuestionCard key={i} index={i} question={q} handleChange={handleQuestionChange} handleOptionChange={handleOptionChange} remove={removeQuestion} />
            )) : <p className="text-center text-gray-500 py-8">No questions added yet. Click "Add Question" to start.</p>}
        </div>
        <div className="flex justify-between pt-6 border-t">
            <button onClick={prevStep} className="flex items-center gap-2 px-6 py-2 font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition">
                <ChevronLeft size={18} /> Back to Details
            </button>
            <button onClick={handleSubmit} disabled={loading} className="flex items-center gap-2 px-6 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition shadow-md disabled:bg-gray-400">
                <CheckCircle size={18} /> {loading ? 'Creating...' : 'Create Exam'}
            </button>
        </div>
    </div>
);

const QuestionCard = ({ index, question, handleChange, handleOptionChange, remove }) => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-center">
            <p className="font-bold text-gray-600">Question {index + 1}</p>
            <button onClick={() => remove(index)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
        </div>
        <div className="grid grid-cols-3 gap-4">
            <InputField label="Type" name="type" value={question.type} onChange={(e) => handleChange(index, 'type', e.target.value)} as="select">
                <option>Subjective</option><option>MCQ</option>
            </InputField>
            <InputField label="Marks" name="marks" type="number" value={question.marks} onChange={(e) => handleChange(index, 'marks', e.target.value)} />
        </div>
        <InputField label="Question Text" name="text" value={question.text} onChange={(e) => handleChange(index, 'text', e.target.value)} as="textarea" required />
        
        {question.type === 'Subjective' && (
            <InputField 
                label="Model Answer (Optional)" 
                name="modelAnswer" 
                value={question.modelAnswer} 
                onChange={(e) => handleChange(index, 'modelAnswer', e.target.value)} 
                as="textarea" 
                placeholder="Provide an ideal answer to guide the AI, or leave blank for general evaluation." 
            />
        )}
        
        {question.type === 'MCQ' && (
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-600">Options (Select the correct one)</label>
                {question.options.slice(0, 4).map((opt, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <input type="radio" name={`correct-opt-${index}`} checked={opt.isCorrect} onChange={(e) => handleOptionChange(index, i, 'isCorrect', e.target.checked)} />
                        <input type="text" value={opt.text} onChange={(e) => handleOptionChange(index, i, 'text', e.target.value)} className="w-full p-2 border border-gray-300 rounded-md text-sm" placeholder={`Option ${i+1}`} required />
                    </div>
                ))}
            </div>
        )}
    </motion.div>
);

const InputField = ({ label, name, as = 'input', children, ...props }) => (
    <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
        {as === 'select' ? (
            <select name={name} {...props} className="w-full p-2 border border-gray-300 rounded-md bg-white focus:ring-2 focus:ring-indigo-500">
                {children}
            </select>
        ) : as === 'textarea' ? (
            <textarea name={name} {...props} rows="3" className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
        ) : (
            <input name={name} {...props} className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500" />
        )}
    </div>
);

export default TeacherExam;
