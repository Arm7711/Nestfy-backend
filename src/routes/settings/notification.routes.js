import {Router} from "express";
import * as ctrl from '../../controllers/settings/notification.ctrl.js';
import { validate, notificationChannelSchema, marketplaceSchema }
    from '../../validator/settings/notification.validator.js';
import {verifyToken} from "../../middleware/auth.middleware.js";

const router = Router();

router.get('/',  verifyToken, ctrl.getNotificationSettings);
router.patch('/', verifyToken, validate(notificationChannelSchema), ctrl.updateNotificationSetting);

router.get('/marketplace', verifyToken, ctrl.getMarketplaceNotifications);
router.patch('/marketplace', verifyToken, validate(marketplaceSchema), ctrl.updateMarketplaceNotifications);

export default router;