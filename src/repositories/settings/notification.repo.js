import NotificationSettings     from '../../models/settings/NotificationSettings.js';
import MarketplaceNotifications from '../../models/settings/MarketplaceNotifications.js';

export const findNotifByProfileId = (profileSettingsId) =>
    NotificationSettings.findOne({ where: { profileSettingsId } });

export const createNotif = (profileSettingsId, defaults = {}) =>
    NotificationSettings.create({ profileSettingsId, ...defaults });

export const updateNotif = (profileSettingsId, data) =>
    NotificationSettings.update(data, {
        where:     { profileSettingsId },
        returning: true,
    });

export const findMarketByProfileId = (profileSettingsId) =>
    MarketplaceNotifications.findOne({ where: { profileSettingsId } });

export const createMarket = (profileSettingsId, defaults = {}) =>
    MarketplaceNotifications.create({ profileSettingsId, ...defaults });

export const updateMarket = (profileSettingsId, data) =>
    MarketplaceNotifications.update(data, {
        where:     { profileSettingsId },
        returning: true,
    });