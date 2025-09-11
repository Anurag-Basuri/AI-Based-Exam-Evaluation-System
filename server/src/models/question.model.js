import mongoose from 'mongoose';
import slugify from 'slugify';

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
		tags: [
			{
				type: String,
				trim: true,
				maxlength: [50, 'Tag cannot exceed 50 characters'],
			},
		],
		difficulty: {
			type: String,
			enum: ['easy', 'medium', 'hard'],
			default: 'medium',
		},
		subject: {
			type: String,
			trim: true,
			required: [true, 'Subject is required'],
			maxlength: [100, 'Subject cannot exceed 100 characters'],
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
			required: [true, 'Creator is required'],
		},
		slug: {
			type: String,
			unique: true,
			trim: true,
		},
	},
	{
		timestamps: false,
	},
);

questionSchema.pre('save', function (next) {
	if (this.isModified('text')) {
		this.slug = slugify(this.text, { lower: true, strict: true });
	}
	next();
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
