import Joi from 'joi';

export const createListingSchema = Joi.object({
    title: Joi.string()
        .min(5)
        .max(200)
        .required()
        .messages({
            'string.min': 'Վերնագիրը պետք է լինի նվազագույնը 5 նիշ',
            'string.max': 'Վերնագիրը պետք է լինի առավելագույնը 200 նիշ',
            'any.required': 'Վերնագիրը պարտադիր է',
        }),

    description: Joi.string()
        .min(20)
        .required()
        .messages({
            'string.min': "Description must be at least 30 characters",
            'any.required': 'Description is required',
        }),

    type: Joi.string()
        .valid('sale', 'rent')
        .required()
        .messages({
            'any.only': 'Type must be a sell or rent',
            'ant.required': 'Type is required',
        }),

    category: Joi.string()
        .valid('apartment', 'house', 'commercial', 'land', 'office')
        .required()
        .messages({
            'any.only': 'Category is not right',
            'any.required': 'Category is required',
        }),

    price: Joi.number()
        .positive()
        .required()
        .messages({
            'number.positive': 'Գինը պետք է լինի դրական թիվ',
            'any.required': 'Գինը պարտադիր է',
        }),

    currency: Joi.string()
        .valid('USD', "AMD")
        .default('USD'),

    city: Joi.string()
        .required()
        .messages({
            'any.required': 'City field is required',
        }),

    district: Joi.string().optional(),
    address:  Joi.string().optional(),

    lat: Joi.number().min(-90).max(90).optional(),
    lng: Joi.number().min(-180).max(180).optional(),

    rooms:       Joi.number().integer().min(1).optional(),
    floor:       Joi.number().integer().min(0).optional(),
    totalFloors: Joi.number().integer().min(1).optional(),
    area:        Joi.number().positive().optional(),
    buildYear:   Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),

    amenities: Joi.array().items(Joi.string()).optional(),
});