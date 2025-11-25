import React from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../hooks/useAuth.js';
import { getTeacherDashboardStats } from '../../services/teacherServices.js';
import { API_BASE_URL } from '../../services/api.js';

// --- Utilities & defaults ---
const DEFAULT_DASH = {
    exams: { total: 0, live: 0, scheduled: 0, draft: 0, totalEnrolled: 0 },
    issues: { open: 0 },
    submissions: { pending: 0 },
    examsToReview: [],
    recentSubmissions: [],
    teacher: null,
};

const formatDate = v => {
    if (!v) return '—';
    try {
        const d = new Date(v);
        if (Number.isNaN(d.getTime())) return String(v);
        return d.toLocaleString();
    } catch {
        return String(v);
    }
};

// --- Small reusable UI pieces with improved visuals ---
const IconMini = ({ children }) => (
    <div style={{ width: 44, height: 44, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.04)' }}>
        {children}
    </div>
);

const KPI = ({ label, value, color = '#6366f1', subtitle }) => (
    <div
        style={{
            padding: 14,
            borderRadius: 14,
            background: 'linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.02))',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: '1px solid rgba(100,100,120,0.06)',
            boxShadow: '0 6px 18px rgba(11,15,22,0.04)',
        }}
    >
        <IconMini>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="14" height="16" rx="2" stroke={color} strokeWidth="1.4" />
            </svg>
        </IconMini>
        <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color }}>{value}</div>
                {subtitle && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>}
            </div>
        </div>
        {/* sparkline */}
        <svg width="64" height="28" viewBox="0 0 64 28" fill="none">
            <path d="M2 20L14 12L28 16L40 10L62 14" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.9"/>
        </svg>
    </div>
);

const StatusBadge = ({ status }) => {
    const s = String(status ?? 'pending').toLowerCase();
    const map = {
        pending: { bg: '#fff7ed', color: '#b45309' },
        submitted: { bg: '#eef2ff', color: '#4338ca' },
        graded: { bg: '#ecfdf5', color: '#065f46' },
        review: { bg: '#fff1f2', color: '#9f1239' },
    };
    const style = map[s] || { bg: '#f3f4f6', color: '#374151' };
    return (
        <span style={{ background: style.bg, color: style.color, padding: '6px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700 }}>
            {s.replace('-', ' ')}
        </span>
    );
};

// --- Main Component ---
const MOBILE_BREAKPOINT = 1024;

const applyThemeVars = (mode) => {
    // mode: 'dark' | 'light' | 'system'
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const resolved = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;
    const root = document.documentElement;
    if (!root) return;
    if (resolved === 'dark') {
        root.style.setProperty('--bg', '#0b1220');
        root.style.setProperty('--surface', '#0f1724');
        root.style.setProperty('--text', '#e6eef8');
        root.style.setProperty('--text-muted', '#98a0b3');
        root.style.setProperty('--primary', '#60a5fa');
        root.style.setProperty('--border', 'rgba(255,255,255,0.04)');
        root.style.setProperty('--skeleton', 'linear-gradient(90deg,#0f1724,#0b1220)');
        root.style.setProperty('--shadow-sm', '0 6px 18px rgba(2,6,23,0.6)');
    } else {
        root.style.setProperty('--bg', '#f6f8fb');
        root.style.setProperty('--surface', '#ffffff');
        root.style.setProperty('--text', '#0b1220');
        root.style.setProperty('--text-muted', '#6b7280');
        root.style.setProperty('--primary', '#3b82f6');
        root.style.setProperty('--border', 'rgba(2,6,23,0.06)');
        root.style.setProperty('--skeleton', 'linear-gradient(90deg,#eaeef6,#f6f8fb)');
        root.style.setProperty('--shadow-sm', '0 6px 18px rgba(15,23,42,0.06)');
    }
};

const TeacherHome = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [data, setData] = React.useState(DEFAULT_DASH);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const [isMobile, setIsMobile] = React.useState(
        typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false,
    );
    const [themeMode, setThemeMode] = React.useState('system'); // 'system' | 'dark' | 'light'

    React.useEffect(() => {
        applyThemeVars(themeMode);
    }, [themeMode]);

    React.useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const loadData = React.useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const resp = await getTeacherDashboardStats();
            if (!resp || typeof resp !== 'object') {
                setData(DEFAULT_DASH);
            } else {
                setData(prev => ({ ...DEFAULT_DASH, ...prev, ...resp }));
            }
        } catch (e) {
            console.warn('Dashboard load failed', e);
            setError(e?.message ?? 'Failed to load dashboard');
            setData(DEFAULT_DASH);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadData();
    }, [loadData]);

    // Real-time updates (light)
    React.useEffect(() => {
        if (!user?.id) return undefined;
        const socket = io(API_BASE_URL, {
            withCredentials: true,
            query: { role: 'teacher', userId: user.id },
        });
        const onNewSubmission = s =>
            setData(curr => ({
                ...curr,
                recentSubmissions: [s, ...(curr.recentSubmissions || [])].slice(0, 5),
                submissions: {
                    ...(curr.submissions || {}),
                    pending: (curr.submissions?.pending || 0) + 1,
                },
            }));
        socket.on('new-submission', onNewSubmission);
        socket.on('submission-updated', () => loadData());
        return () => {
            socket.off('new-submission', onNewSubmission);
            socket.disconnect();
        };
    }, [user, loadData]);

    const teacher =
        (data.teacher && Object.keys(data.teacher).length ? data.teacher : null) ||
        (user
            ? {
                    id: user.id,
                    fullname: user.fullname,
                    username: user.username,
                    email: user.email,
                    phonenumber: user.phonenumber,
                    department: user.department,
                    createdAt: user.createdAt,
              }
            : null);

    // Small loading skeleton component
    const Skeleton = ({ height = 12, width = '100%', radius = 8 }) => (
        <div style={{ background: 'var(--skeleton)', height, width, borderRadius: radius }} />
    );

    return (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20, fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial', background: 'var(--bg)', color: 'var(--text)', minHeight: '100vh' }}>
            <header
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 8,
                }}
            >
                <div>
                    <h1 style={{ margin: 0, fontSize: 24 }}>{teacher?.fullname ?? 'Teacher'}</h1>
                    <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 6 }}>
                        {teacher?.department ?? 'Department not set'}
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                        onClick={() => navigate('/teacher/exams/create')}
                        style={{
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: 'linear-gradient(90deg,#4f46e5,#3b82f6)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            boxShadow: '0 8px 24px rgba(59,130,246,0.12)',
                        }}
                    >
                        New Exam
                    </button>

                    <button
                        onClick={() => setThemeMode(mode => mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark')}
                        title="Toggle theme (cycles: dark → light → system)"
                        style={{
                            padding: '8px 10px',
                            borderRadius: 10,
                            border: '1px solid rgba(100,100,120,0.08)',
                            background: 'transparent',
                            color: 'var(--text)',
                        }}
                    >
                        {themeMode === 'system' ? 'Theme: system' : themeMode === 'dark' ? 'Theme: dark' : 'Theme: light'}
                    </button>

                    <button
                        onClick={() => navigate('/teacher/settings')}
                        style={{
                            padding: '8px 12px',
                            borderRadius: 10,
                            border: '1px solid rgba(100,100,120,0.08)',
                            background: 'transparent',
                        }}
                    >
                        Edit Profile
                    </button>
                </div>
            </header>

            {error && (
                <div
                    style={{
                        marginTop: 12,
                        padding: 12,
                        borderRadius: 8,
                        background: '#fff4f4',
                        color: '#9b1c1c',
                    }}
                >
                    {error}
                </div>
            )}

            <section
                style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr' : '360px 1fr',
                    gap: 20,
                    marginTop: 18,
                }}
            >
                {/* Left column: teacher profile */}
                <aside style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* Profile Card */}
                    <div
                        style={{
                            padding: 18,
                            borderRadius: 14,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            boxShadow: 'var(--shadow-sm)',
                        }}
                    >
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div
                                style={{
                                    width: 72,
                                    height: 72,
                                    borderRadius: 14,
                                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                                    color: '#fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: 28,
                                    boxShadow: '0 8px 20px rgba(99,102,241,0.12)',
                                }}
                            >
                                {(teacher?.fullname ?? teacher?.username ?? 'T')
                                    .split(' ')
                                    .map(p => p[0])
                                    .join('')
                                    .slice(0, 2)
                                    .toUpperCase()}
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.2 }}>
                                    {loading ? <Skeleton height={18} width={160} /> : teacher?.fullname ?? '—'}
                                </div>
                                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6 }}>
                                    {loading ? <Skeleton height={12} width={110} /> : '@' + (teacher?.username ?? '—')}
                                </div>
                                <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M3 8v10a2 2 0 0 0 2 2h14" stroke="rgba(55,65,81,0.6)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M17 8V6a5 5 0 0 0-10 0v2" stroke="rgba(55,65,81,0.6)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        <span>{loading ? <Skeleton height={12} width={90} /> : formatDate(teacher?.createdAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                            <Field label="Email">{loading ? <Skeleton height={14} width={'80%'} /> : teacher?.email}</Field>
                            <Field label="Phone">{loading ? <Skeleton height={14} width={'60%'} /> : teacher?.phonenumber ?? '—'}</Field>
                            <Field label="Department">{loading ? <Skeleton height={14} width={'70%'} /> : teacher?.department ?? '—'}</Field>
                            <Field label="Address">{loading ? <Skeleton height={14} width={'100%'} /> : teacher?.address ?? '—'}</Field>
                        </div>

                        {/* Actions: removed Copy Email & Export as requested */}
                        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => navigate('/teacher/activity')}
                                style={{
                                    flex: 1,
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                    fontWeight: 700,
                                }}
                            >
                                View Activity
                            </button>
                            <button
                                onClick={() => navigate('/teacher/settings')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    background: 'linear-gradient(90deg,#eef2ff,#eef6ff)',
                                    border: 'none',
                                    fontWeight: 700,
                                }}
                            >
                                Manage
                            </button>
                        </div>
                    </div>

                    {/* Contact & security */}
                    <div
                        style={{
                            padding: 14,
                            borderRadius: 12,
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                        }}
                    >
                        <div style={{ fontWeight: 800, marginBottom: 8 }}>Contact & Security</div>
                        <Field label="Department">{teacher?.department ?? '—'}</Field>
                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => navigate('/teacher/change-password')}
                                style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent' }}
                            >
                                Change Password
                            </button>
                            <button
                                onClick={() => navigate('/teacher/contacts')}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                    background: 'transparent',
                                }}
                            >
                                Contacts
                            </button>
                        </div>
                    </div>
                </aside>

                {/* Right column: KPIs + activity */}
                <main style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* KPIs */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
                            gap: 12,
                        }}
                    >
                        <KPI label="Total Exams" value={data.exams?.total ?? 0} color="#6366f1" subtitle={`${data.exams?.totalEnrolled ?? 0} enrolled`} />
                        <KPI label="Live Exams" value={data.exams?.live ?? 0} color="#10b981" subtitle="Currently running" />
                        <KPI label="Pending Reviews" value={data.submissions?.pending ?? 0} color="#f59e0b" subtitle="Needs attention" />
                        <KPI label="Open Issues" value={data.issues?.open ?? 0} color="#ef4444" subtitle="Reported by students" />
                    </div>

                    {/* Recent submissions & exams to review */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                            gap: 12,
                        }}
                    >
                        {/* Recent submissions */}
                        <div
                            style={{
                                padding: 14,
                                borderRadius: 12,
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 800, display: 'flex', gap: 10, alignItems: 'center' }}>
                                    <div style={{ width: 8, height: 8, borderRadius: 999, background: '#3b82f6' }} />
                                    Recent Submissions
                                </div>
                                <button onClick={() => navigate('/teacher/results')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)' }}>View all</button>
                            </div>

                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {loading ? (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 10, alignItems: 'center', background: 'linear-gradient(90deg, rgba(0,0,0,0.01), transparent)' }}>
                                            <Skeleton height={48} width={48} radius={8} />
                                            <div style={{ flex: 1 }}>
                                                <Skeleton height={14} width={'60%'} />
                                                <div style={{ height: 8 }} />
                                                <Skeleton height={12} width={'40%'} />
                                            </div>
                                        </div>
                                    ))
                                ) : (data.recentSubmissions || []).length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center' }}>
                                        <svg width="42" height="42" viewBox="0 0 24 24" fill="none"><path d="M3 12v6a2 2 0 0 0 2 2h14" stroke="rgba(99,102,241,0.2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 8h10" stroke="rgba(99,102,241,0.2)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        <div>No recent submissions — good job staying on top.</div>
                                    </div>
                                ) : (
                                    (data.recentSubmissions || []).map(s => (
                                        <div
                                            key={s._id || s.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 12,
                                                padding: 12,
                                                borderRadius: 10,
                                                cursor: 'pointer',
                                                transition: 'transform .12s, box-shadow .12s',
                                                boxShadow: '0 6px 18px rgba(11,15,22,0.03)',
                                            }}
                                            onClick={() => navigate(`/teacher/grade/${s._id || s.id}`)}
                                            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-3px)')}
                                            onMouseLeave={e => (e.currentTarget.style.transform = 'none')}
                                        >
                                            <div
                                                style={{
                                                    width: 48,
                                                    height: 48,
                                                    borderRadius: 10,
                                                    background: '#eef2ff',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontWeight: 800,
                                                    color: '#4338ca',
                                                    fontSize: 18,
                                                }}
                                            >
                                                {(s.student?.fullname || 'S')[0]}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 800 }}>{s.student?.fullname ?? s.student?.username ?? 'Student'}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{s.exam?.title ?? s.examTitle} • {formatDate(s.createdAt)}</div>
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                                                <StatusBadge status={s.status ?? s.grade ?? 'pending'} />
                                                <div style={{ fontWeight: 800, fontSize: 14 }}>{s.grade ?? (s.score !== undefined ? String(s.score) : '—')}</div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Exams to review */}
                        <div
                            style={{
                                padding: 14,
                                borderRadius: 12,
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontWeight: 800 }}>Exams Needing Review</div>
                                <button onClick={() => navigate('/teacher/exams')} style={{ background: 'transparent', border: 'none', color: 'var(--primary)' }}>Manage</button>
                            </div>
                            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                {loading ? (
                                    <Skeleton height={80} width={'100%'} />
                                ) : (data.examsToReview || []).length === 0 ? (
                                    <div style={{ color: 'var(--text-muted)' }}>All caught up — no pending reviews.</div>
                                ) : (
                                    (data.examsToReview || []).map(e => (
                                        <div
                                            key={e._id || e.id}
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                padding: 12,
                                                borderRadius: 10,
                                                border: '1px dashed rgba(100,100,120,0.06)',
                                                cursor: 'pointer',
                                                transition: 'background .12s, transform .12s',
                                            }}
                                            onClick={() => navigate(`/teacher/results/${e._id || e.id}`)}
                                            onMouseEnter={ev => (ev.currentTarget.style.transform = 'translateY(-3px)')}
                                            onMouseLeave={ev => (ev.currentTarget.style.transform = 'none')}
                                        >
                                            <div style={{ fontWeight: 800 }}>{e.title}</div>
                                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{(e.submissionsCount ?? 0)} submissions</div>
                                                <div style={{ background: 'linear-gradient(90deg,#eef2ff,#eef6ff)', color: 'var(--primary)', fontWeight: 800, padding: '6px 10px', borderRadius: 999 }}>
                                                    {e.pendingCount ?? Math.max(0, (e.submissionsCount || 0) - (e.evaluatedCount || 0))}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick actions */}
                    <div style={{ display: 'flex', gap: 8, justifyContent: isMobile ? 'stretch' : 'flex-start' }}>
					{/* Quick actions */}
					<div
						style={{
							display: 'flex',
							gap: 8,
							justifyContent: isMobile ? 'stretch' : 'flex-start',
						}}
					>
						<button
							onClick={() => navigate('/teacher/exams/create')}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								background: 'linear-gradient(90deg,#4f46e5,#3b82f6)',
								color: '#fff',
								border: 'none',
							}}
						>
							Create Exam
						</button>
						<button
							onClick={() => navigate('/teacher/questions')}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'transparent',
							}}
						>
							Question Bank
						</button>
						<button
							onClick={() => navigate('/teacher/issues')}
							style={{
								padding: '10px 14px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'transparent',
							}}
						>
							Open Issues
						</button>
					</div>
				</main>
			</section>
		</div>
	);
};

export default TeacherHome;
