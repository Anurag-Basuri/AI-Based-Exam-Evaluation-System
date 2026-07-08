import mongoose from 'mongoose';
import { customAlphabet } from 'nanoid';

// Custom alphabet for join codes: uppercase letters and numbers.
// One number or letter must not be repeated consecutively.
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const nanoid = customAlphabet(alphabet, 8);

export function generateUniqueJoinCode() {
	const code = nanoid();

	// Check if the generated code has repeating consecutive characters
	for (let i = 0; i < code.length - 2; i++) {
		if (code[i] === code[i + 1] && code[i] === code[i + 2]) {
			// If repeats found, generate a new code
			return generateUniqueJoinCode();
		}
	}

	return code;
}

const materialSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: [true, 'Material title is required'],
			trim: true,
			maxlength: [100, 'Title cannot exceed 100 characters'],
		},
		fileUrl: {
			type: String,
			required: [true, 'File URL is required'],
		},
		originalName: {
			type: String,
			required: true,
		},
		size: {
			type: Number, // File size in bytes
			default: 0,
		},
		publicId: {
			type: String, // Cloudinary public_id (useful for deletion)
			required: false,
		},
		uploadedAt: {
			type: Date,
			default: Date.now,
		},
	},
	{ _id: true },
);

const classroomSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: [true, 'Classroom name is required'],
			trim: true,
			minlength: [3, 'Name must be at least 3 characters'],
			maxlength: [100, 'Name cannot exceed 100 characters'],
		},
		description: {
			type: String,
			trim: true,
			maxlength: [500, 'Description cannot exceed 500 characters'],
		},
		joinCode: {
			type: String,
			unique: true,
			default: () => generateUniqueJoinCode(),
			index: true,
		},
		teacher: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'Teacher is required'],
			index: true,
		},
		students: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		pendingStudents: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'User',
			},
		],
		materials: [materialSchema],
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
		toObject: { virtuals: true },
	},
);

// Index for efficient student-side queries: "find all classrooms I belong to"
classroomSchema.index({ students: 1 });

// Index for pending student queries
classroomSchema.index({ pendingStudents: 1 });

// Compound index for teacher-side queries
classroomSchema.index({ teacher: 1, createdAt: -1 });

const Classroom = mongoose.model('Classroom', classroomSchema);

export default Classroom;
