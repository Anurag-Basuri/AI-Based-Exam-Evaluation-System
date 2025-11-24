import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import Alert from '../../components/ui/Alert.jsx';
import * as StudentSvc from '../../services/studentServices.js';

const statusStyles = {
    'in-progress': { color: '#f59e0b', label: 'In Progress', icon: '🟡', bg: '#fffbeb', border: '#fcd34d' },
    started: { color: '#f59e0b', label: 'Started', icon: '🟡', bg: '#fffbeb', border: '#fcd34d' },
    submitted: { color: '#6366f1', label: 'Evaluating...', icon: '⚙️', bg: '#e0e7ff', border: '#a5b4fc' },
    evaluated: { color: '#10b981', label: 'Evaluated', icon: '✅', bg: '#d1fae5', border: '#6ee7b7' },
    published: { color: '#10b981', label: 'Published', icon: '✅', bg: '#d1fae5', border: '#6ee7b7' },
    pending: { color: '#64748b', label: 'Pending', icon: '⏳', bg: '#f1f5f9', border: '#cbd5e1' },
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
    const cfg = statusStyles[submission.status] || statusStyles.pending;
    const hasScore = submission.score != null;

    return (
        <article style={styles.card.container} className="hover-card">
            <div style={styles.card.header}>
                <div style={styles.card.iconWrapper}>
                    📝
                </div>
                <div style={{ flex: 1 }}>
                    <h3 style={styles.card.title}>{submission.examTitle}</h3>
                    <p style={styles.card.date}>
                        {new Date(submission.createdAt || Date.now()).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </p>
                </div>
                <span style={{ ...styles.card.statusBadge, background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
                    {cfg.icon} {cfg.label}
                </span>
            </div>

            <div style={styles.card.content}>
                {submission.status === 'published' && hasScore ? (
                    <div style={styles.card.scoreBox}>
                        <div style={styles.card.scoreValue}>
                            {submission.score.toFixed(1)}
                            <span style={styles.card.scoreMax}>/ {submission.maxScore ?? 0}</span>
                        </div>
                        {submission.percentage != null && (
                            <div style={{
                                ...styles.card.percentageBadge,
                                background: submission.percentage >= 70 ? '#dcfce7' : submission.percentage >= 40 ? '#fef9c3' : '#fee2e2',
                                color: submission.percentage >= 70 ? '#166534' : submission.percentage >= 40 ? '#854d0e' : '#991b1b',
                            }}>
                                {submission.percentage}%
                            </div>
                        )}
                    </div>
                ) : (
                    <p style={styles.card.remarks}>
                        {submission.remarks || (['in-progress', 'started'].includes(submission.status) 
                            ? 'Exam is currently active.' 
                            : 'Results will be available after evaluation.')}
                    </p>
                )}
            </div>

            {['in-progress', 'started'].includes(submission.status) && (
                <div style={styles.card.footer}>
                    <button
                        onClick={() => onContinue(submission)}
                        disabled={isContinuing}
                        style={{
                            ...styles.button.primary,
                            width: '100%',
                            opacity: isContinuing ? 0.7 : 1,
                        }}
                    >
                        {isContinuing ? 'Resuming...' : '▶ Continue Exam'}
                    </button>
                </div>
            )}
        </article>
    );
};

const StudentExams = () => {
    const navigate = useNavigate();
    const { success, error: toastError } = useToast();

    const CODE_LEN = 8;
    const [code, setCode] = React.useState('');
    const [searching, setSearching] = React.useState(false);
    const [starting, setStarting] = React.useState(false);
    const [found, setFound] = React.useState(null);
    const [submissions, setSubmissions] = React.useState([]);
    const [errorBanner, setErrorBanner] = React.useState('');
    const [continuingId, setContinuingId] = React.useState('');

    const loadMine = React.useCallback(async (force = false) => {
        try {
            const list = await StudentSvc.safeApiCall(StudentSvc.getMySubmissions, {}, force);
            setSubmissions(Array.isArray(list) ? list : []);
        } catch (e) {
            setErrorBanner(e?.message || 'Failed to load your submissions');
        }
    }, []);

    React.useEffect(() => {
        loadMine();
    }, [loadMine]);

    const handleSearch = async e => {
        e?.preventDefault?.();
        setErrorBanner('');
        const cleaned = (code || '').trim().toUpperCase();
        if (!cleaned || cleaned.length !== CODE_LEN) {
            setErrorBanner(`Enter a valid ${CODE_LEN}-character code`);
            return;
        }
        setSearching(true);
        setFound(null);
        try {
            const exam = await StudentSvc.safeApiCall(StudentSvc.searchExamByCode, cleaned);
            setFound(exam || null);
            if (!exam) setErrorBanner('No exam found for this code');
        } catch (e) {
            setErrorBanner(e?.message || 'Search failed');
        } finally {
            setSearching(false);
        }
    };

    const handleStart = async () => {
        if (!found?.id || starting) return;
        setStarting(true);
        setErrorBanner('');
        try {
            const submission = await StudentSvc.safeApiCall(StudentSvc.startExam, found.id);
            const submissionId = submission?.id || submission?._id;

            if (!submissionId) throw new Error('Could not start exam. Please try again.');

            success('Exam session initiated. Redirecting...');
            navigate(`/student/take/${encodeURIComponent(submissionId)}`);
        } catch (e) {
            setErrorBanner(e?.message || 'Unable to start exam');
        } finally {
            setStarting(false);
        }
    };

    const handleContinue = async sub => {
        if (continuingId) return;
        setContinuingId(sub.id);
        try {
            navigate(`/student/take/${encodeURIComponent(sub.id)}`);
        } catch (e) {
            toastError('Could not open exam.');
            setContinuingId('');
        }
    };

    return (
        <div style={styles.pageContainer}>
            <style>{`
                .hover-card { transition: transform 0.2s, box-shadow 0.2s; }
                .hover-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
            `}</style>

            <header style={styles.header.container}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <button 
                            onClick={() => navigate('/student/dashboard')}
                            style={styles.button.ghost}
                        >
                            ← Back
                        </button>
                        <h1 style={styles.header.title}>My Exams</h1>
                    </div>
                    <p style={styles.header.subtitle}>Manage your assessments and track your progress.</p>
                </div>
                <button
                    onClick={() => loadMine(true)}
                    disabled={starting}
                    style={{
                        ...styles.button.secondary,
                        opacity: starting ? 0.7 : 1,
                        cursor: starting ? 'wait' : 'pointer'
                    }}
                >
                    {starting ? '⏳ Refreshing...' : '🔄 Refresh List'}
                </button>
            </header>

            {errorBanner && (
                <div style={{ marginBottom: 24 }} className="animate-fade-in">
                    <Alert type="error" onClose={() => setErrorBanner('')}>
                        {errorBanner}
                    </Alert>
                </div>
            )}

            {/* Hero Section: Join Exam */}
            <section style={styles.hero.container} className="animate-fade-in">
                <div style={styles.hero.content}>
                    <h2 style={styles.hero.title}>Join a New Exam</h2>
                    <p style={styles.hero.subtitle}>Enter the unique 8-character code provided by your teacher.</p>
                    
                    <form onSubmit={handleSearch} style={styles.hero.form}>
                        <input
                            value={code}
                            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN))}
                            placeholder="ENTER CODE"
                            maxLength={CODE_LEN}
                            style={styles.hero.input}
                        />
                        <button
                            type="submit"
                            disabled={searching || !code}
                            style={{
                                ...styles.button.primary,
                                padding: '16px 32px',
                                fontSize: 16,
                                opacity: (searching || !code) ? 0.7 : 1
                            }}
                        >
                            {searching ? 'Searching...' : 'Find Exam'}
                        </button>
                    </form>

                    {found && (
                        <div style={styles.foundExam.container}>
                            <div style={styles.foundExam.header}>
                                <h3 style={styles.foundExam.title}>{found.title}</h3>
                                <span style={styles.foundExam.badge}>{found.duration} mins</span>
                            </div>
                            <p style={styles.foundExam.description}>{found.description || 'No description provided.'}</p>
                            <div style={styles.foundExam.actions}>
                                <button
                                    onClick={() => {
                                        setCode('');
                                        setFound(null);
                                    }}
                                    style={styles.button.ghost}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleStart}
                                    disabled={starting}
                                    style={styles.button.success}
                                >
                                    {starting ? 'Starting...' : '🚀 Start Exam'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
                <div style={styles.hero.decoration}>
                    📝
                </div>
            </section>

            {/* Previous Exams Grid */}
            <section style={{ marginTop: 40 }} className="animate-fade-in">
                <h2 style={styles.sectionTitle}>Your History</h2>
                {submissions.length === 0 ? (
                    <div style={styles.emptyState.container}>
                        <div style={styles.emptyState.icon}>📭</div>
                        <h3 style={styles.emptyState.title}>No exams taken yet</h3>
                        <p style={styles.emptyState.text}>Once you join an exam, it will appear here.</p>
                    </div>
                ) : (
                    <div style={styles.grid}>
                        {submissions.map(s => (
                            <PreviousExamCard
                                key={s.id}
                                submission={s}
                                onContinue={handleContinue}
                                isContinuing={s.id === continuingId}
                            />
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
};

const styles = {
    pageContainer: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px',
    },
    header: {
        container: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 32,
            flexWrap: 'wrap',
            gap: 16,
        },
        title: { fontSize: 32, fontWeight: 800, color: 'var(--text)', margin: 0 },
        subtitle: { fontSize: 16, color: 'var(--text-muted)', margin: '4px 0 0 0' },
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: 'var(--text)',
        marginBottom: 24,
        borderBottom: '2px solid var(--border)',
        paddingBottom: 12,
    },
    hero: {
        container: {
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
            borderRadius: 24,
            padding: 40,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white',
            boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.5)',
            position: 'relative',
            overflow: 'hidden',
        },
        content: { flex: 1, zIndex: 1, maxWidth: 600 },
        title: { fontSize: 36, fontWeight: 800, margin: '0 0 12px 0' },
        subtitle: { fontSize: 18, opacity: 0.9, margin: '0 0 32px 0', lineHeight: 1.5 },
        form: { display: 'flex', gap: 12, flexWrap: 'wrap' },
        input: {
            flex: 1,
            minWidth: 200,
            padding: '16px 24px',
            borderRadius: 12,
            border: '2px solid rgba(255,255,255,0.2)',
            background: 'rgba(255,255,255,0.1)',
            color: 'white',
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 2,
            outline: 'none',
            backdropFilter: 'blur(10px)',
            '::placeholder': { color: 'rgba(255,255,255,0.5)' }
        },
        decoration: {
            fontSize: 200,
            position: 'absolute',
            right: -40,
            bottom: -60,
            opacity: 0.1,
            transform: 'rotate(-15deg)',
            userSelect: 'none',
        },
    },
    foundExam: {
        container: {
            marginTop: 24,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 16,
            padding: 24,
            color: 'var(--text)',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        },
        header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
        title: { fontSize: 20, fontWeight: 700, margin: 0 },
        badge: { background: '#e0e7ff', color: '#4338ca', padding: '4px 12px', borderRadius: 20, fontSize: 14, fontWeight: 600 },
        description: { color: '#4b5563', margin: '0 0 20px 0', fontSize: 15 },
        actions: { display: 'flex', gap: 12, justifyContent: 'flex-end' },
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 24,
    },
    card: {
        container: {
            background: 'var(--surface)',
            borderRadius: 16,
            border: '1px solid var(--border)',
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            height: '100%',
        },
        header: { display: 'flex', gap: 16, alignItems: 'flex-start' },
        iconWrapper: {
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'var(--bg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
        },
        title: { fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 4px 0', lineHeight: 1.3 },
        date: { fontSize: 13, color: 'var(--text-muted)', margin: 0 },
        statusBadge: {
            padding: '4px 10px',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 700,
            border: '1px solid',
            whiteSpace: 'nowrap',
        },
        content: { flex: 1 },
        scoreBox: {
            background: 'var(--bg)',
            borderRadius: 12,
            padding: 16,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        scoreValue: { fontSize: 24, fontWeight: 800, color: 'var(--text)' },
        scoreMax: { fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 },
        percentageBadge: { padding: '4px 8px', borderRadius: 6, fontSize: 14, fontWeight: 700 },
        remarks: { fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic', margin: 0 },
        footer: { marginTop: 'auto' },
    },
    emptyState: {
        container: {
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--surface)',
            borderRadius: 24,
            border: '2px dashed var(--border)',
        },
        icon: { fontSize: 48, marginBottom: 16 },
        title: { fontSize: 20, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px 0' },
        text: { color: 'var(--text-muted)' },
    },
    button: {
        primary: {
            background: 'linear-gradient(135deg, #4f46e5, #3b82f6)',
            color: 'white',
            border: 'none',
            borderRadius: 12,
            padding: '12px 24px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2)',
        },
        secondary: {
            background: 'var(--surface)',
            color: 'var(--text)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '10px 20px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
        },
        success: {
            background: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 10,
            padding: '10px 24px',
            fontWeight: 700,
            cursor: 'pointer',
        },
        ghost: {
            background: 'transparent',
            color: '#6b7280',
            border: 'none',
            padding: '10px 20px',
            fontWeight: 600,
            cursor: 'pointer',
        },
    },
};

export default StudentExams;
