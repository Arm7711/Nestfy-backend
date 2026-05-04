import AppError from '../utils/AppError.js';


export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
        }

        if (!roles.includes(req.user.role)) {
            return next(new AppError(
                `Access denied. Required roles: ${roles.join(', ')}`,
                403,
                'FORBIDDEN'
            ));
        }

        next();
    };
};