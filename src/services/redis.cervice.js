import redis from "../config/redis.js";
import logger from "../utils/logger.js";

//ttl CONSTANTS bolor cahcheeri jamketner


export const TTL = {
    FEED_SECTION: 60 * 5,
    FEED_TREE: 60  * 10,
    FEED_PREMIUM: 60 * 3,
    LISTING_DETAIL: 60 * 15,
    RANK_SCORE: 60 * 60,
    TRENDING: 60 * 30,
    FEATURED: 60 * 5,
    FAVORITES: 60 * 60,
    SEARCH: 60 * 5,
};

export const CacheKey = {
    feedSection: (section, plan, page = 1) =>
        `feed:section${section}:plan:${plan}:page=${page}`,

    feedFull: (userId, plan) =>  `feed:full:${userId ?? 'guest'}:${plan}`,

    listingDetail: (listingId) => `listing:detail:${listingId}`,
    rankScore: (listingId) => `listing:rank:${listingId}`,
    trending: (city) => `trending:${city ?? 'global'}`,
    featured: () => `featured:global`,
    userFavorites: (userId) => `user:favorites:${userId}`,
    userFeed: (userId, page) => `user:feed:${userId}:${page}`,

    listingPattern: (listingId) => `listing:*:${listingId}`,
    feedPattern: () => `feed:*`,
};

export const get = async (key) => {
    try {
        const raw = await redis.get(key)
        if(!raw) return null;
        return JSON.parse(raw);
    }catch(error) {
        logger.warn(`Redis GET failed [${key}]: ${error.message}`);
        return null;
    }
};

export const set = async (key, value, ttl = TTL.FEED_SECTION) => {
    try {
        const serialized =  JSON.stringify(value);
        if(ttl > 0) {
            await redis.setex(key, ttl, serialized);
        }else {
            await redis.set(key, serialized);
        }
    }catch(error) {
        logger.warn(`Redis SET failed [${key}]: ${error.message}`);
    }
};

export const del = async (keys) => {
    try {
        const keyArray = Array.isArray(keys) ? keys : [keys];
        if(keyArray.length === 0) return;
        await redis.del(...keyArray);
        logger.debug(`Redis DEL: ${keyArray.join(', ')}`);
    }catch(error) {
        logger.warn(`Redis DEL failed ${error.message}`)
    }
};

export const invalidatePattern = async (pattern) => {
    try {
        let cursor = '0';
        const keysToDelete = [];

        do {
            const [nextCursor, keys] = await redis.scan(
                cursor,
                'MATCH', pattern,
                'COUNT', 100
            );
            cursor = nextCursor;
            keysToDelete.push(...keys);
        }while(cursor !== '0');

        if(keysToDelete.length > 0) {
            await redis.del(...keysToDelete);
            logger.info(`Redis invalidated ${keysToDelete.length} keys matching "${pattern}"`);
        }
    }catch(error) {
        logger.warn(`Redis pattern invalidation failed [${pattern}]: ${error.message}`);
    }
};

export const exists = async (key) => {
    try {
        return (await redis.exists(key)) === 1;
    }catch(error) {
        return false;
    }
};

export const getOrSet = async (key, fetcher, ttl =TTL.FEED_SECTION) => {
    const cached = await get(key);
    if(cached !== null) return cached;

    const fresh = await fetcher();

    if(fresh !== null && fresh !== undefined) {
        set(cached, key, ttl).catch(() => {})
    }

    return fresh;
};


export const mget = async (keys) => {
    if(!keys.length) return {};

    try {
        const values = await redis.mget(...keys);

        return Object.fromEntries(
            keys.map((k, i) => [k, values[i] ? JSON.parse(values[i]) : null])
        );
    }catch(error) {
        logger.warn(`Redis MGET failed: ${error.message}`)
    }
};

export const increment = async (key, by = 1) => {
    try {
        return await redis.incrby(key, by);
    }catch(error) {
        logger.warn(`Redis INCR failed [${key}]: ${error.message}`);
        return null;
    }
}

export default {
    get, set, del, getOrSet, mget, CacheKey, invalidatePattern, increment, TTL, cacheKey
}