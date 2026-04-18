import Joi from "joi";
import { validate } from "./notification.validator.js";

export const privacySchema = Joi.object({
    profileVisibility: Joi.string().valid('public', 'private', 'agents_only'),
    showPhone: Joi.boolean(),
    showEmail: Joi.boolean(),
    allowMessaging: Joi.boolean(),
    showOnlineStatus: Joi.boolean(),
    showLastSeen: Joi.boolean(),
    showListingStats: Joi.boolean(),
    showAgencyMembership: Joi.boolean(),
}).min(1);

export { validate }