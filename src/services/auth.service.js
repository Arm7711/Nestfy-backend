import bcrypt from 'bcryptjs';
import * as userRepo    from '../repositories/user.repo.js';
import * as sessionSvc  from './session.service.js';
import * as otpSvc      from './otp.service.js';
import { generateAccessToken, verifyRefreshToken } from './token.service.js';
import { hashToken } from '../utils/crypto.js';
import AppError from '../utils/AppError.js';

const DUMMY_HASH = '$2b$12$LKZuMdHcCYHDy3TdPmmHaOwTsIicKkxcTpjwcWtQIrNPX9YNH.EzS';

const formatUser = (user) => ({
    id:              user.id,
    name:            user.name,
    email:           user.email,
    role:            user.role,
    avatar:          user.avatar,
    emailVerifiedAt: user.emailVerifiedAt,
});


export const register = async ({ name, email, password, userAgent, ip }) => {
    if (await userRepo.existsByEmail(email)) {
        throw new AppError('An account with this email already exists.', 409, 'EMAIL_TAKEN');
    }

    const user = await userRepo.createUser({ name, email, password });
    const { session, rawToken } = await sessionSvc.createSession(user.id, userAgent, ip);

    return {
        accessToken:  generateAccessToken(user, session.id),
        refreshToken: rawToken,
        user:         formatUser(user),
    };
};


export const login = async ({ email, password, userAgent, ip }) => {
    const user = await userRepo.findByEmail(email);

    const hashToCompare = user?.password ?? DUMMY_HASH;
    const isMatch = await bcrypt.compare(password, hashToCompare);

    if (!user || !isMatch) {
        throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
        throw new AppError('This account has been suspended. Contact support.', 403, 'ACCOUNT_SUSPENDED');
    }

    const { session, rawToken } = await sessionSvc.createSession(user.id, userAgent, ip);

    return {
        accessToken:  generateAccessToken(user, session.id),
        refreshToken: rawToken,
        user:         formatUser(user),
    };
};



export const verifyCode = async ({ email, code, userAgent, ip }) => {
    const result = await otpSvc.verifyOtp(email, code);

    if (!result.success) {
        const STATUS = { INVALID_CODE: 400, CODE_EXPIRED: 400, TOO_MANY_ATTEMPTS: 429 };
        const MESSAGES = {
            INVALID_CODE:      'Invalid or expired code.',
            CODE_EXPIRED:      'This code has expired. Please request a new one.',
            TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please request a new code.',
        };
        const err = new AppError(
            MESSAGES[result.error] ?? 'Verification failed.',
            STATUS[result.error]   ?? 400,
            result.error
        );
        if (result.remainingAttempts !== undefined) err.remainingAttempts = result.remainingAttempts;
        throw err;
    }

    let user = await userRepo.findByEmail(email);

    if (!user) {
        user = await userRepo.createUser({
            name:            email.split('@')[0],
            email,
            emailVerifiedAt: new Date(),
        });
    } else {
        if (!user.isActive) {
            throw new AppError('This account has been suspended.', 403, 'ACCOUNT_SUSPENDED');
        }
        if (!user.emailVerifiedAt) {
            await user.update({ emailVerifiedAt: new Date() });
        }
    }

    const { session, rawToken } = await sessionSvc.createSession(user.id, userAgent, ip);

    return {
        accessToken:  generateAccessToken(user, session.id),
        refreshToken: rawToken,
        user:         formatUser(user),
    };
};


export const refresh = async ({ refreshToken, userAgent, ip }) => {
    let decoded;
    try {
        decoded = verifyRefreshToken(refreshToken);
    } catch {
        throw new AppError('Invalid or expired refresh token.', 401, 'INVALID_TOKEN');
    }

    const { jti, sub: userId } = decoded;

    const session = await sessionSvc.findSession(jti);
    if (!session) {
        throw new AppError('Session not found.', 401, 'SESSION_NOT_FOUND');
    }

    if (session.isRevoked) {
        await sessionSvc.revokeAllSessions(userId);
        throw new AppError(
            'Token reuse detected. All sessions have been revoked for your security.',
            401,
            'TOKEN_REUSE_DETECTED'
        );
    }

    if (hashToken(refreshToken) !== session.refreshTokenHash) {
        await sessionSvc.revokeAllSessions(userId);
        throw new AppError('Token integrity check failed. All sessions revoked.', 401, 'TOKEN_MISMATCH');
    }

    if (new Date() > session.expiresAt) {
        await sessionSvc.revokeSession(jti);
        throw new AppError('Session expired. Please log in again.', 401, 'SESSION_EXPIRED');
    }

    const user = await userRepo.findById(userId);
    if (!user || !user.isActive) {
        await sessionSvc.revokeAllSessions(userId);
        throw new AppError('Account not found or suspended.', 401, 'ACCOUNT_INVALID');
    }

    const { session: newSession, rawToken: newRawToken } =
        await sessionSvc.rotateSession(session, userAgent, ip);

    return {
        accessToken:  generateAccessToken(user, newSession.id),
        refreshToken: newRawToken,
        user:         formatUser(user),
    };
};

export const logout = async ({ refreshToken }) => {
    if (!refreshToken) return;
    try {
        const decoded = verifyRefreshToken(refreshToken);
        await sessionSvc.revokeSession(decoded.jti);
    } catch {

    }
};


export const logoutAll = async ({ userId }) => {
    await sessionSvc.revokeAllSessions(userId);
};