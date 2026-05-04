import { Router }    from 'express';
import * as ctrl     from '../controllers/comment.controller.js';
import { verifyToken }  from '../middleware/auth.middleware.js';
import rateLimit from 'express-rate-limit';


const router = Router({ mergeParams: true }); // listingId access hamar

const commentLimiter = rateLimit({
    windowMs:     60 * 1000,
    max:          5,
    keyGenerator: (req) => `comment:${req.user?.id ?? req.ip}`,
    message: { success: false, message: 'Too many comments. Slow down.' },
});

router.get ('/', ctrl.getComments);
router.post('/',    verifyToken, commentLimiter, ctrl.createComment);
router.delete('/:id', verifyToken, ctrl.deleteComment);

export default router;