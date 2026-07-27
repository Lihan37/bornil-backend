import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { cloudinary } from '../config/cloudinary';
import { AppError } from '../utils/AppError';

const storage = new CloudinaryStorage({
  cloudinary,
  params: async () => ({
    folder: 'jewelry-shop/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    resource_type: 'image',
  }),
});

export const uploadProductImages = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6,
  },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new AppError(400, 'Only image files are allowed'));
      return;
    }
    cb(null, true);
  },
}).array('images', 6);
