import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

const studentSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			lowercase: true,
		},
		fullname: {
			type: String,
			required: [true, 'Full name is required'],
			trim: true,
			minlength: [2, 'Full name must be at least 2 characters long'],
			maxlength: [50, 'Full name cannot exceed 50 characters'],
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
	},
	{
		timestamps: true,
	}
);

studentSchema.pre('save', async function (next) {
	if (!this.isModified('password')) {
		return next();
	}

	try {
		this.password = await bcrypt.hash(this.password, 12);
		next();
	} catch (error) {
		next(error);
	}
});

studentSchema.methods.comparePassword = async function (enteredPassword) {
	return await bcrypt.compare(enteredPassword, this.password);
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
