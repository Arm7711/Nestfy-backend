import { randomInt, createHash, randomUUID } from 'crypto';

export const generateOtpCode = () => String(randomInt(100000, 999999));

export const generateJti = () => randomUUID();

export const hashToken = (token) =>
    createHash('sha256').update(token).digest('hex');