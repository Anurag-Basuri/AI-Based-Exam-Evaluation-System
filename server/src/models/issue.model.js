import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
	{
		action: {
			type: String,
			enum: ['created', 'resolved', 'assigned', 'status-changed'],
			required: true,
		},
		user: {
			type: mongoose.Schema.Types.ObjectId,
			refPath: 'userModel',
		},
		userModel: {
			type: String,
			enum: ['Student', 'Teacher'],
		},
		details: {
			type: String,
		},
	},
	{
		timestamps: true,
		_id: false,
	},
);

const internalNoteSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
			required: true
		},
		note: {
			type: String,
			required: true,
			trim: true
		},
	},
	{ timestamps: true },
);

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
		// Track which teacher is actively working on the issue
		assignedTo: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Teacher',
			required: [true, 'Teacher reference is required'],
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
		// Keep a log of all actions taken on the issue
		activityLog: [activityLogSchema],
		// Add a new field for private teacher notes
		internalNotes: [internalNoteSchema],
	},
	{ timestamps: true },
);

// Add initial creation log
issueSchema.pre('save', function (next) {
	if (this.isNew) {
		this.activityLog.push({
			action: 'created',
			user: this.student,
			userModel: 'Student',
			details: 'Issue created by student.',
		});
	}
	next();
});

// Mark issue as resolved
issueSchema.methods.markResolved = function (teacherId, reply) {
	this.status = 'resolved';
	this.resolvedBy = teacherId;
	this.resolvedAt = new Date();
	if (reply) this.reply = reply;
	this.activityLog.push({
		action: 'resolved',
		user: teacherId,
		userModel: 'Teacher',
		details: 'Issue marked as resolved.',
	});
};

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
