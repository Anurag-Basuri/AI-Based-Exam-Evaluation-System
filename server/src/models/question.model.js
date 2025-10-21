import mongoose from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

const RubricItemSchema = new mongoose.Schema(
	{
		criterion: {
			type: String,
			trim: true,
		},
		weight: {
			type: Number,
			min: 0,
			max: 1,
		},
	},
	{ _id: false },
);

const KeywordItemSchema = new mongoose.Schema(
	{
		term: {
			type: String,
			trim: true,
		},
		weight: {
			type: Number,
			default: 1,
		},
	},
	{ _id: false },
);

const AiPolicySchema = new mongoose.Schema(
	{
		strictness: {
			type: String,
			enum: ['lenient', 'moderate', 'strict'],
			default: 'moderate',
		},
		language: {
			type: String,
			default: 'en',
		},
		reviewTone: {
			type: String,
			default: 'concise',
		},
		targetLength: {
			type: Number,
			default: 3,
		},
		requireCitations: {
			type: Boolean,
			default: false,
		},
		customInstructions: {
			type: String,
			default: '',
		},
		rubric: {
			type: [RubricItemSchema],
			default: [],
		},
		keywords: {
			type: [KeywordItemSchema],
			default: [],
		},
		penalties: {
			type: Map,
			of: Number,
			default: undefined,
		},
	},
	{ _id: false },
);

const questionSchema = new mongoose.Schema(
	{
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
		slug: {
			type: String,
			unique: true,
			trim: true,
		},
		aiPolicy: {
			type: AiPolicySchema,
			default: undefined,
		},
	},
	{
		timestamps: true,
	},
);

// Validation
questionSchema.pre('validate', function (next) {
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

// Generate slug
questionSchema.pre('save', function (next) {
	if (this.isModified('text') || this.isNew) {
		this.slug = `${slugify(this.text.slice(0, 50), { lower: true, strict: true })}-${nanoid(6)}`;
	}
	next();
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
