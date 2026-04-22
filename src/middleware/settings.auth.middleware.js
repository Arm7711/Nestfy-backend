import {verifyToken} from "./auth.middleware.js";
import AppError from "../utils/AppError.js";

/**
 * settingsAuthGuard — verifies token + checks if account is active
 * WHY? When accounts are marked for deletion,
 * we partially block access to settings instead of fully deleting them
 */

export const settingsAuthGuard = [
    verifyToken,
    (req, res, next) => {
        if(!req.user) {
            return next(new AppError('Authentication required', 401, 'UNAUTHORIZED'));
        }

        if(req.user.isActive === false) {
            return next(new AppError(
                'Account is suspended. Contact support.',
                403,
                'ACCOUNT_SUSPENDED',
            ));
        }

        next();
    },
];

/**
 * sensitiveActionGuard — for sensitive operations
 * Recent login check — if more than 30 minutes have passed since login
 * we require the user to re-enter their password
 */

export const sensitiveActionGuard = [
    ...settingsAuthGuard,
    (req, res, next) => {
        const session = req.session;
        const loginTime = session?.createdAt ? new Date(session.createdAt) : null;
        const minutesSince = loginTime
            ? (Date.now() - loginTime) / (1000 * 60)
            : Infinity;

        if(minutesSince > 30) {
            return next(new AppError(
                'Please re-authenticate to platform this action.',
                403,
                'REAUTHENTICATION_REQUIRED'
            ));
        }

        next();
    },
];

