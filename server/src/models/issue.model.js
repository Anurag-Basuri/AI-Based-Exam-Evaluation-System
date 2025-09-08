import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    teacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Teacher',
        required: true,
    },
    subject: {
        type: String,
        required: [true, 'Issue subject is required.'],
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        required: [true, 'Issue description is required.'],
        trim: true,
        maxlength: 2000,
    },
    status: {
        type: String,
        enum: ['Pending', 'Resolved'],
        default: 'Pending',
    },
    reply: {
        type: String,
        trim: true,
        default: '',
    },
}, { timestamps: true });

const Issue = mongoose.model('Issue', issueSchema);

export default Issue;
