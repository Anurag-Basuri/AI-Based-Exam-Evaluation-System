import mongoose from 'mongoose';

// Evaluation sub-schema (exactly one per answer)
const evaluationSubSchema = new mongoose.Schema(
	{
		evaluator: {
			type: String,
			enum: ['ai', 'teacher'],
			required: true,
		},
		marks: {
			type: Number,
			min: 0,
			required: true,
		},
		remarks: {
			type: String,
			trim: true,
			maxlength: 1000,
		},
		evaluatedAt: {
			type: Date,
			default: Date.now,
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

const submissionSchema = new mongoose.Schema(
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
		evaluations: {
			type: [
				{
					question: {
						type: mongoose.Schema.Types.ObjectId,
						ref: 'Question',
						required: true,
					},
					evaluation: evaluationSubSchema,
				},
			],
			default: [],
		},

		totalMarks: {
			type: Number,
			min: 0,
			default: 0,
		},

		submittedAt: {
			type: Date,
			default: Date.now,
			immutable: true,
		},
		evaluatedAt: {
			type: Date,
		},
		evaluatedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
		},
		isPublished: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true },
);

// Ensure at least one answer or mark as empty submission
submissionSchema.pre('validate', function (next) {
	if (!Array.isArray(this.answers)) {
		this.answers = [];
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

submissionSchema.pre('save', function (next) {
	const answerIds = this.answers.map(a => a.question.toString());
	const invalidEvals = this.evaluations.filter(ev => !answerIds.includes(ev.question.toString()));
	if (invalidEvals.length > 0) {
		return next(new Error('Evaluation found for question without an answer.'));
	}
	next();
});

submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
