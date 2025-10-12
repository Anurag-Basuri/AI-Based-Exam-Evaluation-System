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
		// Link directly to the submission the student is reporting about
		submission: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Submission',
			required: [true, 'Submission reference is required'],
		},
		issueType: {
			type: String,
			enum: ['evaluation', 'technical', 'question', 'other'],
			required: [true, 'Issue type is required'],
			description: 'The category of the issue being reported.',
		},
		description: {
			type: String,
			required: [true, 'Issue description is required'],
			trim: true,
			maxlength: [2000, 'Description cannot exceed 2000 characters'],
		},
		status: {
			type: String,
			enum: ['open', 'in-progress', 'resolved'],
			default: 'open',
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
	this.status = 'resolved';
	this.resolvedBy = teacherId;
	this.resolvedAt = new Date();
	if (reply) this.reply = reply;
};

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
