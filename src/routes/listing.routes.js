import { Router }   from 'express';
import rateLimit     from 'express-rate-limit';
import * as ctrl     from '../controllers/listing.controller.js';
import { verifyToken }      from '../middleware/auth.middleware.js';
import { requireRole }      from '../middleware/role.middleware.js';
import { listingImageUpload, handleMulterError } from '../config/multer.js';
import {
    validateListing,
    validateRejectListing,
    validateSearch,
} from '../validators/listing.validator.js';
import { getComments } from '../controllers/comment.controller.js';
import * as wishlistCtrl from '../controllers/wishlist.controller.js';
import { validateWishlistParam } from '../validators/wishlist.validator.js';

const router = Router();

//  Rate limiters

const createLimiter = rateLimit({
    windowMs:     60 * 60 * 1000, // 1 hour
    max:          10,
    keyGenerator: (req) => `create-listing:${req.user?.id}`,
    message:      { success: false, code: 'RATE_LIMIT', message: 'Too many listings created.' },
});

const viewLimiter = rateLimit({
    windowMs:     60 * 1000, // 1 min
    max:          60,
    message:      { success: false, message: 'Too many requests.' },
});

//  Public routes

router.get('/',    validateSearch, ctrl.getListings);
router.get('/:id', viewLimiter,   ctrl.getListingById);

// Comments on listing — mounted inline for param access
router.get('/:listingId/comments', getComments);

//  Authenticated routes

router.use(verifyToken);

// Wishlist (favorites) — nested under /listings/:listingId/favorite
router.post('/:listingId/favorite', validateWishlistParam, wishlistCtrl.toggleFavorite);
router.get ('/:listingId/favorite', validateWishlistParam, wishlistCtrl.checkFavorite);

// Create
router.post(
    '/',
    createLimiter,
    requireRole('user', 'agent', 'agency'),
    validateListing,
    ctrl.createListing
);

// Update
router.put(
    '/:id',
    requireRole('user', 'agent', 'agency'),
    validateListing,
    ctrl.updateListing
);

// Status transitions
router.post('/:id/submit',  requireRole('user', 'agent', 'agency'), ctrl.submitForReview);
router.post('/:id/archive', requireRole('user', 'agent', 'agency'), ctrl.archiveListing);
router.delete('/:id',       requireRole('user', 'agent', 'agency'), ctrl.deleteListing);

// Images

router.post(
    '/:id/images',
    requireRole('user', 'agent', 'agency'),
    listingImageUpload,
    handleMulterError,
    ctrl.uploadImages
);

router.delete(
    '/:id/images/:imageId',
    requireRole('user', 'agent', 'agency'),
    ctrl.deleteImage
);

router.patch(
    '/:id/images/:imageId/primary',
    requireRole('user', 'agent', 'agency'),
    ctrl.setPrimaryImage
);

router.patch(
    '/:id/images/reorder',
    requireRole('user', 'agent', 'agency'),
    ctrl.reorderImages
);

//  Admin

router.post(
    '/:id/approve',
    requireRole('admin', 'superadmin'),
    ctrl.approveListing
);

router.post(
    '/:id/reject',
    requireRole('admin', 'superadmin'),
    validateRejectListing,
    ctrl.rejectListing
);

export default router;