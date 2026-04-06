import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller.js';
import { verifyToken } from '../middleware/auth.middleware.js';
import { authLimiter, sendCodeLimiter } from '../middleware/rate.limitter.js';
import { validate, checkEmailSchema, initiateSchema, verifyCodeSchema } from '../validator/auth.validator.js';

const router = Router();

router.post('/check-email',  authLimiter, validate(checkEmailSchema),  ctrl.checkEmail);


router.post('/login',        authLimiter, validate(initiateSchema),    ctrl.initiateLogin);
router.post('/register',     authLimiter, validate(initiateSchema),    ctrl.initiateRegister);


router.post('/verify-code',  authLimiter, validate(verifyCodeSchema),  ctrl.verifyCodeController);


router.post('/refresh',                                                 ctrl.refresh);
router.post('/access-token',                           ctrl.getAccessTokenController);
router.post('/logout',                                                  ctrl.logout);
router.post('/logout-all',   verifyToken,                              ctrl.logoutAll);

router.get('/me',            verifyToken,                              ctrl.getMe);


router.post('/google',       authLimiter,                              ctrl.googleAuth);
router.post('/apple',        authLimiter,                              ctrl.appleAuth);

export default router;