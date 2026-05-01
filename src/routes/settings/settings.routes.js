import { Router } from 'express';
import * as profile from '../../controllers/settings/profile.ctrl.js';
import * as security from '../../controllers/settings/security.ctrl.js';
import * as privacy from '../../controllers/settings/privacy.ctrl.js';
import * as notif from '../../controllers/settings/notification.ctrl.js';
import * as payment from '../../controllers/settings/payment.ctrl.js';

import {
    settingsAuthGuard,
    sensitiveActionGuard,
} from "../../middleware/settings.auth.middleware.js";

import upload from '../../middleware/upload.js';

import {
    settingsLimiter,
    passwordChangeLimiter,
    twoFactorLimiter,
} from "../../middleware/settings.rate.limiter.js";

import { validateProfile } from '../../validators/settings/profile.validator.js';
import {
    validateChangePassword,
    validateTwoFactor,
    validateSecuritySettings,
} from '../../validators/settings/security.validator.js';
import { validateConnectPayPal, validatePaymentSettings }
    from '../../validators/settings/payment.validator.js';


const router = Router();

router.use(settingsAuthGuard);
router.use(settingsLimiter);

//  Profile
router.get('/profile', profile.getProfile);
router.put('/profile', validateProfile, profile.updateProfile);
router.patch('/profile/avatar', upload.single('avatar'), profile.updateAvatar);

// Security
router.get('/security', security.getSecuritySettings);
router.put('/security', validateSecuritySettings, security.updateSecuritySettings);
router.post('/security/change-password', passwordChangeLimiter, sensitiveActionGuard, validateChangePassword, security.changePassword);
router.post('/security/2fa', twoFactorLimiter, validateTwoFactor, security.toggleTwoFactor);
router.get('/security/sessions', security.getActiveSessions);
router.delete('/security/sessions/:sessionId', security.revokeSession);
router.post('/security/logout-all', security.logoutAllDevices);

// Privacy
router.get('/privacy', privacy.getPrivacySettings);
router.put('/privacy', privacy.updatePrivacySettings);
router.post('/privacy/data-download', privacy.requestDataDownload);
router.post('/privacy/delete-account', sensitiveActionGuard, privacy.requestAccountDeletion);
router.delete('/privacy/delete-account', privacy.cancelAccountDeletion);


// Notifications
router.get('/notifications', notif.getNotificationSettings);
router.put('/notifications', notif.updateNotificationSettings);


// Payment
router.get('/payment', payment.getPaymentSettings);
router.put('/payment', validatePaymentSettings, payment.updatePaymentSettings);
router.post('/payment/paypal/connect', sensitiveActionGuard, validateConnectPayPal, payment.connectPayPal);
router.post('/payment/paypal/disconnect', sensitiveActionGuard, payment.disconnectPayPal);

export default router;