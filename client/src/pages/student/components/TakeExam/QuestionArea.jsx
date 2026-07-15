import React, { useMemo } from 'react';
import { Check } from 'lucide-react';

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
		<div className="w-full max-w-4xl mx-auto animate-in slide-in-from-bottom-4 fade-in duration-300">
			<div className="glass-card bg-[var(--surface)] p-6 sm:p-10 rounded-3xl shadow-xl border border-[var(--border)] relative overflow-hidden">
				
				{/* Question header */}
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-6 border-b-2 border-[var(--bg-secondary)]">
					<div className="flex items-center gap-3">
						<span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 px-3 py-1 rounded-lg font-black text-sm">
							{index + 1}{totalQuestions ? ` / ${totalQuestions}` : ''}
						</span>
						<span className={`px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider ${
							isMCQ 
								? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' 
								: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400'
						}`}>
							{isMCQ ? 'MCQ' : 'Subjective'}
						</span>
					</div>
					<span className="bg-[var(--bg-secondary)] text-[var(--text-muted)] px-3 py-1 rounded-lg font-bold text-sm border border-[var(--border)]">
						{question.max_marks} Mark{question.max_marks !== 1 ? 's' : ''}
					</span>
				</div>

				{/* Question text */}
				<div className="text-xl sm:text-2xl font-bold text-[var(--text)] mb-10 leading-relaxed">
					{question.text}
				</div>

				{/* Answer section */}
				<div>
					{isMCQ ? (
						<div
							className="flex flex-col gap-4"
							role="radiogroup"
							aria-label={`Options for question ${index + 1}`}
						>
							{question.options?.map((opt, i) => {
								const optId = String(opt.id ?? opt._id ?? i);
								const isSelected = String(answer?.responseOption ?? '') === optId;
								return (
									<label
										key={optId}
										className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
											isSelected 
												? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
												: 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--bg-secondary)] hover:border-gray-300 dark:hover:border-gray-600'
										}`}
									>
										<span className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 font-black text-sm transition-colors ${
											isSelected 
												? 'bg-indigo-500 text-white shadow-md' 
												: 'bg-[var(--bg-secondary)] text-[var(--text-muted)]'
										}`}>
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
											className="hidden"
										/>
										<span className="text-base sm:text-lg font-medium text-[var(--text)] leading-relaxed flex-1">
											{opt.text}
										</span>
									</label>
								);
							})}
						</div>
					) : (
						<div className="relative">
							<textarea
								value={responseText}
								onChange={e =>
									onAnswerChange(question.id, e.target.value, 'subjective')
								}
								disabled={disabled}
								placeholder="Type your answer here..."
								className="w-full min-h-[240px] sm:min-h-[300px] p-5 rounded-2xl border-2 border-[var(--border)] bg-[var(--bg-secondary)] text-[var(--text)] text-base sm:text-lg font-medium outline-none focus:border-indigo-500 focus:bg-[var(--surface)] transition-all resize-y shadow-inner"
								spellCheck="true"
								aria-label={`Answer for question ${index + 1}`}
							/>
							{/* Text stats bar */}
							{textStats && (
								<div className="flex justify-between items-center mt-3 text-xs sm:text-sm font-bold text-[var(--text-muted)] px-2">
									<span>
										{textStats.words} word{textStats.words !== 1 ? 's' : ''} · {textStats.chars} character{textStats.chars !== 1 ? 's' : ''}
									</span>
									{textStats.words > 0 && (
										<span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-md">
											<Check className="w-3.5 h-3.5" />
											Answered
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
