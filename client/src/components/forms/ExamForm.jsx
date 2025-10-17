import React from 'react';

const Field = ({ label, error, children }) => (
	<label style={{ display: 'grid', gap: 6 }}>
		<span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>{label}</span>
		{children}
		{error ? (
			<span style={{ color: '#ef4444', fontSize: 12, fontWeight: 700 }}>{error}</span>
		) : null}
	</label>
);

const inputStyle = {
	width: '100%',
	padding: '12px 14px',
	borderRadius: 10,
	border: '1px solid var(--border)',
	background: 'var(--bg)',
	color: 'var(--text)',
	outline: 'none',
	fontSize: 14,
};

const ExamForm = ({ value, onChange, errors = {}, disabled = false }) => {
	const set = (k, v) => onChange(prev => ({ ...prev, [k]: v }));

	return (
		<div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>
			<div style={{ gridColumn: '1 / -1' }}>
				<Field label="Title" error={errors.title}>
					<input
						disabled={disabled}
						style={inputStyle}
						placeholder="e.g., Mid Term 2025 - Physics"
						value={value.title}
						onChange={e => set('title', e.target.value)}
					/>
				</Field>
			</div>

			<div style={{ gridColumn: '1 / -1' }}>
				<Field label="Description">
					<textarea
						disabled={disabled}
						style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
						placeholder="Brief description for students"
						value={value.description}
						onChange={e => set('description', e.target.value)}
					/>
				</Field>
			</div>

			<div>
				<Field label="Duration (minutes)" error={errors.duration}>
					<input
						disabled={disabled}
						type="number"
						min={1}
						max={240}
						style={inputStyle}
						value={value.duration}
						onChange={e => set('duration', e.target.value)}
					/>
				</Field>
			</div>

			<div>
				<Field label="Start time" error={errors.startTime}>
					<input
						disabled={disabled}
						type="datetime-local"
						style={inputStyle}
						value={value.startTime}
						onChange={e => set('startTime', e.target.value)}
					/>
				</Field>
			</div>

			<div>
				<Field label="End time" error={errors.endTime}>
					<input
						disabled={disabled}
						type="datetime-local"
						style={inputStyle}
						value={value.endTime}
						onChange={e => set('endTime', e.target.value)}
					/>
				</Field>
			</div>
		</div>
	);
};

export default ExamForm;
