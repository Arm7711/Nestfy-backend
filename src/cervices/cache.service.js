import redis from "../config/redis.js";

export const getCache = async (key) => {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
};

export const setCache = async (key, data, ttlSecond = 600) => {
    await redis.setex(key, ttlSecond, JSON.stringify(data));
};

export const clearListingsCache = async () => {
    const keys = await redis.keys('listings:*');
    if(keys.length > 0) {
        await redis.del(...keys);
    }
}