import Joi from 'joi';
import { validate } from './notification.validator.js';

export const authSchema  = Joi.object({
    twoFactorEnabled: Joi.boolean(),
    threeFactorMethod: Joi.string().valid('email', 'sms', 'totp').allow('null'),
    loginAlerts: Joi.boolean(),
    deviceTracking: Joi.boolean(),
    sessionTimeout:        Joi.string().valid('1h', '24h', '7d', '30d', 'never'),
    trustedDevicesEnabled: Joi.boolean(),
}).min(1);

export { validate };

