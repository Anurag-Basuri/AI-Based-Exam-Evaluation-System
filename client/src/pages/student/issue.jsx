import React from 'react';
import { safeApiCall } from '../../services/apiServices.js';

const fallbackIssues = [
    {
        id: 'iss-1',
        examTitle: 'Algebra Midterm',
        issueType: 'Technical',
        description: 'Calculator froze during section 2, question 4.',
        status: 'open',
        reply: null,
        createdAt: '2025-09-22 09:45',
    },
    {
        id: 'iss-2',
        examTitle: 'Physics Quiz',
        issueType: 'Evaluation',
        description: 'Score seems low for essay question. Please recheck.',
        status: 'resolved',
        reply: 'Score adjusted to 18/20 after reevaluation.',
        createdAt: '2025-09-18 14:10',
        resolvedAt: '2025-09-19 09:20',
    },
];

const statusStyles = {
    open: { label: 'Open', color: '#b45309', bg: '#fffbeb', border: '#fcd34d' },
    pending: { label: 'Pending', color: '#4338ca', bg: '#eef2ff', border: '#c7d2fe' },
    resolved: { label: 'Resolved', color: '#047857', bg: '#ecfdf5', border: '#6ee7b7' },
};

const useIssues = () => {
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState('');
    const [issues, setIssues] = React.useState([]);

    const load = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { getStudentIssues } = await import('../../services/apiServices.js');
            let data = [];
            if (typeof getStudentIssues === 'function') {
                const res = await safeApiCall(getStudentIssues);
                data = res?.data || res || [];
            }
            if (!data.length) data = fallbackIssues;
            setIssues(data);
        } catch (e) {
            setError(e?.message || 'Failed to load issues');
            setIssues(fallbackIssues);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        load();
    }, [load]);

    return { loading, error, issues, setIssues, reload: load };
};

const StudentIssues = () => {
    const { loading, error, issues, setIssues, reload } = useIssues();
    const [showForm, setShowForm] = React.useState(false);
    const [saving, setSaving] = React.useState(false);
    const [form, setForm] = React.useState({
        exam: '',
        issueType: '',
        description: '',
    });

    const handleSubmit = async e => {
        e.preventDefault();
        if (!form.exam || !form.issueType || !form.description) return;
        setSaving(true);
        try {
            const { createStudentIssue } = await import('../../services/apiServices.js');
            if (typeof createStudentIssue === 'function') {
                await safeApiCall(createStudentIssue, form);
                await reload();
            } else {
                // Fallback optimistic add
                const optimistic = {
                    id: `temp-${Date.now()}`,
                    examTitle: form.exam,
                    issueType: form.issueType,
                    description: form.description,
                    status: 'open',
                    createdAt: new Date().toLocaleString(),
                };
                setIssues(prev => [optimistic, ...prev]);
            }
            setForm({ exam: '', issueType: '', description: '' });
            setShowForm(false);
        } catch (e) {
            alert(e?.message || 'Could not submit issue');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section>
            <header
                style={{
                    background: 'linear-gradient(135deg, rgba(249,115,22,0.18), rgba(249,115,22,0.06))',
                    padding: 18,
                    borderRadius: 16,
                    border: '1px solid rgba(249,115,22,0.2)',
                    boxShadow: '0 12px 24px rgba(15,23,42,0.08)',
                    marginBottom: 18,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 12,
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                <div>
                    <h1 style={{ margin: 0 }}>Support & Issues</h1>
                    <p style={{ margin: '6px 0 0', color: '#4b5563' }}>
                        Raise concerns about exam sessions or evaluations. We respond promptly.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(s => !s)}
                    style={{
                        padding: '10px 16px',
                        borderRadius: 12,
                        border: 'none',
                        background: '#f97316',
                        color: '#ffffff',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 10px 22px rgba(249,115,22,0.25)',
                    }}
                >
                    {showForm ? 'Close' : 'Create issue'}
                </button>
            </header>

            {showForm && (
                <form
                    onSubmit={handleSubmit}
                    style={{
                        background: '#ffffff',
                        borderRadius: 16,
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 12px 28px rgba(15,23,42,0.08)',
                        padding: 18,
                        marginBottom: 20,
                        display: 'grid',
                        gap: 14,
                    }}
                >
                    <div style={{ display: 'grid', gap: 10 }}>
                        <label style={{ fontWeight: 700, color: '#0f172a' }}>Exam</label>
                        <input
                            value={form.exam}
                            onChange={e => setForm(s => ({ ...s, exam: e.target.value }))}
                            placeholder="Exam title or ID"
                            style={{
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                            }}
                            required
                        />
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                        <label style={{ fontWeight: 700, color: '#0f172a' }}>Issue type</label>
                        <select
                            value={form.issueType}
                            onChange={e => setForm(s => ({ ...s, issueType: e.target.value }))}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                            }}
                            required
                        >
                            <option value="">Select</option>
                            <option value="Technical">Technical</option>
                            <option value="Evaluation">Evaluation</option>
                            <option value="Content">Content</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gap: 10 }}>
                        <label style={{ fontWeight: 700, color: '#0f172a' }}>Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm(s => ({ ...s, description: e.target.value }))}
                            placeholder="Describe the problem with details so we can assist quickly."
                            rows={4}
                            style={{
                                padding: '10px 12px',
                                borderRadius: 10,
                                border: '1px solid #cbd5e1',
                                outline: 'none',
                                resize: 'vertical',
                            }}
                            required
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: '1px solid #cbd5e1',
                                background: '#ffffff',
                                color: '#0f172a',
                                cursor: 'pointer',
                                fontWeight: 700,
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            style={{
                                padding: '10px 14px',
                                borderRadius: 10,
                                border: 'none',
                                background: '#f97316',
                                color: '#ffffff',
                                cursor: 'pointer',
                                fontWeight: 700,
                                boxShadow: '0 10px 20px rgba(249,115,22,0.25)',
                                opacity: saving ? 0.7 : 1,
                            }}
                        >
                            {saving ? 'Submitting…' : 'Submit issue'}
                        </button>
                    </div>
                </form>
            )}

            {loading && <div style={{ color: '#475569' }}>Loading your issues…</div>}
            {!loading && error && (
                <div style={{ color: '#b91c1c', marginBottom: 12 }}>{error}</div>
            )}
            {!loading && !issues.length && (
                <div
                    style={{
                        padding: 20,
                        borderRadius: 16,
                        border: '1px dashed #cbd5e1',
                        textAlign: 'center',
                        color: '#64748b',
                    }}
                >
                    No issues yet. Everything looks good!
                </div>
            )}

            <div style={{ display: 'grid', gap: 16 }}>
                {issues.map(issue => {
                    const chip = statusStyles[issue.status] ?? statusStyles.open;
                    return (
                        <article
                            key={issue.id}
                            style={{
                                background: '#ffffff',
                                borderRadius: 16,
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 12px 26px rgba(15,23,42,0.07)',
                                padding: 18,
                                display: 'grid',
                                gap: 12,
                            }}
                        >
                            <header style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontSize: '1.05rem' }}>{issue.examTitle}</h2>
                                    <div style={{ color: '#64748b', fontSize: 13 }}>
                                        {issue.createdAt ? `Submitted on ${issue.createdAt}` : ''}
                                    </div>
                                </div>
                                <span
                                    style={{
                                        alignSelf: 'flex-start',
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

                            <div
                                style={{
                                    background: '#f8fafc',
                                    borderRadius: 12,
                                    padding: 14,
                                    border: '1px solid #e2e8f0',
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 6, color: '#0f172a' }}>
                                    {issue.issueType} Issue
                                </div>
                                <p style={{ margin: 0, color: '#475569', lineHeight: 1.6 }}>
                                    {issue.description}
                                </p>
                            </div>

                            {issue.reply ? (
                                <div
                                    style={{
                                        background: '#ecfdf5',
                                        borderRadius: 12,
                                        padding: 14,
                                        border: '1px solid #6ee7b7',
                                        color: '#047857',
                                    }}
                                >
                                    <strong style={{ display: 'block', marginBottom: 6 }}>Teacher reply</strong>
                                    {issue.reply}
                                    {issue.resolvedAt && (
                                        <div style={{ marginTop: 6, fontSize: 12, color: '#0f766e' }}>
                                            Resolved on {issue.resolvedAt}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div style={{ color: '#a16207', fontSize: 13 }}>
                                    Awaiting teacher response.
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </section>
    );
};

export default StudentIssues;