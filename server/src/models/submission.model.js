import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
	{
		exam: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Exam',
			required: [true, 'Exam reference is required'],
		},
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [true, 'Student reference is required'],
		},
		answers: [
			{
				question: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Question',
					required: true,
				},
				responseText: {
					type: String,
					trim: true,
				},
				responseOption: {
					type: mongoose.Schema.Types.ObjectId,
				},
				marksAwarded: {
					type: Number,
					min: 0,
					default: 0,
				},
				remarks: {
					type: String,
					trim: true,
				},
			},
		],
		totalMarks: {
			type: Number,
			min: 0,
			default: 0,
		},
		submittedAt: {
			type: Date,
			default: Date.now,
			required: true,
		},
		evaluated: {
			type: Boolean,
			default: false,
		},
		evaluatedAt: {
			type: Date,
		},
	},
	{
		timestamps: true,
	},
);

// Ensure one submission per student per exam
submissionSchema.index({ exam: 1, student: 1 }, { unique: true });

// Auto-calc total marks before saving
submissionSchema.pre('save', function (next) {
	if (this.answers && this.answers.length > 0) {
		this.totalMarks = this.answers.reduce((sum, ans) => sum + (ans.marksAwarded || 0), 0);
	}
	next();
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
