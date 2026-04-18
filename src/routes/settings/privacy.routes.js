import {Router} from "express";
import * as ctrl from "../../controllers/settings/privacy.ctrl.js";
import { validate, privacySchema } from '../../validator/settings/privacy.validator.js';
import {verifyToken} from "../../middleware/auth.middleware.js";

const router = new Router();

router.get('/', verifyToken, ctrl.getPrivacy);
router.patch('/', verifyToken, validate(privacySchema), ctrl.updatePrivacy);

export default router;