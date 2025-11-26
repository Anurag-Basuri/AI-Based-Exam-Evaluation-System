import React from 'react';

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

const MCQEditor = ({ value = [], onChange }) => {
	const setOption = (idx, patch) => {
		const next = value.map((o, i) => (i === idx ? { ...o, ...patch } : o));
		onChange?.(next);
	};
	const addOption = () => onChange?.([...value, { text: '', isCorrect: false }]);
	const removeOption = idx => onChange?.(value.filter((_, i) => i !== idx));
	const toggleCorrect = idx => setOption(idx, { isCorrect: !value[idx]?.isCorrect });

	return (
		<div style={{ display: 'grid', gap: 10 }}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
				<strong style={{ color: 'var(--text)' }}>Options</strong>
				<button
					onClick={addOption}
					type="button"
					style={{
						padding: '8px 12px',
						borderRadius: 8,
						border: '1px solid var(--border)',
						background: 'var(--surface)',
						color: 'var(--text)',
						fontWeight: 800,
						cursor: 'pointer',
						fontSize: 12,
					}}
				>
					Add option
				</button>
			</div>
			{value.map((opt, idx) => (
				<div
					key={idx}
					style={{
						display: 'grid',
						gridTemplateColumns: '1fr auto auto',
						gap: 8,
						alignItems: 'center',
						background: 'var(--surface)',
						border: '1px solid var(--border)',
						borderRadius: 10,
						padding: 8,
					}}
				>
					<input
						style={inputStyle}
						placeholder={`Option ${idx + 1}`}
						value={opt.text}
						onChange={e => setOption(idx, { text: e.target.value })}
					/>
					<button
						type="button"
						onClick={() => toggleCorrect(idx)}
						style={{
							padding: '8px 10px',
							borderRadius: 8,
							border: `1px solid ${opt.isCorrect ? '#10b981' : 'var(--border)'}`,
							background: opt.isCorrect
								? 'color-mix(in srgb, #10b981 15%, var(--surface))'
								: 'var(--surface)',
							color: opt.isCorrect ? '#065f46' : 'var(--text)',
							fontWeight: 800,
							cursor: 'pointer',
							whiteSpace: 'nowrap',
						}}
						title="Toggle correct"
					>
						{opt.isCorrect ? 'Correct ✓' : 'Mark correct'}
					</button>
					<button
						type="button"
						onClick={() => removeOption(idx)}
						style={{
							padding: '8px 10px',
							borderRadius: 8,
							border: '1px solid var(--border)',
							background: 'var(--surface)',
							color: '#dc2626',
							fontWeight: 800,
							cursor: 'pointer',
						}}
					>
						Remove
					</button>
				</div>
			))}
			{value.length < 2 && (
				<div style={{ color: 'var(--text-muted)', fontSize: 12 }}>
					Add at least 2 options and mark one correct.
				</div>
			)}
		</div>
	);
};

export default MCQEditor;
