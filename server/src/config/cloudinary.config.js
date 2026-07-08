import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary connection
const connectCloudinary = () => {
	const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

	if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
		console.warn(
			'[CLOUDINARY] ⚠️ Missing credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, or CLOUDINARY_API_SECRET). File uploads will fail.',
		);
		return;
	}

	cloudinary.config({
		cloud_name: CLOUDINARY_CLOUD_NAME,
		api_key: CLOUDINARY_API_KEY,
		api_secret: CLOUDINARY_API_SECRET,
		secure: true,
	});

	console.log('[CLOUDINARY] ✅ Connected to Cloudinary');
};

export { cloudinary };
export default connectCloudinary;
