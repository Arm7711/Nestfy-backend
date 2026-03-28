import rateLimit from 'express-rate-limit';

const make = (opts) =>
    rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        handler: (req, res) =>
            res.status(429).json({ success: false, message: opts.message }),
        ...opts,
    });

export const globalLimiter = make({
    windowMs: 15 * 60 * 1000,
    max: 300,
    message: 'Too many requests. Please try again later.',
});

export const authLimiter = make({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    message: 'Too many auth attempts. Please try again later.',
});

export const sendCodeLimiter = make({
    windowMs: 60 * 1000,
    max: 3,
    message: 'Too many code requests. Please wait a minute.',
});