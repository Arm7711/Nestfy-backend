import * as notifRepo from '../../repositories/settings/notification.repo.js';
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import { NotificationUpdateDTO } from '../../dto/notification.dto.js';


export const getNotificationSettings = async (userId) => {
    let settings = await notifRepo.findByUserId(userId);
    if(!settings) {
        settings = await notifRepo.create(userId, {
            securityAlerts: true,
        });
    }
    return settings;
};

export const updateNotificationSettings = async (userId, rawData)=> {
    const dto = NotificationUpdateDTO(rawData);

    dto.securityAlerts = true;

    const updated = await notifRepo.update(userId, rawData);
    if(!updated) throw new AppError('Notification settings not found', 404);

    logger.info(`Notification settings updated for user ${userId}`);
    return updated;
};

export const shouldNotify = async (userId, event, channel = 'email') => {
    const settings = await notifRepo.findByUserId(userId);
    if(!settings) return false;

    const channelMap = {
        email: settings.notification.email,
        sms: settings.sms.notification,
        push: settings.pushNotifications,
    };

    if(!channelMap[channel]) return false;

    return settings[event] ?? false;
}


