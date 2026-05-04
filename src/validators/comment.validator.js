import Joi from 'joi';

const commentSchema = Joi.object({
    content: Joi.string()
        .min(1).max(1000)
        .required()
        .custom((val) => val.replace(/<[^>]*>/g, '').trim()) // Strip HTML
        .messages({
            'string.min':   'Comment cannot be empty.',
            'string.max':   'Comment must be at most 1000 characters.',
            'any.required': 'Content is required.',
        }),

    parentId: Joi.number()
        .integer()
        .positive()
        .optional()
        .allow(null)
        .default(null),
});

export const validateComment = (req, res, next) => {
    const { error, value } = commentSchema.validate(req.body, {
        abortEarly:   false,
        stripUnknown: true,
    });
    if (error) {
        return res.status(400).json({
            success:  false,
            code:     'VALIDATION_ERROR',
            messages: error.details.map(d => d.message),
        });
    }
    req.body = value;
    next();
};