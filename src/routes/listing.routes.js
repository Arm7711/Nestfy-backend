import { Router } from 'express';
import {
    getListings,
    getListingById,
    createListing,
    updateListingStatus,
} from '../controllers/listing.controller.js';
import { verifyToken, requireRole } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/',    getListings);
router.get('/:id', getListingById);

router.post('/', verifyToken, requireRole('agent'), createListing);

router.patch('/:id/status', verifyToken, requireRole('admin', 'superadmin'), updateListingStatus);

export default router;