import React, { useEffect, useState } from 'react';
import Login from '../components/Login.jsx';
import Register from '../components/Register.jsx';
import img1 from '../assets/image1.jpg';
import img2 from '../assets/image2.jpg';
import img3 from '../assets/image3.jpg';
import img4 from '../assets/image4.jpg';

// New helpers: URL param + storage (no hashes)
const VALID_MODES = new Set(['login', 'register']);

const getUrlMode = () => {
    if (typeof window === 'undefined') return null;
    try {
        const url = new URL(window.location.href);
        const mode = (url.searchParams.get('auth') || '').toLowerCase();
        return VALID_MODES.has(mode) ? mode : null;
    } catch {
        return null;
    }
};

const setUrlMode = (mode, { replace = false } = {}) => {
    if (typeof window === 'undefined') return;
    try {
        const url = new URL(window.location.href);
        const current = (url.searchParams.get('auth') || '').toLowerCase();
        if (current === mode) return;
        url.searchParams.set('auth', mode);
        if (replace) window.history.replaceState({}, '', url.toString());
        else window.history.pushState({}, '', url.toString());
    } catch {}
};

const loadSavedMode = () => {
    if (typeof window === 'undefined') return null;
    try {
        const saved = (localStorage.getItem('authMode') || '').toLowerCase();
        return VALID_MODES.has(saved) ? saved : null;
    } catch {
        return null;
    }
};

const saveMode = mode => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem('authMode', mode);
    } catch {}
};

// Utility: media query -> boolean state
const useMediaQuery = (query, defaultState = false) => {
    const [matches, setMatches] = useState(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function')
            return defaultState;
        return window.matchMedia(query).matches;
    });

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
        const mql = window.matchMedia(query);
        const onChange = e => setMatches(e.matches);
        if (mql.addEventListener) mql.addEventListener('change', onChange);
        else mql.addListener(onChange);
        setMatches(mql.matches);
        return () => {
            if (mql.removeEventListener) mql.removeEventListener('change', onChange);
            else mql.removeListener(onChange);
        };
    }, [query]);

    return matches;
};

const AuthPage = () => {
    // Initialize: URL (?auth=...), else localStorage, else 'login'
    const [mode, setMode] = useState(() => {
        return getUrlMode() || loadSavedMode() || 'login';
    });

    // Keep URL in sync on first render (replace so no extra history entry)
    useEffect(() => {
        setUrlMode(mode, { replace: true });
        saveMode(mode);
    }, []); // run once

    // Handle browser back/forward (popstate)
    useEffect(() => {
        const onPop = () => {
            const m = getUrlMode();
            if (m && m !== mode) setMode(m);
        };
        window.addEventListener('popstate', onPop);
        return () => window.removeEventListener('popstate', onPop);
    }, [mode]);

    // Cross‑tab sync via storage events
    useEffect(() => {
        const onStorage = e => {
            if (e.key === 'authMode') {
                const m = (e.newValue || '').toLowerCase();
                if (VALID_MODES.has(m) && m !== mode) {
                    // Align URL too
                    setUrlMode(m, { replace: true });
                    setMode(m);
                }
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [mode]);

    // Setter that updates state, URL (push) and storage
    const setAuthMode = next => {
        const m = VALID_MODES.has(next) ? next : 'login';
        if (m === mode) return;
        setMode(m);
        setUrlMode(m, { replace: false }); // create history entry for back/forward
        saveMode(m);
    };

    const isRegister = mode === 'register';

    // Responsive flags
    const isNarrow = useMediaQuery('(max-width: 900px)', false);
    const isCompact = useMediaQuery('(max-width: 520px)', false);

    const accentA = isRegister ? '#f97316' : '#4f46e5';
    const accentB = isRegister ? '#fb923c' : '#6366f1';
    const accentGrad = `linear-gradient(135deg, ${accentA} 0%, ${accentB} 100%)`;

    const Switch = (
        <div
            role="tablist"
            aria-label="Authentication mode"
            style={{ ...styles.switchInlineWrap, padding: isCompact ? 4 : 6 }}
        >
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,
                    padding: 1,
                    background: accentGrad,
                    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                    WebkitMaskComposite: 'xor',
                    maskComposite: 'exclude',
                }}
            />
            <button
                type="button"
                role="tab"
                aria-selected={!isRegister}
                onClick={() => setAuthMode('login')}
                style={{
                    ...styles.switchBtn,
                    padding: isCompact ? '8px 12px' : '10px 16px',
                    ...(!isRegister ? styles.switchActiveLogin : {}),
                }}
            >
                <span aria-hidden="true" style={{ marginRight: 6 }}>
                    🔑
                </span>{' '}
                Login
            </button>
            <button
                type="button"
                role="tab"
                aria-selected={isRegister}
                onClick={() => setAuthMode('register')}
                style={{
                    ...styles.switchBtn,
                    padding: isCompact ? '8px 12px' : '10px 16px',
                    ...(isRegister ? styles.switchActiveRegister : {}),
                }}
            >
                <span aria-hidden="true" style={{ marginRight: 6 }}>
                    ✨
                </span>{' '}
                Register
            </button>
        </div>
    );

    return (
        <div style={styles.page}>
            {/* Background layers */}
            <div
                aria-hidden="true"
                style={{
                    ...styles.bgLayer,
                    backgroundImage: `url(/rope-texture.png)`,
                    backgroundSize: isCompact ? '420px' : '600px',
                }}
            />
            <div
                aria-hidden="true"
                style={{
                    ...styles.bgRadial,
                    background:
                        'radial-gradient(1000px 500px at 10% -100px, rgba(99,102,241,0.12), transparent), radial-gradient(1000px 500px at 90% -100px, rgba(99,102,241,0.12), transparent)',
                }}
            />
            <div aria-hidden="true" style={{ ...styles.blob, ...styles.blobA }} />
            <div aria-hidden="true" style={{ ...styles.blob, ...styles.blobB }} />
            <div aria-hidden="true" style={{ ...styles.blob, ...styles.blobC }} />

            <section
                style={{
                    ...styles.shell,
                    padding: isCompact ? '12px' : 'clamp(1rem, 3vw, 2rem)',
                }}
            >
                <div
                    style={{
                        ...styles.grid,
                        maxWidth: isCompact ? 980 : 1200,
                        gap: isCompact ? 12 : 'clamp(1rem, 2.5vw, 2rem)',
                        gridTemplateColumns: isNarrow ? '1fr' : 'minmax(360px, 480px) 1fr',
                    }}
                >
                    {/* Left: Auth card */}
                    <div style={{ ...styles.leftCol, gap: isCompact ? 10 : 12 }}>
                        {Switch}
                        <div
                            style={{
                                ...styles.card,
                                padding: isCompact ? 12 : 'clamp(1rem, 2.2vw, 1.4rem)',
                                borderRadius: isCompact ? 16 : 20,
                            }}
                        >
                            {isRegister ? <Register embedded /> : <Login embedded />}
                        </div>
                        <p style={styles.subtleNote}>
                            Tip: Use the role switch inside the form to switch Student/Teacher
                            styles.
                        </p>
                    </div>

                    {/* Right: Showcase panel */}
                    <aside
                        style={{
                            ...styles.rightCol,
                            padding: isCompact ? 12 : 'clamp(1rem, 2.4vw, 1.8rem)',
                            borderRadius: isCompact ? 16 : 20,
                            background: isRegister
                                ? 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(251,146,60,0.18))'
                                : 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.18))',
                            border: `1px solid ${
                                isRegister ? 'rgba(251,146,60,0.35)' : 'rgba(99,102,241,0.35)'
                            }`,
                            boxShadow: isRegister
                                ? '0 20px 60px rgba(249,115,22,0.18)'
                                : '0 20px 60px rgba(79,70,229,0.18)',
                            WebkitBackdropFilter: 'saturate(140%) blur(4px)',
                            backdropFilter: 'saturate(140%) blur(4px)',
                        }}
                    >
                        <h2 style={styles.heroTitle}>AI‑Based Exam Evaluation</h2>
                        <p style={styles.heroCopy}>
                            Plan, deliver, and evaluate exams end‑to‑end. Secure sessions,
                            consistent scoring, insightful feedback.
                        </p>

                        <div style={styles.pills}>
                            {[
                                { t: 'Secure Exams', c: isRegister ? '#9a3412' : '#3730a3' },
                                { t: 'Question Banks', c: isRegister ? '#b45309' : '#4338ca' },
                                { t: 'Fast Results', c: isRegister ? '#c2410c' : '#4f46e5' },
                            ].map((p, i) => (
                                <span
                                    key={i}
                                    style={{ ...styles.pill, color: p.c, borderColor: `${p.c}33` }}
                                >
                                    {p.t}
                                </span>
                            ))}
                        </div>

                        <div
                            style={{
                                ...styles.mosaic,
                                gridTemplateColumns: isCompact ? '1fr' : 'repeat(2, 1fr)',
                                gap: isCompact ? 10 : 12,
                                marginBottom: isCompact ? 12 : 14,
                            }}
                        >
                            {[img1, img2, img3, img4].map((src, i) => (
                                <div
                                    key={i}
                                    style={{
                                        ...styles.tile,
                                        transform:
                                            i === 0
                                                ? 'rotateY(-8deg) rotateX(6deg)'
                                                : i === 1
                                                    ? 'rotateY(8deg) rotateX(-6deg)'
                                                    : i === 2
                                                        ? 'rotateY(6deg) rotateX(6deg)'
                                                        : 'rotateY(-6deg) rotateX(-6deg)',
                                    }}
                                >
                                    <img
                                        src={src}
                                        alt={`illustration ${i + 1}`}
                                        loading="lazy"
                                        decoding="async"
                                        style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </section>

            <style>
                {`
          @keyframes floaty { 0% { transform: translateY(0px); } 100% { transform: translateY(-16px); } }
          @media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
        `}
            </style>
        </div>
    );
};

const styles = {
    page: {
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, -apple-system, sans-serif",
        color: '#0f172a',
    },
    bgLayer: {
        position: 'absolute',
        inset: 0,
        opacity: 0.03,
        backgroundSize: '600px',
        zIndex: 0,
        pointerEvents: 'none',
    },
    bgRadial: {
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
    },
    blob: {
        position: 'absolute',
        borderRadius: '50%',
        filter: 'blur(24px)',
        opacity: 0.22,
        animation: 'floaty 3.8s ease-in-out infinite alternate',
        pointerEvents: 'none',
    },
    blobA: { width: 260, height: 260, top: -60, left: -40, background: '#a5b4fc' },
    blobB: {
        width: 340,
        height: 340,
        bottom: -120,
        right: -60,
        background: '#fecaca',
        animationDelay: '0.6s',
    },
    blobC: {
        width: 280,
        height: 280,
        top: 120,
        right: -80,
        background: '#bbf7d0',
        animationDelay: '0.3s',
    },

    shell: {
        position: 'relative',
        zIndex: 1,
        padding: 'clamp(1rem, 3vw, 2rem)',
        display: 'grid',
        placeItems: 'center',
    },
    grid: {
        display: 'grid',
        gap: 'clamp(1rem, 2.5vw, 2rem)',
        width: '100%',
        maxWidth: 1200,
        alignItems: 'stretch',
    },
    leftCol: { display: 'grid', gap: 12, alignContent: 'start' },

    switchInlineWrap: {
        position: 'relative',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 6,
        borderRadius: 999,
        padding: 6,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.86))',
        border: '1px solid rgba(226,232,240,0.8)',
        boxShadow: '0 10px 28px rgba(2,6,23,0.12)',
    },
    switchBtn: {
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        color: '#334155',
        fontWeight: 800,
        padding: '10px 16px',
        borderRadius: 999,
        cursor: 'pointer',
        letterSpacing: 0.2,
    },
    switchActiveLogin: {
        background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
        color: '#fff',
        boxShadow: '0 8px 20px rgba(79,70,229,0.28)',
    },
    switchActiveRegister: {
        background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)',
        color: '#fff',
        boxShadow: '0 8px 20px rgba(249,115,22,0.28)',
    },

    card: {
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: 20,
        boxShadow: '0 20px 60px rgba(2,6,23,0.10)',
        padding: 'clamp(1rem, 2.2vw, 1.4rem)',
    },

    rightCol: {
        borderRadius: 20,
        padding: 'clamp(1rem, 2.4vw, 1.8rem)',
        backdropFilter: 'saturate(140%) blur(4px)',
    },
    heroTitle: {
        margin: 0,
        marginBottom: 10,
        fontSize: 'clamp(1.4rem, 2.6vw, 2.2rem)',
        fontWeight: 800,
        background: 'linear-gradient(90deg, #0f172a, #334155)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    heroCopy: {
        margin: 0,
        marginBottom: 16,
        color: '#475569',
        fontSize: 'clamp(0.95rem, 1vw, 1.05rem)',
        lineHeight: 1.7,
    },
    pills: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 },
    pill: {
        border: '1px solid',
        padding: '6px 10px',
        borderRadius: 999,
        fontWeight: 700,
        fontSize: 12,
        background: '#fff',
    },

    mosaic: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: 12,
        perspective: '800px',
        marginBottom: 14,
    },
    tile: {
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 16px 30px rgba(0,0,0,0.08)',
        transition: 'transform 0.5s',
        aspectRatio: '4 / 3',
    },

    points: {
        margin: 0,
        paddingLeft: '1.1rem',
        color: '#334155',
        lineHeight: 1.8,
        fontSize: 'clamp(0.95rem, 1vw, 1rem)',
    },

    subtleNote: {
        margin: 0,
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
};

export default AuthPage;
