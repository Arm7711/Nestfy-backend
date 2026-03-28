import { randomUUID } from 'crypto';

const IS_DEV = process.env.NODE_ENV === 'development';

export const errorHandler = (err, req, res, _next) => {
    const requestId = randomUUID();

    console.error(`[${requestId}]`, {
        message:  err.message,
        code:     err.code,
        status:   err.statusCode,
        url:      `${req.method} ${req.originalUrl}`,
        ip:       req.ip,
        ...(IS_DEV && { stack: err.stack }),
    });

    if (err.isOperational) {
        const body = {
            success:   false,
            message:   err.message,
            code:      err.code,
            requestId,
        };
        if (err.remainingAttempts !== undefined) body.remainingAttempts = err.remainingAttempts;
        return res.status(err.statusCode).json(body);
    }

    if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
        return res.status(422).json({
            success:   false,
            message:   'Validation error.',
            errors:    err.errors?.map((e) => e.message),
            requestId,
        });
    }

    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
        return res.status(401).json({
            success:   false,
            message:   'Token invalid or expired.',
            code:      'INVALID_TOKEN',
            requestId,
        });
    }


    return res.status(500).json({
        success:   false,
        message:   'An unexpected error occurred.',
        requestId,
        ...(IS_DEV && { debug: err.message }),
    });
};

export const notFoundHandler = (req, res) =>
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.path} not found.`,
    });