import multer from 'multer';
import AppError from '../utils/AppError.js';

const ALLOWED_MIME = [
    'image/jpeg', 'image/jpg',
    'image/png',  'image/webp', 'image/heic',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB


const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
    // VIDEO STRICTLY FORBIDDEN
    if (file.mimetype.startsWith('video/')) {
        return cb(
            new AppError(
                'Video upload is strictly forbidden. Images only.',
                400,
                'VIDEO_NOT_ALLOWED'
            ),
            false
        );
    }

    if (!ALLOWED_MIME.includes(file.mimetype)) {
        return cb(
            new AppError(
                'Invalid file type. Allowed: JPEG, PNG, WebP, HEIC.',
                400,
                'INVALID_FILE_TYPE'
            ),
            false
        );
    }

    cb(null, true);
};


export const listingImageUpload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
        files:    15, // Max 15 images per upload
    },
}).array('images', 15);


export const singleImageUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 1 },
}).single('image');

export const kycUpload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_FILE_SIZE, files: 3 },
}).fields([
    { name: 'documentFront', maxCount: 1 },
    { name: 'documentBack',  maxCount: 1 },
    { name: 'selfie',        maxCount: 1 },
]);

export const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                code:    'FILE_TOO_LARGE',
                message: 'File size exceeds 10MB limit.',
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                code:    'TOO_MANY_FILES',
                message: 'Too many files uploaded.',
            });
        }
    }
    next(err);
};