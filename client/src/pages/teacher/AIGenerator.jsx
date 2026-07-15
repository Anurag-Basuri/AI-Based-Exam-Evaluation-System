import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster';
import * as TeacherSvc from '../../services/teacherServices';
import AgentChat from '../../components/AgentChat';
import PageHeader from '../../components/ui/PageHeader.jsx';
import { Cpu, ArrowLeft, BookOpen, AlertTriangle, Sparkles, Clock, Hash, BarChart3, Award } from 'lucide-react';

// Question limits
const LIMITS = { total: 30, mcq: 30, subjective: 10 };

export default function AIGenerator() {
    const navigate = useNavigate();
    const { toast } = useToast();

    const [classrooms, setClassrooms] = useState([]);
    const [loadingClassrooms, setLoadingClassrooms] = useState(true);

    const [step, setStep] = useState(1); // 1: config, 2: chat
    const [config, setConfig] = useState({
        classroomId: '',
        title: 'Midterm Exam',
        topicFocus: 'Chapter 1 to 3',
        totalQuestions: 5,
        mcqCount: 3,
        difficulty: 'medium',
        duration: 60,
        marksPerMcq: 1,
        marksPerSubjective: 5,
        additionalInstructions: ''
    });

    const subjectiveCount = Math.max(0, config.totalQuestions - config.mcqCount);

    // Validation
    const getValidationErrors = () => {
        const errors = [];
        if (config.totalQuestions > LIMITS.total) errors.push(`Total questions cannot exceed ${LIMITS.total}`);
        if (config.totalQuestions < 1) errors.push('Need at least 1 question');
        if (config.mcqCount > LIMITS.mcq) errors.push(`MCQ count cannot exceed ${LIMITS.mcq}`);
        if (config.mcqCount > config.totalQuestions) errors.push('MCQ count cannot exceed total questions');
        if (config.mcqCount < 0) errors.push('MCQ count cannot be negative');
        if (subjectiveCount > LIMITS.subjective) errors.push(`Subjective questions cannot exceed ${LIMITS.subjective} (currently ${subjectiveCount})`);
        if (config.duration < 5) errors.push('Duration must be at least 5 minutes');
        if (config.duration > 240) errors.push('Duration cannot exceed 240 minutes');
        return errors;
    };

    const validationErrors = getValidationErrors();

    useEffect(() => {
        const fetchClassrooms = async () => {
            try {
                const res = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherClassrooms);
                setClassrooms(res || []);
                if (res && res.length > 0) {
                    setConfig(prev => ({ ...prev, classroomId: res[0]._id }));
                }
            } catch (error) {
                toast.error('Failed to load classrooms');
            } finally {
                setLoadingClassrooms(false);
            }
        };
        fetchClassrooms();
    }, [toast]);

    const handleStart = (e) => {
        e.preventDefault();
        if (!config.classroomId) {
            toast.error('Please select a classroom');
            return;
        }
        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return;
        }
        setStep(2);
    };

    const handleExamCreated = (exam) => {
        navigate(`/teacher/exams/edit/${exam._id}`);
    };

    const inputCls = "w-full bg-[var(--bg-secondary)] border border-[var(--border)] text-[var(--text)] rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium placeholder:text-[var(--text-muted)]/50";
    const selectCls = inputCls + " appearance-none";

    return (
        <div className="min-h-screen bg-[var(--bg)] pb-20 dash-enter">
            <PageHeader
                title={step === 1 ? "AI Exam Generator" : "Generating Exam..."}
                subtitle={step === 1 ? "Create an exam instantly using your classroom materials." : `Creating "${config.title}" with AI assistance`}
                breadcrumbs={[
                    { label: 'Home', to: '/teacher' },
                    { label: 'Exams', to: '/teacher/exams' },
                    { label: 'AI Generator' }
                ]}
                actions={[
                    <button
                        key="back"
                        onClick={() => step === 2 ? setStep(1) : navigate('/teacher/exams')}
                        className="flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm font-bold text-[var(--text)] transition-all hover:bg-[var(--bg-secondary)] active:scale-95"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {step === 2 ? 'Back to Config' : 'Back to Exams'}
                    </button>
                ]}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {step === 1 && (
                    <div className="glass-card rounded-3xl p-6 sm:p-8 border border-[var(--border)] relative overflow-hidden">
                        {/* Decorative gradient */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-500/5 via-violet-500/5 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-[var(--text)]">Configure Your Exam</h2>
                                    <p className="text-sm text-[var(--text-muted)] font-medium">Set up parameters and let AI generate questions from your materials.</p>
                                </div>
                            </div>

                            <form onSubmit={handleStart} className="space-y-6">
                                {/* Classroom Select */}
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                                        <BookOpen className="w-4 h-4 text-indigo-500" /> Classroom Context
                                    </label>
                                    <select
                                        value={config.classroomId}
                                        onChange={e => setConfig({...config, classroomId: e.target.value})}
                                        className={selectCls}
                                        disabled={loadingClassrooms}
                                    >
                                        {classrooms.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-[var(--text-muted)] font-medium">The AI will read the materials uploaded in this classroom to generate questions.</p>
                                </div>

                                {/* Title + Topic */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)]">Exam Title</label>
                                        <input
                                            type="text"
                                            value={config.title}
                                            onChange={e => setConfig({...config, title: e.target.value})}
                                            className={inputCls}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)]">Topic Focus</label>
                                        <input
                                            type="text"
                                            value={config.topicFocus}
                                            onChange={e => setConfig({...config, topicFocus: e.target.value})}
                                            className={inputCls}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Question Counts */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)] flex items-center gap-1">
                                            <Hash className="w-3.5 h-3.5" /> Total <span className="text-[var(--text-muted)] font-normal text-xs">({LIMITS.total} max)</span>
                                        </label>
                                        <input
                                            type="number" min="1" max={LIMITS.total}
                                            value={config.totalQuestions}
                                            onChange={e => {
                                                const total = Math.min(LIMITS.total, Math.max(1, Number(e.target.value) || 1));
                                                const mcq = Math.min(config.mcqCount, total);
                                                setConfig({...config, totalQuestions: total, mcqCount: mcq});
                                            }}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)]">MCQ <span className="text-[var(--text-muted)] font-normal text-xs">({LIMITS.mcq} max)</span></label>
                                        <input
                                            type="number" min="0" max={Math.min(LIMITS.mcq, config.totalQuestions)}
                                            value={config.mcqCount}
                                            onChange={e => {
                                                const mcq = Math.min(LIMITS.mcq, Math.min(config.totalQuestions, Math.max(0, Number(e.target.value) || 0)));
                                                setConfig({...config, mcqCount: mcq});
                                            }}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className={`text-sm font-bold flex items-center gap-1 ${subjectiveCount > LIMITS.subjective ? 'text-rose-500' : 'text-[var(--text)]'}`}>
                                            Subjective <span className="font-normal text-xs">({LIMITS.subjective} max)</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={subjectiveCount}
                                            readOnly
                                            className={inputCls + " opacity-60 cursor-not-allowed"}
                                            title="Computed as Total - MCQ"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)] flex items-center gap-1">
                                            <Clock className="w-3.5 h-3.5" /> Duration <span className="text-[var(--text-muted)] font-normal text-xs">(min)</span>
                                        </label>
                                        <input
                                            type="number" min="5" max="240"
                                            value={config.duration}
                                            onChange={e => setConfig({...config, duration: Number(e.target.value) || 60})}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Difficulty + Marks */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                                            <BarChart3 className="w-4 h-4" /> Difficulty
                                        </label>
                                        <select
                                            value={config.difficulty}
                                            onChange={e => setConfig({...config, difficulty: e.target.value})}
                                            className={selectCls}
                                        >
                                            <option value="easy">Easy</option>
                                            <option value="medium">Medium</option>
                                            <option value="hard">Hard</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                                            <Award className="w-4 h-4" /> Marks per MCQ
                                        </label>
                                        <input
                                            type="number" min="1" max="10"
                                            value={config.marksPerMcq}
                                            onChange={e => setConfig({...config, marksPerMcq: Number(e.target.value) || 1})}
                                            className={inputCls}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-[var(--text)] flex items-center gap-1.5">
                                            <Award className="w-4 h-4" /> Marks per Subjective
                                        </label>
                                        <input
                                            type="number" min="1" max="25"
                                            value={config.marksPerSubjective}
                                            onChange={e => setConfig({...config, marksPerSubjective: Number(e.target.value) || 5})}
                                            className={inputCls}
                                        />
                                    </div>
                                </div>

                                {/* Validation Errors */}
                                {validationErrors.length > 0 && (
                                    <div className="rounded-xl border border-rose-200 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/10 p-4 space-y-1.5">
                                        {validationErrors.map((err, i) => (
                                            <div key={i} className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm font-medium">
                                                <AlertTriangle className="w-4 h-4 shrink-0" /> {err}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={validationErrors.length > 0}
                                        className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-2 hover:scale-[1.02] active:scale-95"
                                    >
                                        <Cpu className="w-5 h-5" /> Generate Exam
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <AgentChat
                        classroomId={config.classroomId}
                        config={config}
                        onExamCreated={handleExamCreated}
                    />
                )}
            </div>
        </div>
    );
}
