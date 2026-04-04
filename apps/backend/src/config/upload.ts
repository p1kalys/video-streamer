import multer from 'multer';
import { config } from './index.js';
import { ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '@video-streamer/shared';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_API_SECRET,
});

// Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    return {
      folder: 'video-streamer',
      resource_type: 'video',
      allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
      public_id: `video-${uniqueSuffix}`,
    };
  },
});

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype as any)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only video files are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});

// Middleware to normalize Cloudinary file info
export const normalizeCloudinaryFile = (req: any, res: any, next: any) => {
  if (req.files && req.files.length > 0) {
    req.files = req.files.map((file: any) => {
      // Cloudinary returns url and public_id, we need to normalize this
      if (file.path && file.path.startsWith('http')) {
        file.cloudinaryUrl = file.path;
        file.cloudinaryPublicId = file.filename;
      }
      return file;
    });
  }
  next();
};
