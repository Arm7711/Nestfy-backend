import Joi from 'joi';

export const registerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .required()
        .messages({
            'string.min': 'Անունը պետք է լինի min 2 նիշ',
            'string.max': 'Անունը պետք է լինի max 50 նիշ',
            'any.required': 'Անունը պարտադիր է',
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email-ը ճիշտ չէ',
            'any.required': 'Email-ը պարտադիր է',
        }),

    password: Joi.string()
        .min(8)
        .max(100)
        .required()
        .messages({
            'string.min': 'Գաղտնաբառը պետք է լինի min 8 նիշ',
            'any.required': 'Գաղտնաբառը պարտադիր է',
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            'any.only': 'Գաղտնաբառերը չեն համընկնում',
            'any.required': 'Հաստատեք գաղտնաբառը',
        }),
});

export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            'string.email': 'Email-ը ճիշտ չէ',
            'any.required': 'Email-ը պարտադիր է',
        }),

    password: Joi.string()
        .required()
        .messages({
            'any.required': 'Գաղտնաբառը պարտադիր է',
        }),
});