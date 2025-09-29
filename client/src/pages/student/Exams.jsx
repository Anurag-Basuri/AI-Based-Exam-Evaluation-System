import React from 'react';
import { safeApiCall } from '../../services/apiServices.js';

const useExams = () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [exams, setExams] = React.useState([]);

    React.useEffect(() => {
        let mounted = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                // Try API if implemented; fallback to sample data
                const { getStudentExams } = await import('../../services/apiServices.js');
                let data = [];
                if (typeof getStudentExams === 'function') {
                    const res = await safeApiCall(getStudentExams);
                    data = res?.data || res || [];
                }
                if (!data.length) {
                    data = [
                        { id: '1', title: 'Algebra Midterm', status: 'active', durationMin: 60, startAt: '2025-10-01 10:00' },
                        { id: '2', title: 'Physics Quiz', status: 'upcoming', durationMin: 30, startAt: '2025-10-05 09:00' },
                        { id: '3', title: 'History Final', status: 'completed', durationMin: 90, startAt: '2025-09-20 11:00' },
                    ];
                }
                if (mounted) setExams(data);
            } catch (e) {
                if (mounted) setError(e?.message || 'Failed to load exams');
            } finally {
                if (mounted) setLoading(false);
            }
        };
        load();
        return () => {
            mounted = false;
        };
    }, []);

    return { loading, error, exams, setExams };
};

const Exams = () => {
    const { loading, error, exams, setExams } = useExams();
    const [query, setQuery] = React.useState('');
    const [filter, setFilter] = React.useState('all'); // all | active | upcoming | completed
    const q = query.toLowerCase();

    const filtered = exams.filter(e => {
        const okFilter = filter === 'all' ? true : e.status === filter;
        const okQuery = !q || e.title.toLowerCase().includes(q);
        return okFilter && okQuery;
    });

    const handleStart = async (examId) => {
        try {
            const { startStudentSubmission } = await import('../../services/apiServices.js');
            await safeApiCall(startStudentSubmission, { examId });
            alert('Exam session started. Open the exam player to continue.');
            // Optionally update status locally
            setExams(prev => prev.map(x => (x.id === examId ? { ...x, status: 'active' } : x)));
        } catch (e) {
            alert(e?.message || 'Failed to start exam');
        }
    };

    return (
        <section>
            <h1 style={{ marginTop: 0 }}>Exams</h1>

            <div style={{ display: 'flex', gap: 10, margin: '10px 0' }}>
                <input
                    placeholder="Search exams"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    style={{
                        flex: 1,
                        border: '1px solid #cbd5e1',
                        borderRadius: 8,
                        padding: '10px 12px',
                        outline: 'none',
                    }}
                />
                <select
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    style={{ border: '1px solid #cbd5e1', borderRadius: 8, padding: '10px 12px' }}
                >
                    <option value="all">All</option>
                    <option value="active">Active</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="completed">Completed</option>
                </select>
            </div>

            {loading && <div>Loading exams…</div>}
            {!loading && error && <div style={{ color: '#ef4444' }}>{error}</div>}

            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 10 }}>
                {filtered.map(exam => (
                    <li
                        key={exam.id}
                        style={{
                            background: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: 12,
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: 8,
                            alignItems: 'center',
                        }}
                    >
                        <div>
                            <div style={{ fontWeight: 800 }}>{exam.title}</div>
                            <div style={{ color: '#64748b', fontSize: 13 }}>
                                {exam.durationMin} min • {exam.startAt}
                            </div>
                            <div style={{ marginTop: 6 }}>
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: '2px 6px',
                                        borderRadius: 999,
                                        border: '1px solid #cbd5e1',
                                        background: '#f8fafc',
                                    }}
                                >
                                    Status: {exam.status}
                                </span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            {exam.status === 'upcoming' && (
                                <button disabled style={btnMuted}>Not started</button>
                            )}
                            {exam.status === 'active' && (
                                <button style={btnPrimary} onClick={() => handleStart(exam.id)}>Continue</button>
                            )}
                            {exam.status === 'completed' && (
                                <button style={btnOutline} onClick={() => alert('Results page TBD')}>View Result</button>
                            )}
                            {exam.status === 'upcoming' && (
                                <button style={btnPrimary} onClick={() => handleStart(exam.id)}>Start</button>
                            )}
                        </div>
                    </li>
                ))}
            </ul>
        </section>
    );
};

const btnPrimary = {
    padding: '8px 10px',
    borderRadius: 8,
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    cursor: 'pointer',
    fontWeight: 700,
};
const btnOutline = {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #cbd5e1',
    background: '#fff',
    color: '#0f172a',
    cursor: 'pointer',
    fontWeight: 700,
};
const btnMuted = {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px dashed #cbd5e1',
    background: '#fff',
    color: '#64748b',
    cursor: 'not-allowed',
    fontWeight: 700,
};

export default Exams;