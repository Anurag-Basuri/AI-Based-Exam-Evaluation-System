import mongoose from 'mongoose';
import { nanoid } from 'nanoid';
import slugify from 'slugify';

const examSchema = new mongoose.Schema(
	{
		searchId: {
			type: String,
			unique: true,
			required: [true, 'Search ID is required'],
			minlength: [8, 'Search ID must be 8 characters'],
			maxlength: [8, 'Search ID must be 8 characters'],
			trim: true,
			match: [/^[A-Za-z0-9]{8}$/, 'Search ID must be 8 alphanumeric characters'],
		},
		title: {
			type: String,
			required: [true, 'Exam title is required'],
			trim: true,
			maxlength: [100, 'Exam title cannot exceed 100 characters'],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [400, 'Description cannot exceed 400 characters'],
		},
		createdBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
			required: [true, 'Creator is required'],
		},
		duration: {
			type: Number,
			required: [true, 'Duration is required'],
			min: [1, 'Duration must be at least 1 minute'],
			max: [240, 'Duration cannot exceed 240 minutes'],
		},
		questions: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Question',
				required: true,
			},
		],
		startTime: {
			type: Date,
			required: [true, 'Start time is required'],
			validate: {
				validator: function (v) {
					return v && v > new Date();
				},
				message: 'Start time must be in the future',
			},
		},
		endTime: {
			type: Date,
			required: [true, 'End time is required'],
			validate: {
				validator: function (v) {
					if (v && this.startTime) {
						return v > this.startTime;
					}
					return true;
				},
				message: 'End time must be after start time',
			},
		},
		isActive: {
			type: Boolean,
			default: true,
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

examSchema.pre('validate', function (next) {
    if (!this.searchId) {
        this.searchId = nanoid(8);
    }
    next();
});

// Generate slug before saving
examSchema.pre('save', function (next) {
	if (this.isModified('title')) {
		this.slug = `${slugify(this.title, { lower: true, strict: true })}-${this.createdBy.toString().slice(-4)}`;
	}
	next();
});

// Ensure at least one question is present and time logic is correct
examSchema.pre('validate', function (next) {
	if (!this.questions || this.questions.length === 0) {
		this.invalidate('questions', 'Exam must have at least one question.');
	}
	if (this.startTime && this.endTime && this.endTime <= this.startTime) {
		this.invalidate('endTime', 'End time must be after start time.');
	}
	next();
});

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
