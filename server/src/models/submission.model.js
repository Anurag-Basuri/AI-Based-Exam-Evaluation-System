import mongoose from 'mongoose';
import slugify from 'slugify';

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
				response: {
					type: mongoose.Schema.Types.Mixed,
					required: true,
				},
				marksAwarded: {
					type: Number,
					min: 0,
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

submissionSchema.pre('save', function (next) {
    if (this.isModified('exam') && this.isModified('student')) {
        this.slug = slugify(`${this.exam}-${this.student}`, { lower: true, strict: true });
    }
    next();
});

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;
