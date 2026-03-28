import bcrypt from 'bcryptjs';
import redis from '../config/redis.js';
import * as authCodeRepo from '../repositories/authCode.repo.js';
import { generateOtpCode } from '../utils/crypto.js';
import { sendOtpEmail } from './email.service.js';
import AppError from '../utils/AppError.js';

const OTP_EXPIRY_MINUTES    = 10;
const MAX_ATTEMPTS          = 5;
const EMAIL_COOLDOWN_S      = 60;
const IP_MAX_PER_HOUR       = 15;

const checkAndEnforceRateLimit = async (email, ip) => {
    const emailCooldownKey = `otp:cooldown:${email}`;
    const ipCounterKey     = `otp:ip:${ip}`;

    const emailTTL = await redis.ttl(emailCooldownKey);
    if (emailTTL > 0) {
        throw new AppError(
            `Please wait ${emailTTL} seconds before requesting a new code.`,
            429,
            'OTP_COOLDOWN'
        );
    }

    const ipCount = await redis.incr(ipCounterKey);
    if (ipCount === 1) await redis.expire(ipCounterKey, 3600);

    if (ipCount > IP_MAX_PER_HOUR) {
        throw new AppError('Too many requests from this IP. Try again later.', 429, 'RATE_LIMIT');
    }
};

const setEmailCooldown = (email) =>
    redis.setex(`otp:cooldown:${email}`, EMAIL_COOLDOWN_S, '1');

export const sendOtp = async (email, ip) => {
    const normalizedEmail = email.toLowerCase().trim();

    await checkAndEnforceRateLimit(normalizedEmail, ip);

    await authCodeRepo.invalidatePreviousCodes(normalizedEmail);

    const otp      = generateOtpCode();
    const codeHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await authCodeRepo.create({
        email: normalizedEmail,
        codeHash,
        expiresAt,
        ipAddress: ip ?? null,
    });

    await setEmailCooldown(normalizedEmail);
    await sendOtpEmail(normalizedEmail, otp);
};

export const verifyOtp = async (email, code) => {
    const normalizedEmail = email.toLowerCase().trim();
    const authCode = await authCodeRepo.findLatestActive(normalizedEmail);

    if (!authCode) {
        return { success: false, error: 'INVALID_CODE' };
    }

    const [affected] = await authCodeRepo.atomicIncrementAttempts(authCode.id, MAX_ATTEMPTS);

    if (affected === 0) {
        const fresh = await authCodeRepo.findById(authCode.id);
        if (fresh && fresh.attempts >= MAX_ATTEMPTS) {
            return { success: false, error: 'TOO_MANY_ATTEMPTS' };
        }
        return { success: false, error: 'CODE_EXPIRED' };
    }

    const isValid = await bcrypt.compare(code, authCode.codeHash);

    if (!isValid) {
        const fresh = await authCodeRepo.findById(authCode.id);
        const remainingAttempts = Math.max(0, MAX_ATTEMPTS - (fresh?.attempts ?? MAX_ATTEMPTS));
        return { success: false, error: 'INVALID_CODE', remainingAttempts };
    }

    await authCodeRepo.markAsUsed(authCode.id);

    return { success: true };
};