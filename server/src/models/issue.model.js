import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [true, 'Student reference is required'],
		},
		exam: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Exam',
			required: [true, 'Exam reference is required'],
		},
		question: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Question',
		},
		// If the issue is about a specific answer/evaluation
		submission: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Submission',
		},
		issueType: {
			type: String,
			enum: ['question', 'evaluation'],
			required: [true, 'Issue type is required'],
			description: 'Whether the issue is about the question itself or the evaluation/answer',
		},
		description: {
			type: String,
			required: [true, 'Issue description is required'],
			trim: true,
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		status: {
			type: String,
			enum: ['Pending', 'Resolved'],
			default: 'Pending',
		},
		reply: {
			type: String,
			trim: true,
			maxlength: [2000, 'Reply cannot exceed 2000 characters'],
			default: '',
		},
		resolvedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
		},
		resolvedAt: {
			type: Date,
		},
	},
	{ timestamps: true },
);

// Mark issue as resolved
issueSchema.methods.markResolved = function (teacherId, reply) {
	this.status = 'Resolved';
	this.resolvedBy = teacherId;
	this.resolvedAt = new Date();
	if (reply) this.reply = reply;
};

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
