import * as authSvc from '../services/auth.service.js';
import * as otpSvc  from '../services/otp.service.js';
import { verifyGoogleToken, verifyAppleToken } from '../services/oauth.serivice.js';
import asyncHandler from '../utils/asyncHandler.js';

const IS_PROD     = process.env.NODE_ENV === 'production';
const COOKIE_NAME = IS_PROD ? '__Host-refresh' : 'refreshToken';

const COOKIE_SET_OPTS = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path:     '/',
    maxAge:   7 * 24 * 60 * 60 * 1000,
};

const COOKIE_CLR_OPTS = {
    httpOnly: true,
    secure:   IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path:     '/',
};

const setRefreshCookie  = (res, token) => res.cookie(COOKIE_NAME, token, COOKIE_SET_OPTS);
const clearRefreshCookie = (res)       => res.clearCookie(COOKIE_NAME, COOKIE_CLR_OPTS);
const getRefreshCookie  = (req)        => req.cookies[COOKIE_NAME];


export const checkEmail = asyncHandler(async (req, res) => {
    const { flow } = await authSvc.checkEmail(req.body.email);
    res.json({ success: true, flow });
});

export const initiateLogin = asyncHandler(async (req, res) => {
    const result = await authSvc.initiateLogin(req.body.email, req.ip);
    res.json({ success: true, ...result });
});

export const initiateRegister = asyncHandler(async (req, res) => {
    const result = await authSvc.initiateRegister(req.body.email, req.ip);
    res.status(201).json({ success: true, ...result });
});

export const verifyCode = asyncHandler(async (req, res) => {
    const { accessToken, refreshToken, user } = await authSvc.verifyCode({
        ...req.body,
        userAgent: req.headers['user-agent'],
        ip:        req.ip,
    });

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, accessToken, user });
});


export const refresh = asyncHandler(async (req, res) => {
    const token = getRefreshCookie(req);
    if (!token) {
        return res.status(401).json({ success: false, message: 'No refresh token.', code: 'NO_TOKEN' });
    }

    const { accessToken, refreshToken } = await authSvc.refresh({
        refreshToken: token,
        userAgent:    req.headers['user-agent'],
        ip:           req.ip,
    });

    setRefreshCookie(res, refreshToken);
    res.json({ success: true, accessToken });
});

export const logout = asyncHandler(async (req, res) => {
    await authSvc.logout({ refreshToken: getRefreshCookie(req) });
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logged out successfully.' });
});

export const logoutAll = asyncHandler(async (req, res) => {
    await authSvc.logoutAll({ userId: req.user.id });
    clearRefreshCookie(res);
    res.json({ success: true, message: 'All sessions revoked.' });
});

export const getMe = asyncHandler(async (req, res) => {
    const u = req.user;
    res.json({
        success: true,
        user: {
            id:              u.id,
            name:            u.name,
            email:           u.email,
            role:            u.role,
            avatar:          u.avatar,
            emailVerifiedAt: u.emailVerifiedAt,
            createdAt:       u.createdAt,
        },
    });
});

export const googleAuth = asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential) {
        return res.status(400).json({ success: false, message: 'Google token is required.', code: 'MISSING_TOKEN' });
    }

    const { providerId, email, name } = await verifyGoogleToken(credential);
    const { accessToken, refreshToken, user, isNewUser } = await authSvc.oauthLogin({
        provider: 'google', providerId, email, name,
        userAgent: req.headers['user-agent'], ip: req.ip,
    });

    setRefreshCookie(res, refreshToken);
    res.status(isNewUser ? 201 : 200).json({ success: true, accessToken, user });
});

export const appleAuth = asyncHandler(async (req, res) => {
    const { identityToken, user: appleUser } = req.body;
    if (!identityToken) {
        return res.status(400).json({ success: false, message: 'Apple token is required.', code: 'MISSING_TOKEN' });
    }

    const { providerId, email, name } = await verifyAppleToken(identityToken, appleUser);
    const { accessToken, refreshToken, user, isNewUser } = await authSvc.oauthLogin({
        provider: 'apple', providerId, email, name,
        userAgent: req.headers['user-agent'], ip: req.ip,
    });

    setRefreshCookie(res, refreshToken);
    res.status(isNewUser ? 201 : 200).json({ success: true, accessToken, user });
});