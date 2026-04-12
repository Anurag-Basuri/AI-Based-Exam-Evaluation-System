import React, { useMemo } from 'react';

const QuestionArea = ({ question, index, answer, onAnswerChange, disabled, totalQuestions }) => {
	const isMCQ = question.type === 'multiple-choice';
	const responseText = answer?.responseText || '';

	// Word and character count for subjective answers
	const textStats = useMemo(() => {
		if (isMCQ) return null;
		const chars = responseText.length;
		const words = responseText.trim() ? responseText.trim().split(/\s+/).length : 0;
		return { chars, words };
	}, [responseText, isMCQ]);

	return (
		<div className="question-container">
			<div className="question-card">
				{/* Question header */}
				<div className="question-meta">
					<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
						<span style={{
							background: 'var(--primary-light-bg)', color: 'var(--primary-strong)',
							padding: '4px 10px', borderRadius: 6, fontWeight: 800, fontSize: '0.8rem',
						}}>
							{index + 1}{totalQuestions ? ` / ${totalQuestions}` : ''}
						</span>
						<span style={{
							background: isMCQ ? '#dcfce7' : '#e0e7ff',
							color: isMCQ ? '#16a34a' : '#4338ca',
							padding: '3px 8px', borderRadius: 6, fontSize: '0.7rem',
							fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
						}}>
							{isMCQ ? 'MCQ' : 'Subjective'}
						</span>
					</div>
					<span style={{
						background: 'var(--bg-secondary)', padding: '4px 10px',
						borderRadius: 6, fontWeight: 700, fontSize: '0.8rem',
					}}>
						{question.max_marks} Mark{question.max_marks !== 1 ? 's' : ''}
					</span>
				</div>

				{/* Question text */}
				<div className="question-text">{question.text}</div>

				{/* Answer section */}
				<div className="answer-section">
					{isMCQ ? (
						<div
							className="options-list"
							role="radiogroup"
							aria-label={`Options for question ${index + 1}`}
						>
							{question.options?.map((opt, i) => {
								const optId = String(opt.id ?? opt._id ?? i);
								const isSelected = String(answer?.responseOption ?? '') === optId;
								return (
									<label
										key={optId}
										className={`option-item ${isSelected ? 'selected' : ''}`}
									>
										<span className="option-letter" style={{
											width: 32, height: 32, borderRadius: 8,
											background: isSelected ? 'var(--primary)' : 'var(--bg-secondary)',
											color: isSelected ? '#fff' : 'var(--text-muted)',
											display: 'flex', alignItems: 'center', justifyContent: 'center',
											fontWeight: 800, fontSize: 13, flexShrink: 0,
											transition: 'all 0.15s ease',
										}}>
											{String.fromCharCode(65 + i)}
										</span>
										<input
											type="radio"
											name={`q-${String(question.id)}`}
											value={optId}
											checked={isSelected}
											onChange={e =>
												onAnswerChange(
													question.id,
													String(e.target.value),
													'multiple-choice',
												)
											}
											disabled={disabled}
											className="option-radio"
											style={{ display: 'none' }}
										/>
										<span style={{ fontSize: '1rem', lineHeight: 1.5 }}>{opt.text}</span>
									</label>
								);
							})}
						</div>
					) : (
						<div style={{ position: 'relative' }}>
							<textarea
								value={responseText}
								onChange={e =>
									onAnswerChange(question.id, e.target.value, 'subjective')
								}
								disabled={disabled}
								placeholder="Type your answer here..."
								className="subjective-input"
								spellCheck="true"
								aria-label={`Answer for question ${index + 1}`}
							/>
							{/* Text stats bar */}
							{textStats && (
								<div style={{
									display: 'flex', justifyContent: 'space-between', alignItems: 'center',
									padding: '8px 4px 0', fontSize: 12, color: 'var(--text-muted)',
								}}>
									<span>
										{textStats.words} word{textStats.words !== 1 ? 's' : ''} · {textStats.chars} character{textStats.chars !== 1 ? 's' : ''}
									</span>
									{textStats.words > 0 && (
										<span style={{
											color: 'var(--success)', fontWeight: 600, fontSize: 11,
											display: 'flex', alignItems: 'center', gap: 4,
										}}>
											✓ Answered
										</span>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default QuestionArea;
