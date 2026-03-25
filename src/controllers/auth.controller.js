import jwt from 'jsonwebtoken';
import {registerSchema, loginSchema} from "../validator/auth.validator.js";
import User from "../models/User.js";
import 'dotenv/config';
import appleSignIn from 'apple-signin-auth';
import { OAuth2Client } from 'google-auth-library';
import redis from "../config/redis.js";
import {
    generateAccessToken,
    generateRefreshToken,
    saveRefreshToken,
    setRefreshCookie}
    from "../utils/auth.utils.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const register = async (req, res) => {
    try {
        const { error } = registerSchema.validate(req.body, { abortEarly: false, allowUnknown: true });

        if (error) {
            const messages = error.details.map(d => d.message);
            return res.status(400).json({
                success: false,
                messages,
            })
        }

        const {name, email, password} = req.body;

        const existing = await User.findOne({where: {email}});
        if (existing) {
            return res.status(409).json({
                success: false,
                message: 'This email is already taken',
            });
        }

        const user = await User.create({
            name,
            email,
            password,
        })

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await saveRefreshToken(user.id, refreshToken);
        setRefreshCookie(res, refreshToken);

        res.status(201).json({
            success: true,
            message: 'Registration Successfully',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const { error } = loginSchema.validate(req.body, { abortEarly: false, allowUnknown: true });
        if (error) {
            const messages = error.details.map(d => d.message);
            return res.status(400).json({ success: false, messages });
        }

        const user = await User.findOne({
            where: {email}
        })
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email or password is incorrect",
            })
        }

        if (!user.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is blocked, contact support.',
            });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Email or password are incorrect',
            });
        }

        const accessToken  = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await saveRefreshToken(user.id, refreshToken);
        setRefreshCookie(res, refreshToken);


        res.json({
            success: true,
            message: 'You have successfully logged in.',
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    }catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
}


export const googleLogin = async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) return res.status(400).json({ success: false, message: 'Google ID token missing' });

        const ticket = await client.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture: avatar } = payload;

        if (!email) return res.status(400).json({ success: false, message: 'Email not available from Google' });

        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({ name, email, avatar, provider: 'google', googleId });
        } else if (!user.googleId) {
            user.googleId = googleId;
            user.provider = 'google';
            await user.save();
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await saveRefreshToken(user.id, refreshToken);
        setRefreshCookie(res, refreshToken);

        res.json({ success: true, accessToken, user: user.toJSON() });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Google login failed', error: err.message });
    }
};

export const appleLogin = async (req, res) => {
    try {
        const { identityToken } = req.body;
        if (!identityToken) return res.status(400).json({ success: false, message: 'Apple identity token missing' });

        const appleData = await appleSignIn.verifyIdToken(identityToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: false,
        });

        const { sub: appleId, email } = appleData;
        if (!email) return res.status(400).json({ success: false, message: 'Apple email missing' });

        let user = await User.findOne({ where: { email } });

        const displayName = req.body.name || 'Apple User';

        if (!user) {
            user = await User.create({ name: displayName, email, provider: 'apple', appleId });
        } else if (!user.appleId) {
            user.appleId = appleId;
            user.provider = 'apple';
            if (req.body.name) user.name = req.body.name;
            await user.save();
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        await saveRefreshToken(user.id, refreshToken);
        setRefreshCookie(res, refreshToken);

        res.json({ success: true, accessToken, user: user.toJSON() });

    } catch (err) {
        res.status(500).json({ success: false, message: 'Apple login failed', error: err.message });
    }
};

export const refreshToken = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is missing',
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

        const savedToken = await redis.get(`refresh:${decoded.id}`);
        if (!savedToken || savedToken !== token) {
            return res.status(401).json({
                success: false,
                message: 'Token is invalid or expired.',
            });
        }

        const user = await User.findByPk(decoded.id);
        if (!user || !user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
            });
        }

        const newAccessToken = generateAccessToken(user);

        res.json({
            success: true,
            accessToken: newAccessToken,
        });
    } catch (err) {
        res.status(401).json({
            success: false,
            message: 'Token is invalid',
        });
    }
};

export const logout = async (req, res) => {
    try {
        const token = req.cookies.refreshToken;

        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
                await redis.del(`refresh:${decoded.id}`);
            } catch (jwtErr) {
            }
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
        });

        return res.status(200).json({ success: true, message: 'Logged out successfully.' });
    } catch (err) {
        return res.status(500).json({ success: false, message: 'Server error during logout.' });
    }
};


export const getMe = async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            avatar: req.user.avatar,
            createdAt: req.user.createdAt,
        },
    });
};