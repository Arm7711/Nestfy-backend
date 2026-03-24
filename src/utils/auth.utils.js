import jwt from 'jsonwebtoken';
import redis from "../config/redis.js";


const generateAccessToken = (user) => {
    return jwt.sign(
        {id: user.id, role: user.role},
        process.env.JWT_ACCESS_SECRET,
        {expiresIn: process.env.JWT_ACCESS_EXPIRES }
    );
};

const generateRefreshToken = (user) => {
    return jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        {expiresIn: process.env.JWT_REFRESH_EXPIRES }
    );
};

const saveRefreshToken = async (userId, refreshToken) => {
    await redis.setex(`refresh:${userId}`, 604800, refreshToken)
};

const setRefreshCookie = (res, token) => {
    res.cookie('refreshToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });
};

export {
    generateAccessToken,
    generateRefreshToken,
    saveRefreshToken,
    setRefreshCookie,
}
