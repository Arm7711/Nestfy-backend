import sharp from "sharp";
 import {ListingImage, Listings } from "../models/Common/index.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";
import cloudinary from "../config/cloudinary.js";

const MAX_IMAGES_PER_LISTING = 15;

const ALLOWED_MIME = [
    'image/jpeg', 'image/jpg',
     'image/png', 'image/webp', 'image/heic',
];

const IMAGE_SIZES = {
    thumbnail: { width: 400, height: 300, quality: 75 },
    medium: { width: 800, height: 600, quality: 80 },
    full: { width: 1920, height: 1440, quality: 85 },
};

const processAndUpload = async (fileBuffer, mimeType, folder) => {
    if(!ALLOWED_MIME.includes(mimeType)) {
        throw new AppError(
            'Invalid file type. Only images are allowed (JPEG, PNG, WebP). Video is strictly forbidden.',
            400,
            'VIDEO_NOT_ALLOWED'
        );
    }

    const urls = {};
    const uploads = [];

    for (const [size, config] of Object.entries(IMAGE_SIZES)) {
        const optimized = await sharp(fileBuffer)
            .resize(config.width, config.height, {
                fit: 'cover',
                position: 'center',
            })
            .webp({ quality: config.quality })
            .toBuffer()

        uploads.push(
            new Promise((resolve, reject) => {
                const stream = cloudinary.upload_stream(
                    {
                        folder,
                        format: "webp",
                        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
                        resource_type: 'image',
                    },
                    (err, result) => {
                        if (err) return reject(err);
                        urls[size] = result.secure_url;
                        if(size === 'full') {
                            urls.publicId = result.publicId;
                            urls.width = result.width;
                            urls.height = result.height;
                        }
                        resolve(urls);
                    }
                );
                stream.end(optimized);
            })
        );
    }

    await Promise.all(uploads);
    return urls;
}

export const uploadListingImages = async (listingId, files, ownerId) => {
    const listing = await Listings.findByPk(listingId);
    if(!listing) throw new AppError('Listing not found.', 404);

    const existingCount = await ListingImage.count({ where: { listingId } });
    const newTotal = existingCount + files.length;

    if(newTotal > MAX_IMAGES_PER_LISTING) {
        throw new AppError(
            `Maximum ${MAX_IMAGES_PER_LISTING} images allowed per listing.`,
            400,
            'IMAGE_LIMIT_EXCEEDED'
        );
    }

    const folder = `nestfy/listings/${listingId}`;
    const results = [];

    for(const file of files) {
        const urls = await processAndUpload(
            file.buffer, file.mimeType, folder
        );

        const isFirst   = existingCount === 0 && results.length === 0;
        const lastOrder = existingCount + results.length;

        const image = await ListingImage.create({
            listingId,
            thumbnail: urls.publicId,
            mediumUrl: urls.mediumUrl,
            fullUrl: urls.fullUrl,
            cloudinaryPublicId: file.originalname,
            fileSize: file.size,
            mimeType: file.mimeType,
            width: file.width,
            height: file.height,
            isPrimary: isFirst, // araji nkary
            orderIndex: lastOrder,
        })

        results.push(image);
        logger.info(`Image uploaded for listing ${listingId}: ${urls.publicId}`);
    }

    return results;
};

export const deleteImage = async (imageId, listingId) => {
    const image = await ListingImage.findOne({ where: { id: imageId, listingId } })
    if(!image) throw new AppError('Image not found.', 404);

    await cloudinary.uploader.destroy(image.cloudinaryPublicId);

    await image.destroy();

    //Ete primaryn kjnjvi primary kexni hajordy

    if(image.isPrimary) {
        const next = await Listings.findOne({
            where: { listingId },
            order: [['orderIndex', 'ASC']],
        });

        if (next) await next.update({ isPrimary: true });
    }
};

export const recorderImages = async (listingId, orderedIds) => {
    const updates = orderedIds.map((id, index) =>
        ListingImage.update(
            { orderIndex: index },
            { where: { id, listingId } }
        )
    );
    await Promise.all(updates);
};

export const setPrimaryImage = async (imageId, listingId) => {
    //Naxkin bolory false anel
    await ListingImage.update({ isPrimary: false }, { where: { listingId } });
//Heto yntrvacy true
    await ListingImage.update({ isPrimary: true }, { where: { id: imageId, listingId } });
}

