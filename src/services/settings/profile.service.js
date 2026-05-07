import * as profileRepo from '../../repositories/settings/profile.repo.js';
import { ProfileUpdateDTO } from '../../dto/profile.dto.js';
import logger from '../../utils/logger.js';
import AppError from '../../utils/AppError.js';

export const getProfile = async (userId) => {
    let profile = await profileRepo.findByUserId(userId);

    if (!profile) {
        logger.info(`Auto-creating profile for user ${userId}`);
        profile = await profileRepo.create(userId);
    }

    return profile.toPrivateDTO();
};

export const updateProfile = async (userId, rawData) => {
    const dto = await ProfileUpdateDTO(rawData);

    if (dto.username) {
        const existing = await profileRepo.findByUsername(dto.username);
        if (existing && existing.userId !== userId) {
            throw new AppError('Username already taken.', 409, 'USERNAME_TAKEN');
        }
    }

    const updated = await profileRepo.update(userId, dto);
    if (!updated) {
        throw new AppError('Profile not found.', 404, 'PROFILE_NOT_FOUND');
    }

    logger.info(`Profile updated for user ${userId}`);
    return updated.toPrivateDTO();
};

export const updateAvatar = async (userId, avatarUrl) => {
    if (!avatarUrl) {
        throw new AppError('Avatar URL is required.', 400, 'MISSING_AVATAR');
    }
    await profileRepo.updateAvatar(userId, avatarUrl);
    logger.info(`Avatar updated for ${userId}`);
    return { avatar: avatarUrl };
};