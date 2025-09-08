import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  response: {
    type: mongoose.Schema.Types.Mixed, // String for subjective, option id(s) for MCQ
    required: true
  },
  marksAwarded: {
    type: Number,
    default: null // To be set after evaluation
  },
  feedback: {
    type: String,
    trim: true
  }
}, { _id: false });

const submissionSchema = new mongoose.Schema({
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  answers: [answerSchema],
  submittedAt: {
    type: Date,
    default: Date.now
  },
  totalMarks: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['in_progress', 'submitted', 'evaluated', 'published'],
    default: 'in_progress'
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher'
  },
  evaluatedAt: {
    type: Date
  },
  remarks: {
    type: String,
    trim: true
  },
  isPassed: {
    type: Boolean,
    default: null
  }
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);
export default Submission;