import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useToast } from '../../components/ui/Toaster.jsx';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../services/api.js';
import * as TeacherSvc from '../../services/teacherServices.js';

// --- Constants & Config ---
const MOBILE_BREAKPOINT = 1024;
const ITEMS_PER_PAGE = 10;

const STATUS_CONFIG = {
    active: { label: 'Active', color: 'var(--success-text)', bg: 'var(--success-bg)', border: 'var(--success-border)', icon: '🟢', tooltip: 'Exam is currently running' },
    live: { label: 'Live Now', color: 'var(--danger-text)', bg: 'var(--danger-bg)', border: 'var(--danger-border)', icon: '🔴', tooltip: 'Students can take this exam right now' },
    scheduled: { label: 'Scheduled', color: 'var(--info-text)', bg: 'var(--info-bg)', border: 'var(--info-border)', icon: '🗓️', tooltip: 'Exam will start in the future' },
    draft: { label: 'Draft', color: 'var(--text-muted)', bg: 'var(--bg-secondary)', border: 'var(--border)', icon: '📝', tooltip: 'Only visible to you' },
    completed: { label: 'Completed', color: 'var(--primary)', bg: 'var(--primary-light-bg)', border: 'var(--primary-light)', icon: '✅', tooltip: 'Exam has ended' },
    cancelled: { label: 'Cancelled', color: 'var(--danger-text)', bg: 'var(--danger-bg)', border: 'var(--danger-border)', icon: '❌', tooltip: 'Exam was cancelled' },
};

// --- Helper Components ---

const StatCard = ({ title, value, icon, color, loading }) => (
    <div style={styles.statCard}>
        <div style={{ ...styles.statIcon, background: (color || '#000') + '20', color: color || 'var(--text)' }}>{icon}</div>
        <div>
            <div style={styles.statLabel}>{title}</div>
            <div style={styles.statValue}>
                {loading ? <span className="skeleton" style={{ width: 40, height: 24, display: 'block', borderRadius: 4 }} /> : (value ?? 0)}
            </div>
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
    return (
        <span
            title={config.tooltip}
            style={{
                ...styles.badge,
                color: config.color,
                background: config.bg,
                border: `1px solid ${config.border}`,
                cursor: 'help',
            }}
        >
            {config.icon} {config.label}
        </span>
    );
};

const ActionMenu = ({ onAction, isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <>
            <div style={styles.menuBackdrop} onClick={onClose} />
            <div style={styles.actionMenu} role="menu">
                <button type="button" onClick={() => onAction('clone')} style={styles.menuItem}>📋 Clone</button>
                <button type="button" onClick={() => onAction('rename')} style={styles.menuItem}>✏️ Rename</button>
                <button type="button" onClick={() => onAction('regenerate')} style={styles.menuItem}>🔄 New Code</button>
                <div style={styles.menuDivider} />
                <button type="button" onClick={() => onAction('delete')} style={{ ...styles.menuItem, color: 'var(--danger-text)' }}>🗑️ Delete</button>
            </div>
        </>
    );
};

const ExamRow = ({ exam, onAction, onNavigate }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const status = exam.derivedStatus || exam.status;

    const handleMenuAction = (action) => {
        onAction(action, exam);
        setMenuOpen(false);
    };

    const qCount = exam.questionCount ?? (Array.isArray(exam.questions) ? exam.questions.length : 0);
    const enrolled = (exam.enrolled ?? exam.enrolledCount ?? exam.enrolled) || 0;
    const submissions = (exam.submissions ?? exam.submissionCount ?? exam.submissions) || 0;
    const start = exam.startAt ?? exam.startTime ?? '—';

    return (
        <tr style={styles.row} onClick={() => onNavigate(exam)}>
            <td style={styles.cell}>
                <div style={styles.examTitle}>{exam.title || 'Untitled'}</div>
                <div style={styles.examMeta}>
                    {qCount} Qs • {exam.duration ?? '—'} mins
                </div>
            </td>
            <td style={styles.cell}>
                <StatusBadge status={status} />
            </td>
            <td style={styles.cell}>
                <div style={styles.codeBox}>
                    <span style={{ fontFamily: 'monospace' }}>{exam.searchId || '—'}</span>
                    {exam.searchId && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAction('copy', exam); }}
                            style={styles.copyBtn}
                            title="Copy Code"
                        >
                            📋
                        </button>
                    )}
                </div>
            </td>
            <td style={styles.cell}>
                <div style={styles.statGroup}>
                    <span title="Enrolled Students">👥 {enrolled}</span>
                    <span title="Submissions">📝 {submissions}</span>
                </div>
            </td>
            <td style={styles.cell}>
                {typeof start === 'string' ? start : new Date(start).toLocaleDateString()}
            </td>
            <td style={styles.cell} onClick={e => e.stopPropagation()}>
                <div style={styles.actions}>
                    {status === 'draft' ? (
                        <button type="button" onClick={() => onAction('publish', exam)} style={styles.btnPrimarySmall}>Publish</button>
                    ) : (
                        <button type="button" onClick={() => onNavigate(exam)} style={styles.btnSecondarySmall}>View</button>
                    )}
                    <div style={{ position: 'relative' }}>
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
                            style={styles.btnIcon}
                            aria-haspopup="true"
                            aria-expanded={menuOpen}
                        >
                            ⋮
                        </button>
                        <ActionMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onAction={handleMenuAction} />
                    </div>
                </div>
            </td>
        </tr>
    );
};

const ExamCard = ({ exam, onAction, onNavigate }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const status = exam.derivedStatus || exam.status;
    const qCount = exam.questionCount ?? (Array.isArray(exam.questions) ? exam.questions.length : 0);
    const enrolled = exam.enrolled ?? exam.enrolledCount ?? 0;
    const start = exam.startAt ?? exam.startTime ?? '—';

    return (
        <div style={styles.card} onClick={() => onNavigate(exam)}>
            <div style={styles.cardHeader}>
                <div style={styles.examTitle}>{exam.title || 'Untitled'}</div>
                <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
                    <button type="button" onClick={() => setMenuOpen(!menuOpen)} style={styles.btnIcon}>⋮</button>
                    <ActionMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onAction={(a) => { onAction(a, exam); setMenuOpen(false); }} />
                </div>
            </div>

            <div style={styles.cardStatusRow}>
                <StatusBadge status={status} />
                <div style={styles.codeBox}>
                    <span style={{ fontFamily: 'monospace' }}>{exam.searchId || '—'}</span>
                    {exam.searchId && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onAction('copy', exam); }}
                            style={styles.copyBtn}
                        >
                            📋
                        </button>
                    )}
                </div>
            </div>

            <div style={styles.cardStats}>
                <div style={styles.cardStatItem}>
                    <span style={styles.cardStatLabel}>Questions</span>
                    <span style={styles.cardStatValue}>{qCount}</span>
                </div>
                <div style={styles.cardStatItem}>
                    <span style={styles.cardStatLabel}>Duration</span>
                    <span style={styles.cardStatValue}>{exam.duration ?? '—'}m</span>
                </div>
                <div style={styles.cardStatItem}>
                    <span style={styles.cardStatLabel}>Enrolled</span>
                    <span style={styles.cardStatValue}>{enrolled}</span>
                </div>
            </div>

            <div style={styles.cardFooter}>
                <div style={styles.examMeta}>{typeof start === 'string' ? start : new Date(start).toLocaleDateString()}</div>
                {status === 'draft' ? (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAction('publish', exam); }}
                        style={styles.btnPrimarySmall}
                    >
                        Publish
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onNavigate(exam); }}
                        style={styles.btnSecondarySmall}
                    >
                        View Details
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main Page Component ---

const TeacherExams = () => {
    const [stats, setStats] = useState({ total: 0, active: 0, scheduled: 0, completed: 0 });
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalExams, setTotalExams] = useState(0);

    const navigate = useNavigate();
    const { toast } = useToast();

    // --- Effects ---

    useEffect(() => {
        const handleResize = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to page 1 on search change
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            // Load stats (fixed function name)
            const statsRes = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherDashboardStats);
            setStats(statsRes || { total: 0, active: 0, scheduled: 0, completed: 0 });

            // Load exams with a reasonable limit; backend returns paginated items
            const examsRes = await TeacherSvc.safeApiCall(TeacherSvc.getTeacherExams, {
                limit: 1000,
                q: debouncedSearch,
            });

            setExams(examsRes?.items || []);
            setTotalExams(examsRes?.total ?? (Array.isArray(examsRes?.items) ? examsRes.items.length : 0));
        } catch (err) {
            console.error('Load error:', err);
            toast.error?.('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [debouncedSearch, toast]);

    useEffect(() => {
        loadData();

        const socket = io(API_BASE_URL, {
            withCredentials: true,
            transports: ['websocket'],
        });

        const handleUpdate = () => {
            loadData();
            toast.info?.('Exam list updated');
        };

        socket.on('exam-created', handleUpdate);
        socket.on('exam-updated', handleUpdate);
        socket.on('exam-deleted', handleUpdate);

        return () => {
            socket.off('exam-created', handleUpdate);
            socket.off('exam-updated', handleUpdate);
            socket.off('exam-deleted', handleUpdate);
            socket.disconnect();
        };
    }, [loadData, toast]);

    // --- Handlers ---

    const handleAction = async (action, exam) => {
        try {
            switch (action) {
                case 'copy':
                    if (exam?.searchId) {
                        await navigator.clipboard.writeText(exam.searchId);
                        toast.success?.('Code copied to clipboard');
                    }
                    break;
                case 'delete':
                    if (!window.confirm(`Delete "${exam.title}"? This cannot be undone.`)) return;
                    await TeacherSvc.safeApiCall(TeacherSvc.deleteExam, exam.id);
                    toast.success?.('Exam deleted');
                    loadData();
                    break;
                case 'clone':
                    await TeacherSvc.safeApiCall(TeacherSvc.duplicateTeacherExam, exam.id);
                    toast.success?.('Exam cloned');
                    loadData();
                    break;
                case 'publish':
                    if (!window.confirm(`Publish "${exam.title}"?`)) return;
                    await TeacherSvc.safeApiCall(TeacherSvc.publishTeacherExam, exam.id);
                    toast.success?.('Exam published');
                    loadData();
                    break;
                case 'regenerate':
                    if (!window.confirm('Regenerate share code? Old code will stop working.')) return;
                    await TeacherSvc.safeApiCall(TeacherSvc.regenerateExamShareCode, exam.id);
                    toast.success?.('New code generated');
                    loadData();
                    break;
                case 'rename': {
                    const newName = window.prompt('Enter new name:', exam.title);
                    if (newName && newName !== exam.title) {
                        await TeacherSvc.safeApiCall(TeacherSvc.updateExam, exam.id, { title: newName });
                        toast.success?.('Exam renamed');
                        loadData();
                    }
                    break;
                }
                default:
                    break;
            }
        } catch (err) {
            console.error('Action error:', err);
            toast.error?.('Action failed');
        }
    };

    const handleNavigate = (exam) => {
        if (exam?.id) navigate(`/teacher/exams/edit/${exam.id}`);
    };

    // --- Filtering & Pagination Logic ---

    const filteredExams = useMemo(() => {
        return exams.filter(exam => {
            const status = exam.derivedStatus || exam.status || 'draft';

            let matchesFilter = true;
            if (filter === 'active') matchesFilter = status === 'active' || status === 'live';
            if (filter === 'scheduled') matchesFilter = status === 'scheduled';
            if (filter === 'draft') matchesFilter = status === 'draft';
            if (filter === 'completed') matchesFilter = status === 'completed' || status === 'cancelled';

            return matchesFilter;
        });
    }, [exams, filter]);

    const paginatedExams = useMemo(() => {
        const start = (page - 1) * ITEMS_PER_PAGE;
        return filteredExams.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredExams, page]);

    const totalPages = Math.max(1, Math.ceil(filteredExams.length / ITEMS_PER_PAGE));

    // --- Render ---

    return (
        <div style={styles.page}>
            <div style={styles.container}>

                {/* Header */}
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.title}>My Exams</h1>
                        <p style={styles.subtitle}>Manage your assessments and track performance.</p>
                    </div>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <button type="button" onClick={loadData} style={styles.btnIcon} title="Refresh Data">
                            🔄
                        </button>
                        <Link to="/teacher/exams/create" style={styles.createBtn}>
                            <span style={{ fontSize: 18 }}>+</span> Create Exam
                        </Link>
                    </div>
                </header>

                {/* Stats Dashboard */}
                <div style={styles.statsGrid}>
                    <StatCard
                        title="Total Exams"
                        value={stats.total}
                        icon="📚"
                        color="#6366f1"
                        loading={loading}
                    />
                    <StatCard
                        title="Active Now"
                        value={stats.active}
                        icon="🟢"
                        color="#22c55e"
                        loading={loading}
                    />
                    <StatCard
                        title="Scheduled"
                        value={stats.scheduled}
                        icon="🗓️"
                        color="#3b82f6"
                        loading={loading}
                    />
                    <StatCard
                        title="Completed"
                        value={stats.completed}
                        icon="✅"
                        color="#8b5cf6"
                        loading={loading}
                    />
                </div>

                {/* Controls */}
                <div style={styles.controls}>
                    <div style={styles.tabs}>
                        {['all', 'active', 'scheduled', 'draft', 'completed'].map(f => (
                            <button
                                key={f}
                                type="button"
                                onClick={() => { setFilter(f); setPage(1); }}
                                style={filter === f ? styles.tabActive : styles.tab}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </button>
                        ))}
                    </div>
                    <div style={styles.searchWrapper}>
                        <span style={styles.searchIcon}>🔍</span>
                        <input
                            type="text"
                            placeholder="Search exams..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={styles.searchInput}
                        />
                    </div>
                </div>

                {/* Content */}
                <div style={styles.contentArea}>
                    {loading && exams.length === 0 ? (
                        <div style={styles.loadingState}>
                            <div className="spinner" />
                            <p>Loading your exams...</p>
                        </div>
                    ) : filteredExams.length === 0 ? (
                        <div style={styles.emptyState}>
                            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
                            <h3>No exams found</h3>
                            <p>Try adjusting your filters or create a new exam.</p>
                        </div>
                    ) : (
                        <>
                            {!isMobile ? (
                                <div style={styles.tableWrapper}>
                                    <table style={styles.table}>
                                        <thead>
                                            <tr>
                                                <th style={styles.th}>Exam Details</th>
                                                <th style={styles.th}>Status</th>
                                                <th style={styles.th}>Code</th>
                                                <th style={styles.th}>Stats</th>
                                                <th style={styles.th}>Date</th>
                                                <th style={styles.th}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {paginatedExams.map(exam => (
                                                <ExamRow
                                                    key={exam.id || exam._id}
                                                    exam={exam}
                                                    onAction={handleAction}
                                                    onNavigate={handleNavigate}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={styles.cardGrid}>
                                    {paginatedExams.map(exam => (
                                        <ExamCard
                                            key={exam.id || exam._id}
                                            exam={exam}
                                            onAction={handleAction}
                                            onNavigate={handleNavigate}
                                        />
                                    ))}
                                </div>
                            )}

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div style={styles.pagination}>
                                    <button
                                        type="button"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1}
                                        style={styles.pageBtn}
                                    >
                                        ← Prev
                                    </button>
                                    <span style={styles.pageInfo}>
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages}
                                        style={styles.pageBtn}
                                    >
                                        Next →
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Styles ---

const styles = {
    page: {
        minHeight: '100vh',
        background: 'var(--bg-secondary)',
        padding: '24px',
    },
    container: {
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    title: {
        margin: 0,
        fontSize: 32,
        fontWeight: 800,
        color: 'var(--text)',
        letterSpacing: '-0.02em',
    },
    subtitle: {
        margin: '4px 0 0',
        color: 'var(--text-muted)',
        fontSize: 16,
    },
    createBtn: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--primary)',
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 12,
        textDecoration: 'none',
        fontWeight: 600,
        fontSize: 15,
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        transition: 'transform 0.2s',
    },
    statsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
    },
    statCard: {
        background: 'var(--surface)',
        padding: 20,
        borderRadius: 16,
        border: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        boxShadow: 'var(--shadow-sm)',
    },
    statIcon: {
        width: 48,
        height: 48,
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 24,
    },
    statLabel: {
        color: 'var(--text-muted)',
        fontSize: 13,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    statValue: {
        fontSize: 24,
        fontWeight: 800,
        color: 'var(--text)',
        lineHeight: 1.2,
    },
    controls: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    tabs: {
        display: 'flex',
        gap: 4,
        background: 'var(--surface)',
        padding: 4,
        borderRadius: 12,
        border: '1px solid var(--border)',
        overflowX: 'auto',
    },
    tab: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: 'transparent',
        color: 'var(--text-muted)',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    tabActive: {
        padding: '8px 16px',
        borderRadius: 8,
        border: 'none',
        background: 'var(--primary)',
        color: '#fff',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(59, 130, 246, 0.25)',
    },
    searchWrapper: {
        position: 'relative',
        flex: '1 1 300px',
        maxWidth: 400,
    },
    searchIcon: {
        position: 'absolute',
        left: 12,
        top: '50%',
        transform: 'translateY(-50%)',
        color: 'var(--text-muted)',
        pointerEvents: 'none',
    },
    searchInput: {
        width: '100%',
        padding: '10px 12px 10px 40px',
        borderRadius: 12,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontSize: 14,
        outline: 'none',
        transition: 'border-color 0.2s',
    },
    contentArea: {
        minHeight: 400,
    },
    tableWrapper: {
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border)',
        color: 'var(--text-muted)',
        fontSize: 12,
        fontWeight: 700,
        textTransform: 'uppercase',
        background: 'var(--bg-secondary)',
    },
    row: {
        cursor: 'pointer',
        transition: 'background 0.1s',
        borderBottom: '1px solid var(--border)',
    },
    cell: {
        padding: '16px 24px',
        verticalAlign: 'middle',
        color: 'var(--text)',
        fontSize: 14,
    },
    examTitle: {
        fontWeight: 600,
        fontSize: 15,
        marginBottom: 4,
        color: 'var(--text)',
    },
    examMeta: {
        color: 'var(--text-muted)',
        fontSize: 13,
    },
    badge: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
    },
    codeBox: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        background: 'var(--bg-secondary)',
        padding: '4px 8px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        fontSize: 13,
    },
    copyBtn: {
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        padding: 2,
        fontSize: 14,
        opacity: 0.7,
    },
    statGroup: {
        display: 'flex',
        gap: 12,
        fontSize: 13,
        color: 'var(--text-muted)',
        fontWeight: 500,
    },
    actions: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        justifyContent: 'flex-end',
    },
    btnPrimarySmall: {
        padding: '6px 12px',
        borderRadius: 6,
        border: 'none',
        background: 'var(--primary)',
        color: '#fff',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    btnSecondarySmall: {
        padding: '6px 12px',
        borderRadius: 6,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
    },
    btnIcon: {
        width: 32,
        height: 32,
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: 'var(--text-muted)',
        fontSize: 18,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.2s',
    },
    menuBackdrop: {
        position: 'fixed',
        inset: 0,
        zIndex: 40,
    },
    actionMenu: {
        position: 'absolute',
        right: 0,
        top: '100%',
        marginTop: 4,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        boxShadow: 'var(--shadow-md)',
        zIndex: 50,
        minWidth: 160,
        padding: 4,
        display: 'flex',
        flexDirection: 'column',
    },
    menuItem: {
        padding: '10px 12px',
        textAlign: 'left',
        background: 'transparent',
        border: 'none',
        color: 'var(--text)',
        fontSize: 14,
        fontWeight: 500,
        cursor: 'pointer',
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        transition: 'background 0.1s',
    },
    menuDivider: {
        height: 1,
        background: 'var(--border)',
        margin: '4px 0',
    },
    cardGrid: {
        display: 'grid',
        gap: 16,
    },
    card: {
        background: 'var(--surface)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardStatusRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardStats: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
        background: 'var(--bg)',
        padding: 12,
        borderRadius: 12,
    },
    cardStatItem: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
    },
    cardStatLabel: {
        fontSize: 11,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        fontWeight: 600,
    },
    cardStatValue: {
        fontSize: 14,
        fontWeight: 700,
        color: 'var(--text)',
    },
    cardFooter: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTop: '1px solid var(--border)',
    },
    loadingState: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 48,
        color: 'var(--text-muted)',
        gap: 16,
    },
    emptyState: {
        textAlign: 'center',
        padding: 48,
        color: 'var(--text-muted)',
    },
    pagination: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
        marginTop: 24,
    },
    pageBtn: {
        padding: '8px 16px',
        borderRadius: 8,
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        color: 'var(--text)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    pageInfo: {
        color: 'var(--text-muted)',
        fontSize: 14,
        fontWeight: 500,
    },
};

export default TeacherExams;
