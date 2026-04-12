import React from 'react';

const FormRow = ({ children }) => (
	<div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>{children}</div>
);

const FormField = ({ label, error, tooltip, children, htmlFor }) => (
	<div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
		<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
			<label htmlFor={htmlFor} style={{ color: 'var(--text)', fontWeight: 600, fontSize: 14 }}>
				{label}
				{tooltip && (
					<span
						style={{
							fontSize: 12,
							color: 'var(--text-muted)',
							marginLeft: 6,
							cursor: 'help'
						}}
						title={tooltip}
					>
						ⓘ
					</span>
				)}
			</label>
			{error && (
				<span style={{ color: '#ef4444', fontSize: 13, fontWeight: 500, animation: 'fadeIn 0.2s' }}>
					{error}
				</span>
			)}
		</div>
		{React.cloneElement(children, { error })}
	</div>
);

const FormInput = ({ error, isDark, ...props }) => (
	<input
		{...props}
		style={{
			width: '100%',
			padding: '12px 14px',
			borderRadius: 10,
			border: error ? '1px solid #ef4444' : (isDark ? '1px solid #334155' : '1px solid #cbd5e1'),
			background: isDark ? '#1e293b' : '#ffffff',
			color: isDark ? '#f8fafc' : '#0f172a',
			outline: 'none',
			fontSize: 15,
			boxShadow: error ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
			transition: 'border-color 0.2s, box-shadow 0.2s'
		}}
		onFocus={(e) => {
			if (!error) {
				e.target.style.borderColor = '#6366f1';
				e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
			}
		}}
		onBlur={(e) => {
			if (!error) {
				e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1';
				e.target.style.boxShadow = 'none';
			}
		}}
	/>
);

const FormTextarea = ({ error, isDark, ...props }) => (
	<textarea
		{...props}
		style={{
			width: '100%',
			padding: '12px 14px',
			borderRadius: 10,
			border: error ? '1px solid #ef4444' : (isDark ? '1px solid #334155' : '1px solid #cbd5e1'),
			background: isDark ? '#1e293b' : '#ffffff',
			color: isDark ? '#f8fafc' : '#0f172a',
			outline: 'none',
			fontSize: 15,
			minHeight: 100,
			resize: 'vertical',
			boxShadow: error ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
			transition: 'border-color 0.2s, box-shadow 0.2s'
		}}
		onFocus={(e) => {
			if (!error) {
				e.target.style.borderColor = '#6366f1';
				e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
			}
		}}
		onBlur={(e) => {
			if (!error) {
				e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1';
				e.target.style.boxShadow = 'none';
			}
		}}
	/>
);

const FormSelect = ({ error, isDark, ...props }) => (
	<select
		{...props}
		style={{
			width: '100%',
			padding: '12px 14px',
			borderRadius: 10,
			border: error ? '1px solid #ef4444' : (isDark ? '1px solid #334155' : '1px solid #cbd5e1'),
			background: isDark ? '#1e293b' : '#ffffff',
			color: isDark ? '#f8fafc' : '#0f172a',
			outline: 'none',
			fontSize: 15,
			cursor: props.disabled ? 'not-allowed' : 'pointer',
			boxShadow: error ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : 'none',
			transition: 'border-color 0.2s, box-shadow 0.2s'
		}}
		onFocus={(e) => {
			if (!error && !props.disabled) {
				e.target.style.borderColor = '#6366f1';
				e.target.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
			}
		}}
		onBlur={(e) => {
			if (!error) {
				e.target.style.borderColor = isDark ? '#334155' : '#cbd5e1';
				e.target.style.boxShadow = 'none';
			}
		}}
	/>
);


const ExamForm = ({ value, onChange, errors = {}, disabled, aiPolicy, onAiPolicyChange, isDark = false }) => {
	const handleChange = e => {
		const { name, value: val } = e.target;
		onChange({ ...value, [name]: val });
	};

	const handlePolicyChange = e => {
		const { name, value: val } = e.target;
		onAiPolicyChange({ ...aiPolicy, [name]: val });
	};

	return (
		<form onSubmit={e => e.preventDefault()} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
			
			<FormField label="Exam Title" error={errors.title} htmlFor="title">
				<FormInput
					id="title"
					disabled={disabled}
					placeholder="e.g., Mid Term 2025 - Physics"
					name="title"
					value={value.title}
					onChange={handleChange}
					isDark={isDark}
				/>
			</FormField>

			<FormField label="Description" error={errors.description} htmlFor="description">
				<FormTextarea
					id="description"
					disabled={disabled}
					placeholder="Brief description for students"
					name="description"
					value={value.description}
					onChange={handleChange}
					isDark={isDark}
				/>
			</FormField>

			<FormRow>
				<FormField label="Duration (minutes)" error={errors.duration} htmlFor="duration">
					<FormInput
						id="duration"
						disabled={disabled}
						type="number"
						min={1}
						max={240}
						name="duration"
						value={value.duration}
						onChange={handleChange}
						isDark={isDark}
					/>
				</FormField>
			</FormRow>

			<FormRow>
				<FormField label="Start Time" error={errors.startTime} htmlFor="startTime" tooltip="When students can begin the exam.">
					<FormInput
						id="startTime"
						disabled={disabled}
						type="datetime-local"
						name="startTime"
						value={value.startTime}
						onChange={handleChange}
						isDark={isDark}
					/>
				</FormField>

				<FormField label="End Time" error={errors.endTime} htmlFor="endTime" tooltip="When the exam automatically locks.">
					<FormInput
						id="endTime"
						disabled={disabled}
						type="datetime-local"
						name="endTime"
						value={value.endTime}
						onChange={handleChange}
						isDark={isDark}
					/>
				</FormField>
			</FormRow>

			{/* AI Policy Section */}
			{aiPolicy && onAiPolicyChange && (
				<div style={{
					marginTop: 12,
					paddingTop: 24,
					borderTop: isDark ? '1px solid #334155' : '1px solid #e2e8f0'
				}}>
					<h3
						style={{
							margin: '0 0 16px',
							fontSize: 18,
							fontWeight: 700,
							color: isDark ? '#f8fafc' : '#0f172a',
							display: 'flex',
							alignItems: 'baseline',
							gap: 8
						}}
					>
						AI Evaluation Policy
						<span style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#94a3b8' : '#64748b' }}>
							(For subjective questions)
						</span>
					</h3>

					<div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
						<FormRow>
							<FormField
								label="Strictness"
								htmlFor="strictness"
								tooltip="Controls how strictly the AI adheres to the reference answer and grading criteria."
							>
								<FormSelect
									id="strictness"
									name="strictness"
									value={aiPolicy.strictness}
									onChange={handlePolicyChange}
									disabled={disabled}
									isDark={isDark}
								>
									<option value="lenient">Lenient</option>
									<option value="moderate">Moderate</option>
									<option value="strict">Strict</option>
								</FormSelect>
							</FormField>

							<FormField
								label="Review Tone"
								htmlFor="reviewTone"
								tooltip="Determines the level of detail in the AI's feedback to the student."
							>
								<FormSelect
									id="reviewTone"
									name="reviewTone"
									value={aiPolicy.reviewTone}
									onChange={handlePolicyChange}
									disabled={disabled}
									isDark={isDark}
								>
									<option value="concise">Concise</option>
									<option value="detailed">Detailed</option>
									<option value="comprehensive">Comprehensive</option>
								</FormSelect>
							</FormField>
						</FormRow>

						<FormRow>
							<FormField
								label="Expected Answer Length (Words)"
								htmlFor="expectedLength"
								tooltip="The approximate number of words the AI expects in a good answer."
							>
								<FormInput
									id="expectedLength"
									name="expectedLength"
									type="number"
									value={aiPolicy.expectedLength}
									onChange={handlePolicyChange}
									disabled={disabled}
									min="10"
									step="5"
									isDark={isDark}
								/>
							</FormField>
						</FormRow>

						<FormField
							label="Custom Instructions"
							htmlFor="customInstructions"
							tooltip="Provide any extra instructions for the AI evaluator, e.g., 'Focus on the historical context' or 'Penalize spelling errors'."
						>
							<FormTextarea
								id="customInstructions"
								name="customInstructions"
								value={aiPolicy.customInstructions}
								onChange={handlePolicyChange}
								disabled={disabled}
								rows="3"
								placeholder="e.g., Focus on the main concepts..."
								isDark={isDark}
							/>
						</FormField>
					</div>
				</div>
			)}
			<style>{`
				@keyframes fadeIn {
					from { opacity: 0; transform: translateY(-4px); }
					to { opacity: 1; transform: translateY(0); }
				}
			`}</style>
		</form>
	);
};

export default ExamForm;
