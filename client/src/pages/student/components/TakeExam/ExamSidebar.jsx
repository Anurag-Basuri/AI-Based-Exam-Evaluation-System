import React, { useMemo } from 'react';

const ExamSidebar = ({
	questions = [],
	answers = [],
	markedForReview = [],
	currentIndex = 0,
	onNavigate = () => {},
	isOpen = false,
	onClose = () => {},
	isOnline = true,
	lastSaved = null,
	saving = false,
	violations = { count: 0, lastType: '' },
	onSubmit = () => {},
}) => {
	// Defensive defaults & safe access
	const v = violations || { count: 0, lastType: '' };

	// Calculate stats
	const stats = useMemo(() => {
		const qList = Array.isArray(questions) ? questions : [];
		const aList = Array.isArray(answers) ? answers : [];
		const marked = Array.isArray(markedForReview) ? markedForReview.map(String) : [];
		let answered = 0;
		const statusMap = qList.map(q => {
			const qid = String(q?.id ?? q?._id ?? '');
			const ans = aList.find(a => String(a.question) === qid);
			const isAnswered = !!(
				(ans?.responseText && String(ans.responseText).trim().length > 0) ||
				ans?.responseOption
			);
			const isMarked = marked.includes(qid);

			if (isAnswered) answered++;

			if (isMarked && isAnswered) return 'answered-review';
			if (isMarked) return 'review';
			if (isAnswered) return 'answered';
			return 'unanswered';
		});

		return { statusMap, answered, total: qList.length };
	}, [questions, answers, markedForReview]);

	// map status to color/class used by CSS; keep inline fallback to ensure colors show
	const statusColor = status => {
		switch (status) {
			case 'answered':
				return { cls: 'answered', color: '#10b981' }; // green
			case 'review':
				return { cls: 'review', color: '#f59e0b' }; // amber
			case 'answered-review':
				return { cls: 'answered-review', color: '#8b5cf6' }; // purple
			default:
				return { cls: 'unanswered', color: '#cbd5e1' }; // gray
		}
	};

	const lastSavedText = saving
		? 'Saving...'
		: lastSaved
		? lastSaved instanceof Date
			? lastSaved.toLocaleTimeString()
			: (() => {
					try {
						return new Date(lastSaved).toLocaleTimeString();
					} catch {
						return String(lastSaved);
					}
			  })()
		: '--';

	return (
		<>
			{/* Mobile Backdrop */}
			<div
				className={`overlay-backdrop ${isOpen ? '' : 'mobile-only'}`}
				style={{ display: isOpen ? 'block' : 'none', zIndex: 9 }}
				onClick={onClose}
				aria-hidden={!isOpen}
			/>

			<aside className={`exam-sidebar ${isOpen ? 'open' : ''}`} aria-label="Question palette">
				<div className="sidebar-header">
					<span>Question Palette</span>
					<button
						className="nav-btn mobile-only"
						onClick={onClose}
						aria-label="Close palette"
					>
						×
					</button>
				</div>

				<div className="sidebar-content">
					<div className="palette-grid" role="list">
						{stats.statusMap.map((status, i) => {
							const s = statusColor(status);
							return (
								<button
									key={i}
									className={`palette-btn ${s.cls} ${
										i === currentIndex ? 'current' : ''
									}`}
									onClick={() => {
										onNavigate(i);
										if (window.innerWidth < 1024) onClose();
									}}
									aria-current={i === currentIndex}
									role="listitem"
									aria-label={`Question ${i + 1} ${status}`}
									style={{
										borderColor:
											i === currentIndex ? 'var(--primary)' : undefined,
									}}
								>
									<span
										className="palette-dot"
										style={{
											background: s.color,
											width: 10,
											height: 10,
											borderRadius: 6,
											display: 'inline-block',
											marginRight: 8,
										}}
										aria-hidden="true"
									/>
									{i + 1}
								</button>
							);
						})}
					</div>

					<div className="palette-legend" aria-hidden="false">
						<div className="legend-item">
							<span
								className="legend-dot success"
								style={{ background: '#10b981' }}
							/>{' '}
							Answered
						</div>
						<div className="legend-item">
							<span
								className="legend-dot warning"
								style={{ background: '#f59e0b' }}
							/>{' '}
							Review
						</div>
						<div className="legend-item">
							<span
								className="legend-dot answered-review"
								style={{ background: '#8b5cf6' }}
							/>{' '}
							Ans & Review
						</div>
						<div className="legend-item">
							<span
								className="legend-dot unanswered"
								style={{ background: '#cbd5e1' }}
							/>{' '}
							Unanswered
						</div>
					</div>

					<div style={{ marginTop: 'auto' }}>
						<div
							className="status-info"
							style={{
								background: 'var(--bg-secondary)',
								padding: 12,
								borderRadius: 8,
								fontSize: '0.8rem',
								display: 'flex',
								flexDirection: 'column',
								gap: 6,
							}}
						>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span>Status:</span>
								<span
									style={{
										color: isOnline ? 'var(--success)' : 'var(--error)',
										fontWeight: 600,
									}}
								>
									{isOnline ? 'Online' : 'Offline'}
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span>Last Saved:</span>
								<span>{lastSavedText}</span>
							</div>
							<div
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									color: v.count > 0 ? 'var(--warning)' : 'inherit',
								}}
							>
								<span>Violations:</span>
								<strong>{v.count} / 5</strong>
							</div>
						</div>
					</div>
				</div>

				<div className="sidebar-footer">
					<button
						className="nav-btn primary"
						style={{
							width: '100%',
							background: 'var(--error)',
							justifyContent: 'center',
						}}
						onClick={onSubmit}
						aria-label="Submit exam"
					>
						Submit Exam
					</button>
				</div>
			</aside>
		</>
	);
};

export default ExamSidebar;
