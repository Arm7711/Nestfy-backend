import Joi from "joi";
import {makeValidator} from "./security.validator.js";

export const connectPayPalSchema  = Joi.object({
    paypalEmail: Joi.string().email().required(),
    paypalAccountId: Joi.string().required(),
    payoutEmail: Joi.string().email().optional().allow(null, ''),
});

export const paymentSettingsSchema = Joi.object({
    defaultCurrency:   Joi.string().valid('USD','EUR','AMD','RUB','GBP').optional(),
    autoPayoutEnabled: Joi.boolean().optional(),
    payoutThreshold: Joi.number().min(1).max(100).optional(),
}).min(1);

export const validateConnectPayPal = makeValidator(connectPayPalSchema);
export const validatePaymentSettings = makeValidator(paymentSettingsSchema);