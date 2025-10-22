import React from 'react';

const FormRow = ({ children }) => (
	<div style={{ display: 'grid', gap: 14, gridTemplateColumns: '1fr 1fr' }}>{children}</div>
);

const FormLabel = ({ children, htmlFor, tooltip }) => (
	<label htmlFor={htmlFor} style={{ display: 'grid', gap: 6 }}>
		<span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 13 }}>
			{children}
			{tooltip ? (
				<span
					style={{
						fontSize: 12,
						fontWeight: 400,
						color: 'var(--text-muted)',
						marginLeft: 4,
					}}
					title={tooltip}
				>
					?
				</span>
			) : null}
		</span>
	</label>
);

const FormInput = ({ error, ...props }) => (
	<input
		{...props}
		style={{
			width: '100%',
			padding: '12px 14px',
			borderRadius: 10,
			border: '1px solid var(--border)',
			background: 'var(--bg)',
			color: 'var(--text)',
			outline: 'none',
			fontSize: 14,
		}}
	/>
);

const ExamForm = ({ value, onChange, errors, disabled, aiPolicy, onAiPolicyChange }) => {
	const handleChange = e => {
		const { name, value: val } = e.target;
		onChange({ ...value, [name]: val });
	};

	const handlePolicyChange = e => {
		const { name, value: val } = e.target;
		onAiPolicyChange({ ...aiPolicy, [name]: val });
	};

	return (
		<form onSubmit={e => e.preventDefault()}>
			<FormRow>
				<div style={{ gridColumn: '1 / -1' }}>
					<FormLabel label="Title" error={errors.title}>
						<FormInput
							disabled={disabled}
							placeholder="e.g., Mid Term 2025 - Physics"
							name="title"
							value={value.title}
							onChange={handleChange}
						/>
					</FormLabel>
				</div>

				<div style={{ gridColumn: '1 / -1' }}>
					<FormLabel label="Description" error={errors.description}>
						<textarea
							disabled={disabled}
							style={{
								width: '100%',
								padding: '12px 14px',
								borderRadius: 10,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								outline: 'none',
								fontSize: 14,
								minHeight: 90,
								resize: 'vertical',
							}}
							placeholder="Brief description for students"
							name="description"
							value={value.description}
							onChange={handleChange}
						/>
					</FormLabel>
				</div>

				<div>
					<FormLabel label="Duration (minutes)" error={errors.duration}>
						<FormInput
							disabled={disabled}
							type="number"
							min={1}
							max={240}
							name="duration"
							value={value.duration}
							onChange={handleChange}
						/>
					</FormLabel>
				</div>

				<div>
					<FormLabel label="Start time" error={errors.startTime}>
						<FormInput
							disabled={disabled}
							type="datetime-local"
							name="startTime"
							value={value.startTime}
							onChange={handleChange}
						/>
					</FormLabel>
				</div>

				<div>
					<FormLabel label="End time" error={errors.endTime}>
						<FormInput
							disabled={disabled}
							type="datetime-local"
							name="endTime"
							value={value.endTime}
							onChange={handleChange}
						/>
					</FormLabel>
				</div>
			</FormRow>

			{/* AI Policy Section */}
			{aiPolicy && onAiPolicyChange && (
				<>
					<h3
						style={{
							marginTop: 24,
							marginBottom: 12,
							fontSize: 18,
							fontWeight: 700,
							color: 'var(--text)',
							borderTop: '1px solid var(--border)',
							paddingTop: 16,
						}}
					>
						AI Evaluation Policy
						<span
							style={{
								fontSize: 13,
								fontWeight: 500,
								color: 'var(--text-muted)',
								marginLeft: 8,
							}}
						>
							(For subjective questions)
						</span>
					</h3>

					<FormRow>
						<FormLabel
							htmlFor="strictness"
							tooltip="Controls how strictly the AI adheres to the reference answer and grading criteria."
						>
							Strictness
						</FormLabel>
						<select
							id="strictness"
							name="strictness"
							value={aiPolicy.strictness}
							onChange={handlePolicyChange}
							disabled={disabled}
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
							}}
						>
							<option value="lenient">Lenient</option>
							<option value="moderate">Moderate</option>
							<option value="strict">Strict</option>
						</select>
					</FormRow>

					<FormRow>
						<FormLabel
							htmlFor="reviewTone"
							tooltip="Determines the level of detail in the AI's feedback to the student."
						>
							Review Tone
						</FormLabel>
						<select
							id="reviewTone"
							name="reviewTone"
							value={aiPolicy.reviewTone}
							onChange={handlePolicyChange}
							disabled={disabled}
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
							}}
						>
							<option value="concise">Concise</option>
							<option value="detailed">Detailed</option>
							<option value="comprehensive">Comprehensive</option>
						</select>
					</FormRow>

					<FormRow>
						<FormLabel
							htmlFor="expectedLength"
							tooltip="The approximate number of words the AI expects in a good answer."
						>
							Expected Answer Length (Words)
						</FormLabel>
						<FormInput
							id="expectedLength"
							name="expectedLength"
							type="number"
							value={aiPolicy.expectedLength}
							onChange={handlePolicyChange}
							disabled={disabled}
							min="10"
							step="5"
						/>
					</FormRow>

					<FormRow>
						<FormLabel
							htmlFor="customInstructions"
							tooltip="Provide any extra instructions for the AI evaluator, e.g., 'Focus on the historical context' or 'Penalize spelling errors'."
						>
							Custom Instructions
						</FormLabel>
						<textarea
							id="customInstructions"
							name="customInstructions"
							value={aiPolicy.customInstructions}
							onChange={handlePolicyChange}
							disabled={disabled}
							rows="3"
							placeholder="e.g., Focus on the main concepts..."
							style={{
								width: '100%',
								padding: '10px 12px',
								borderRadius: 8,
								border: '1px solid var(--border)',
								background: 'var(--bg)',
								color: 'var(--text)',
								resize: 'vertical',
							}}
						/>
					</FormRow>
				</>
			)}
		</form>
	);
};

export default ExamForm;
