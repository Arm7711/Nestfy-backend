import Joi from 'joi';
import AppError from '../utils/AppError.js';

const emailField = Joi.string().email().lowercase().trim().required().messages({
    'string.email':  'Invalid email address.',
    'any.required':  'Email is required.',
});

const passwordField = Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
        'string.min':          'Password must be at least 8 characters.',
        'string.pattern.base': 'Password must include uppercase, lowercase, and a digit.',
        'any.required':        'Password is required.',
    });

export const registerSchema = Joi.object({
    name: Joi.string().min(2).max(100).trim().required().messages({
        'string.min':  'Name must be at least 2 characters.',
        'string.max':  'Name must be at most 100 characters.',
        'any.required': 'Name is required.',
    }),
    email:           emailField,
    password:        passwordField,
    confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
        'any.only':    'Passwords do not match.',
        'any.required': 'Please confirm your password.',
    }),
});

export const loginSchema = Joi.object({
    email:    emailField,
    password: Joi.string().required().messages({ 'any.required': 'Password is required.' }),
});

export const sendCodeSchema = Joi.object({
    email: emailField,
});

export const verifyCodeSchema = Joi.object({
    email: emailField,
    code:  Joi.string().length(6).pattern(/^\d{6}$/).required().messages({
        'string.length':       'Code must be exactly 6 digits.',
        'string.pattern.base': 'Code must be numeric.',
        'any.required':        'Verification code is required.',
    }),
});

export const validate = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
    });

    if (error) {
        const message = error.details.map((d) => d.message).join(' | ');
        return next(new AppError(message, 400, 'VALIDATION_ERROR'));
    }

    req.body = value;
    next();
};