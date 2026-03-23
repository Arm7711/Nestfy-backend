import { Router } from 'express';
import {
    register,
    login,
    refreshToken,
    logout,
    getMe,
} from '../controller/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/register',  register);
router.post('/login',     login);
router.post('/refresh',   refreshToken);
router.post('/logout',    logout);
router.get('/me',         verifyToken, getMe);

export default router;