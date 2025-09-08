import mongoose from 'mongoose';

const evaluationSchema = new mongoose.Schema({
  submission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Submission',
    required: true
  },
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  aiMarks: {
    type: Number,
    min: 0,
    default: null
  },
  aiFeedback: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  teacherMarks: {
    type: Number,
    min: 0,
    default: null
  },
  teacherRemarks: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  evaluatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('Evaluation', evaluationSchema);
