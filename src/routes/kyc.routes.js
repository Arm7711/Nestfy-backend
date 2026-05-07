import { Router }    from 'express';
import * as ctrl     from '../controllers/kyc.controller.js';
import { verifyToken} from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';
import {requireRole} from "../middleware/role.middleware.js";

const router = Router();

// Max 3 KYC attempts per day
const kycLimiter = rateLimit({
    windowMs:     24 * 60 * 60 * 1000,
    max:          3,
    keyGenerator: (req) => `kyc:${req.user?.id}`,
    message: {
        success: false,
        code:    'KYC_LIMIT',
        message: 'Maximum 3 KYC attempts per day.',
    },
});

router.use(verifyToken);

router.post('/submit',
    kycLimiter,
    ctrl.submitKYC
);

router.get('/status', ctrl.getKYCStatus);

// Admin override
router.patch('/:kycId/decision',
    requireRole('admin', 'superadmin'),
    ctrl.adminOverrideKYC
);

export default router;