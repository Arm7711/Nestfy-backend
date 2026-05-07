import { Router }      from 'express';
import rateLimit       from 'express-rate-limit';
import * as ctrl       from '../controllers/wishlist.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { validateWishlistParam } from '../validators/wishlist.validator.js';

const router = Router();

router.use(verifyToken);

const toggleLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: (req) => `wishlist:toggle:${req.user.id}`,
    message: { success: false, code: 'RATE_LIMIT', message: 'Too many requests. Slow down.' },
})

router.get('/', ctrl.getWishlistIds);

router.get('/ids', ctrl.getWishlistIds);

router.get('/:listingId/check', validateWishlistParam, ctrl.checkFavorite);

router.post('/:listingId',   toggleLimiter, validateWishlistParam, ctrl.toggleFavorite);

// DELETE /wishlist     — clear all
router.delete('/',                     ctrl.clearWishlist);

export default router;