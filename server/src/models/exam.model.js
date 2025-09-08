import mongoose from 'mongoose';

const examSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  description: { type: String, trim: true, maxlength: 500 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher', required: true },
  isPublished: { type: Boolean, default: false },
  date: { type: Date, required: true },
  startTime: { type: Date, required: true },
  accessCode: { type: String, trim: true, unique: true, validate: { validator: (v) => v.length === 6, message: 'Access code must be 6 characters.' } },
  endTime: { type: Date, required: true },
  durationMinutes: { type: Number, required: true, min: 1 },
  // ✅ ADDED: A field to store the total possible marks for the exam.
  totalMarks: { type: Number, required: true, default: 0 },
  year: { type: String, required: true, enum: ['1', '2', '3', '4'] },
  semester: { type: String, required: true, enum: ['1', '2', '3', '4', '5', '6', '7', '8'] },
  batch: { type: String, required: true, trim: true },
  section: { type: String, required: true, trim: true, uppercase: true },
  department: { type: String, required: true, trim: true, enum: ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical', 'Chemical', 'Aerospace', 'Biotechnology', 'Other'] },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  allowedRollNumbers: [{ type: String, trim: true, uppercase: true }],
  status: { type: String, enum: ['draft', 'scheduled', 'active', 'completed'], default: 'draft' }
}, { timestamps: true });

examSchema.pre('save', async function(next) {
  if (this.isNew && !this.accessCode) {
    let accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const Exam = mongoose.model('Exam');
    while (await Exam.findOne({ accessCode })) {
      accessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    }
    this.accessCode = accessCode;
  }
  next();
});

examSchema.methods.canAccess = async function(student, providedAccessCode) {
  if (!student) return false;
  
  if (this.accessCode.toLowerCase() !== providedAccessCode.toLowerCase()) {
      console.log("Access denied: Incorrect access code.");
      return false;
  }
  
  const now = new Date();
  if (now < this.startTime || now > this.endTime) {
      console.log("Access denied: Exam is not currently active.");
      return false;
  }
  
  if (student.section.toLowerCase() !== this.section.toLowerCase() || 
      student.department.toLowerCase() !== this.department.toLowerCase() || 
      student.year !== this.year) {
      console.log("Access denied: Student's class does not match exam's target class.");
      return false;
  }
  
  return true;
};

const Exam = mongoose.model('Exam', examSchema);
export default Exam;
