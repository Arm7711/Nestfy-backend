import { Op } from "sequelize";
import { ListingView, Listings } from "../../models/Common/index.js";

const BOT_PATTERNS = [
    /bot/i, /crawler/i, /spider/i,
    /scrapy/i, /wget/i, /curl/i,
    /python-requests/i, /go-http/i,
    /headless/i, /phantomjs/i,
];

const isBot = (userAgent) => {
    if (!userAgent) return true;
    return BOT_PATTERNS.some((p) => p.test(userAgent));
};

/**
 * trackView — listing view tracking with deduplication
 *
 * BUGS FIXED:
 * 1. Was calling `Listings.findOrCreate` instead of `ListingView.findOrCreate`
 * 2. ipAddress was being set to userAgent string (swapped fields in controller)
 */
export const trackView = async ({ listingId, userId = null, ipAddress, userAgent }) => {
    const botDetected = isBot(userAgent);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const uniqueWhere = userId
        ? { listingId, userId, viewedDate: today }
        : { listingId, userId: null, ipAddress, viewedDate: today };

    const [, created] = await ListingView.findOrCreate({
        where:    uniqueWhere,
        defaults: {
            ...uniqueWhere,
            userAgent,
            isBot: botDetected,
        },
    });

    if (created && !botDetected) {
        await Listings.increment('viewCount', { where: { id: listingId } });
        updateRankScore(listingId).catch(() => {});
    }

    return { counted: created && !botDetected };
};

/**
 * updateRankScore — recomputes listing rank after each view
 *
 * Formula:
 *   views × 1  +  favorites × 3  +  comments × 2  +  featured bonus 50  +  recency bonus (max 30)
 *
 * BUGS FIXED:
 * 1. Was using `listing.publishedAt` (a Date object) in arithmetic as if it were commentCount
 * 2. Was using `listing.publishedAt` again for featured bonus check
 */

const updateRankScore = async (listingId) => {
    const listing = await Listings.findByPk(listingId, {
        attributes: [
            'id', 'viewCount', 'favoriteCount',
            'commentCount', 'isFeatured', 'publishedAt',
        ],
    });

    if (!listing) return;

    const daysSincePublish = listing.publishedAt
        ? (Date.now() - new Date(listing.publishedAt)) / (1000 * 60 * 60 * 24)
        : 999;

    const recencyBonus = Math.max(0, 30 - daysSincePublish);

    const score =
        (listing.viewCount    * 1) +
        (listing.favoriteCount * 3) +
        (listing.commentCount  * 2) +
        (listing.isFeatured    ? 50 : 0) +
        recencyBonus;

    await Listings.update({ rankScore: parseFloat(score.toFixed(2)) }, { where: { id: listingId } });
};

// Analytics (admin / owner)

export const getViewStats = async (listingId, days = 30) => {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const views = await ListingView.findAll({
        where: {
            listingId,
            isBot:      false,
            viewedDate: { [Op.gte]: since.toISOString().split('T')[0] },
        },
        attributes: ['viewedDate', 'userId'],
        order:      [['viewedDate', 'ASC']],
    });

    // Group by date
    const byDate = views.reduce((acc, v) => {
        acc[v.viewedDate] = (acc[v.viewedDate] || 0) + 1;
        return acc;
    }, {});

    const uniqueUsers  = new Set(views.filter((v) => v.userId).map((v) => v.userId)).size;
    const guestViews   = views.filter((v) => !v.userId).length;

    return {
        total:       views.length,
        uniqueUsers,
        guestViews,
        byDate,
    };
};