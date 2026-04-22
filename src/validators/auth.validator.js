import Joi from 'joi';
import AppError from '../utils/AppError.js';

const emailField = Joi.string().email().lowercase().trim().required().messages({
    'string.email': 'Invalid email address.',
    'any.required': 'Email is required.',
});

export const checkEmailSchema = Joi.object({
    email: emailField,
});

export const initiateSchema = Joi.object({
    email: emailField,
});

export const verifyCodeSchema = Joi.object({
    email: emailField,
    code: Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
        'string.length':       'Code must be exactly 6 digits.',
        'string.pattern.base': 'Code must be numeric.',
        'any.required':        'Verification code is required.',
    }),
});

export const sendCodeSchema = Joi.object({
    email: emailField,
});

export const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly:    false,
        stripUnknown:  true,
    });
    if (error) {
        const message = error.details.map((d) => d.message).join(' | ');
        return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }
    req.body = value;
    next();
};