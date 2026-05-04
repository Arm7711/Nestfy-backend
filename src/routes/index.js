import { Router }   from 'express';
import authRoutes    from './auth.routes.js';
// import listingRoutes from './listing.routes.js';
// import commentRoutes from './comment.routes.js';
import kycRoutes     from './kyc.routes.js';
//import chatRoutes    from './chat.routes.js';
import settingsRoutes from "./settings.routes.js";


const router = Router();

router.use('/auth',      authRoutes);
//router.use('/listings',  listingRoutes);
//router.use('/listings/:listingId/comments', commentRoutes);
router.use('/kyc',       kycRoutes);
//router.use('/chat',      chatRoutes);
router.use('/settings',  settingsRoutes);

export default router;