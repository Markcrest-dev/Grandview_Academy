import { v2 as cloudinary } from 'cloudinary';
import env from './env.js';

/**
 * Cloudinary configuration.
 * Only initialises if credentials are provided.
 */

const isConfigured =
  env.cloudinaryCloudName &&
  env.cloudinaryApiKey &&
  env.cloudinaryApiSecret;

if (isConfigured) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} fileBuffer - The file data
 * @param {Object} options
 * @param {string} options.folder - Cloudinary folder (e.g. 'profiles', 'documents')
 * @param {string} [options.resourceType='auto'] - Resource type
 * @returns {Promise<Object>} Cloudinary upload result
 */
export async function uploadFile(fileBuffer, { folder, resourceType = 'auto' }) {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Add credentials to .env');
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `grandview-academy/${folder}`,
        resource_type: resourceType,
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
        max_bytes: 10 * 1024 * 1024, // 10MB
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete a file from Cloudinary by public ID.
 *
 * @param {string} publicId - The Cloudinary public ID
 * @returns {Promise<Object>} Deletion result
 */
export async function deleteFile(publicId) {
  if (!isConfigured) {
    throw new Error('Cloudinary is not configured. Add credentials to .env');
  }

  return cloudinary.uploader.destroy(publicId);
}

export { isConfigured as cloudinaryConfigured };
export default cloudinary;
