import * as userRepo from '../repositories/user.repo.js';
import * as sessionSvc from './session.service.js';
import * as otpSvc from './otp.service.js'; 
import { generateAccessToken, verifyRefreshToken } from './token.service.js';
import { hashToken } from '../utils/crypto.js';
import OAuthAccount from '../models/OAuthAccount.js'; 
import AppError from '../utils/AppError.js';

const formatUser = (user) => ({
    id: user.id, name: user.name, email: user.email,
    role: user.role, avatar: user.avatar, emailVerifiedAt: user.emailVerifiedAt,
});


export const checkEmail = async (email) => {
    const normalized = email.toLowerCase().trim();
    const user = await userRepo.findByEmail(normalized);
    return { flow: user ? 'login' : 'register' };
};

export const initiateLogin = async (email, ip) => {
    const normalized = email.toLowerCase().trim();
    const user = await userRepo.findByEmail(normalized);

    if (!user) throw new AppError('No account found with this email.', 404, 'USER_NOT_FOUND');
    if (!user.isActive) throw new AppError('This account has been suspended.', 403, 'ACCOUNT_SUSPENDED');

    await otpSvc.sendOtp(normalized, ip);
    return { message: 'Verification code sent.' };
};

export const initiateRegister = async (email, ip) => {
    const normalized = email.toLowerCase().trim();

    const existing = await userRepo.findByEmail(normalized);
    if (existing) {
        await otpSvc.sendOtp(normalized, ip);
        return { message: 'Account already exists. Verification code sent.', flow: 'login' };
    }

    const name = normalized.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    await userRepo.createUser({ name, email: normalized });
    await otpSvc.sendOtp(normalized, ip);
    return { message: 'Account created. Verification code sent.', flow: 'register' };
};

export const verifyCodeForCookie = async ({ email, code, userAgent, ip }) => {
    const normalized = email.toLowerCase().trim();
    const result = await otpSvc.verifyOtp(normalized, code);

    if (!result.success) {
        const MESSAGES = {
            INVALID_CODE: 'Invalid or expired code.',
            CODE_EXPIRED: 'This code has expired. Please request a new one.',
            TOO_MANY_ATTEMPTS: 'Too many failed attempts. Please request a new code.',
        };
        const STATUS = { INVALID_CODE: 400, CODE_EXPIRED: 400, TOO_MANY_ATTEMPTS: 429 };
        const err = new AppError(MESSAGES[result.error] ?? 'Verification failed.', STATUS[result.error] ?? 400, result.error);
        if (result.remainingAttempts !== undefined) err.remainingAttempts = result.remainingAttempts;
        throw err;
    }

    const user = await userRepo.findByEmail(normalized);
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    if (!user.isActive) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');

    if (!user.emailVerifiedAt) {
        await user.update({ emailVerifiedAt: new Date() });
        await user.reload();
    }

    const { session, rawToken } = await sessionSvc.createSession(user.id, userAgent, ip);

    return {
        refreshToken: rawToken,
        user: formatUser(user),
    };
};

export const refreshAccessToken = async (refreshToken, userAgent, ip) => {
    if (!refreshToken) throw new AppError('No refresh token', 401);

    const { accessToken, refreshToken: newRefreshToken, user } = await refresh({ refreshToken, userAgent, ip });

    return { accessToken, refreshToken: newRefreshToken, user };
};

export const oauthLogin = async ({ provider, providerId, email, name, userAgent, ip }) => {
    let oauthAccount = await OAuthAccount.findOne({
        where: { provider, providerId },
        include: [{ model: (await import('../models/User.js')).default, as: 'user' }],
    });

    if (oauthAccount) {
        const user = oauthAccount.user;
        if (!user.isActive) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');

        const { session, rawToken } = await sessionSvc.createSession(user.id, userAgent, ip);
        return {
            accessToken: generateAccessToken(user, session.id),
            refreshToken: rawToken,
            user: formatUser(user),
            isNewUser: false,
        };
    }

    let user = email ? await userRepo.findByEmail(email) : null;

    if (user) {
        if (!user.isActive) throw new AppError('Account suspended.', 403, 'ACCOUNT_SUSPENDED');
        await OAuthAccount.create({ userId: user.id, provider, providerId, providerEmail: email });
        if (!user.emailVerifiedAt) await user.update({ emailVerifiedAt: new Date() });
    } else {
        const userEmail = email ?? `${provider}_${providerId}@oauth.placeholder`;
        const autoName = name ?? userEmail.split('@')[0];
        user = await userRepo.createUser({ name: autoName, email: userEmail, emailVerifiedAt: new Date() });
        await OAuthAccount.create({ userId: user.id, provider, providerId, providerEmail: email });
    }

    const { session, rawToken } = await sessionSvc.createSession(user.id, userAgent, ip);
    return {
        accessToken: generateAccessToken(user, session.id),
        refreshToken: rawToken,
        user: formatUser(user),
        isNewUser: !oauthAccount,
    };
};

export const logout = async ({ refreshToken }) => {
    if (!refreshToken) return;
    try {
        const decoded = verifyRefreshToken(refreshToken);
        await sessionSvc.revokeSession(decoded.jti);
    } catch { }
};

export const logoutAll = async ({ userId }) => {
    await sessionSvc.revokeAllSessions(userId);
};
