import jwt from 'jsonwebtoken';
import { generateJti } from '../../utils/crypto.js';

const ACCESS_EXPIRES  = process.env.JWT_ACCESS_EXPIRES          || '15m';
const REFRESH_EXPIRES = parseInt(process.env.JWT_REFRESH_EXPIRES_SECONDS, 10) || 604800;

export const generateAccessToken = (user, sessionId) =>
    jwt.sign(
        { sub: user.id, role: user.role, sessionId, jti: generateJti() },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES }
    );

export const generateRefreshToken = (userId, jti) =>
    jwt.sign(
        { sub: userId, jti },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES }
    );

export const verifyAccessToken  = (token) => jwt.verify(token, process.env.JWT_ACCESS_SECRET);
export const verifyRefreshToken = (token) => jwt.verify(token, process.env.JWT_REFRESH_SECRET);

export const REFRESH_TTL_SECONDS = REFRESH_EXPIRES;