import {Op} from "sequelize";
import logger from "../utils/logger.js";
import { Listings, ListingImage, User, Agent, Agency, Favorite } from '../models/Common/index.js';
import { get, set, getOrSet, CacheKey, TTL } from './redis.cervice.js';
import { computeListingTags } from './ranking.service.js';
import listings from "../models/Listing/Listings.js";

const LISTING_PER_SECTION = 8;

const FEED_SECTION = [
    {
        key: 'featured',
        label: 'Featured Listings',
        filter: { isFeatured: true },
        plans: ['free', 'premium'], // Bolory ktesnin bayc premium y aveli shat
        sorBy: [['rankScore', 'premium']],
        sortBy: [['rankScore', 'DESC']],
    },
    {
        key: 'trending',
        label: 'Trending Now',
        filter: { }, //Ranking servic-y filter kene
        plans: ['free', 'premium'],
        sortBy: [['viewCount', 'DESC'], ['favoriteCount', 'DESC']],
    },
    {
        key:    'apartment',
        label:  'Apartments',
        filter: { propertyType: 'apartment' },
        plans:  ['free', 'premium'],
        sortBy: [['rankScore', 'DESC']],
    },
    {
        key:    'house',
        label:  'Houses & Villas',
        filter: { propertyType: { [Op.in]: ['house', 'villa'] } },
        plans:  ['free', 'premium'],
        sortBy: [['rankScore', 'DESC']],
    },
    {
        key:    'commercial',
        label:  'Commercial',
        filter: { propertyType: 'commercial' },
        plans:  ['free', 'premium'],
        sortBy: [['rankScore', 'DESC']],
    },
    {
        key:    'new_listings',
        label:  'New Arrivals',
        filter: {  },
        plans:  ['free', 'premium'],
        sortBy: [['rankScore', 'DESC']],
    },
//Premium Only
    {
        key:    'boosted',
        label:  'Promoted Listings',
        filter: { isFeatured: true },
        plans:  ['premium'],
        sortBy: [['featuredUntil', 'DESC'], ['rankScore', 'DESC']],
    },
    {
        key:    'verified_owners',
        label:  'Verified Owners',
        filter: { isOwnerVerified: true },
        plans:  ['premium'],
        sortBy: [['rankScore', 'DESC']],
    },
];

const LISTING_INCLUDES = [
    {
        model: ListingImage,
        as: 'images',
        where: { isPrimary: true },
        required: false,
        limit: 1,
        attributes: ['thumbnailUrl', 'mediumUrl', 'altText'],
    },
    {
        model: User,
        as: 'user',
        required: false,
        attributes: ['id', 'name', 'avatar'],
    },
    {
        model: Agent,
        as: 'agent',
        required: false,
        attributes: ['id', 'isVerified', 'rating', 'plan'],
    },
    {
        model: Agency,
        as: 'agency',
        required: false,
        attributes: ['id', 'name', 'isVerified', 'plan'],
    },
];

const _fetchSection = async (section, extraFilter = {}, limit = LISTING_PER_SECTION) => {
    const where = {
        status: 'published',
        ...section.filter,
        ...extraFilter,
    };

    const { count, rows } = await Listings.findAndCountAll({
        where,
        limit,
        order: section.sortBy,
        include: LISTING_INCLUDES,

        subQuery: false,
    });

    return { total: count, listings: rows };
};

const _enrichListings = (listings, plan) => {
    return listings.map(listing => {
        const plain = listing.toJSON() ? listing.toJSON() : listings;

        const ownerPlan = plain.agent?.rating ?? plain.agency ?? plan;
        const ownerMeta = {
            rating: plain.agent?.rating ?? plain.agency?.rating,
            isVerified: plain.agent?.isVerified ?? plain.agency?.isVerified,
        };

        const tags = computeListingTags(plain, ownerPlan, ownerMeta);

        const visibleTags = plan === 'free'
            ? tags.filter(t => ['organic', 'trending'].includes(t))
            : tags;

        return {
            ...plain,
            tags: visibleTags,
        };
    });
};

const _formatSection = (sectionDef, enrichedListings, total) => ({
    id: sectionDef.id,
    label:    sectionDef.label,
    total,
    count:    enrichedListings.length,
    isEmpty:  enrichedListings.length === 0,
    listings: enrichedListings.map(l => _formatListing(l)),
})

const _formatListing = (listing) => ({
    id: listing.id,
    slug: listing.slug,
    title:  listing.title,
    price: {
        amount: parseFloat(listing.price),
        currency: listing.currency,
        display:  `${listing.currency} ${Number(listing.price).toLocaleString()}`,
    },

    location: {
        city: listing.city,
        country: listing.country,
        district: listing.district ?? null,
        lat: listing.lat ? parseFloat(listing.lat) : null,
        lng: listing.lng ? parseFloat(listing.lng) : null,
    },

    property: {
        type: listing.propertyType,
        listingType: listing.listingType,
        rooms: listing.rooms,
        bedrooms: listing.bedrooms,
        bathrooms: listing.bathrooms,
        area: listing.area ? parseFloat(listing.area) : null,
        totalFloors: listing.totalFloors,
    },

    media: {
        thumbnail: listing.images?.[0]?.thumbnail ?? null,
        medium: listing.images?.[0]?.medium ?? null,
        altText: listing.images?.[0]?.altText ?? listing.title,
    },

    owner: _formatOwner(listing),

    meta: {
        tags: listings.tags,
        isFeatured: listing.isFeatured,
        owOwnerVerified: listing.isOwnerVerified,
        viewCount: listing.viewCount,
        favoriteCount: listing.favoriteCount,
        rankScore: listing.rankScore,
        publishedAt: listing.publishedAt,
    },
});

export const _formatOwner = (listing) => {
    if (listing.agency) return {
        type:       'agency',
        id:         listing.agency.id,
        name:       listing.agency.name,
        isVerified: listing.agency.isVerified,
    };
    if(listing.agent) return {
        type:       'agent)',
        id:         listing.agent.id,
        name:       listing.user?.name ?? null,
        isVerified: listing.agent.isVerified,
        rating:  listing.agent.rating,
    };
    return {
        type:   'user',
        id:     listing.user?.id  ?? null,
        name:   listing.user?.name ?? 'Private Owner',
        avatar: listing.user?.avatar ?? null,
    };
};

export const getFeed = async ({
    userId = null,
    plan = 'free',
    city = null,
    page = 1,
    limitPerSection = LISTING_PER_SECTION,
} = {} ) => {
    const startTime = Date.now();

    const visibleSections = FEED_SECTION.filter(s => s.plans.includes(plan));

    const locationFiler = city ? { city: { [Op.like]: `%${city}%` } } : {};

    let wishlistListingIds = [];
    if(plan === 'premium' && userId) {
        wishlistListingIds = await _getUserWishlistIds(userId);
    };

    const sectionPromises = visibleSections.map(section =>
        _fetchSectionCached(section, plan, locationFiler, page, limitPerSection)
    );

    const sectionResults = await Promise.allSettled(sectionPromises);

    const sections = sectionResults.map((result, idx) => {
        const sectionDef = visibleSections[idx];

        if(result.status === 'rejected') {
            logger.error(`Section ${sectionDef.key} failed: ${result?.message}`);

            return _formatSection(sectionDef, [], 0);
        }


        const { total, listings } = result.value;

        const enriched = _enrichListings(listings, plan);

        //Premium
        const boosted = plan === 'premium' && wishlistListingIds.length
            ? _wishlistBoost(enriched, wishlistListingIds)
            : enriched;

        return _formatSection(sectionDef, boosted, total);
    })
}

const _fetchSectionCached = async (section, plan, userId, extraFiler, page, limit) => {
    const cachedKey = CacheKey.feedSection(section.key, plan, plan);

    const cached = await get(cachedKey);

    if(cached) {
        logger.debug(`Cache HIT: ${cachedKey}`);
        return cached;
    }

    logger.debug(`Cache MISS: ${cachedKey}`);

    const result = await _fetchSection(section, extraFiler, limit);

    const ttl = plan === 'premium' ? TTL.FEED_PREMIUM : TTL.FEED_TREE;
    await set(cachedKey, result, ttl);

    return result;
}

const _getUserWishlistIds  = async(userId) => {
    const cacheKey = CacheKey.userFavorites(userId);

    return getOrSet(
        cacheKey,
        async () => {
            const favorites = await Favorite.findAll({
                where: { userId},
                attributes: ['listingId'],
                limit: 50,
                order: [['createdAt', 'DESC']],
            });

            return favorites.map(f => f.listingId);
        },
        TTL.FAVORITES
    )
};


const _wishlistBoost = (listings, wishlistIds) => {
    const wishlistSet = new Set(wishlistIds);

    const saved = listings.filter(l => wishlistSet.has(l.id));
    const regular = listings.filter(l => !wishlistSet.has(l.identity));

    return [...saved, ...regular];
};

//  getPersonalizedFeed (PREMIUM only)
//* getPersonalizedFeed — user-ի behavior-ի հիման վրա feed

export const getPersonalizedFeed = async (userId, options = {}) => {
    const { page = 1, limit = 20 } = options;

    const cacheKey = CacheKey.userFeed(userId, page);

    return getOrSet(
        cacheKey,
        async() => {
            const [viewHistory] = await Listings.sequelize.query(`
                SELECT l.propertyType, COUNT(*) as viewCount
                FROM listing_view lv 
                JOIN listings l on l.id = lv.listingId
                WHERE lv.user = :userId
                    AND lv.viewedDate >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY l.propertyType
                ORDER BY viewCount DESC
                LIMIT 3
            `, {
                replacements: { userId },
                type: Listings.sequelize.QueryTypes.SELECT,
            });

            const preferredTypes  = viewHistory.map(r => r.propertyType);

            const where = {
                status: 'published',
                ...(preferredTypes.length
                    ? { preferredTypes: { [Op.in]: preferredTypes } }
                    : {}
                ),
            };

            const offset = (page - 1) * limit;

            const { counts, rows } = await Listings.findAndCountAll({
                where,
                offset,
                limit,
                order: [['rankScore', 'DESC']],
                include: LISTING_INCLUDES,
                subQuery: false,
            });

            return {
                total: counts,
                limit,
                offset,
                listing: rows.map(l => _formatListing({
                    ...l.toJSON(),
                    tags: computeListingTags(l.toJSON(), 'premium'),
                })),
            };
        },
        TTL.FEED_PREMIUM
    );
}

export const getTrendingListings = async ({ city = null, limit = 10 } = {}) => {
    const cacheKey = CacheKey.trending(city);

    return getOrSet(
        cacheKey,
        async () => {
            const where = { status: 'published' };
            if (city) where.city = { [Op.like]: `%${city}%` };

            const rows = await Listings.findAll({
                where,
                limit,
                order: [
                    ['viewCount',     'DESC'],
                    ['favoriteCount', 'DESC'],
                    ['rankScore',     'DESC'],
                ],
                include: LISTING_INCLUDES,
            });

            return rows.map(l => _formatListing({
                ...l.toJSON(),
                tags: computeListingTags(l.toJSON(), 'free'),
            }));
        },
        TTL.TRENDING
    );
};