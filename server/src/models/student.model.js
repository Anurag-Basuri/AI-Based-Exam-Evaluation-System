import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const studentSchema = new mongoose.Schema(
	{
		firstName: {
			type: String,
			required: [true, 'First name is required'],
			trim: true,
			minlength: [2, 'First name must be at least 2 characters long'],
			maxlength: [50, 'First name cannot exceed 50 characters'],
		},
		lastName: {
			type: String,
			required: [true, 'Last name is required'],
			trim: true,
			minlength: [2, 'Last name must be at least 2 characters long'],
			maxlength: [50, 'Last name cannot exceed 50 characters'],
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			validate: [validator.isEmail, 'Please provide a valid email'],
		},
		password: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters long'],
			select: false, // Don't include password in queries by default
		},

    // Unique registration ID for the student
    registrationID: {
      type: String,
      required: [true, 'Registration ID is required'],
      unique: true,
      trim: true,
    },
		rollNumber: {
			type: String,
			required: [true, 'Roll number is required'],
			unique: true,
			trim: true,
			uppercase: true,
			validate: {
				validator: function (v) {
					return /^[A-Z0-9]{6,12}$/.test(v);
				},
				message:
					'Roll number must be 6-12 characters long and contain only letters and numbers',
			},
		},
		phoneNumber: {
			type: String,
			required: [true, 'Phone number is required'],
			validate: {
				validator: function (v) {
					return /^\+?[\d\s-()]{10,15}$/.test(v);
				},
				message: 'Please provide a valid phone number',
			},
		},

		gender: {
			type: String,
			required: [true, 'Gender is required'],
			enum: {
				values: ['male', 'female', 'other'],
				message: 'Gender must be either male, female, or other',
			},
		},
		year: {
			type: String,
			required: [true, 'Academic year is required'],
			enum: {
				values: ['1', '2', '3', '4'],
				message: 'Year must be 1, 2, 3, or 4',
			},
		},
		semester: {
			type: String,
			required: [true, 'Semester is required'],
			enum: {
				values: ['1', '2', '3', '4', '5', '6', '7', '8'],
				message: 'Semester must be between 1 and 8',
			},
		},
		section: {
			type: String,
			required: [true, 'Section is required'],
			trim: true,
			uppercase: true,
			validate: {
				validator: function (v) {
					return /^[A-Z]$/.test(v);
				},
				message: 'Section must be a single uppercase letter',
			},
		},
		address: {
			street: {
				type: String,
				required: [true, 'Street address is required'],
				trim: true,
			},
			city: {
				type: String,
				required: [true, 'City is required'],
				trim: true,
			},
			state: {
				type: String,
				required: [true, 'State is required'],
				trim: true,
			},
			postalCode: {
				type: String,
				required: [true, 'Postal code is required'],
				trim: true,
				validate: {
					validator: function (v) {
						return /^\d{5,6}$/.test(v);
					},
					message: 'Postal code must be 5 or 6 digits',
				},
			},
			country: {
				type: String,
				required: [true, 'Country is required'],
				trim: true,
				default: 'India',
			},
		},
		department: {
			type: String,
			required: [true, 'Department is required'],
			trim: true,
			enum: {
				values: [
					'Computer Science',
					'Information Technology',
					'Electronics',
					'Mechanical',
					'Civil',
					'Electrical',
					'Chemical',
					'Aerospace',
					'Biotechnology',
					'Other',
				],
				message: 'Please select a valid department',
			},
		},
		courses: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'Course',
			},
		],
    gpa: {
      type: Number,
      min: [0, 'GPA cannot be negative'],
      max: [10, 'GPA cannot exceed 10'],
      default: 0,
    },

    // Profile picture URL
		profilePicture: {
			type: String,
			default: null,
		},
	},
	{
		timestamps: true,
	},
);

// Virtual field for full name
studentSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Encrypt password before saving
studentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
studentSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);

export default Student;
