import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authLimiter, sendCodeLimiter } from '../middleware/rate.limitter.js';
import {
    validate,
    registerSchema,
    loginSchema,
    sendCodeSchema,
    verifyCodeSchema,
} from '../validator/auth.validator.js';

const router = Router();

router.post('/register',     authLimiter,     validate(registerSchema),    ctrl.register);
router.post('/login',        authLimiter,     validate(loginSchema),       ctrl.login);
router.post('/send-code',    sendCodeLimiter, validate(sendCodeSchema),    ctrl.sendCode);
router.post('/verify-code',  authLimiter,     validate(verifyCodeSchema),  ctrl.verifyCode);
router.post('/refresh',                                                     ctrl.refresh);
router.post('/logout',                                                      ctrl.logout);

router.post('/logout-all',   verifyToken,                                  ctrl.logoutAll);
router.get('/me',            verifyToken,                                  ctrl.getMe);

export default router;