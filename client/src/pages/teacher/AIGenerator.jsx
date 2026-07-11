import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../components/ui/Toaster';
import * as TeacherSvc from '../../services/teacherServices';
import AgentChat from '../../components/AgentChat';
import { FiCpu, FiArrowLeft, FiBookOpen } from 'react-icons/fi';

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
        marksPerMcq: 1,
        marksPerSubjective: 5,
        additionalInstructions: ''
    });

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
        setStep(2);
    };

    const handleExamCreated = (exam) => {
        navigate(`/teacher/exams/edit/${exam._id}`);
    };

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
                            <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>Select Classroom Context <FiBookOpen className="inline" /></label>
                            <select 
                                value={config.classroomId}
                                onChange={e => setConfig({...config, classroomId: e.target.value})}
                                style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
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
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>Exam Title</label>
                                <input 
                                    type="text" 
                                    value={config.title}
                                    onChange={e => setConfig({...config, title: e.target.value})}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>Topic Focus</label>
                                <input 
                                    type="text" 
                                    value={config.topicFocus}
                                    onChange={e => setConfig({...config, topicFocus: e.target.value})}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>Total Questions</label>
                                <input 
                                    type="number" min="1" max="50"
                                    value={config.totalQuestions}
                                    onChange={e => setConfig({...config, totalQuestions: Number(e.target.value)})}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>MCQ Count</label>
                                <input 
                                    type="number" min="0" max={config.totalQuestions}
                                    value={config.mcqCount}
                                    onChange={e => setConfig({...config, mcqCount: Number(e.target.value)})}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: isDark ? '#e2e8f0' : '#334155' }}>Difficulty</label>
                                <select 
                                    value={config.difficulty}
                                    onChange={e => setConfig({...config, difficulty: e.target.value})}
                                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, background: isDark ? '#0f172a' : '#f8fafc', color: isDark ? '#f8fafc' : '#0f172a', border: isDark ? '1px solid #334155' : '1px solid #cbd5e1' }}
                                >
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                            <button 
                                type="submit" 
                                style={{ background: '#4f46e5', color: '#fff', padding: '12px 24px', borderRadius: 8, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
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
