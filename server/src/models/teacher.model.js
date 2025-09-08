import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const teacherSchema = new mongoose.Schema(
  {
    // Basic Information
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

    // Professional Information
    employeeID: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          return /^[A-Z0-9]{5,10}$/.test(v);
        },
        message: 'Employee ID must be 5-10 characters long and contain only letters and numbers',
      },
    },
    title: {
      type: String,
      required: [true, 'Academic title is required'],
      enum: {
        values: [
          'Assistant Professor',
          'Associate Professor',
          'Professor',
          'Lecturer',
          'Senior Lecturer',
          'Instructor',
          'Visiting Professor',
          'Emeritus Professor'
        ],
        message: 'Please select a valid academic title',
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
          'Mathematics',
          'Physics',
          'Chemistry',
          'English',
          'Management',
          'Other',
        ],
        message: 'Please select a valid department',
      },
    },
    specialization: {
      type: [String],
      required: [true, 'At least one specialization is required'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one specialization must be provided'
      }
    },

    // Contact Information
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

    // Personal Information
    gender: {
      type: String,
      required: [true, 'Gender is required'],
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be either male, female, or other',
      },
    },
    address: {
      street: {
        type: String,
        required: [false, 'Street address is required'],
        trim: true,
      },
      city: {
        type: String,
        required: [false, 'City is required'],
        trim: true,
      },
      state: {
        type: String,
        required: [false, 'State is required'],
        trim: true,
      },
      postalCode: {
        type: String,
        required: [false, 'Postal code is required'],
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
        required: [false, 'Country is required'],
        trim: true,
        default: 'India',
      },
    },

    // Professional Details
    experienceYears: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Experience cannot be negative'],
      max: [50, 'Experience cannot exceed 50 years'],
    },

    // Academic Relationships
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
      },
    ],
    subjects: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        code: {
          type: String,
          required: true,
          trim: true,
          uppercase: true,
        },
        credits: {
          type: Number,
          required: true,
          min: 1,
          max: 6,
        },
      },
    ],

    // System Fields
    profilePicture: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual field for full name
teacherSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Encrypt password before saving
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare passwords
teacherSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

const Teacher = mongoose.model('Teacher', teacherSchema);

export default Teacher;
