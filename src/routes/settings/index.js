import { Router }       from 'express';
import notifRoutes      from './notification.routes.js';
import privacyRoutes    from './privacy.routes.js';
import authRoutes       from './auth.settings.routes.js';
import { verifyToken }  from '../../middleware/auth.middleware.js';
import * as ctrl        from '../../controllers/settings/profileSettings.ctrl.js';

const router = Router();

router.use(verifyToken);

router.get('/', ctrl.getSettings);

router.use('/notifications', notifRoutes);
router.use('/privacy',       privacyRoutes);
router.use('/auth',          authRoutes);

export default router;