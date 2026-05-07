import {Op} from "sequelize";
import Favorite from '../../models/Listing/Favorite.js';
import { Listings, ListingImage, User } from '../../models/Common/index.js';
import redis from "../../config/redis.js";
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";


const CACHE_TTL = 60 * 10;
const cacheKey   = (userId) => `wishlist:ids:${userId}`;

const getCachedIds = async (userId) => {
    try {
        const raw = await redis.get(cacheKey(userId));
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null; // Cache miss — degrade gracefully
    }
};


const setCachedIds = async (userId, ids) => {
    try {
        await redis.set(cacheKey(userId), JSON.stringify(ids), 'EX', CACHE_TTL);
    }catch {  }
};

const invalidateCache = async (userId, ids) => {
    try {
        await redis.del(cacheKey(userId));
    }catch {  }
}


//Toggle

/**
 * toggleFavorite — add or remove a listing from wishlist
 *
 * Flow:
 * 1. Verify listing exists and is published
 * 2. findOrCreate → if created = added, if found = removed
 * 3. Increment / decrement favoriteCount on Listing (denormalized counter)
 * 4. Invalidate Redis cache
 *
 * Why findOrCreate instead of find → create?
 * Race-condition safe — concurrent requests won't create duplicates
 * Unique constraint on (userId, listingId) is the final safety net
 */

export const toggleFavorite = async (userId, listingId) => {
    const listing = await Listings.findByPk(userId, {
        where: { id: listingId, status: 'published' },
        attributes: ['id', 'favoriteCount'],
    });

    if(!listing) {
        throw new AppError('Listing not found.', 404, 'LISTING_NOT_FOUND');
    }

    const [favorite, created] = await Favorite.findOrCreate({
        where: { userId, listingId },
        defaults: { userId, listingId },
    });

    if(created) {
        await Listings.increment('favoriteCount', { where: { id: listingId } });
        await invalidateCache(userId);

        logger.info(`Wishlist: user ${userId} added listing ${listingId}`);

        return { action: 'added', favoriteId: favorite.id };
    }

    await favorite.destroy();

    await Listings.decrement('favoriteCount', {
        where: { id: listingId, favoriteCount: { [Op.gt]: 0 } },
    });

    await invalidateCache(userId);
    logger.info(`Wishlist: user ${userId} removed listing ${listingId}`);

    return { action: 'removed' };
};

export const getWishlist = async (userId, query) => {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, parseInt(query.limit) || 20);

    const offset = (page - 1) * limit;

    const { count, rows } = await Favorite.findAndCountAll({
        where: { userId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: Listings,
                as: 'listing',
                required: true,
                where: { status: 'published' },
                attributes: [
                    'id', 'title', 'slug', 'price', 'currency',
                    'city', 'country', 'propertyType', 'listingType',
                    'rooms', 'area', 'isFeatured', 'publishedAt',
                ],
                include: [
                    {
                        model: ListingImage,
                        as: 'images',
                        required: false,
                        where: { isPrimary: true },
                        limit: 1,
                        attributes: ['thumbnailUrl', 'mediumUrl'],
                    },
                ],
            },
        ],
    });

    return {
        favorites: rows,
        pagination: {
            total:      count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            hasMore:    page * limit < count,
        },
    };
};

/**
 * getWishlistIds — returns only listingId array
 *
 * Used by the feed to highlight hearted listings without loading full data
 * Aggressively cached in Redis — invalidated on toggle
 *
 * Why separate endpoint?
 * On a feed with 20+ cards, we need to know which ones are saved
 * Loading full Favorite records for this would be wasteful
 */

export const getWishlistIds = async (userId) => {
    const cached = await getCachedIds(userId);

    if(cached !== null) return cached;

    const favorites = await Favorite.findAll({
        where: { userId},
        attributes: ['listingId'],
        order: [['createdAt', 'DESC']],
        limit: 500, //  hard cap

    });

    const ids = favorites.map((favorite) => favorite.id);
    await setCachedIds(userId, ids);
    return ids;
};

export const isInWishlist = async (userId, listingId) => {
    const cached = await getCachedIds(userId);
    if(cached !== null) return cached.includes(Number(listingId));

    const exists = await Favorite.findOne({ where: { userId, listingId  } });

    return !!exists;
};

export const clearWishlist = async (userId) => {
    const count = await Favorite.destroy({ where: { userId } });
    await invalidateCache(userId);
    logger.info(`Wishlist cleared for user ${userId}: ${count} items removed`);
    return { removed: count };
}