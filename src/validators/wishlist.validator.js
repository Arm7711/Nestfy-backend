import Joi from 'joi';
import AppError from "../utils/AppError.js";

const listingIdParamSchema = Joi.object({
    listingId: Joi.number().integer().positive().required().messages({
        'number.base':     'listingId must be a number.',
        'number.positive': 'listingId must be a positive integer.',
        'any.required':    'listingId is required.',
    }),
});


const wishlistQuerySchema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20),
});


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

export const validateWishlistParam = (req, res, next) => {
    const { error, value } = listingIdParamSchema.validate(
        { listingId: Number(req.params.listingId) },
        { abortEarly: false }
    );
    if (error) {
        return next(new AppError(
            error.details.map((d) => d.message).join(' | '),
            400,
            'VALIDATION_ERROR'
        ));
    }
    req.params.listingId = value.listingId;
    next();
};


export const validateWishlistQuery = (req, res, next) => {
    const { error, value } = wishlistQuerySchema.validate(req.query, {
        abortEarly:   false,
        stripUnknown: true,
        convert:      true,
    });
    if (error) {
        return next(new AppError(
            error.details.map((d) => d.message).join(' | '),
            400,
            'VALIDATION_ERROR'
        ));
    }
    req.query = value;
    next();
};