import sharp from 'sharp';
import { ListingImage, Listings } from '../../models/Common/index.js';
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";
import cloudinary from "../../config/cloudinary.js";

const MAX_IMAGES_PER_LISTING = 15;

const ALLOWED_MIME = [
    'image/jpeg', 'image/jpg',
    'image/png', 'image/webp', 'image/heic',
];

const IMAGE_SIZES = {
    thumbnail: { width: 400,  height: 300,  quality: 75 },
    medium:    { width: 800,  height: 600,  quality: 80 },
    full:      { width: 1920, height: 1440, quality: 85 },
};

// Core upload pipeline

//processAndUpload — resize → webp → Cloudinary (3 sizes in parallel)

const processAndUpload = async (fileBuffer, mimeType, folder) => {
    if (!ALLOWED_MIME.includes(mimeType)) {
        throw new AppError(
            'Invalid file type. Only images allowed (JPEG, PNG, WebP). Video is strictly forbidden.',
            400,
            'VIDEO_NOT_ALLOWED'
        );
    }

    const urls    = {};
    const uploads = Object.entries(IMAGE_SIZES).map(([size, config]) =>
        new Promise(async (resolve, reject) => {
            try {
                const optimized = await sharp(fileBuffer)
                    .resize(config.width, config.height, { fit: 'cover', position: 'center' })
                    .webp({ quality: config.quality })
                    .toBuffer();

                const stream = cloudinary.uploader.upload_stream(
                    {
                        folder,
                        format:        'webp',
                        resource_type: 'image',
                        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                    },
                    (err, result) => {
                        if (err) return reject(err);

                        urls[`${size}Url`] = result.secure_url;

                        if (size === 'full') {
                            urls.publicId = result.public_id;
                            urls.width    = result.width;
                            urls.height   = result.height;
                        }
                        resolve();
                    }
                );
                stream.end(optimized);
            } catch (err) {
                reject(err);
            }
        })
    );

    await Promise.all(uploads);
    return urls;
};

//  Service methods
export const uploadListingImages = async (listingId, files, ownerId) => {
    const listing = await Listings.findByPk(listingId);
    if (!listing) throw new AppError('Listing not found.', 404);

    const existingCount = await ListingImage.count({ where: { listingId } });
    const newTotal      = existingCount + files.length;

    if (newTotal > MAX_IMAGES_PER_LISTING) {
        throw new AppError(
            `Maximum ${MAX_IMAGES_PER_LISTING} images allowed per listing. Currently has ${existingCount}.`,
            400,
            'IMAGE_LIMIT_EXCEEDED'
        );
    }

    const folder  = `nestfy/listings/${listingId}`;
    const results = [];

    for (const file of files) {
        const urls = await processAndUpload(file.buffer, file.mimetype, folder);

        const isFirst   = existingCount === 0 && results.length === 0;
        const lastOrder = existingCount + results.length;

        const image = await ListingImage.create({
            listingId,
            thumbnailUrl:       urls.thumbnailUrl,
            mediumUrl:          urls.mediumUrl,
            fullUrl:            urls.fullUrl,
            cloudinaryPublicId: urls.publicId,
            originalFilename:   file.originalname,
            fileSize:           file.size,
            mimeType:           file.mimetype,
            width:              urls.width  ?? null,
            height:             urls.height ?? null,
            isPrimary:          isFirst,
            orderIndex:         lastOrder,
        });

        results.push(image);
        logger.info(`Image uploaded for listing ${listingId}: ${urls.publicId}`);
    }

    return results;
};

export const deleteImage = async (imageId, listingId) => {
    const image = await ListingImage.findOne({ where: { id: imageId, listingId } });
    if (!image) throw new AppError('Image not found.', 404);

    // Remove from Cloudinary
    await cloudinary.uploader.destroy(image.cloudinaryPublicId);

    const wasPrimary = image.isPrimary;
    await image.destroy();

    // If the deleted image was primary → promote next by orderIndex
    if (wasPrimary) {
        const next = await ListingImage.findOne({
            where: { listingId },
            order: [['orderIndex', 'ASC']],
        });
        if (next) await next.update({ isPrimary: true });
    }

    logger.info(`Image ${imageId} deleted from listing ${listingId}`);
};

/**
 * reorderImages — batch update orderIndex
 */
export const reorderImages = async (listingId, orderedIds) => {
    if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
        throw new AppError('orderedIds must be a non-empty array.', 400, 'INVALID_INPUT');
    }

    const updates = orderedIds.map((id, index) =>
        ListingImage.update(
            { orderIndex: index },
            { where: { id, listingId } }
        )
    );

    await Promise.all(updates);
};

export const setPrimaryImage = async (imageId, listingId) => {
    // Verify image belongs to this listing
    const image = await ListingImage.findOne({ where: { id: imageId, listingId } });
    if (!image) throw new AppError('Image not found.', 404);

    // Clear all primary flags first, then set the new one
    await ListingImage.update({ isPrimary: false }, { where: { listingId } });
    await ListingImage.update({ isPrimary: true  }, { where: { id: imageId, listingId } });
};