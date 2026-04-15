import * as userRepo   from '../repositories/user.repo.js';
import * as sessionSvc from './session.service.js';
import { generateAccessToken, verifyRefreshToken } from './token.service.js';
import { hashToken } from '../utils/crypto.js';
import AppError from '../utils/AppError.js';

const formatUser = (user) => ({
    id: user.id, name: user.name, email: user.email,
    role: user.role, avatar: user.avatar, emailVerifiedAt: user.emailVerifiedAt,
});

export const refresh = async ({ refreshToken, userAgent, ip }) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_TOKEN');
    }

    const { jti, sub: userId } = decoded;
    const session = await sessionSvc.findSession(jti);

    if (!session) throw new AppError('Session not found.', 401, 'SESSION_NOT_FOUND');

    if (session.isRevoked) {
        await sessionSvc.revokeAllSessions(userId);
        throw new AppError('Token reuse detected. All sessions revoked.', 401, 'TOKEN_REUSE_DETECTED');
    }

    if (hashToken(refreshToken) !== session.refreshTokenHash) {
        await sessionSvc.revokeAllSessions(userId);
        throw new AppError('Token integrity check failed.', 401, 'TOKEN_MISMATCH');
    }

    if (new Date() > session.expiresAt) {
        await sessionSvc.revokeSession(jti);
        throw new AppError('Session expired.', 401, 'SESSION_EXPIRED');
    }

    const user = await userRepo.findById(userId);
    if (!user || !user.isActive) {
        await sessionSvc.revokeAllSessions(userId);
        throw new AppError('Account not found or suspended.', 401, 'ACCOUNT_INVALID');
    }

    const { session: newSession, rawToken } = await sessionSvc.rotateSession(session, userAgent, ip);

    return {
        accessToken:  generateAccessToken(user, newSession.id),
        refreshToken: rawToken,
        user:         formatUser(user),
    };
};