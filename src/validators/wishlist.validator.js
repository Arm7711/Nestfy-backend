import Joi from 'joi';

const wishlistSchema = Joi.object({
    listingId: Joi.number()
        .integer()
        .positive()
        .required()
        .messages({
            'number.positive': 'Invalid listing ID.',
            'any.required':    'Listing ID is required.',
        }),
});

export const validateWishlist = (req, res, next) => {
    const { error, value } = wishlistSchema.validate(req.body, {
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