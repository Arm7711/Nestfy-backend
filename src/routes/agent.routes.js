import { Router } from 'express';
import {
    registerAgent,
    getMyAgentProfile,
    getAgentById,
    approveAgent,
    rejectAgent,
} from '../controllers/agent.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import {requireRole} from "../middleware/role.middleware.js";


const router = Router();

router.get('/me', verifyToken, requireRole('agent'), getMyAgentProfile);

router.get('/:id', getAgentById);

router.post('/register', verifyToken, registerAgent);


router.patch(
    '/:id/approve',
    verifyToken,
    requireRole('admin', 'superadmin'),
    approveAgent
);
router.patch(
    '/:id/reject',
    verifyToken,
    requireRole('admin', 'superadmin'),
    rejectAgent
);

export default router;