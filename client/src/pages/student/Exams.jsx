import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import Alert from '../../components/ui/Alert.jsx';
import PageHeader from '../../components/ui/PageHeader.jsx';
import * as StudentSvc from '../../services/studentServices.js';
import { Search, Rocket, Play, RefreshCcw, FileText, CheckCircle, Clock } from 'lucide-react';

const statusStyles = {
    'in-progress': { colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', label: 'In Progress', icon: <Clock className="w-4 h-4" /> },
    started: { colorClass: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20', label: 'Started', icon: <Clock className="w-4 h-4" /> },
    submitted: { colorClass: 'text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20', label: 'Evaluating...', icon: <RefreshCcw className="w-4 h-4 animate-spin" /> },
    evaluated: { colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', label: 'Evaluated', icon: <CheckCircle className="w-4 h-4" /> },
    published: { colorClass: 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20', label: 'Published', icon: <CheckCircle className="w-4 h-4" /> },
    pending: { colorClass: 'text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700', label: 'Pending', icon: <Clock className="w-4 h-4" /> },
};

const PreviousExamCard = ({ submission, onContinue, isContinuing }) => {
    const cfg = statusStyles[submission.status] || statusStyles.pending;
    const hasScore = submission.score != null;

    return (
        <article className="glass-card flex flex-col h-full rounded-2xl border border-[var(--border)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-500/50 group">
            <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform text-indigo-600 dark:text-indigo-400">
                    <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-[var(--text)] leading-tight mb-1 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {submission.examTitle}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] font-medium">
                        {new Date(submission.createdAt || Date.now()).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            <div className="mb-6 flex-1">
                <div className="flex items-center gap-2 mb-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${cfg.colorClass}`}>
                        {cfg.icon} {cfg.label}
                    </span>
                </div>

                {submission.status === 'published' && hasScore ? (
                    <div className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between border border-[var(--border)]">
                        <div className="flex items-baseline gap-1">
                            <span className="text-2xl font-black text-[var(--text)]">
                                {submission.score.toFixed(1)}
                            </span>
                            <span className="text-sm font-medium text-[var(--text-muted)]">
                                / {submission.maxScore ?? 0}
                            </span>
                        </div>
                        {submission.percentage != null && (
                            <div className={`px-2.5 py-1 rounded-lg text-sm font-black border ${
                                submission.percentage >= 70 ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 
                                submission.percentage >= 40 ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20' : 
                                'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                            }`}>
                                {submission.percentage}%
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="text-sm text-[var(--text-muted)] italic">
                        {submission.remarks || (['in-progress', 'started'].includes(submission.status) 
                            ? 'Exam is currently active.' 
                            : 'Results will be available after evaluation.')}
                    </p>
                )}
            </div>

            {['in-progress', 'started'].includes(submission.status) && (
                <div className="mt-auto">
                    <button
                        onClick={() => onContinue(submission)}
                        disabled={isContinuing}
                        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-indigo-400 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
                    >
                        {isContinuing ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                        {isContinuing ? 'Resuming...' : 'Continue Exam'}
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
        <div className="min-h-screen bg-[var(--bg)] pb-20 dash-enter">
            <PageHeader
                title="My Exams"
                subtitle="Manage your assessments and track your progress."
                breadcrumbs={[
                    { label: 'Home', to: '/student' },
                    { label: 'Exams' }
                ]}
                actions={[
                    <button
                        key="refresh"
                        onClick={() => loadMine(true)}
                        disabled={starting}
                        className="flex items-center gap-2 bg-[var(--surface)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--text)] font-bold px-4 py-2.5 rounded-xl transition-all disabled:opacity-50"
                    >
                        {starting ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <RefreshCcw className="w-4 h-4" />}
                        {starting ? 'Refreshing...' : 'Refresh List'}
                    </button>
                ]}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {errorBanner && (
                    <div className="mb-6 animate-in slide-in-from-top-2 fade-in duration-300">
                        <Alert type="error" onClose={() => setErrorBanner('')}>
                            {errorBanner}
                        </Alert>
                    </div>
                )}

                {/* Hero Section: Join Exam */}
                <section className="glass-card relative overflow-hidden rounded-3xl p-8 sm:p-12 shadow-xl mb-12 border border-[var(--border)] bg-[var(--surface)] animate-in zoom-in-95 duration-500">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-blue-500/5 dark:from-indigo-500/10 dark:to-blue-500/10 z-0 pointer-events-none"></div>
                    
                    <div className="relative z-10 max-w-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                                <Rocket className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text)]">Join a New Exam</h2>
                        </div>
                        <p className="text-[var(--text-muted)] text-lg font-medium mb-8">Enter the unique 8-character code provided by your teacher.</p>
                        
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 mb-4">
                            <input
                                value={code}
                                onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, CODE_LEN))}
                                placeholder="ENTER CODE"
                                maxLength={CODE_LEN}
                                className="flex-1 bg-[var(--bg-secondary)] border-2 border-[var(--border)] text-[var(--text)] placeholder-[var(--text-muted)] text-xl font-black tracking-[0.25em] text-center sm:text-left px-6 py-4 rounded-2xl outline-none focus:border-indigo-500 dark:focus:border-indigo-400 focus:bg-[var(--surface)] transition-all"
                            />
                            <button
                                type="submit"
                                disabled={searching || !code || code.length !== CODE_LEN}
                                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-8 py-4 rounded-2xl transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                            >
                                {searching ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                                {searching ? 'Searching' : 'Find Exam'}
                            </button>
                        </form>

                        {found && (
                            <div className="mt-6 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl p-6 animate-in slide-in-from-bottom-4 fade-in duration-300">
                                <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                                    <h3 className="text-xl font-bold text-[var(--text)]">{found.title}</h3>
                                    <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider border border-indigo-200 dark:border-indigo-500/30">
                                        {found.duration} mins
                                    </span>
                                </div>
                                <p className="text-[var(--text-muted)] font-medium mb-6">{found.description || 'No description provided.'}</p>
                                <div className="flex flex-wrap gap-3 justify-end">
                                    <button
                                        onClick={() => {
                                            setCode('');
                                            setFound(null);
                                        }}
                                        className="px-6 py-2.5 rounded-xl font-bold border border-[var(--border)] text-[var(--text)] hover:bg-[var(--bg-secondary)] transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStart}
                                        disabled={starting}
                                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
                                    >
                                        {starting ? 'Starting...' : 'Join Exam'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="absolute -bottom-20 -right-20 text-[250px] opacity-10 rotate-[-15deg] pointer-events-none hidden md:block select-none">
                        📝
                    </div>
                </section>

                {/* Previous Exams Grid */}
                <section>
                    <div className="flex items-center justify-between border-b-2 border-[var(--border)] pb-4 mb-8">
                        <h2 className="text-2xl font-black text-[var(--text)]">Your History</h2>
                        <span className="bg-[var(--bg-secondary)] text-[var(--text-muted)] px-3 py-1 rounded-full text-sm font-bold">
                            {submissions.length} Total
                        </span>
                    </div>

                    {submissions.length === 0 ? (
                        <div className="glass-card rounded-3xl border-2 border-dashed border-[var(--border)] p-12 text-center flex flex-col items-center">
                            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner">
                                📭
                            </div>
                            <h3 className="text-xl font-black text-[var(--text)] mb-2">No exams taken yet</h3>
                            <p className="text-[var(--text-muted)] font-medium max-w-sm">
                                Once you join an exam using a code from your teacher, it will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
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
        </div>
    );
};

export default StudentExams;
