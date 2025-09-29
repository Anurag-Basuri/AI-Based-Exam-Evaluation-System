import React from 'react';
import { safeApiCall } from '../../services/apiServices.js';

const statusMap = {
    pending: { bg: '#fff7ed', border: '#fcd34d', color: '#92400e', label: 'Pending' },
    evaluated: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', label: 'Evaluated' },
    flagged: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', label: 'Flagged' },
};

const fallbackSubmissions = [
    {
        id: 'sub-9001',
        examTitle: 'Algebra Midterm',
        studentName: 'Anurag Sharma',
        score: 82,
        maxScore: 100,
        status: 'evaluated',
        submittedAt: '2025-09-21 11:20',
    },
    {
        id: 'sub-9002',
        examTitle: 'Algebra Midterm',
        studentName: 'Priya Kumar',
        score: null,
        maxScore: 100,
        status: 'pending',
        submittedAt: '2025-09-21 11:15',
    },
    {
        id: 'sub-9101',
        examTitle: 'Physics Quiz',
        studentName: 'Maria Singh',
        score: 18,
        maxScore: 20,
        status: 'flagged',
        submittedAt: '2025-09-19 10:05',
    },
];

const useSubmissions = () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [submissions, setSubmissions] = React.useState([]);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { getTeacherSubmissions } = await import('../../services/apiServices.js');
                let data = [];
                if (typeof getTeacherSubmissions === 'function') {
                    const res = await safeApiCall(getTeacherSubmissions);
                    data = res?.data || res || [];
                }
                if (!data.length) data = fallbackSubmissions;
                if (mounted) setSubmissions(data);
            } catch (e) {
                if (mounted) {
                    setError(e?.message || 'Failed to load submissions');
                    setSubmissions(fallbackSubmissions);
                }
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, []);

    return { loading, error, submissions, setSubmissions };
};

const TeacherResults = () => {
    const { loading, error, submissions, setSubmissions } = useSubmissions();
    const [query, setQuery] = React.useState('');
    const [status, setStatus] = React.useState('all');

    const q = query.toLowerCase();
    const filtered = submissions.filter(sub => {
        const statusMatch = status === 'all' ? true : sub.status === status;
        const queryMatch =
            !q ||
            sub.examTitle.toLowerCase().includes(q) ||
            sub.studentName.toLowerCase().includes(q);
        return statusMatch && queryMatch;
    });

    const handleEvaluate = async (submission) => {
        const { id, examTitle, studentName } = submission;
        try {
            const { evaluateSubmissionTeacher } = await import('../../services/apiServices.js');
            if (typeof evaluateSubmissionTeacher === 'function') {
                await safeApiCall(evaluateSubmissionTeacher, id);
            }
            // Optimistic update
            setSubmissions(prev =>
                prev.map(item =>
                    item.id === id
                        ? { ...item, status: 'evaluated', score: item.score ?? Math.round(item.maxScore * 0.75) }
                        : item,
                ),
            );
            alert(`Auto evaluation triggered for ${studentName} (${examTitle}).`);
        } catch (e) {
            alert(e?.message || 'Failed to trigger evaluation');
        }
    };

    const handleGrade = (submission) => {
        alert(`Open grading panel for ${submission.studentName} – ${submission.examTitle}.`);
    };

    return (
        <section>
            <header
                style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.05))',
                    padding: 20,
                    borderRadius: 18,
                    border: '1px solid rgba(99,102,241,0.2)',
                    boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
                    marginBottom: 18,
                }}
            >
                <h1 style={{ margin: 0 }}>Exam Submissions</h1>
                <p style={{ margin: '8px 0 0', color: '#475569' }}>
                    Manage grading, trigger auto-evaluation, and monitor flagged submissions.
                </p>
            </header>

            <div
                style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    marginBottom: 16,
                    alignItems: 'center',
                }}
            >
                <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search by student or exam"
                        style={{
                            width: '100%',
                            padding: '10px 14px 10px 40px',
                            borderRadius: 12,
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            outline: 'none',
                        }}
                    />
                    <span
                        aria-hidden
                        style={{
                            position: 'absolute',
                            left: 12,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#94a3b8',
                        }}
                    >
                        🔎
                    </span>
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                    {['all', 'evaluated', 'pending', 'flagged'].map(st => {
                        const active = status === st;
                        return (
                            <button
                                key={st}
                                onClick={() => setStatus(st)}
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: 999,
                                    border: active ? '1px solid #6366f1' : '1px solid #cbd5e1',
                                    background: active ? '#eef2ff' : '#ffffff',
                                    color: active ? '#4338ca' : '#334155',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                }}
                            >
                                {st[0].toUpperCase() + st.slice(1)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {loading && <div style={{ color: '#475569' }}>Loading submissions…</div>}
            {!loading && error && <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>}
            {!loading && !filtered.length && (
                <div
                    style={{
                        padding: 20,
                        borderRadius: 16,
                        border: '1px dashed #cbd5e1',
                        textAlign: 'center',
                        color: '#64748b',
                    }}
                >
                    No submissions match your filters.
                </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
                {filtered.map(sub => {
                    const chip = statusMap[sub.status] ?? statusMap.pending;
                    return (
                        <article
                            key={sub.id}
                            style={{
                                background: '#ffffff',
                                borderRadius: 18,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 12px 26px rgba(15,23,42,0.07)',
                                padding: 20,
                                display: 'grid',
                                gridTemplateColumns: '1fr minmax(160px, 220px)',
                                gap: 18,
                                alignItems: 'start',
                            }}
                        >
                            <div>
                                <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                    <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{sub.examTitle}</h2>
                                    <span
                                        style={{
                                            fontSize: 12,
                                            padding: '3px 10px',
                                            borderRadius: 999,
                                            border: `1px solid ${chip.border}`,
                                            background: chip.bg,
                                            color: chip.color,
                                            fontWeight: 700,
                                        }}
                                    >
                                        {chip.label}
                                    </span>
                                </header>
                                <div style={{ color: '#475569', fontSize: 14, marginBottom: 6 }}>
                                    Student: <strong>{sub.studentName}</strong>
                                </div>
                                <div style={{ color: '#475569', fontSize: 13, marginBottom: 12 }}>
                                    Submitted at {sub.submittedAt}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                    {sub.score != null ? (
                                        <>
                                            <span style={{ fontSize: 28, fontWeight: 800, color: '#0f172a' }}>
                                                {sub.score}
                                            </span>
                                            <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>
                                                /{sub.maxScore}
                                            </span>
                                        </>
                                    ) : (
                                        <span style={{ fontSize: 16, fontWeight: 600, color: '#9a3412' }}>
                                            Pending grading
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div
                                style={{
                                    background: '#f8fafc',
                                    borderRadius: 14,
                                    padding: 16,
                                    border: '1px solid #e2e8f0',
                                    display: 'grid',
                                    gap: 10,
                                }}
                            >
                                <button
                                    onClick={() => handleGrade(sub)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: 'none',
                                        background: '#6366f1',
                                        color: '#ffffff',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                        boxShadow: '0 12px 22px rgba(99,102,241,0.25)',
                                    }}
                                >
                                    Open grading
                                </button>
                                <button
                                    onClick={() => handleEvaluate(sub)}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #cbd5e1',
                                        background: '#ffffff',
                                        color: '#4338ca',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                    }}
                                >
                                    Auto evaluate
                                </button>
                                <button
                                    onClick={() => alert('Download report coming soon')}
                                    style={{
                                        padding: '10px 12px',
                                        borderRadius: 10,
                                        border: '1px solid #e2e8f0',
                                        background: '#f1f5f9',
                                        color: '#1e293b',
                                        cursor: 'pointer',
                                        fontWeight: 700,
                                    }}
                                >
                                    Download report
                                </button>
                            </div>
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default TeacherResults;