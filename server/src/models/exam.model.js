import mongoose from 'mongoose';
import slugify from 'slugify';

const EXAM_LOCK_WINDOW = process.env.EXAM_LOCK_WINDOW
	? Number(process.env.EXAM_LOCK_WINDOW)
	: 5 * 60 * 1000; // 5 minutes default

// Define AI Policy Subschema(Only for subjective questions evaluation)
// How the model should evaluate subjective answers
const AiPolicySchema = new mongoose.Schema(
	{
		strictness: {
			type: String,
			enum: ['lenient', 'moderate', 'strict'],
			default: 'moderate',
		},
		reviewTone: {
			type: String,
			enum: ['concise', 'detailed', 'comprehensive', 'exhaustive'],
			default: 'concise',
		},

		// Number of expected words in answers
		expectedLength: {
			type: Number,
			default: 20,
		},
		customInstructions: {
			type: String,
			trim: true,
			maxlength: [500, 'Custom instructions cannot exceed 500 characters'],
			default: '',
		},
	},
	{ _id: false },
);

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
			immutable: true,
			default: () => {
				const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
				let id = '';
				for (let i = 0; i < 8; i++) {
					id += ALPHA[Math.floor(Math.random() * ALPHA.length)];
				}
				return id;
			},
			set: v =>
				String(v || '')
					.toUpperCase()
					.replace(/[^A-Z0-9]/g, '')
					.slice(0, 8),
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
		status: {
			type: String,
			enum: ['draft', 'active', 'completed', 'cancelled'],
			default: 'draft',
		},
		publishedAt: {
			type: Date,
			default: null,
		},
		totalMarks: {
			type: Number,
			default: 0,
			min: 0,
		},
		slug: {
			type: String,
			unique: true,
			trim: true,
		},
		aiPolicy: { type: AiPolicySchema, default: undefined },
	},
	{
		timestamps: true,
	},
);

// Generate slug before saving
examSchema.pre('save', function (next) {
	if (this.isModified('title') || this.isNew) {
		// Use the correct field name 'searchId'
		this.slug = `${slugify(this.title, { lower: true, strict: true })}-${this.searchId}`;
	}
	next();
});

// Allow exam creation without questions, but enforce at least one before startTime
examSchema.pre('validate', function (next) {
	const now = new Date();
	// Only enforce question presence if status is being set to 'active'
	if (
		this.status === 'active' &&
		(!Array.isArray(this.questions) || this.questions.length === 0)
	) {
		this.invalidate('questions', 'Exam must have at least one question before activation.');
	}
	if (this.startTime && this.endTime && this.endTime <= this.startTime) {
		this.invalidate('endTime', 'End time must be after start time.');
	}
	next();
});

// Mark exam completed if endTime has passed
examSchema.pre('save', function (next) {
    if (this.isModified('status') && this.status === 'active' && !this.publishedAt) {
        this.publishedAt = new Date();
    }
    // Only transition from 'active' to 'completed'
    if (this.status === 'active' && this.endTime && this.endTime < new Date()) {
        this.status = 'completed';
    }
    next();
});

// Simple cleanup function for orphan exams (call from a scheduled job if needed)
examSchema.statics.cleanupOrphanExams = async function () {
	const now = new Date();
	const orphanExams = await this.find({
		questions: { $size: 0 },
		status: 'draft',
		createdAt: { $lte: new Date(now - 24 * 60 * 60 * 1000) }, // older than 24h
	});
	for (const exam of orphanExams) {
		await this.findByIdAndDelete(exam._id);
	}
};

// Helpful index for status/time-based maintenance jobs
examSchema.index({ status: 1, endTime: 1 });

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
