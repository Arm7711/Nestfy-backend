import { Router } from 'express';
import * as ctrl  from '../../controllers/settings/auth.ctrl.js';
import { validate, authSchema } from '../../validator/settings/auth.validator.js';

const router = Router();

router.get('/', ctrl.getAuthSettings);
router.patch('/', validate(authSchema), ctrl.updateAuthSettings);

export default router;