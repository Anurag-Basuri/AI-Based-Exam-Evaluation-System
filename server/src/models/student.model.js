import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const studentSchema = new mongoose.Schema(
	{
		username: {
			type: String,
			required: [true, 'Username is required'],
			unique: true,
			trim: true,
			minlength: [3, 'Username must be at least 3 characters'],
			maxlength: [30, 'Username cannot exceed 30 characters'],
			match: [
				/^[a-zA-Z0-9_.]+$/,
				'Username can only contain letters, numbers, underscores, and dots',
			],
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
			unique: true,
			sparse: true,
			trim: true,
			validate: {
				validator: function (v) {
					return /^\+?[\d\s\-()]{10,15}$/.test(v);
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
		gender: {
			type: String,
			enum: ['male', 'female', 'other'],
		},
		address: {
			street: { type: String, trim: true },
			city: { type: String, trim: true },
			state: { type: String, trim: true },
			postalCode: {
				type: String,
				trim: true,
				validate: {
					validator: function (v) {
						return !v || /^\d{5,6}$/.test(v);
					},
					message: 'Postal code must be 5 or 6 digits',
				},
			},
			country: { type: String, trim: true },
		},
		refreshToken: {
			type: String,
			select: false,
		},
		resetPasswordToken: String,
		resetPasswordExpires: Date,
	},
	{
		timestamps: true,
	},
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

studentSchema.methods.createPasswordResetToken = function () {
	const resetToken = crypto.randomBytes(32).toString('hex');
	this.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
	this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
	return resetToken;
};

studentSchema.methods.generateAuthToken = function () {
	return jwt.sign(
		{ id: this._id, role: 'student', username: this.username },
		process.env.ACCESS_TOKEN_SECRET,
		{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '24h' },
	);
};

studentSchema.methods.generateRefreshToken = function () {
	this.refreshToken = jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d',
	});

	return this.refreshToken;
};

const Student = mongoose.model('Student', studentSchema);
export default Student;
