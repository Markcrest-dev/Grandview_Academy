import { Router } from 'express';
import multer from 'multer';
import { uploadFile, cloudinaryConfigured } from '../config/cloudinary.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const router = Router();

// Configure multer for memory storage (buffer uploaded to Cloudinary, not saved to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

/**
 * POST /api/uploads
 * Upload a file to Cloudinary.
 * Expects multipart/form-data with a 'file' field and optional 'folder' field.
 * Folders: 'profiles', 'documents', 'photos'
 */
router.post('/', upload.single('file'), async (req, res, next) => {
  try {
    if (!cloudinaryConfigured) {
      return sendError(res, {
        message: 'File uploads are not configured. Add Cloudinary credentials to .env',
        statusCode: 503,
      });
    }

    if (!req.file) {
      return sendError(res, { message: 'No file provided. Send a file in the "file" field.' });
    }

    const folder = req.body.folder || 'documents';
    const validFolders = ['profiles', 'documents', 'photos'];
    if (!validFolders.includes(folder)) {
      return sendError(res, {
        message: `Invalid folder. Must be one of: ${validFolders.join(', ')}`,
      });
    }

    const result = await uploadFile(req.file.buffer, { folder });

    sendSuccess(res, {
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        size: result.bytes,
        width: result.width,
        height: result.height,
      },
      message: 'File uploaded successfully',
      statusCode: 201,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
