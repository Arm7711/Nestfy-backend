import * as sessionRepo from '../repositories/session.repo.js';
import { generateJti, hashToken } from '../utils/crypto.js';
import { generateRefreshToken, REFRESH_TTL_SECONDS } from './token.service.js';

export const createSession = async (userId, userAgent, ip) => {
    const jti      = generateJti();
    const rawToken = generateRefreshToken(userId, jti);
    const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

    const session = await sessionRepo.create({
        userId,
        jti,
        refreshTokenHash: hashToken(rawToken),
        userAgent: userAgent?.substring(0, 500) ?? null,
        ipAddress: ip ?? null,
        expiresAt,
    });

    return { session, rawToken };
};

export const rotateSession = async (oldSession, userAgent, ip) => {
    await sessionRepo.revokeByJti(oldSession.jti);
    return createSession(oldSession.userId, userAgent, ip);
};

export const revokeSession     = (jti)    => sessionRepo.revokeByJti(jti);
export const revokeAllSessions = (userId) => sessionRepo.revokeAllByUserId(userId);
export const findSession       = (jti)    => sessionRepo.findByJti(jti);
export const getUserSessions   = (userId) => sessionRepo.findActiveByUserId(userId);