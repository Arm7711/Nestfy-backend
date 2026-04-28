import { verifyAccessToken } from '../services/token.service.js';
import * as userRepo from '../repositories/user.repo.js';
import AppError from '../utils/AppError.js';

export const verifyToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader?.startsWith('Bearer ')) {
            throw new AppError('Access token required.', 401, 'NO_TOKEN');
        }

        const token   = authHeader.slice(7); 
        const decoded = verifyAccessToken(token);
        

        const user = await userRepo.findById(decoded.sub);
        if (!user || !user.isActive) {
            throw new AppError('Account not found or suspended.', 401, 'INVALID_USER');
        }

        req.user         = user;
        req.tokenPayload = decoded;
        next();
    } catch (err) {
        console.log(err);
        
        if (err.isOperational) return next(err);
        next(new AppError('Token invalid or expired.', 401, 'INVALID_TOKEN'));
    }
};

export const requireRole = (...roles) => (req, res, next) => {
    if (!req.user) {
        return next(new AppError('Unauthorized.', 401, 'UNAUTHORIZED'));
    }
    if (!roles.includes(req.user.role)) {
        return next(new AppError('Insufficient permissions.', 403, 'FORBIDDEN'));
    }
    next();
};

export const requireVerifiedEmail = (req, res, next) => {
    if (!req.user?.emailVerifiedAt) {
        return next(new AppError('Email verification is required.', 403, 'EMAIL_NOT_VERIFIED'));
    }
    next();
};