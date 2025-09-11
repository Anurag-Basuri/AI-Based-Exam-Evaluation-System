import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const teacherSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
    },
    fullname: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [2, 'Full name must be at least 2 characters long'],
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    phonenumber: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      validate: {
        validator: function (v) {
          return /^\+?[\d\s-()]{10,15}$/.test(v);
        },
        message: 'Please provide a valid phone number',
      },
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
    },

    // Personal Information
    gender: {
      type: String,
      enum: {
        values: ['male', 'female', 'other'],
        message: 'Gender must be either male, female, or other',
      },
    },
    address: {
      street: {
        type: String,
      },
      city: {
        type: String,
        trim: true,
      },
      state: {
        type: String,
        trim: true,
      },
      postalCode: {
        type: String,
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
        trim: true,
      }
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to hash password if modified
teacherSchema.pre('save', async function (next) {
  if (!this.isModified('password')){
    return next();
  }

  try {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to compare passwords
teacherSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Teacher = mongoose.model('Teacher', teacherSchema);
export default Teacher;