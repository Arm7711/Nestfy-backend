import Joi from 'joi';

const profileSchema = Joi.object({
    fullName: Joi.string().min(2).max(100).optional(),
    username: Joi.string()
        .alphanum()
        .min(3).max(50)
        .pattern(/^[a-zA-Z0-9_]+$/)
        .optional()
        .messages({
            'string.pattern.base': 'Username can only contain letters, numbers, underscores.',
        }),
    phone: Joi.string()
        .pattern(/^\+?[\d\s\-()]{7,20}$/)
        .optional()
        .messages({ 'string.pattern.base': 'Invalid phone format.' }),
    bio:      Joi.string().max(500).optional().allow(''),
    country:  Joi.string().max(100).optional(),
    language: Joi.string().length(2).optional(),
    timezone: Joi.string().max(60).optional(),
}).min(1).messages({ 'object.min': 'At least one field required.' });

export const validateProfile = (req, res, next) => {
    const { error } = profileSchema.validate(req.body, { abortEarly: false });
    if (error) {
        return res.status(400).json({
            success:  false,
            code:     'VALIDATION_ERROR',
            messages: error.details.map(d => d.message),
        });
    }
    next();
};