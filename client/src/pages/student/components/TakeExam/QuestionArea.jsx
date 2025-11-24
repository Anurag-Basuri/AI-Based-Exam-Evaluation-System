import React from 'react';

const QuestionArea = ({ question, index, answer, onAnswerChange, disabled }) => {
    const isMCQ = question.type === 'multiple-choice';

    return (
        <div className="question-container">
            <div className="question-card">
                <div className="question-meta">
                    <span>Question {index + 1}</span>
                    <span>{question.max_marks} Mark{question.max_marks !== 1 ? 's' : ''}</span>
                </div>

                <div className="question-text">
                    {question.text}
                </div>

                <div className="answer-section">
                    {isMCQ ? (
                        <div className="options-list">
                            {question.options?.map((opt, i) => {
                                const isSelected = String(answer?.responseOption) === String(opt.id);
                                return (
                                    <label 
                                        key={opt.id || i} 
                                        className={`option-item ${isSelected ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`q-${question.id}`}
                                            value={opt.id}
                                            checked={isSelected}
                                            onChange={() => onAnswerChange(question.id, String(opt.id), 'multiple-choice')}
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
                            onChange={(e) => onAnswerChange(question.id, e.target.value, 'subjective')}
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
