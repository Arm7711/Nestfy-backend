import { Router }   from 'express';
import * as ctrl    from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.use(verifyToken);

router.get ('/',                               ctrl.getConversations);
router.post('/listing/:listingId',             ctrl.startConversation);
router.get ('/:conversationId/messages',       ctrl.getMessages);
router.post('/:conversationId/messages',       ctrl.sendMessage);
router.post('/:conversationId/read',           ctrl.markAsRead);

export default router;