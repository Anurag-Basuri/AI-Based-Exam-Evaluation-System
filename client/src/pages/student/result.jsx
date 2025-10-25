import React from 'react';
import {
	safeApiCall,
	getMySubmissions,
	getSubmissionById,
} from '../../services/studentServices.js';

// --- Theme-aware status styles ---
const statusStyles = {
	pending: {
		label: 'Pending',
		icon: '⏳',
		color: 'var(--warning-text)',
		bg: 'var(--warning-bg)',
		border: 'var(--warning-border)',
	},
	submitted: {
		label: 'Submitted',
		icon: '📋',
		color: 'var(--info-text)',
		bg: 'var(--info-bg)',
		border: 'var(--info-border)',
	},
	evaluated: {
		label: 'Evaluated',
		icon: '🤖',
		color: 'var(--success-text)',
		bg: 'var(--success-bg)',
		border: 'var(--success-border)',
	},
	published: {
		label: 'Published',
		icon: '✅',
		color: 'var(--success-text)',
		bg: 'var(--success-bg)',
		border: 'var(--success-border)',
	},
	flagged: {
		label: 'Flagged',
		icon: '🚨',
		color: 'var(--danger-text)',
		bg: 'var(--danger-bg)',
		border: 'var(--danger-border)',
	},
};

// --- Detailed Answer Breakdown Component ---
const AnswerDetail = ({ answer, evaluation }) => {
	const question = answer.question;
	const isMCQ = question.type === 'multiple-choice';
	const marks = evaluation?.evaluation?.marks ?? 0;
	const remarks = evaluation?.evaluation?.remarks;

	let studentResponse;
	if (isMCQ) {
		const selectedOption = question.options.find(
			opt => String(opt._id) === String(answer.responseOption),
		);
		const correctOption = question.options.find(opt => opt.isCorrect);
		studentResponse = (
			<>
				<p>
					<strong>Your Answer: </strong>
					{selectedOption ? (
						<span
							style={{
								color: selectedOption.isCorrect
									? 'var(--success-text)'
									: 'var(--danger-text)',
							}}
						>
							{selectedOption.text}
						</span>
					) : (
						<i>Not answered</i>
					)}
				</p>
				{!selectedOption?.isCorrect && (
					<p style={{ color: 'var(--success-text)' }}>
						<strong>Correct Answer: </strong>
						{correctOption?.text}
					</p>
				)}
			</>
		);
	} else {
		studentResponse = (
			<p style={{ whiteSpace: 'pre-wrap' }}>{answer.responseText || <i>Not answered</i>}</p>
		);
	}

	return (
		<div style={{ borderTop: '1px solid var(--border)', padding: '16px 0' }}>
			<div
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 8,
				}}
			>
				<h5 style={{ margin: 0, flex: 1 }}>{question.text}</h5>
				<strong style={{ color: 'var(--primary)' }}>
					{marks} / {question.max_marks}
				</strong>
			</div>
			<div style={{ fontSize: 14, color: 'var(--text-muted)' }}>{studentResponse}</div>
			{remarks && (
				<div
					style={{
						marginTop: 8,
						background: 'var(--bg)',
						padding: '8px 12px',
						borderRadius: 8,
						fontSize: 13,
					}}
				>
					<strong>Feedback:</strong> {remarks}
				</div>
			)}
		</div>
	);
};

// --- Result Details Modal ---
const ResultDetailModal = ({ submissionId, onClose }) => {
	const [loading, setLoading] = React.useState(true);
	const [error, setError] = React.useState('');
	const [submission, setSubmission] = React.useState(null);

	React.useEffect(() => {
		const loadDetails = async () => {
			setLoading(true);
			setError('');
			try {
				const data = await safeApiCall(getSubmissionById, submissionId);
				setSubmission(data);
			} catch (e) {
				setError(e.message || 'Failed to load details.');
			} finally {
				setLoading(false);
			}
		};
		loadDetails();
	}, [submissionId]);

	const answersMap = React.useMemo(
		() => new Map(submission?.answers.map(a => [String(a.question._id), a])),
		[submission],
	);

	return (
		<div style={styles.modalBackdrop} onClick={onClose}>
			<div style={styles.modalContent} onClick={e => e.stopPropagation()}>
				<button onClick={onClose} style={styles.modalCloseButton}>
					×
				</button>
				{loading && <p>Loading details...</p>}
				{error && <p style={{ color: 'var(--danger-text)' }}>{error}</p>}
				{submission && (
					<>
						<h3 style={{ marginTop: 0 }}>{submission.exam.title} - Breakdown</h3>
						<div style={{ maxHeight: '70vh', overflowY: 'auto', paddingRight: 16 }}>
							{(submission.evaluations || []).map(ev => {
								const answer = answersMap.get(String(ev.question));
								return answer ? (
									<AnswerDetail key={ev._id} answer={answer} evaluation={ev} />
								) : null;
							})}
						</div>
					</>
				)}
			</div>
		</div>
	);
};

const ResultCard = ({ result, onViewDetails }) => {
    const config = statusStyles[result.status] || statusStyles.pending;
    const isPublished = result.status === 'published';
    const hasScore = isPublished && result.score !== null && result.score !== undefined;

    return (
        <article style={styles.resultCard} className="result-card">
            <div style={styles.resultCardMain}>
                <header style={{ marginBottom: '16px' }}>
                    <div style={styles.resultCardHeader}>
                        <h3 style={styles.resultCardTitle}>{result.examTitle}</h3>
                        <span
                            style={{
                                ...styles.statusPill,
                                ...{
                                    border: `1px solid ${config.border}`,
                                    background: config.bg,
                                    color: config.color,
                                },
                            }}
                        >
                            <span>{config.icon}</span>
                            {config.label}
                        </span>
                    </div>
                    {result.submittedAt && (
                        <div style={styles.resultCardSubtitle}>Submitted: {result.submittedAt}</div>
                    )}
                </header>

                <div style={styles.scoreBox}>
                    {hasScore ? (
                        <>
                            <span style={styles.scoreValue}>{result.score.toFixed(1)}</span>
                            <span style={styles.scoreMax}>/ {result.maxScore || 100}</span>
                            {result.percentage != null && (
                                <span
                                    style={{
                                        ...styles.scorePercent,
                                        color:
                                            result.percentage >= 70
                                                ? 'var(--success-text)'
                                                : result.percentage >= 50
                                                    ? 'var(--warning-text)'
                                                    : 'var(--danger-text)',
                                    }}
                                >
                                    ({result.percentage}%)
                                </span>
                            )}
                        </>
                    ) : (
                        <span style={styles.awaitingEvalText}>
                            {isPublished ? 'Score not available' : '📝 Awaiting evaluation'}
                        </span>
                    )}
                </div>

                {result.remarks && (
                    <div style={styles.feedbackBox}>
                        <div style={styles.feedbackTitle}>Feedback</div>
                        <p style={styles.feedbackText}>{result.remarks}</p>
                    </div>
                )}
            </div>

            <div style={styles.performancePane} id="performance-pane">
                <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>
                    Performance
                </div>
                {hasScore && result.percentage != null && (
                    <div
                        style={{
                            ...styles.donutChart,
                            background: `conic-gradient(${
                                result.percentage >= 70
                                    ? 'var(--success-text)'
                                    : result.percentage >= 50
                                        ? 'var(--warning-text)'
                                        : 'var(--danger-text)'
                            } ${result.percentage * 3.6}deg, var(--border) 0deg)`,
                        }}
                    >
                        <div style={styles.donutChartInner}>{result.percentage}%</div>
                    </div>
                )}
                <button
                    onClick={() => onViewDetails(result.id)}
                    style={styles.detailsButton}
                    disabled={!isPublished}
                >
                    View Details
                </button>
            </div>
        </article>
    );
};

const StudentResults = () => {
	const [loading, setLoading] = React.useState(false);
	const [error, setError] = React.useState('');
	const [results, setResults] = React.useState([]);
	const [query, setQuery] = React.useState('');
	const [status, setStatus] = React.useState('all');
	const [viewingResultId, setViewingResultId] = React.useState(null);

	const loadResults = React.useCallback(async (force = false) => {
        setLoading(true);
        setError('');
        try {
            const data = await safeApiCall(getMySubmissions, {}, force);
            setResults(Array.isArray(data) ? data : []);
        } catch (e) {
            setError(e?.message || 'Failed to load results');
        } finally {
            setLoading(false);
        }
    }, []);

	React.useEffect(() => {
		loadResults();
	}, [loadResults]);

	const filteredResults = React.useMemo(() => {
		const q = query.toLowerCase();
		return results.filter(result => {
			const matchesStatus = status === 'all' || result.status === status;
			const matchesQuery = !q || result.examTitle.toLowerCase().includes(q);
			return matchesStatus && matchesQuery;
		});
	}, [results, status, query]);

	const statusCounts = React.useMemo(() => {
		const counts = {
			all: results.length,
			evaluated: 0,
			submitted: 0,
			pending: 0,
			flagged: 0,
			published: 0,
		};
		results.forEach(result => {
			counts[result.status] = (counts[result.status] || 0) + 1;
		});
		// Combine evaluated and published for the filter button
		counts.evaluated += counts.published;
		return counts;
	}, [results]);

	const filterOptions = [
		{ key: 'all', label: 'All' },
		{ key: 'published', label: 'Published' },
		{ key: 'submitted', label: 'Submitted' },
	];

	return (
		<div style={styles.pageContainer}>
			<ResponsiveStyleManager />
			{viewingResultId && (
				<ResultDetailModal
					submissionId={viewingResultId}
					onClose={() => setViewingResultId(null)}
				/>
			)}
			<header style={styles.pageHeader}>
				<div>
					<h1 style={styles.pageTitle}>Results & Feedback</h1>
					<p style={styles.pageSubtitle}>Review your exam scores and teacher feedback.</p>
				</div>
				<button onClick={() => loadResults(true)} disabled={loading} style={styles.refreshButton}>
					{loading ? '⏳' : '🔄'} Refresh
				</button>
			</header>

			<div style={styles.controlsContainer}>
				<div style={{ position: 'relative', flex: '1 1 300px' }}>
					<input
						value={query}
						onChange={e => setQuery(e.target.value)}
						placeholder="Search by exam title..."
						style={styles.searchInput}
					/>
					<span style={styles.searchIcon}>🔍</span>
				</div>
				<div style={styles.filterGroup}>
					{filterOptions.map(option => (
						<button
							key={option.key}
							onClick={() => setStatus(option.key)}
							style={
								status === option.key
									? styles.filterButtonActive
									: styles.filterButton
							}
						>
							{option.label}
							<span
								style={
									status === option.key
										? styles.filterCountActive
										: styles.filterCount
								}
							>
								{statusCounts[option.key] || 0}
							</span>
						</button>
					))}
				</div>
			</div>

			{error && <div style={styles.errorBox}>❌ {error}</div>}
			{loading && (
				<div style={styles.loadingBox}>
					<div style={{ fontSize: '32px', marginBottom: 16 }}>⏳</div>
					<p style={{ margin: 0, fontWeight: 600 }}>Loading your results...</p>
				</div>
			)}
			{!loading && !error && filteredResults.length === 0 && (
				<div style={styles.emptyStateBox}>
					<div style={{ fontSize: '48px', marginBottom: 16 }}>📊</div>
					<h3 style={{ margin: '0 0 8px 0', color: 'var(--text)' }}>
						{query || status !== 'all' ? 'No matching results' : 'No results yet'}
					</h3>
					<p style={{ margin: 0, color: 'var(--text-muted)' }}>
						{query || status !== 'all'
							? 'Try adjusting your search or filters'
							: 'Complete some exams to see your results here'}
					</p>
				</div>
			)}
			{!loading && !error && filteredResults.length > 0 && (
				<div style={{ display: 'grid', gap: 24 }}>
					{filteredResults.map(result => (
						<ResultCard
							key={result.id}
							result={result}
							onViewDetails={setViewingResultId}
						/>
					))}
				</div>
			)}
		</div>
	);
};

// --- Centralized, theme-aware styles object ---
const styles = {
	pageContainer: { maxWidth: '1200px', margin: '0 auto', padding: '16px' },
	pageHeader: {
		background: 'var(--surface)',
		padding: '32px 28px',
		borderRadius: 20,
		border: '1px solid var(--border)',
		marginBottom: 32,
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'flex-start',
		gap: 20,
		flexWrap: 'wrap',
	},
	pageTitle: { margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800, color: 'var(--text)' },
	pageSubtitle: { margin: 0, color: 'var(--text-muted)', fontSize: '16px' },
	refreshButton: {
		padding: '12px 16px',
		borderRadius: '10px',
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '14px',
	},
	controlsContainer: {
		background: 'var(--surface)',
		padding: '24px',
		borderRadius: 16,
		border: '1px solid var(--border)',
		marginBottom: 24,
		display: 'flex',
		gap: 20,
		alignItems: 'center',
		flexWrap: 'wrap',
	},
	searchInput: {
		width: '100%',
		padding: '12px 16px 12px 48px',
		borderRadius: 12,
		border: '1px solid var(--border)',
		background: 'var(--bg)',
		outline: 'none',
		fontSize: '14px',
		fontWeight: 500,
		color: 'var(--text)',
	},
	searchIcon: {
		position: 'absolute',
		left: 16,
		top: '50%',
		transform: 'translateY(-50%)',
		color: 'var(--text-muted)',
		fontSize: '16px',
	},
	filterGroup: { display: 'flex', gap: 8, flexWrap: 'wrap' },
	filterButton: {
		padding: '10px 16px',
		borderRadius: 25,
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text-muted)',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '14px',
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		transition: 'all 0.2s ease',
	},
	filterButtonActive: {
		padding: '10px 16px',
		borderRadius: 25,
		border: '1px solid var(--primary)',
		background: 'var(--primary-bg)',
		color: 'var(--primary)',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '14px',
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		transition: 'all 0.2s ease',
	},
	filterCount: {
		background: 'var(--text-muted)',
		color: 'var(--surface)',
		borderRadius: '12px',
		padding: '2px 8px',
		fontSize: '12px',
		fontWeight: 700,
		minWidth: '20px',
		textAlign: 'center',
	},
	filterCountActive: {
		background: 'var(--primary)',
		color: 'var(--primary-contrast)',
		borderRadius: '12px',
		padding: '2px 8px',
		fontSize: '12px',
		fontWeight: 700,
		minWidth: '20px',
		textAlign: 'center',
	},
	errorBox: {
		padding: '20px',
		borderRadius: 12,
		background: 'var(--danger-bg)',
		border: '1px solid var(--danger-border)',
		color: 'var(--danger-text)',
		textAlign: 'center',
		marginBottom: 24,
	},
	loadingBox: { padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' },
	emptyStateBox: {
		padding: '60px 20px',
		textAlign: 'center',
		background: 'var(--surface)',
		borderRadius: 16,
		border: '2px dashed var(--border)',
	},
	resultCard: {
		background: 'var(--surface)',
		borderRadius: 16,
		border: '1px solid var(--border)',
		boxShadow: 'var(--shadow-sm)',
		display: 'grid',
		gridTemplateColumns: '1fr',
		'@media (min-width: 768px)': { gridTemplateColumns: '1fr 200px' },
	},
	resultCardMain: { padding: '24px' },
	resultCardHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		marginBottom: '8px',
		flexWrap: 'wrap',
	},
	resultCardTitle: {
		margin: 0,
		fontSize: '18px',
		fontWeight: 700,
		color: 'var(--text)',
		flex: 1,
	},
	statusPill: {
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		fontSize: '12px',
		padding: '6px 12px',
		borderRadius: '20px',
		fontWeight: 700,
	},
	resultCardSubtitle: { color: 'var(--text-muted)', fontSize: '13px' },
	scoreBox: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '8px',
		padding: '16px',
		background: 'var(--bg)',
		borderRadius: '12px',
		border: '1px solid var(--border)',
		marginBottom: '16px',
	},
	scoreValue: { fontSize: '32px', fontWeight: 800, color: 'var(--text)', lineHeight: 1 },
	scoreMax: { fontSize: '18px', fontWeight: 600, color: 'var(--text-muted)' },
	scorePercent: { fontSize: '14px', marginLeft: '8px', fontWeight: 600 },
	awaitingEvalText: { fontSize: '16px', fontWeight: 600, color: 'var(--text-muted)' },
	feedbackBox: {
		background: 'var(--info-bg)',
		borderRadius: 12,
		padding: '14px',
		border: '1px solid var(--info-border)',
	},
	feedbackTitle: {
		fontWeight: 600,
		color: 'var(--info-text)',
		marginBottom: '6px',
		fontSize: '14px',
	},
	feedbackText: { margin: 0, color: 'var(--info-text)', lineHeight: 1.5, fontSize: '14px' },
	performancePane: {
		background: 'var(--bg)',
		borderRadius: '0 16px 16px 0',
		padding: '20px',
		borderLeft: '1px solid var(--border)',
		display: 'flex',
		flexDirection: 'column',
		gap: '16px',
		alignItems: 'center',
		textAlign: 'center',
	},
	donutChart: {
		width: '80px',
		height: '80px',
		borderRadius: '50%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		margin: '0 auto',
		position: 'relative',
	},
	donutChartInner: {
		width: '60px',
		height: '60px',
		borderRadius: '50%',
		background: 'var(--bg)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		fontSize: '16px',
		fontWeight: 800,
		color: 'var(--text)',
	},
	detailsButton: {
		padding: '10px 16px',
		borderRadius: '8px',
		border: '1px solid var(--border)',
		background: 'var(--surface)',
		color: 'var(--text)',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '14px',
		width: '100%',
		marginTop: 'auto',
		':disabled': { opacity: 0.5, cursor: 'not-allowed' },
	},
	modalBackdrop: {
		position: 'fixed',
		inset: 0,
		background: 'rgba(0,0,0,0.6)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		zIndex: 1000,
		padding: 16,
	},
	modalContent: {
		background: 'var(--surface)',
		borderRadius: 16,
		padding: '24px 32px',
		width: '100%',
		maxWidth: '700px',
		position: 'relative',
		boxShadow: 'var(--shadow-xl)',
	},
	modalCloseButton: {
		position: 'absolute',
		top: 12,
		right: 12,
		background: 'none',
		border: 'none',
		fontSize: 24,
		cursor: 'pointer',
		color: 'var(--text-muted)',
	}
};

// Add a simple component to manage the stylesheet
const ResponsiveStyleManager = () => {
	React.useEffect(() => {
		const styleSheet = document.createElement('style');
		styleSheet.id = 'responsive-result-styles';
		styleSheet.innerHTML = `
            @media (max-width: 768px) {
                #result-card {
                    grid-template-columns: 1fr;
                }
                #performance-pane {
                    border-left: none;
                    border-top: 1px solid var(--border);
                    border-radius: 0 0 16px 16px;
                }
            }
        `;
		document.head.appendChild(styleSheet);
		return () => {
			document.head.removeChild(styleSheet);
		};
	}, []);
	return null;
};

export default StudentResults;
