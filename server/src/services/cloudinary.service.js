import { cloudinary } from '../db.js';

// Cloudinary folder constants
const FOLDERS = {
	CLASSROOM_MATERIALS: 'classroom_materials',
	PROFILE_PICTURES: 'profile_pictures',
};

// Upload a file buffer to Cloudinary
export const uploadFile = (fileBuffer, options = {}) => {
	return new Promise((resolve, reject) => {
		const {
			folder = FOLDERS.CLASSROOM_MATERIALS,
			resourceType = 'auto',
			publicId,
			transformation,
		} = options;

		const uploadOptions = {
			folder,
			resource_type: resourceType,
			...(publicId && { public_id: publicId }),
			...(transformation && { transformation }),
		};

		const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
			if (error) return reject(error);
			resolve(result);
		});

		stream.end(fileBuffer);
	});
};

// Upload from a local file path (used by multer-storage-cloudinary internally)
export const uploadFromPath = async (filePath, options = {}) => {
	const {
		folder = FOLDERS.CLASSROOM_MATERIALS,
		resourceType = 'auto',
		publicId,
	} = options;

	return cloudinary.uploader.upload(filePath, {
		folder,
		resource_type: resourceType,
		...(publicId && { public_id: publicId }),
	});
};

// Delete a single file from Cloudinary
export const deleteFile = async (publicId, resourceType = 'raw') => {
	if (!publicId) return null;

	try {
		const result = await cloudinary.uploader.destroy(publicId, {
			resource_type: resourceType,
		});
		return result;
	} catch (error) {
		console.error(`[CLOUDINARY] Failed to delete ${publicId}:`, error.message);
		throw error;
	}
};

// Delete multiple files from Cloudinary (batch)
export const deleteFiles = async (publicIds, resourceType = 'raw') => {
	if (!publicIds || publicIds.length === 0) return [];

	const results = await Promise.allSettled(
		publicIds.map(id => deleteFile(id, resourceType)),
	);

	const failures = results.filter(r => r.status === 'rejected');
	if (failures.length > 0) {
		console.warn(
			`[CLOUDINARY] ${failures.length}/${publicIds.length} deletions failed.`,
		);
	}

	return results;
};

// Get a file's metadata from Cloudinary
export const getFileInfo = async (publicId, resourceType = 'raw') => {
	return cloudinary.api.resource(publicId, { resource_type: resourceType });
};

// Generate a signed download URL (for strict-delivery resources)
export const getSignedUrl = (publicId, options = {}) => {
	const { resourceType = 'raw' } = options;

	return cloudinary.url(publicId, {
		resource_type: resourceType,
		type: 'upload',
		sign_url: true,
		secure: true,
	});
};

export { FOLDERS };
