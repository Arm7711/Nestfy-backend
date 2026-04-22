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

     specializations: Joi.array()
        .items(Joi.string())
        .optional(),

    yearsOfExperience: Joi.number().min(0).optional(),

    certifications: Joi.array()
        .items(
            Joi.object({
                name: Joi.string().required(),
                file: Joi.string().uri().required(),
                year: Joi.number().optional(),
            })
        )
        .optional(),

    languages: Joi.array()
        .items(Joi.string())
        .optional(),


    introVideo: Joi.string().uri().optional(),

    portfolioImages: Joi.array()
        .items(Joi.string().uri())
        .max(10)
        .optional(),


    workingHours: Joi.object().pattern(
        Joi.string(),
        Joi.string()
    ).optional(),

    responseTime: Joi.string()
        .valid("within_hour", "within_day", "within_week")
        .optional(),

    preferredContact: Joi.string()
        .valid("email", "phone", "app_message")
        .optional(),

    isAvailable: Joi.boolean().optional(),


    facebook: Joi.string().uri().optional(),
    instagram: Joi.string().uri().optional(),
    telegram: Joi.string().uri().optional(),
    linkedin: Joi.string().uri().optional(),
    website: Joi.string().uri().optional(),

    totalReviews: Joi.number().min(0).optional(),
    averageRating: Joi.number().min(0).max(5).optional(),
    profileViews: Joi.number().min(0).optional(),
    responseRate: Joi.number().min(0).max(100).optional(),
})
    .min(1)
    .messages({
        "object.min": "At least one field required.",
    });

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