import React from 'react';
import { safeApiCall } from '../../services/apiServices.js';

const statusMap = {
    pending: { bg: '#fff7ed', border: '#fcd34d', color: '#92400e', label: 'Pending' },
    evaluated: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', label: 'Evaluated' },
    flagged: { bg: '#fef2f2', border: '#fca5a5', color: '#b91c1c', label: 'Flagged' },
};

const fallbackResults = [
    {
        id: 'sub-1',
        examTitle: 'Algebra Midterm',
        score: 82,
        maxScore: 100,
        status: 'evaluated',
        evaluatedAt: '2025-09-21 11:20',
        remarks: 'Solid performance. Review quadratic inequalities.',
    },
    {
        id: 'sub-2',
        examTitle: 'Physics Quiz',
        score: null,
        maxScore: 40,
        status: 'pending',
        evaluatedAt: null,
        remarks: 'Awaiting evaluation',
    },
    {
        id: 'sub-3',
        examTitle: 'History Final',
        score: 68,
        maxScore: 100,
        status: 'flagged',
        evaluatedAt: '2025-09-19 17:05',
        remarks: 'Teacher requested clarification on essay question 2.',
    },
];

const useResults = () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [results, setResults] = React.useState([]);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const { getStudentResults } = await import('../../services/apiServices.js');
                let data = [];
                if (typeof getStudentResults === 'function') {
                    const res = await safeApiCall(getStudentResults);
                    data = res?.data || res || [];
                }
                if (!data.length) data = fallbackResults;
                if (mounted) setResults(data);
            } catch (e) {
                if (mounted) {
                    setError(e?.message || 'Failed to load results');
                    setResults(fallbackResults);
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

    return { loading, error, results, setResults };
};

const StudentResults = () => {
    const { loading, error, results } = useResults();
    const [query, setQuery] = React.useState('');
    const [status, setStatus] = React.useState('all');

    const normalized = results.map(res => {
        const map = statusMap[res.status] ?? statusMap.pending;
        return { ...res, chip: map };
    });

    const q = query.toLowerCase();
    const filtered = normalized.filter(res => {
        const matchStatus = status === 'all' ? true : res.status === status;
        const matchQuery = !q || res.examTitle.toLowerCase().includes(q);
        return matchStatus && matchQuery;
    });

    return (
        <section>
            <header
                style={{
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(99,102,241,0.05))',
                    padding: 18,
                    borderRadius: 16,
                    border: '1px solid rgba(99,102,241,0.15)',
                    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                    marginBottom: 18,
                }}
            >
                <h1 style={{ margin: 0 }}>Results & Feedback</h1>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>
                    Review your recent scores and teacher feedback. Filter by status or search by exam title.
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
                <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
                    <input
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Search exams"
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

            {loading && (
                <div style={{ color: '#475569' }}>Loading recent results…</div>
            )}
            {!loading && error && (
                <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>
            )}
            {!loading && !filtered.length && (
                <div
                    style={{
                        border: '1px dashed #cbd5e1',
                        borderRadius: 16,
                        padding: 20,
                        textAlign: 'center',
                        color: '#64748b',
                    }}
                >
                    No results match your filters.
                </div>
            )}

            <div style={{ display: 'grid', gap: 14 }}>
                {filtered.map(res => (
                    <article
                        key={res.id}
                        style={{
                            background: '#ffffff',
                            borderRadius: 16,
                            border: '1px solid #e2e8f0',
                            boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
                            padding: 18,
                            display: 'grid',
                            gridTemplateColumns: '1fr minmax(120px, 200px)',
                            gap: 16,
                        }}
                    >
                        <div>
                            <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                                <h2 style={{ margin: 0, fontSize: '1.1rem' }}>{res.examTitle}</h2>
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: '2px 10px',
                                        borderRadius: 999,
                                        border: `1px solid ${res.chip.border}`,
                                        background: res.chip.bg,
                                        color: res.chip.color,
                                        fontWeight: 700,
                                    }}
                                >
                                    {res.chip.label}
                                </span>
                            </header>
                            <div style={{ color: '#475569', marginBottom: 10 }}>
                                {res.score != null ? (
                                    <span style={{ fontSize: 24, fontWeight: 800, color: '#0f172a' }}>
                                        {res.score}
                                        <span style={{ fontSize: 16, fontWeight: 600, color: '#64748b' }}>
                                            /{res.maxScore}
                                        </span>
                                    </span>
                                ) : (
                                    <span style={{ fontSize: 16, fontWeight: 600 }}>Awaiting score</span>
                                )}
                            </div>
                            <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>{res.remarks}</p>
                        </div>

                        <div
                            style={{
                                background: '#f8fafc',
                                borderRadius: 12,
                                padding: 14,
                                border: '1px solid #e2e8f0',
                                display: 'grid',
                                gap: 6,
                                alignContent: 'start',
                            }}
                        >
                            <div style={{ fontWeight: 700, color: '#0f172a' }}>Evaluation</div>
                            <div style={{ color: '#475569', fontSize: 13 }}>
                                {res.evaluatedAt ? `Evaluated on ${res.evaluatedAt}` : 'Pending review'}
                            </div>
                            <button
                                style={{
                                    marginTop: 6,
                                    padding: '8px 10px',
                                    borderRadius: 10,
                                    border: '1px solid #cbd5e1',
                                    background: '#ffffff',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    color: '#4338ca',
                                }}
                                onClick={() => alert('Detailed view coming soon')}
                            >
                                View details
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default StudentResults;