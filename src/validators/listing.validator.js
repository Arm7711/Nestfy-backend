import Joi from 'joi';

const PROPERTY_TYPES = [
    'apartment', 'house', 'villa',
    'commercial', 'land', 'office', 'garage',
];

const LISTING_TYPES = ['sale', 'rent', 'daily_rent'];

const CURRENCIES = ['USD', 'AMD', 'EUR', 'RUB'];


const AMENITIES = [
    'balcony', 'parking', 'elevator', 'pool',
    'gym', 'security', 'garden', 'storage',
    'air_conditioning', 'heating', 'internet',
    'furniture', 'appliances', 'pet_friendly',
];

const VALID_TAGS = [
    'organic', 'trending', 'superhost',
    'guest_favorite', 'boosted', 'promoted',
];

export const listingSchema = Joi.object({
    title: Joi.string()
        .min(5).max(200)
        .required()
        .messages({
            'string.min': 'Title must be at least 5 characters.',
            'string.max': 'Title must be at most 200 characters.',
            'string.required': 'Title is required',
        }),

    description: Joi.string()
        .min(20).max(5000)
        .optional()
        .messages({
            'string.min': 'Description must be at least 20 characters.',
        }),

    price: Joi.number()
        .positive()
        .required()
        .max(99_99_999)
        .messages({
            'number.positive': 'Price must be a positive number.',
            'number.max': 'Price extends maximum allowed value.',
            'any.required': 'Price is required',
        }),

    currency: Joi.string()
        .valid(...CURRENCIES)
        .required()
        .messages({
            'any.only':     `Property type must be one of: ${PROPERTY_TYPES.join(', ')}`,
            'any.required': 'Property type is required.',
        }),

    listingType: Joi.string()
        .valid(...LISTING_TYPES)
        .required()
        .messages({
            'any.only':     `Listing type must be one of: ${LISTING_TYPES.join(', ')}`,
            'any.required': 'Listing type is required.',
        }),

    country: Joi.string().min(2).max(100).required()
        .messages({ 'any.required': 'Country is required.' }),

    city: Joi.string().min(2).max(100).required()
        .messages({ 'any.required': 'City is required.' }),

    district: Joi.string().max(100).optional().allow('', null),
    address:  Joi.string().max(300).optional().allow('', null),

    lat: Joi.number().min(-90).max(90).optional().allow(null),
    lng: Joi.number().min(-180).max(180).optional().allow(null),

    rooms:       Joi.number().integer().min(0).max(50).optional().allow(null),
    bedrooms:    Joi.number().integer().min(0).max(50).optional().allow(null),
    bathrooms:   Joi.number().integer().min(0).max(20).optional().allow(null),
    floor:       Joi.number().integer().min(-5).max(200).optional().allow(null),
    totalFloors: Joi.number().integer().min(1).max(200).optional().allow(null),
    area:        Joi.number().positive().max(100_000).optional().allow(null),
    buildYear:   Joi.number().integer().min(1800).max(new Date().getFullYear() + 2).optional().allow(null),


    amenities: Joi.array()
        .items(Joi.string().valid(...AMENITIES))
        .max(20)
        .optional()
        .default([])
        .messages({
            'any.only': `Invalid amenity. Allowed: ${AMENITIES.join(', ')}`,
        }),
});

const rejectListingSchema = Joi.object({
    reason: Joi.string().min(10).max(500).required()
        .messages({
            'string.min': 'Rejection reason must be at least 10 characters.',
            'ant.required': 'Rejection reason is required',
        }),
});

const boostSchema = Joi.object({
    duration: Joi.number()
        .valid(7, 14, 30)
        .required()
        .messages({
            'ant.only': 'Duration must be 7, 14 or 30 days.',
            'any.required': 'Duration is required',
        }),

    currency: Joi.number()
        .valid(...CURRENCIES)
        .default('USD'),
})

const searchSchema = Joi.object({
    city:         Joi.string().max(100).optional(),
    country:      Joi.string().max(100).optional(),
    propertyType: Joi.string().valid(...PROPERTY_TYPES).optional(),
    listingType:  Joi.string().valid(...LISTING_TYPES).optional(),
    minPrice:     Joi.number().positive().optional(),
    maxPrice:     Joi.number().positive().optional(),
    rooms:        Joi.number().integer().min(0).optional(),
    bedrooms:     Joi.number().integer().min(0).optional(),
    minArea:      Joi.number().positive().optional(),
    maxArea:      Joi.number().positive().optional(),
    amenities:    Joi.array().items(Joi.string().valid(...AMENITIES)).optional(),
    isFeatured:   Joi.boolean().optional(),
    tags:         Joi.array().items(Joi.string().valid(...VALID_TAGS)).optional(),
    page:         Joi.number().integer().min(1).default(1),
    limit:        Joi.number().integer().min(1).max(50).default(20),
    sortBy:       Joi.string()
        .valid('rankScore', 'price', 'publishedAt', 'viewCount', 'favoriteCount')
        .default('rankScore'),
    sortDir:      Joi.string().valid('ASC', 'DESC').default('DESC'),
}).and(

).custom((value, helpers) => {
    if(value.minPrice && value.maxPrice && value.minPrice > value.maxPrice) {
        return helpers.error('any.invalid', {
            message: 'minPrice cannot be greater than maxPrice',
        });
    }

    return value;
});

const makeValidator = (schema, source = 'body') => (req, res, next) => {
    const data = source === 'query' ? req.query : req.body;

    const { error, value } = schema.validate(data, {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
    });

    if(error) {
        return res.status(400).json({
            success: false,
            code: 'VALIDATION_ERROR',
            message: error.details.map(d => d.message),
        });
    }

    if(source === 'query') req.query = value;
    else req.body = value;

    next();
};

export const validateListing       = makeValidator(listingSchema);
export const validateRejectListing = makeValidator(rejectListingSchema);
export const validateBoost         = makeValidator(boostSchema);
export const validateSearch        = makeValidator(searchSchema, 'query');

