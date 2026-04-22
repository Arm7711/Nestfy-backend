import rateLimit from "express-rate-limit";
import RedisStore from 'rate-limit-redis';
import redis from "../config/redis.js";

/**
 * WHY separate rate limiters per action?
 * Password change — highly sensitive — 5 requests per hour
 * General settings — 100 requests per 15 minutes
 * Data download — 1 per day — also checked at the service level
 */

// General settings — 100 requests per 15 min

export const settingsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    keyGenerator:    (req) => `settings:${req.user.id}`,
    standardHeaders: true,
    message: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later',
    },
});

// Password change - 5 per hour

export const passwordChangeLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    keyGenerator:    (req) => `pwd:${req.user.id}`,
    message: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again in 1 hour.',
    }
});

//2FA toggle - 10 per hour

export const twoFactorLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    keyGenerator:    (req) => `2fa:${req.user.id}`,
    message: {
        success: false,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many 2FA attempts.',
    }
})
