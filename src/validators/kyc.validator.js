import Joi from 'joi';

const ALLOWED_DOCUMENT_TYPES = [
    'passport',
    'national_id',
    'drivers_license',
];

const kycSubmitSchema = Joi.object({
    documentType: Joi.string()
        .valid(...ALLOWED_DOCUMENT_TYPES)
        .required()
        .messages({
            'any.only': `Document type must be one of: ${ALLOWED_DOCUMENT_TYPES.join(', ')}. No other document types are accepted.`,
            'any.required': 'Document type is required.',
        }),
});

const kycAdminSchema = Joi.object({
    decision: Joi.string()
        .valid('approved', 'rejected', 'high_risk')
        .required()
        .messages({
            'any.only':     'Decision must be: approved, rejected, or high_risk.',
            'any.required': 'Decision is required.',
        }),
    reason: Joi.string()
        .min(10).max(500)
        .when('decision', {
            is:   Joi.valid('rejected', 'high_risk'),
            then: Joi.required(),
            otherwise: Joi.optional().allow('', null),
        })
        .messages({
            'any.required': 'Reason is required when rejecting or marking high risk.',
        }),
});

const makeValidator = (schema) => (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

export const validateKYCSubmit = makeValidator(kycSubmitSchema);
export const validateKYCAdmin  = makeValidator(kycAdminSchema);