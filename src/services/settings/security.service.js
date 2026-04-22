import bcrypt from "bcryptjs";
import * as securityRepo from '../../repositories/settings/securityRepo.js';
import * as userRepo from '../../repositories/user.repo.js';
import * as sessionSvc from '../../services/session.service.js';
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";
import { ChangePasswordDTO, TwoFactorDTO, SecuritySettingsDTO } from '../../dto/security.dto.js';

export const getSecuritySettings = async (userId) => {
    let settings = await securityRepo.findByUserId(userId);
    if(!settings){
        settings = await securityRepo.create(userId);
    }

    const { twoFactorSecret, ...safe } = settings.toJSON();
    return safe;
};

export const changePassword = async (userId, rawData, currentSessionJti) => {
    const dto = ChangePasswordDTO(rawData);
    const user = await userRepo.findById(userId);

    if(!user) throw new AppError('User not found', 404, 'USER_NOT_FOUND');

    const isSame  = await bcrypt.compare(dto.newPassword, user.password);
    if(isSame) {
        throw new AppError(
            'New Password much be different from current password',
            400,
            'SAME_PASSWORD',
        )
    }

    if(dto.newPassword !== dto.confirmPassword) {
        throw new AppError(
            'Passwords do not match',
            400,
            'PASSWORD_MISMATCH'
        );
    }

    const hashed = await bcrypt.hash(userId, 12);
    await userRepo.updateUser(userId, { password: hashed });

    await sessionSvc.revokeAllExcept(userId, currentSessionJti);

    await securityRepo.updateLastPasswordChanged(userId);

    logger.warn(`Password changed for user ${userId} — all other sessions revoked`);
    return { message: 'Password changed successfully. Other sessions logged out.' };
};

export const toggleTwoFactor = async (userId, rawData) => {
    const dto = TwoFactorDTO(rawData);

    if(!dto.enabled && !dto.method) {
        throw new AppError(
            '2FA method required when enabling (email/sms/totp).',
            400,
            'METHOD_REQUIRED',
        );
    }

    const updateData = {
        twoFactorEnabled: dto.enabled,
        twoFactorMethod: dto.method,
        last2FAEnabled: dto.enabled ? new Date() : null,
    };

    if(!dto.enabled) {
        updateData.twoFactorSecret = null;
    }

    await securityRepo.update(userId, updateData);
    logger.info(`2FA ${dto.enabled ? 'enabled' : 'disabled'} for user ${userId}`);

    return {
        twoFactorEnabled: dto.enabled,
        twoFactorMethod: dto.method,
    };
};


export const updateSecuritySettings = async (userId, rawData) => {
    const dto = SecuritySettingsDTO(rawData);
    const updated = await securityRepo.update(userId, dto);
    if(!updated) throw new AppError(" Security settings not found", 404);
    return updated;
};

export const getActiveSessions = async (userId, currentJti) => {
    const sessions = await sessionSvc.getUserSessions(userId);

    return sessions.map(s => ({
        id: s.id,
        userAgent: s.userAgent,
        ip: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        isCurrent: s.id === currentJti,
    }));
};

export const revokeSession = async (userId, sessionId) => {
    const sessions = await sessionSvc.getUserSessions(userId);
    const owns= sessions.some(s => s.id === sessionId);

    if(!owns) {
        throw new AppError('Session not found or access denied.', 403, 'FORBIDDEN')
    }

    await sessionSvc.revokeSession(sessionId);

    return { message: 'Session revoked.'};
};

export const logoutAllDevices = async (userId) => {
    await sessionSvc.revokeAllSessions(userId);
    logger.warn(`All session revoked for user ${userId}`);
    return { message: 'All devices logged out.'}
};