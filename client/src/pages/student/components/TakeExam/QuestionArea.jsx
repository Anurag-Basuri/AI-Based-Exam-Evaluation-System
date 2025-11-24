import React from 'react';

const QuestionArea = ({ question, index, answer, onAnswerChange, disabled }) => {
	const isMCQ = question.type === 'multiple-choice';

	return (
		<div className="question-container">
			<div className="question-card">
				<div className="question-meta">
					<span>Question {index + 1}</span>
					<span>
						{question.max_marks} Mark{question.max_marks !== 1 ? 's' : ''}
					</span>
				</div>

				<div className="question-text">{question.text}</div>

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
										/>
										<span style={{ fontSize: '1rem' }}>{opt.text}</span>
									</label>
								);
							})}
						</div>
					) : (
						<textarea
							value={answer?.responseText || ''}
							onChange={e =>
								onAnswerChange(question.id, e.target.value, 'subjective')
							}
							disabled={disabled}
							placeholder="Type your answer here..."
							className="subjective-input"
						/>
					)}
				</div>
			</div>
		</div>
	);
};

export default QuestionArea;
