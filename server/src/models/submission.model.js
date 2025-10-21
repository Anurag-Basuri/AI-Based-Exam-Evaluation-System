import mongoose from 'mongoose';

const EvaluationMetaSchema = new mongoose.Schema(
	{
		rubric_breakdown: {
			type: Array,
			default: undefined,
		},
		keywords_matched: {
			type: Array,
			default: undefined,
		},
		penalties_applied: {
			type: Array,
			default: undefined,
		},
		evalId: {
			type: String,
		},
		path: {
			type: String,
		},
		truncatedInput: {
			type: Boolean,
		},
		fallback: {
			type: Boolean,
		},
		type: {
			type: String,
		},
		reason: {
			type: String,
		},
		message: {
			type: String,
		},
	},
	{ _id: false },
);

const SingleEvaluationSchema = new mongoose.Schema(
	{
		evaluator: {
			type: String,
			enum: ['ai', 'teacher', 'system'],
			default: 'ai',
		},
		marks: {
			type: Number,
			required: true,
			min: 0,
		},
		remarks: {
			type: String,
			default: '',
		},
		evaluatedAt: {
			type: Date,
			default: Date.now,
		},
		meta: {
			type: EvaluationMetaSchema,
			default: undefined,
		},
	},
	{ _id: false },
);

const EvaluationSchema = new mongoose.Schema(
	{
		question: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Question',
			required: true,
		},
		evaluation: {
			type: SingleEvaluationSchema,
			required: true,
		},
	},
	{ _id: false },
);

// Answer sub-schema
const answerSubSchema = new mongoose.Schema(
	{
		question: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Question',
			required: true,
		},
		responseText: {
			type: String,
			trim: true,
			maxlength: 3000,
		},
		responseOption: {
			type: mongoose.Schema.Types.ObjectId, // For MCQ option reference
		},
	},
	{ _id: false },
);

const SubmissionSchema = new mongoose.Schema(
	{
		exam: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Exam',
			required: true,
		},
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: true,
		},

		// Student answers
		answers: {
			type: [answerSubSchema],
			default: [],
		},

		// Evaluations: one per question, matches answers
		evaluations: { type: [EvaluationSchema], default: [] },

		// --- NEW & IMPROVED FIELDS ---
		markedForReview: {
			type: [mongoose.Schema.Types.ObjectId],
			ref: 'Question',
			default: [],
		},
		violations: {
			type: [
				new mongoose.Schema(
					{
						type: { type: String, required: true },
						at: { type: Date, default: Date.now },
					},
					{ _id: false },
				),
			],
			default: [],
		},
		evaluatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher'
		},
		submissionType: {
			type: String,
			enum: ['manual', 'auto'],
			default: 'manual',
		},

		totalMarks: {
			type: Number,
			min: 0,
			default: 0,
		},
		startedAt: {
			type: Date,
			default: Date.now,
			immutable: true,
		},
		duration: {
			type: Number, // in minutes
			required: true,
		},

		status: {
			type: String,
			enum: ['in-progress', 'submitted', 'evaluated'],
			default: 'in-progress',
		},
		submittedAt: {
			type: Date,
		},
		evaluatedAt: {
			type: Date,
		},
	},
	{
		timestamps: true
	},
);

// Ensure at least one answer or mark as empty submission
submissionSchema.pre('validate', function (next) {
	if (!Array.isArray(this.answers)) {
		this.answers = [];
	}
	next();
});

// Auto submit the answers if the endtime has passed
submissionSchema.pre('save', function (next) {
	if (this.status === 'in-progress') {
		const endTime = new Date(this.startedAt.getTime() + this.duration * 60000);
		if (new Date() >= endTime) {
			this.status = 'submitted';
			this.submittedAt = endTime;
		}
	}
	next();
});

// Auto-calc total marks
submissionSchema.pre('save', function (next) {
	this.totalMarks = (this.evaluations || []).reduce(
		(sum, ev) => sum + (ev.evaluation?.marks || 0),
		0,
	);
	next();
});

// Ensure evaluations correspond to answered questions
submissionSchema.pre('save', function (next) {
	const answerIds = this.answers.map(a => a.question.toString());
	const invalidEvals = this.evaluations.filter(ev => !answerIds.includes(ev.question.toString()));
	if (invalidEvals.length > 0) {
		return next(new Error('Evaluation found for question without an answer.'));
	}
	next();
});

submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

// --- Ensure each question within a submission's answers array is unique ---
submissionSchema.index({ _id: 1, 'answers.question': 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);

export default Submission;
