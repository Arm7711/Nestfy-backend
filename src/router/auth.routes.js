import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import {
    register,
    login,
    refreshToken,
    logout,
    getMe,
    googleLogin,
    appleLogin
} from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: { success: false, message: 'Too many attempts' },
});

const limiter = (req, res, next) => authLimiter(req, res, next);


router.post('/login', limiter, login);
router.post('/register', limiter, register);
router.post('/google', limiter, googleLogin);
router.post('/apple', limiter, appleLogin);

router.post('/refresh', refreshToken);
router.post('/logout', logout);

router.get('/me', verifyToken, getMe);

export default router;