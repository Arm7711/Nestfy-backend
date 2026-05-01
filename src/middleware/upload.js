import multer from 'multer';
import path from 'path';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const avatarStorage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder:          'avatars',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation:  [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        public_id: (req) => `avatar_${req.user.id}_${Date.now()}`,
    },
});

const fileFilter = (req, file, cb) => {
    const ext      = path.extname(file.originalname).toLowerCase();
    const isMimeOk = ALLOWED_MIME_TYPES.includes(file.mimetype);
    const isExtOk  = ALLOWED_EXTENSIONS.includes(ext);

    if (isMimeOk || isExtOk) {
        cb(null, true);
    } else {
        cb(
            new Error(`Unsupported file type "${file.mimetype}". Only jpg, jpeg, png and webp are accepted.`),
            false
        );
    }
};

const upload = multer({
    storage:    avatarStorage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

export default upload;