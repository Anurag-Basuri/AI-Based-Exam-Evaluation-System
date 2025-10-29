import mongoose from 'mongoose';
import { nanoid } from 'nanoid'; // add dependency if not present

const questionSchema = new mongoose.Schema(
	{
		// add slug so DB index conflict won't happen when it's missing
		slug: {
			type: String,
			trim: true,
			default: null,
		},
		type: {
			type: String,
			enum: ['multiple-choice', 'subjective'],
			required: [true, 'Question type is required'],
		},
		text: {
			type: String,
			required: [true, 'Question text is required'],
			trim: true,
			minlength: [5, 'Question text must be at least 5 characters'],
			maxlength: [1000, 'Question text cannot exceed 1000 characters'],
		},
		remarks: {
			type: String,
			trim: true,
			maxlength: [500, 'Remarks cannot exceed 500 characters'],
		},
		difficulty: {
			type: String,
			enum: ['easy', 'medium', 'hard'],
			default: 'medium',
		},
		tags: {
			type: [
				{
					type: String,
					trim: true,
					lowercase: true,
				},
			],
			default: [],
		},
		max_marks: {
			type: Number,
			required: [true, 'Maximum marks are required'],
			min: [1, 'Marks must be at least 1'],
			max: [100, 'Marks cannot exceed 100'],
		},
		options: [
			{
				text: {
					type: String,
					trim: true,
					required: function () {
						// Option text is only required on MCQ items
						return this?.parent()?.type === 'multiple-choice';
					},
				},
				isCorrect: {
					type: Boolean,
					default: false,
				},
			},
		],
		answer: {
			type: String,
			trim: true,
			// Make subjective model answer OPTIONAL to prevent validation failures
			required: false,
			default: null,
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
			required: [true, 'Creator is required'],
		},
		sourceExam: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Exam',
		},
	},
	{
		timestamps: true,
	},
);

// Add index for tags for faster searching
questionSchema.index({ tags: 1 });

// Replace the single-field slug index with a composite index scoped to the creator
questionSchema.index(
	{ slug: 1, createdBy: 1 },
	{ unique: true, partialFilterExpression: { slug: { $type: 'string' } } },
);

// Validation
questionSchema.pre('validate', function (next) {
	// Ensure slug exists; make deterministic (no nanoid) so different teachers can have the same base slug
	if (!this.slug && this.text) {
		const base = String(this.text || '')
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.trim()
			.replace(/\s+/g, '-')
			.slice(0, 60);
		// use deterministic slug (no random suffix). uniqueness is enforced with createdBy
		this.slug = base || 'q';
	}

	// MCQ validations
	if (this.type === 'multiple-choice') {
		if (!this.options || this.options.length < 2) {
			this.invalidate('options', 'Multiple-choice questions must have at least 2 options.');
		}
		const correctCount = (this.options || []).filter(opt => opt.isCorrect).length;
		if (correctCount === 0) {
			this.invalidate('options', 'At least one option must be marked as correct.');
		}
		// Ensure subjective-only field is cleared
		this.answer = null;
	}

	// Subjective: ensure options array is empty (not validated)
	if (this.type === 'subjective') {
		this.options = [];
		// answer is optional; keep null if not provided
		if (this.answer === undefined) this.answer = null;
	}

	next();
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
