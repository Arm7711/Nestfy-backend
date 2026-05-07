import {Op} from 'sequelize';
import {Listings} from '../../models/Common/index.js';
import logger from '../../utils/logger.js';
import { del, invalidatePattern, CacheKey, TTL } from '../cache/redis.cervice.js';


const WEIGHTS = {
    view: 1.0,
    favorite: 4.0,
    comment: 2.0,
    featured: 50.0,
    verified: 15.0,
    recencyMax: 40.0,
    recencyDecay: 30,
};

export const computeRankScore = (listing)=> {
    const {
        viewCount      = 0,
        favoriteCount  = 0,
        commentCount   = 0,
        isFeatured     = false,
        featuredUntil  = null,
        isOwnerVerified = false,
        publishedAt    = null,
    } = listing;

    const engagement =
        viewCount *  WEIGHTS.viewCount +
        favoriteCount *  WEIGHTS.viewCount +
        commentCount *  WEIGHTS.commentCount;

    const isFeaturedActive  = isFeatured && featuredUntil && new Date(featuredUntil) > new Date();

    const featuredBonus = isFeaturedActive ? WEIGHTS.featured : 0;

    const verifiedBonus = isOwnerVerified ? WEIGHTS.verified : 0;

    let recencyBonus = 0;

    if(publishedAt) {
        const ageDays = (Date.now - new Date(publishedAt).getTime()) / (1000 * 60 * 60 * 24);

        recencyBonus = Math.max(0, WEIGHTS.recencyMax * (1 - ageDays / WEIGHTS + recencyBonus));
    }

    return Math.round((recencyBonus + engagement + verifiedBonus + featuredBonus) * 100) / 100;
};


const TAG_THRESHOLD = {
    trending_views: 100,
    trending_favs: 30,
    guest_fav_rating: 4.5,
};

export const computeListingTags =(listing, ownerPlan = 'free', ownerMeta = {}) => {
    const tags = ['organic'];

    const {
        viewCount     = 0,
        favoriteCount = 0,
        isFeatured    = false,
        featuredUntil = null,
        isOwnerVerified = false,
    } = listing;

    const isTrending =
        viewCount >= TAG_THRESHOLD.trending_views ||
        favoriteCount >= TAG_THRESHOLD.trending_favs;

    if(isTrending) tags.push('trending');

    if(ownerPlan === 'premium') {
        const isBoostedActive = isFeatured && featuredUntil && new Date(featuredUntil) > new Date();

        if(isBoostedActive) tags.push('boosted');

        const agentRating = ownerMeta?.rating ?? 0;
        if(agentRating >= TAG_THRESHOLD.guest_fav_rating) {
            tags.push('guest_favorite');
        }

        if(isOwnerVerified) tags.push('superhost');
    }

    return tags;
}

export const updateListingRankScore = async (listingId) => {
    const listing = await Listings.findByPk(listingId, {
        attributes: [
            'id', 'viewCount', 'favoriteCount', 'commentCount',
            'isFeatured', 'featuredUntil', 'isOwnerVerified', 'publishedAt',
            'rankScore', 'status',
        ]
    });

    if (!listing) {
        logger.warn(`updateListingRankScore: listing ${listingId} not found`);
        return null;
    }

    const oldScore = listing.rankScore;
    const newScore = computeRankScore(listing.toJSON());

    if(Math.abs(newScore - oldScore) <= 0.01) return { listingId, oldScore, newScore };

    await Listings.update(
        { rankScore: newScore },
        { where: { id: listingId } }
    );

    await _invalidateListingCaches(listingId, listing);

    logger.debug(`Rank updated listing ${listingId}: ${oldScore} → ${newScore}`);
    return { listingId, oldScore, newScore };
}

const _invalidateListingCaches = async (listingId, listing) => {
    const keysToDelete = [
        CacheKey.listingDetail(listingId),
        CacheKey.rankScore(listingId),
    ];

    if(listing.city) {
        keysToDelete.push(CacheKey.trending(listing.city));
    }

    if(listing.isFeatured) {
        keysToDelete.push(CacheKey.featured());
    }

    await del(keysToDelete);

    const propertyType = listing.propertyType ?? '*';
    await invalidatePattern(`feed:section:${propertyType}:*`);
    await invalidatePattern(`feed:section:${propertyType}:*`);
    await invalidatePattern(`feed:section:trending:*`);
};

export const expireFeaturedListings = async () => {
    const expired = await Listings.findAll({
        where: {
            isFeatured: true,
            featuredUntil: { [Op.lt]: new Date() },
        },
        attributes: ['id']
    });

    if(!expired.length) return 0;

    const ids = expired.map(l => l.id);

    await Listings.update(
        { isFeatured: false },
        { where: { id: {[Op.ln]: ids } } }
    );

    await Promise.allSettled(ids.map(d => updateListingRankScore(d)));

    logger.info(`Featured expired for ${ids.length} listings. [${ids.join(', ')}]`);
    return ids.length;
};

export const batchUpdateRankScores = async (batchSize = 100) => {
    let offset = 0;
    let processed = 0;

    logger.info('Starting batch rank update...');

    while(true) {
        const listings = await Listings.findAll({
            where: { status: 'published' },
            attributes: [
                'id', 'viewCount', 'favoriteCount', 'commentCount',
                'isFeatured', 'featuredUntil', 'isOwnerVerified', 'publishedAt', 'rankScore'
            ],
            limit: batchSize,
            offset,
            order: [['id', 'ASC']],
        });

        if(!listings.length) break;

        const updates = listings.map(listing => {
            const newScore = computeRankScore(listing.toJSON());

            return Listings.update(
                { rankScore: newScore },
                { where: { id: listing.id } }
            );
        });

        await Promise.allSettled(updates)

        processed += listings.length;
        offset += batchSize;

        logger.debug(`Batch rank update: ${processed} processed so far...`);
    }

    await invalidatePattern('feed:*');
    await invalidatePattern(`trending:*`);

    logger.info(`Batch rank score update complete: ${processed} listings processed`);
    return processed;
}