import Joi from 'joi';

export const notificationChannelSchema = Joi.object({
    emailNotifications: Joi.boolean(),
    pushNotifications: Joi.boolean(),
    smsNotifications: Joi.boolean(),
}).min(1).messages({
    'object.min': "Nvazaguynnы mi field тал"
});

export const marketplaceSchema = Joi.object({
    newPropertyAlerts: Joi.boolean(),
    priceDropAlerts: Joi.boolean(),
    messages: Joi.boolean(),
    offers: Joi.boolean(),
    savedSearchAlerts: Joi.boolean(),

    inquiryReceived: Joi.boolean(),
    listingApproved: Joi.boolean(),
    listingRejected: Joi.boolean(),
    newReview: Joi.boolean(),
    planExpiring: Joi.boolean(),
}).min(1);

export const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate( req.body, { abortEarly: false });
    if(error) {
        return res.status(400).json({
            success: false,
            code: "VALIDATION_ERROR",
            messages: error.details.map(d => d.message),
        });
    }
    next();
};

