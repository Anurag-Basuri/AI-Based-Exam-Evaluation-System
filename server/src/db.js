import mongoose from 'mongoose';
import colors from 'colors';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

const connectDB = async () => {
	try {
		const uri = process.env.MONGODB_URI;
		if (!uri) {
			throw new Error('❌ MongoDB URI is not defined. Check your .env file.');
		}

		console.log(colors.cyan('🔌 Connecting to MongoDB...'));

		const options = {
			bufferCommands: false,
			maxPoolSize: 10,
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			family: 4,
		};

		const conn = await mongoose.connect(uri, options);
		console.log(colors.green(`✅ MongoDB Connected: ${conn.connection.host}`));

		mongoose.connection.on('error', err => {
			console.error(colors.red('❌ MongoDB connection error:'), err);
		});

		mongoose.connection.on('disconnected', () => {
			console.warn(colors.yellow('⚠️ MongoDB disconnected.'));
		});

		mongoose.connection.on('reconnected', () => {
			console.log(colors.green('🔄 MongoDB reconnected.'));
		});

		const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
		if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
			console.warn(
				colors.yellow('[CLOUDINARY] ⚠️ Missing credentials. File uploads will fail.'),
			);
		} else {
			cloudinary.config({
				cloud_name: CLOUDINARY_CLOUD_NAME,
				api_key: CLOUDINARY_API_KEY,
				api_secret: CLOUDINARY_API_SECRET,
				secure: true,
			});
			console.log(colors.green('[CLOUDINARY] ✅ Connected to Cloudinary'));
		}

		return conn;
	} catch (error) {
		console.error(colors.red(`❌ MongoDB connection failed: ${error.message}`));
		throw error;
	}
};

// Gracefully close the MongoDB connection on termination
const gracefulExit = async () => {
	try {
		await mongoose.connection.close();
		console.log(colors.magenta('🔒 MongoDB connection closed due to app termination'));
		process.exit(0);
	} catch (err) {
		console.error(colors.red('❌ Error during MongoDB disconnection:'), err);
		process.exit(1);
	}
};

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

// Helper to check current DB connection status
export const getConnectionStatus = () => mongoose.connection.readyState;

export { cloudinary };
export default connectDB;
