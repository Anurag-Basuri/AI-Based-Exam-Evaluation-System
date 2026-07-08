import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../db.js';
import { ApiError } from '../utils/ApiError.js';

// Allowed MIME types for study materials
const ALLOWED_MIME_TYPES = new Set([
	// Documents
	'application/pdf',
	'application/msword',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/vnd.ms-powerpoint',
	'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	'application/vnd.ms-excel',
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	'text/plain',
	'text/csv',
	// Images
	'image/jpeg',
	'image/png',
	'image/gif',
	'image/webp',
	// Archives
	'application/zip',
	'application/x-zip-compressed',
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// Cloudinary storage for classroom materials
const materialStorage = new CloudinaryStorage({
	cloudinary,
	params: {
		folder: 'classroom_materials',
		resource_type: 'auto',
	},
});

// File filter — reject disallowed types before uploading to Cloudinary
const materialFileFilter = (_req, file, cb) => {
	if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new ApiError(
				400,
				`File type "${file.mimetype}" is not allowed. Allowed: PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, CSV, images (JPG/PNG/GIF/WEBP), ZIP.`,
			),
			false,
		);
	}
};

// Multer instance for classroom study material uploads
export const uploadMaterial = multer({
	storage: materialStorage,
	limits: { fileSize: MAX_FILE_SIZE },
	fileFilter: materialFileFilter,
});

// Express error-handling middleware to catch Multer errors (file too large, etc.)
export const handleMulterError = (err, _req, res, next) => {
	if (!err) return next();

	if (err instanceof multer.MulterError) {
		if (err.code === 'LIMIT_FILE_SIZE') {
			return res.status(400).json({
				status: 'error',
				message: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
			});
		}
		return res.status(400).json({
			status: 'error',
			message: `Upload error: ${err.message}`,
		});
	}

	// Re-throw ApiError (e.g. from our fileFilter)
	if (err.statusCode) {
		return res.status(err.statusCode).json({
			status: 'error',
			message: err.message,
		});
	}

	next(err);
};
