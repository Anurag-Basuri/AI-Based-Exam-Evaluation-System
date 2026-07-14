import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../components/ui/Toaster';
import * as TeacherSvc from '../../services/teacherServices';
import AgentChat from '../../components/AgentChat';
import { FiCpu, FiArrowLeft, FiBookOpen, FiAlertTriangle } from 'react-icons/fi';

// Question limits
const LIMITS = { total: 30, mcq: 30, subjective: 10 };

export default function AIGenerator() {
    const navigate = useNavigate();
    const { theme } = useTheme();
    const isDark = theme === 'dark';
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

    const inputStyle = {
        width: '100%', padding: '10px 14px', borderRadius: 8,
        background: isDark ? '#0f172a' : '#f8fafc',
        color: isDark ? '#f8fafc' : '#0f172a',
        border: isDark ? '1px solid #334155' : '1px solid #cbd5e1'
    };
    const labelStyle = { display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' };

    return (
        <div style={{ maxWidth: 1000, margin: '24px auto', padding: '0 24px', minHeight: '80vh' }}>
            <div className="flex items-center gap-4 mb-6">
                <button 
                    onClick={() => step === 2 ? setStep(1) : navigate('/teacher/exams')}
                    style={{
                        background: isDark ? '#1e293b' : '#fff',
                        border: isDark ? '1px solid #334155' : '1px solid #e2e8f0',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        padding: '8px',
                        borderRadius: '50%',
                        cursor: 'pointer'
                    }}
                >
                    <FiArrowLeft size={20} />
                </button>
                <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 24, fontWeight: 800, color: isDark ? '#f8fafc' : '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiCpu className="text-indigo-500" /> AI Exam Generator
                    </h2>
                    <p style={{ margin: 0, color: isDark ? '#94a3b8' : '#64748b', fontSize: 15 }}>
                        Create an exam instantly using your classroom materials.
                    </p>
                </div>
            </div>

            {step === 1 && (
                <div style={{ background: isDark ? '#1e293b' : '#fff', padding: 24, borderRadius: 16, border: isDark ? '1px solid #334155' : '1px solid #e2e8f0' }}>
                    <form onSubmit={handleStart} style={{ display: 'grid', gap: 20 }}>
                        <div>
                            <label style={labelStyle}>Select Classroom Context <FiBookOpen className="inline" /></label>
                            <select 
                                value={config.classroomId}
                                onChange={e => setConfig({...config, classroomId: e.target.value})}
                                style={inputStyle}
                                disabled={loadingClassrooms}
                            >
                                {classrooms.map(c => (
                                    <option key={c._id} value={c._id}>{c.name}</option>
                                ))}
                            </select>
                            <small style={{ color: '#64748b', marginTop: 4, display: 'block' }}>The AI will read the materials uploaded in this classroom to generate questions.</small>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Exam Title</label>
                                <input 
                                    type="text" 
                                    value={config.title}
                                    onChange={e => setConfig({...config, title: e.target.value})}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Topic Focus</label>
                                <input 
                                    type="text" 
                                    value={config.topicFocus}
                                    onChange={e => setConfig({...config, topicFocus: e.target.value})}
                                    style={inputStyle}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Total Questions <small style={{ fontWeight: 400, color: '#94a3b8' }}>(max {LIMITS.total})</small></label>
                                <input 
                                    type="number" min="1" max={LIMITS.total}
                                    value={config.totalQuestions}
                                    onChange={e => {
                                        const total = Math.min(LIMITS.total, Math.max(1, Number(e.target.value) || 1));
                                        const mcq = Math.min(config.mcqCount, total);
                                        setConfig({...config, totalQuestions: total, mcqCount: mcq});
                                    }}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>MCQ Count <small style={{ fontWeight: 400, color: '#94a3b8' }}>(max {LIMITS.mcq})</small></label>
                                <input 
                                    type="number" min="0" max={Math.min(LIMITS.mcq, config.totalQuestions)}
                                    value={config.mcqCount}
                                    onChange={e => {
                                        const mcq = Math.min(LIMITS.mcq, Math.min(config.totalQuestions, Math.max(0, Number(e.target.value) || 0)));
                                        setConfig({...config, mcqCount: mcq});
                                    }}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Subjective <small style={{ fontWeight: 400, color: subjectiveCount > LIMITS.subjective ? '#ef4444' : '#94a3b8' }}>(max {LIMITS.subjective})</small></label>
                                <input 
                                    type="number"
                                    value={subjectiveCount}
                                    readOnly
                                    style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed' }}
                                    title="Computed as Total - MCQ"
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Duration <small style={{ fontWeight: 400, color: '#94a3b8' }}>(minutes)</small></label>
                                <input 
                                    type="number" min="5" max="240"
                                    value={config.duration}
                                    onChange={e => setConfig({...config, duration: Number(e.target.value) || 60})}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={labelStyle}>Difficulty</label>
                                <select 
                                    value={config.difficulty}
                                    onChange={e => setConfig({...config, difficulty: e.target.value})}
                                    style={inputStyle}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Marks per MCQ</label>
                                <input 
                                    type="number" min="1" max="10"
                                    value={config.marksPerMcq}
                                    onChange={e => setConfig({...config, marksPerMcq: Number(e.target.value) || 1})}
                                    style={inputStyle}
                                />
                            </div>
                            <div>
                                <label style={labelStyle}>Marks per Subjective</label>
                                <input 
                                    type="number" min="1" max="25"
                                    value={config.marksPerSubjective}
                                    onChange={e => setConfig({...config, marksPerSubjective: Number(e.target.value) || 5})}
                                    style={inputStyle}
                                />
                            </div>
                        </div>

                        {/* Validation Errors */}
                        {validationErrors.length > 0 && (
                            <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '12px 16px' }}>
                                {validationErrors.map((err, i) => (
                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 13, fontWeight: 500, marginBottom: i < validationErrors.length - 1 ? 4 : 0 }}>
                                        <FiAlertTriangle size={14} /> {err}
                                    </div>
                                ))}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <button 
                                type="submit" 
                                disabled={validationErrors.length > 0}
                                style={{ 
                                    background: validationErrors.length > 0 ? '#94a3b8' : '#4f46e5', 
                                    color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, border: 'none', 
                                    cursor: validationErrors.length > 0 ? 'not-allowed' : 'pointer', 
                                    display: 'flex', alignItems: 'center', gap: 8 
                                }}
                            >
                                <FiCpu /> Generate Exam
                            </button>
                        </div>
                    </form>
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
    );
}
