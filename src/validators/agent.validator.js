import Joi from "joi";

export const registerAgentSchema = Joi.object({
    phone: Joi.string()
        .min(8)
        .max(20)
        .required()
        .messages({
            'string.min': 'Phone must be at least 8 characters long.',
            'ant.required': 'Phone is required'
        }),

    bio: Joi.string()
        .min(20)
        .max(1000)
        .optional()
        .messages({
            'string.min': 'Bio must be at least 20 characters long.'
        }),

    city: Joi.string()
        .required()
        .messages({
            'any.required': 'City is required'
        }),

    experience: Joi.number()
        .integer()
        .min(0)
        .max(50)
        .optional(),

    licenseNumber: Joi.string()
        .optional(),

    facebook:  Joi.string().uri().optional(),
    instagram: Joi.string().uri().optional(),
    telegram:  Joi.string().optional(),
    website:   Joi.string().uri().optional(),
})