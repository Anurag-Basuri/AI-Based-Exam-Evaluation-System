import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

// Initialize Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Force HTTPS URLs
});

// Validate Cloudinary configuration
const validateConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error('Cloudinary configuration is incomplete. Please check your environment variables.');
  }
};

// Initialize validation
validateConfig();

// Helper function to clean up local files
const cleanupLocalFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.warn(`Failed to cleanup local file: ${filePath}`, error.message);
  }
};

// Helper function to get file size
const getFileSize = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
};

// Generic upload function with comprehensive options
const uploadToCloudinary = async (filePath, options = {}) => {
  if (!filePath) {
    throw new Error('File path is required');
  }

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const fileSize = getFileSize(filePath);
  const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default

  if (fileSize > maxSize) {
    throw new Error(`File size (${Math.round(fileSize / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB)`);
  }

  const defaultOptions = {
    folder: 'uploads',
    use_filename: true,
    unique_filename: true,
    overwrite: false,
    quality: 'auto:good',
    fetch_format: 'auto',
    ...options
  };

  try {
    const result = await cloudinary.uploader.upload(filePath, defaultOptions);
    
    // Cleanup local file after successful upload
    if (options.cleanup !== false) {
      cleanupLocalFile(filePath);
    }

    return {
      success: true,
      data: {
        public_id: result.public_id,
        secure_url: result.secure_url,
        url: result.url,
        format: result.format,
        resource_type: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        created_at: result.created_at,
      }
    };
  } catch (error) {
    // Cleanup local file even on failure
    if (options.cleanup !== false) {
      cleanupLocalFile(filePath);
    }
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

// Upload image with optimizations
const uploadImage = async (filePath, options = {}) => {
  const imageOptions = {
    resource_type: 'image',
    folder: options.folder || 'uploads/images',
    transformation: [
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
      ...(options.transformations || [])
    ],
    maxSize: 5 * 1024 * 1024, // 5MB for images
    ...options
  };

  return uploadToCloudinary(filePath, imageOptions);
};

// Upload profile picture with specific transformations
const uploadProfilePicture = async (filePath, options = {}) => {
  const profileOptions = {
    folder: 'uploads/profiles',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' }
    ],
    ...options
  };

  return uploadImage(filePath, profileOptions);
};

// Generic delete function
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!publicId) {
    throw new Error('Public ID is required for deletion');
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true // Invalidate CDN cache
    });

    return {
      success: result.result === 'ok',
      result: result.result,
      public_id: publicId
    };
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

// Delete image
const deleteImage = async (publicId) => {
  return deleteFromCloudinary(publicId, 'image');
};

// Health check function
const healthCheck = async () => {
  try {
    await cloudinary.api.ping();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

export {
  uploadImage,
  uploadProfilePicture,
  deleteImage,
  healthCheck
};
