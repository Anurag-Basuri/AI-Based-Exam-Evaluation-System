import mongoose from 'mongoose';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

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
						return this.type === 'multiple-choice';
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
			required: function () {
				return this.type === 'subjective';
			},
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
	},
	{
		timestamps: true,
	},
);

// Validation
questionSchema.pre('validate', function (next) {
	if (this.type === 'multiple-choice') {
		if (!this.options || this.options.length < 2) {
			this.invalidate('options', 'Multiple-choice questions must have at least 2 options.');
		}
		const correctCount = (this.options || []).filter(opt => opt.isCorrect).length;
		if (correctCount === 0) {
			this.invalidate('options', 'At least one option must be marked as correct.');
		}
	}

	// Subjective answers should be optional, not forced
	if (this.type === 'subjective' && !this.answer) {
		this.answer = null; // optional
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
