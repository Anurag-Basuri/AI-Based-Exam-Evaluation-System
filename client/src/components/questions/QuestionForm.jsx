import React from 'react';
import MCQEditor from './MCQEditor.jsx';
import SubjectiveEditor from './SubjectiveEditor.jsx';

const inputStyle = {
	width: '100%',
	padding: '10px 12px',
	borderRadius: 10,
	border: '1px solid var(--border)',
	background: 'var(--bg)',
	color: 'var(--text)',
	outline: 'none',
	fontSize: 14,
};

const QuestionForm = ({ defaultType = 'multiple-choice', onCancel, onSave }) => {
	const [type, setType] = React.useState(defaultType);
	const [text, setText] = React.useState('');
	const [remarks, setRemarks] = React.useState('');
	const [maxMarks, setMaxMarks] = React.useState(1);
	const [mcq, setMcq] = React.useState([
		{ text: '', isCorrect: false },
		{ text: '', isCorrect: false },
	]);
	const [answer, setAnswer] = React.useState('');
	const [error, setError] = React.useState('');

	const validate = () => {
		if (!type) return 'Type is required';
		if (!text.trim()) return 'Question text is required';
		if (!maxMarks || Number(maxMarks) < 1) return 'Max marks must be >= 1';
		if (type === 'multiple-choice') {
			const opts = mcq.filter(o => o.text.trim());
			if (opts.length < 2) return 'MCQ requires at least 2 options';
			if (!opts.some(o => o.isCorrect)) return 'At least one option must be correct';
		}
		return '';
	};

	const onSubmit = () => {
		const v = validate();
		if (v) {
			setError(v);
			return;
		}
		const payload =
			type === 'multiple-choice'
				? {
						type,
						text: text.trim(),
						remarks: remarks.trim(),
						max_marks: Number(maxMarks),
						options: mcq
							.filter(o => o.text.trim())
							.map(o => ({ text: o.text.trim(), isCorrect: !!o.isCorrect })),
					}
				: {
						type,
						text: text.trim(),
						remarks: remarks.trim(),
						max_marks: Number(maxMarks),
						answer: answer?.trim() || null,
					};
		onSave?.(payload);
	};

	return (
		<div>
			<header
				style={{
					display: 'flex',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: 10,
				}}
			>
				<div>
					<h3 style={{ margin: 0, color: 'var(--text)' }}>Create Question</h3>
					<p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
						Supports MCQ and subjective.
					</p>
				</div>
				<select
					value={type}
					onChange={e => setType(e.target.value)}
					style={{
						background: 'var(--bg)',
						color: 'var(--text)',
						border: '1px solid var(--border)',
						borderRadius: 8,
						padding: '8px 10px',
						fontWeight: 700,
					}}
				>
					<option value="multiple-choice">Multiple Choice</option>
					<option value="subjective">Subjective</option>
				</select>
			</header>

			<div style={{ display: 'grid', gap: 12 }}>
				<label style={{ display: 'grid', gap: 6 }}>
					<span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>
						Question text
					</span>
					<textarea
						style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
						placeholder="Write the question statement here…"
						value={text}
						onChange={e => setText(e.target.value)}
					/>
				</label>

				<div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
					<label style={{ display: 'grid', gap: 6 }}>
						<span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>
							Max marks
						</span>
						<input
							type="number"
							min={1}
							max={100}
							style={inputStyle}
							value={maxMarks}
							onChange={e => setMaxMarks(e.target.value)}
						/>
					</label>
					<label style={{ display: 'grid', gap: 6 }}>
						<span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>
							Remarks (optional)
						</span>
						<input
							style={inputStyle}
							placeholder="Any evaluator hint"
							value={remarks}
							onChange={e => setRemarks(e.target.value)}
						/>
					</label>
				</div>

				{type === 'multiple-choice' ? (
					<MCQEditor value={mcq} onChange={setMcq} />
				) : (
					<SubjectiveEditor value={answer} onChange={setAnswer} />
				)}

				{error && <div style={{ color: '#ef4444', fontWeight: 700 }}>{error}</div>}

				<div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
					<button
						onClick={onCancel}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: 'var(--text)',
							fontWeight: 800,
							cursor: 'pointer',
						}}
					>
						Cancel
					</button>
					<button
						onClick={onSubmit}
						style={{
							padding: '10px 14px',
							borderRadius: 10,
							border: 'none',
							background: 'linear-gradient(135deg, #10b981, #059669)',
							color: '#fff',
							fontWeight: 800,
							cursor: 'pointer',
						}}
					>
						Save question
					</button>
				</div>
			</div>
		</div>
	);
};

export default QuestionForm;
