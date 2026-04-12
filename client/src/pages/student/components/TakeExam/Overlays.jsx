import React from 'react';

// ── Violation severity messaging ──────────────────────────────────
const getViolationMessage = (type) => {
	const messages = {
		fullscreen:          'You exited fullscreen mode. Please return to fullscreen to continue.',
		'tab-switch':        'You switched tabs or minimized the window. This is not allowed during the exam.',
		'window-blur':       'You navigated away from the exam window.',
		'copy-attempt':      'Copying exam content is not permitted.',
		'paste-attempt':     'Pasting content is not allowed in this area.',
		'devtools-attempt':  'Developer tools access is blocked during exams.',
		'devtools-open':     'Developer tools were detected. Please close them immediately.',
		'screenshot-attempt':'Screenshot attempt was blocked.',
		visibility:          'You switched tabs or minimized the window.',
	};
	return messages[type] || 'A security violation was detected.';
};

const getSeverityLevel = (violationCount) => {
	if (violationCount <= 2) return { level: 'warning', color: '#f59e0b', label: 'Warning' };
	if (violationCount <= 4) return { level: 'serious', color: '#ef4444', label: 'Serious Warning' };
	return { level: 'critical', color: '#991b1b', label: 'Final Warning' };
};

// ═══════════════════════════════════════════════════════════════════
// START SCREEN
// ═══════════════════════════════════════════════════════════════════
export const StartScreen = ({ submission, onStart, showWarning, onDismissWarning }) => {
	if (showWarning) {
		return (
			<div className="warningOverlay" role="dialog" aria-modal="true">
				<div className="warningModal">
					<div style={{ fontSize: 48, marginBottom: 16 }}>📱</div>
					<h2 style={{ margin: '0 0 12px 0', color: '#1e293b' }}>
						Small Screen Detected
					</h2>
					<p style={{ color: '#64748b', lineHeight: 1.6, marginBottom: 24 }}>
						We strongly recommend using a <strong>laptop or desktop computer</strong>{' '}
						for the best exam experience. Small screens may make it difficult to view
						questions and type answers comfortably.
					</p>
					<div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
						<button onClick={() => window.history.back()} className="nav-btn">
							Go Back
						</button>
						<button onClick={onDismissWarning} className="nav-btn primary">
							Continue Anyway
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="start-screen" role="region" aria-label="Start exam">
			<div className="start-card">
				<div style={{ marginBottom: 24 }}>
					<div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
					<h1 style={{ margin: 0, fontSize: '2rem' }}>{submission.examTitle}</h1>
					<p style={{ color: 'var(--text-muted)', marginTop: 8 }}>
						You are about to begin the exam.
					</p>
				</div>

				<div className="info-grid">
					<div className="info-item">
						<label>Duration</label>
						<strong>{submission.duration} mins</strong>
					</div>
					<div className="info-item">
						<label>Questions</label>
						<strong>{submission.questions?.length || 0}</strong>
					</div>
					<div className="info-item">
						<label>Total Marks</label>
						<strong>
							{(submission.questions || []).reduce(
								(sum, q) => sum + (q.max_marks || 0),
								0,
							)}
						</strong>
					</div>
				</div>

				<div className="warning-box" role="note" aria-label="Exam rules">
					<h3>🔒 Exam Security Rules:</h3>
					<ul>
						<li>The exam <strong>must</strong> be taken in fullscreen mode.</li>
						<li>Switching tabs, minimizing, or navigating away will be logged as violations.</li>
						<li><strong>Copy, paste, and screenshot</strong> are blocked during the exam.</li>
						<li>Developer tools (F12) are disabled.</li>
						<li>After <strong>5 violations</strong>, your exam will be auto-submitted.</li>
						<li>Your answers are auto-saved every 30 seconds.</li>
					</ul>
				</div>

				<button
					onClick={onStart}
					className="nav-btn primary btn-large"
					aria-label="Start exam"
				>
					🚀 Start Exam
				</button>
			</div>
		</div>
	);
};

// ═══════════════════════════════════════════════════════════════════
// VIOLATION OVERLAY — Escalating severity
// ═══════════════════════════════════════════════════════════════════
export const ViolationOverlay = ({ type, violationCount = 0, maxViolations = 5, onAcknowledge }) => {
	const remaining = Math.max(0, maxViolations - violationCount);
	const severity = getSeverityLevel(violationCount);

	return (
		<div className="overlay-backdrop" role="alertdialog" aria-modal="true">
			<div className="overlay-card">
				<span className="overlay-icon">
					{severity.level === 'critical' ? '🚨' : '⚠️'}
				</span>

				{/* Severity badge */}
				<div style={{
					display: 'inline-block',
					padding: '4px 14px',
					borderRadius: 999,
					fontSize: 12,
					fontWeight: 800,
					color: '#fff',
					background: severity.color,
					marginBottom: 12,
					textTransform: 'uppercase',
					letterSpacing: '0.05em',
				}}>
					{severity.label}
				</div>

				<h2 className="overlay-title" style={{ color: severity.color }}>
					Violation Detected
				</h2>

				<p className="overlay-text">
					{getViolationMessage(type)}
				</p>

				{/* Violation progress bar */}
				<div style={{
					background: 'var(--bg-secondary)',
					borderRadius: 12,
					padding: 16,
					marginBottom: 20,
				}}>
					<div style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						marginBottom: 8,
						fontSize: 13,
						fontWeight: 700,
					}}>
						<span>Violations: {violationCount} / {maxViolations}</span>
						<span style={{ color: remaining <= 1 ? '#ef4444' : 'var(--text-muted)' }}>
							{remaining} warning{remaining !== 1 ? 's' : ''} remaining
						</span>
					</div>
					<div style={{
						height: 6,
						borderRadius: 3,
						background: 'var(--border)',
						overflow: 'hidden',
					}}>
						<div style={{
							height: '100%',
							borderRadius: 3,
							width: `${Math.min(100, (violationCount / maxViolations) * 100)}%`,
							background: severity.color,
							transition: 'width 0.3s ease, background 0.3s ease',
						}} />
					</div>
				</div>

				{remaining <= 1 && (
					<p style={{
						color: '#ef4444',
						fontWeight: 700,
						fontSize: 13,
						marginBottom: 16,
						padding: '8px 12px',
						background: '#fee2e2',
						borderRadius: 8,
					}}>
						⚠️ Next violation will auto-submit your exam!
					</p>
				)}

				<button onClick={onAcknowledge} className="nav-btn primary">
					I Understand, Return to Exam
				</button>
			</div>
		</div>
	);
};

// ═══════════════════════════════════════════════════════════════════
// SUBMIT CONFIRMATION
// ═══════════════════════════════════════════════════════════════════
export const SubmitConfirmation = ({ stats, onConfirm, onCancel }) => (
	<div className="overlay-backdrop" role="dialog" aria-modal="true">
		<div className="overlay-card">
			<h2 className="overlay-title">Submit Exam?</h2>

			<div
				style={{
					display: 'flex',
					justifyContent: 'space-around',
					background: 'var(--bg-secondary)',
					padding: 16,
					borderRadius: 12,
					marginBottom: 24,
				}}
			>
				<div style={{ textAlign: 'center' }}>
					<strong style={{ display: 'block', fontSize: '1.25rem' }}>
						{stats.answered}
					</strong>
					<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
						Answered
					</span>
				</div>
				<div style={{ textAlign: 'center' }}>
					<strong
						style={{ display: 'block', fontSize: '1.25rem', color: 'var(--warning)' }}
					>
						{stats.review}
					</strong>
					<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Marked</span>
				</div>
				<div style={{ textAlign: 'center' }}>
					<strong
						style={{
							display: 'block',
							fontSize: '1.25rem',
							color: 'var(--text-muted)',
						}}
					>
						{stats.unanswered}
					</strong>
					<span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
						Unanswered
					</span>
				</div>
			</div>

			<p className="overlay-text">
				Are you sure you want to submit? You cannot change your answers after submission.
			</p>

			<div className="overlay-actions">
				<button onClick={onCancel} className="nav-btn">
					Cancel
				</button>
				<button
					onClick={onConfirm}
					className="nav-btn primary"
					style={{ background: 'var(--error)' }}
				>
					Yes, Submit Exam
				</button>
			</div>
		</div>
	</div>
);
