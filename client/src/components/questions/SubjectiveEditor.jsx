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

const SubjectiveEditor = ({ value, onChange }) => {
	return (
		<div style={{ display: 'grid', gap: 8 }}>
			<label style={{ display: 'grid', gap: 6 }}>
				<span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>
					Model answer (optional)
				</span>
				<textarea
					style={{ ...inputStyle, minHeight: 100, resize: 'vertical' }}
					placeholder="Optional reference answer for evaluators"
					value={value || ''}
					onChange={e => onChange?.(e.target.value)}
				/>
			</label>
		</div>
	);
};

export default SubjectiveEditor;
