import * as profileRepo from '../../repositories/settings/profile.repo.js';
import {ProfileUpdateDTO } from "../../dto/profile.dto.js";
import logger from "../../utils/logger.js";
import AppError from "../../utils/AppError.js";


/**
 * getProfile — fetch profile by userId
 * If profile does not exist, it is automatically created with default values.
 *
 * Why?
 * New users should never face a missing profile state.
 * Auto-creation guarantees that a profile always exists.
 */

export const getProfile = async (userId)=> {
    let profile = await profileRepo.findByUserId(userId);

    if(!profile) {
        logger.info(`Auto-creating  profile for user ${userId}`);
        profile = await profileRepo.create(userId);
    }

    return profile.toPrivateDTO();
};

/**
 * updateProfile — partial update
 * Checks username uniqueness before applying changes.
 */

export const updateProfile = async (userId, rawData) => {
    const dto = await ProfileUpdateDTO(rawData);

    if(dto.username) {
        const existing = await profileRepo.findByUsername(dto.username);
        if(existing) {
            throw new AppError('Username already taken', 409, 'USERNAME_TAKEN');
        }
    }

    const updated = await profileRepo.update(userId, rawData);
    if(!updated) {
        throw new AppError('Profile not found', 409, 'PROFILE_NOT_FOUND');
    }

    logger.info(`Profile updated for user ${userId}`);

    return updated.toPrivateDTO();
}

/**
 * updateAvatar — updates Cloudinary URL
 * File validation is handled in middleware
 */
export const updateAvatar = async (userId, avatarUrl) => {
    if(!avatarUrl) {
        throw new AppError('Avatar URL is required.', 400, 'MISSING_AVATAR');
    }
    await profileRepo.updateAvatar(userId, avatarUrl);
    logger.info(`Avatar updated for ${userId}`);
    return { avatar: avatarUrl };
}

