import { Router }      from 'express';
import * as ctrl       from '../controllers/chat.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import rateLimit       from 'express-rate-limit';
import { validateSendMessage } from '../validators/chat.validator.js';

const router = Router();

router.use(verifyToken);

// Rate limit message sending — 60 per minute
const messageLimiter = rateLimit({
    windowMs:     60 * 1000,
    max:          60,
    keyGenerator: (req) => `chat:msg:${req.user.id}`,
    message:      { success: false, message: 'Too many messages. Slow down.' },
});

router.get('/',                                       ctrl.getConversations);
router.post('/listing/:listingId',                    ctrl.startConversation);
router.get ('/:conversationId/messages',              ctrl.getMessages);
router.post('/:conversationId/messages', messageLimiter, validateSendMessage, ctrl.sendMessage);
router.post('/:conversationId/read',                  ctrl.markAsRead);
router.post('/:conversationId/archive',               ctrl.archiveConversation);

export default router;