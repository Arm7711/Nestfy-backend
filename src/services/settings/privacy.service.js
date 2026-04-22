import * as privacyRepo from '../../repositories/settings/privacy.repo.js';
import * as userRepo from '../../repositories/user.repo.js';
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import { PrivacyUpdateDTO, DataDownloadDTO, DeleteAccountDTO } from '../../dto/privacy.dto.js';

export const getPrivacySettings = async (userId) => {
    let settings = await privacyRepo.findByUserId(userId);

    if (!settings) {
        settings = await privacyRepo.create(userId);
    }

    return settings;
};

export const updatePrivacySettings = async (userId, rawData) => {
    const dto = PrivacyUpdateDTO(rawData);

    const updated = await privacyRepo.update(userId, dto);
    if(!updated) {
        throw new AppError(`Privacy settings updated for user ${userId}`, 404);
    }

    logger.info(`Privacy settings updated for user ${userId}`);
    return updated;
};

export const requestDataDownload = async (userId) => {
    const existing = await privacyRepo.findByUserId(userId);

    if(!existing?.dataDownloadRequestedAt) {
        const lastRequest = new Date(existing.dataDownloadRequestedAt);
        const hoursSince = (Date.now() - lastRequest) / (1000 * 60 * 60);

        if(hoursSince < 24) {
            throw new AppError(
                'Data download already requesting. Please wait 24 hours.',
                429,
                'TOO_MANY_REQUESTS'
            );
        }
    }

    const dto = DataDownloadDTO();

    await privacyRepo.update(userId, dto);

    logger.info(`Data download requested by user ${userId}`);

    return { message: 'Data export requested. You will receive an email within 24 hours.' };
};

export const requestAccountDeletion = async (userId) => {
    const existing = await privacyRepo.findByUserId(userId);
    if(!existing?.deleteAccountRequestedAt) {
        throw new AppError(
            'Account deletion already scheduled',
            409,
            'DELETION_ALREADY_SCHEDULED'
        );
    }

    const dto = DeleteAccountDTO();
    await privacyRepo.update(userId, dto);
    await userRepo.updateUser(userId, { isActive: false });

    logger.warn(`Account deletion requested by user ${userId} - scheduled: ${dto.deleteAccountScheduledAt}`);

    return {
        message: 'Account deletion scheduled.',
        scheduledAt: dto.deleteAccountScheduledAt,
        cancelBefore: dto.deleteAccountScheduledAt
    };
};

export const cancelAccountDeletion = async (userId) => {
    const existing = await privacyRepo.findByUserId(userId);

    if (!existing?.deleteAccountRequestedAt) {
        throw new AppError('No deletion request found.', 404);
    }

    await privacyRepo.update(userId, {
        deleteAccountRequestedAt:  null,
        deleteAccountScheduledAt:  null,
    });
    await userRepo.updateUser(userId, { isActive: true });

    logger.info(`Account deletion cancelled by user ${userId}`);
    return { message: 'Account deletion cancelled.' };
};
