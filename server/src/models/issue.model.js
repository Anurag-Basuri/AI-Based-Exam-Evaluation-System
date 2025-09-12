import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
	{
		student: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Student',
			required: [true, 'Student reference is required'],
		},
		question: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Question',
			required: [true, 'Question reference is required'],
		},
		exam: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Exam',
			required: [true, 'Exam reference is required'],
		},
		subject: {
			type: String,
			required: [true, 'Issue subject is required'],
			trim: true,
			maxlength: [200, 'Subject cannot exceed 200 characters'],
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

issueSchema.methods.markResolved = function (teacherId, reply) {
	this.status = 'Resolved';
	this.resolvedBy = teacherId;
	this.resolvedAt = new Date();
	if (reply) this.reply = reply;
};

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
