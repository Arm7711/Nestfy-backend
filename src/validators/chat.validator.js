import Joi from 'joi';

const MESSAGE_TYPES = ['text', 'image'];

const sendMessageSchema = Joi.object({
    messageType: Joi.string()
        .valid(...MESSAGE_TYPES)
        .default('text')
        .messages({
            'any.only': 'Message type must be text or image. Video is forbidden.',
        }),

    content: Joi.string()
        .max(2000)
        .when('messageType', {
            is:        'text',
            then:      Joi.required(),
            otherwise: Joi.optional().allow('', null),
        })
        .custom((val) => val?.replace(/<[^>]*>/g, '').trim()) 
        .messages({
            'string.max':   'Message content must be at most 2000 characters.',
            'any.required': 'Content is required for text messages.',
        }),

    imageUrl: Joi.string()
        .uri()
        .max(500)
        .when('messageType', {
            is:        'image',
            then:      Joi.required(),
            otherwise: Joi.optional().allow('', null),
        })
        .messages({
            'any.required': 'Image URL is required for image messages.',
        }),
})
    // text kam image — meky bdi exni
    .custom((value, helpers) => {
        if (value.messageType === 'text' && !value.content?.trim()) {
            return helpers.error('any.invalid');
        }
        if (value.messageType === 'image' && !value.imageUrl) {
            return helpers.error('any.invalid');
        }
        return value;
    });

export const validateSendMessage = (req, res, next) => {
    const { error, value } = sendMessageSchema.validate(req.body, {
        abortEarly:   false,
        stripUnknown: true,
        convert:      true,
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