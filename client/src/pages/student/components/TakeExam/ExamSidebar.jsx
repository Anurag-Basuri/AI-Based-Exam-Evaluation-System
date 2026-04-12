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
			const isAnswered = !!((ans?.responseText && String(ans.responseText).trim().length > 0) || ans?.responseOption);
			const isMarked = marked.includes(qid);

			if (isAnswered) answered++;

			if (isMarked && isAnswered) return 'answered-review';
			if (isMarked) return 'review';
			if (isAnswered) return 'answered';
			return 'unanswered';
		});

		return { statusMap, answered, total: qList.length };
	}, [questions, answers, markedForReview]);

	const statusColor = status => {
		switch (status) {
			case 'answered': return { cls: 'answered', color: '#10b981' };
			case 'review': return { cls: 'review', color: '#f59e0b' };
			case 'answered-review': return { cls: 'answered-review', color: '#8b5cf6' };
			default: return { cls: 'unanswered', color: '#cbd5e1' };
		}
	};

	const lastSavedText = saving
		? 'Saving...'
		: lastSaved
			? lastSaved instanceof Date
				? lastSaved.toLocaleTimeString()
				: (() => { try { return new Date(lastSaved).toLocaleTimeString(); } catch { return String(lastSaved); } })()
			: '--';

	const progressPct = stats.total > 0 ? Math.round((stats.answered / stats.total) * 100) : 0;

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
					<span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Question Palette</span>
					<button className="nav-btn mobile-only" onClick={onClose} aria-label="Close palette">
						×
					</button>
				</div>

				<div className="sidebar-content">
					{/* Progress bar */}
					<div style={{ marginBottom: 8 }}>
						<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 12, fontWeight: 700 }}>
							<span style={{ color: 'var(--text-muted)' }}>Progress</span>
							<span style={{ color: progressPct === 100 ? '#10b981' : 'var(--text)' }}>
								{stats.answered} / {stats.total} ({progressPct}%)
							</span>
						</div>
						<div style={{ height: 5, borderRadius: 3, background: 'var(--border)', overflow: 'hidden' }}>
							<div style={{
								height: '100%', borderRadius: 3, transition: 'width 0.3s ease',
								width: `${progressPct}%`,
								background: progressPct === 100 ? '#10b981' : 'var(--primary)',
							}} />
						</div>
					</div>

					{/* Question grid */}
					<div className="palette-grid" role="list">
						{stats.statusMap.map((status, i) => {
							const s = statusColor(status);
							return (
								<button
									key={i}
									className={`palette-btn ${s.cls} ${i === currentIndex ? 'current' : ''}`}
									onClick={() => {
										onNavigate(i);
										if (window.innerWidth < 1024) onClose();
									}}
									aria-current={i === currentIndex}
									role="listitem"
									aria-label={`Question ${i + 1} ${status}`}
								>
									<span
										className="palette-dot"
										style={{
											background: s.color, width: 8, height: 8,
											borderRadius: 4, display: 'inline-block', marginRight: 6,
										}}
										aria-hidden="true"
									/>
									{i + 1}
								</button>
							);
						})}
					</div>

					{/* Legend */}
					<div className="palette-legend" aria-hidden="false">
						{[
							{ cls: 'success', color: '#10b981', label: 'Answered' },
							{ cls: 'warning', color: '#f59e0b', label: 'Review' },
							{ cls: 'answered-review', color: '#8b5cf6', label: 'Ans & Review' },
							{ cls: 'unanswered', color: '#cbd5e1', label: 'Unanswered' },
						].map(item => (
							<div key={item.label} className="legend-item">
								<span className={`legend-dot ${item.cls}`} style={{ background: item.color }} />
								{item.label}
							</div>
						))}
					</div>

					{/* Status panel */}
					<div style={{ marginTop: 'auto' }}>
						<div style={{
							background: 'var(--bg-secondary)', padding: 12, borderRadius: 10,
							fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 8,
						}}>
							<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
								<span style={{ color: 'var(--text-muted)' }}>Connection</span>
								<span style={{
									display: 'flex', alignItems: 'center', gap: 5,
									color: isOnline ? 'var(--success)' : 'var(--error)', fontWeight: 600,
								}}>
									<span style={{
										width: 7, height: 7, borderRadius: '50%',
										background: isOnline ? 'var(--success)' : 'var(--error)',
									}} />
									{isOnline ? 'Online' : 'Offline'}
								</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								<span style={{ color: 'var(--text-muted)' }}>Last Saved</span>
								<span style={{ fontWeight: 600, color: saving ? 'var(--primary)' : 'var(--text)' }}>{lastSavedText}</span>
							</div>
							<div style={{ display: 'flex', justifyContent: 'space-between', color: v.count > 0 ? 'var(--warning)' : 'inherit' }}>
								<span style={{ color: v.count > 0 ? undefined : 'var(--text-muted)' }}>Violations</span>
								<strong>{v.count} / 5</strong>
							</div>
						</div>
					</div>
				</div>

				<div className="sidebar-footer">
					<button
						className="nav-btn primary"
						style={{ width: '100%', background: 'var(--error)', justifyContent: 'center', borderRadius: 10, fontWeight: 700 }}
						onClick={onSubmit}
						aria-label="Submit exam"
					>
						🏁 Submit Exam
					</button>
				</div>
			</aside>
		</>
	);
};

export default ExamSidebar;
