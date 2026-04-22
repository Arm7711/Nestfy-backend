import Joi from "joi";

export const changePasswordSchema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string()
        .min(8).max(128)
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
        .required()
        .messages({
            'string.pattern.base':
                'Password must contain uppercase, lowercase, number, and special characters',
        }),
    confirmPassword: Joi.string()
        .valid(Joi.ref('newPassword'))
        .required()
        .messages({
            'any.only': 'Password do not match',
        }),
});

const twoFactorSchema = Joi.object({
    enabled: Joi.boolean().required(),
    method:  Joi.string().valid('email', 'sms', 'totp').when('enabled', {
        is:        true,
        then:      Joi.required(),
        otherwise: Joi.optional().allow(null),
    }),
});

export const securitySettingsSchema = Joi.object({
    loginAlerts: Joi.boolean().optional(),
    sessionTimeout: Joi.string().valid('1h', '24h', '7d',  '30d', 'never').optional(),
    deviceTracking: Joi.boolean().optional(),
}).min(1);

export const validateChangePassword = makeValidator(changePasswordSchema);
export const validateTwoFactor = makeValidator(twoFactorSchema);
export const validateSecuritySettings = makeValidator(securitySettingsSchema);


export function makeValidator(schema) {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if(error) {
            return res.status(400).json({
                success: false,
                code: "VALIDATION_ERROR",
                messages: error.details.map(d => d.message),
            });
        }
        next();
    };
}