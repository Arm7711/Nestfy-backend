import {Op} from "sequelize";
import AppError  from '../utils/AppError.js';
import {ListingView, Listings} from "../models/Common/index.js";
import {userAgent} from "paypal-rest-sdk/lib/configure.js";

const BOT_PATTERNS = [
    /bot/i, /crawler/i, /spider/i,
    /scrapy/i, /wget/i, /curl/i,
    /python-requests/i, /go-http/i,
];

const isBot =(userAgent) => {
    if  (!userAgent) return true;
    return BOT_PATTERNS.some(p => p.test(userAgent));
};

/**
 * trackView — listing-ի դիտումների tracking + deduplication
 *
 * Logic:
 * Bot-երի դեպքում detect է լինում → կարող է հաշվվել, բայց stats-ում չի ներառվում
 * Logged user → userId + listingId + today unique
 * Guest       → ipAddress + listingId + today unique
 *
 * Ինչու՞ findOrCreate՝ create-ի փոխարեն
 * findOrCreate-ը race condition-ից safe է —
 * միաժամանակյա requests-ի դեպքում duplicate view չի ստեղծում
 */

export const trackView = async ({
    listingId, userId = null, ipAddress, userAgent,
}) => {
    const botDetected = isBot(userAgent);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const uniqueWhere = userId
        ? { listingId, userId, viewedDate: today }
        : { listingId, userId: null, ipAddress, viewedDate: today };

    const [view, created] = await Listings.findOrCreate({
        where: uniqueWhere,
        defaults: {
            ...uniqueWhere,
            userAgent,
            isBot: botDetected,
        }
    })

    if(created && !botDetected) {
        await Listings.increment('viewCount', { where: { id: listingId } });

        updateRankScore(listingId).catch(() => {});
    }

    return{  counted: created  && !botDetected,};
}

const updateRankScore = async (listingId) => {
    const listing = await Listings.findByPk(listingId, {
        attributes: [
            'id', 'viewCount', 'favoriteCount',
            'commentCount', 'isFeatured', 'publishedAt'
        ],
    });

    if(!listing) return false;

    const daysSincePublish = listing.publishedAt
        ? (Date.now() - new Date(listing.publishedAt)) / (1000 * 60 * 60 * 24)
        : 999;

    const recencyBonus = Math.max(0, 30 - daysSincePublish);

    const score =
        (listing.viewCount * 1) +
        (listing.favoriteCount * 3) +
        (listing.publishedAt * 2) +
        (listing.publishedAt ? 50 : 0) +
        recencyBonus;

    await Listings.update(
        { rankScore: score },
        { where: { id: listingId } }
    );
};