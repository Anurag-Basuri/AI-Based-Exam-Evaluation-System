import React from 'react';

export const StartScreen = ({ submission, onStart, showWarning, onDismissWarning }) => {
	// When showWarning is true, show only the warning modal and require user action.
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
					<h3>Please Note:</h3>
					<ul>
						<li>The exam must be taken in fullscreen mode.</li>
						<li>Do not switch tabs, minimize, or navigate away.</li>
						<li>Violations will be logged and may lead to auto-submission.</li>
						<li>Your answers are auto-saved periodically.</li>
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

export const ViolationOverlay = ({ type, onAcknowledge }) => (
	<div className="overlay-backdrop" role="alertdialog" aria-modal="true">
		<div className="overlay-card">
			<span className="overlay-icon">⚠️</span>
			<h2 className="overlay-title" style={{ color: 'var(--error)' }}>
				Violation Detected
			</h2>
			<p className="overlay-text">
				{type === 'fullscreen'
					? 'You exited fullscreen mode. Please return to fullscreen to continue.'
					: type === 'visibility'
					? 'You switched tabs or minimized the window.'
					: 'Navigation attempt detected.'}
			</p>
			<button onClick={onAcknowledge} className="nav-btn primary">
				I Understand, Return to Exam
			</button>
		</div>
	</div>
);

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
