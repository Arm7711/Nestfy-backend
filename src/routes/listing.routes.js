// import { Router } from 'express';
// import rateLimit from 'express-rate-limit';
// import * as ctrl from '../controllers/listing.controller.js';
// import { verifyToken } from '../middleware/auth.middleware.js';
// //import {createListingSchema} from "../validators/listing.validator.js";
// import {handleMulterError} from "../config/multer.js";
// import {requireRole} from "../middleware/role.middleware.js";
// const router = Router();
//
// const createLimiter = rateLimit({
//     windowMs: 60 * 60 * 1000,
//     max: 10,
//     keyGenerator: (req) => `create-listing:${req.user?.id}`,
//     message: { success: false, code: 'RATE_LIMIT', message: 'Too many listings created.' },
// });
//
// //Public routes
//
// router.get('/', ctrl.getListings);
// router.get ('/:id', ctrl.getListingById);
//
// router.get ('/:listingId/comments',  require('../controllers/comment.controller.js').getComments);
//
// router.use(verifyToken);
//
// router.post('/',
//     createLimiter,
//     requireRole('user', 'agent', 'agency'),
//     createListingSchema,
//     ctrl.createListing
// );
//
// router.put('/:id',
//     requireRole('user', 'agent', 'agency'),
//     ctrl.updateListing
// );
//
// router.post('/:id/submit',
//     requireRole('user', 'agent', 'agency'),
//     ctrl.submitForReview
// );
//
// router.post('/:id/archive',
//     requireRole('user', 'agent', 'agency'),
//     ctrl.archiveListing
// );
//
// router.delete('/:id',
//     requireRole('user', 'agent', 'agency'),
//     ctrl.deleteListing
// );
//
// //Images
//
// router.post(
//     '/:id/images',
//     requireRole('user', 'agent', 'agency'),
//     requireRole('user', 'agent', 'agency'),
//     listingImageUpload,
//     handleMulterError,
//     ctrl.uploadImages
// );
//
// router.delete('/:id/images/:imageId',
//     requireRole('user', 'agent', 'agency'),
//     ctrl.deleteImage
// );
//
// // Admin
// router.post('/:id/approve',
//     requireRole('admin', 'superadmin'),
//     ctrl.approveListing
// );
//
// router.post('/:id/reject',
//     requireRole('admin', 'superadmin'),
//     validateRejectListing,
//     ctrl.rejectListing
// );
//
// export default router;
//
