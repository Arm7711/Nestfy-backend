import ProfileSettings from "../../models/settings/ProfileSettings.js";
import NotificationSettings from "../../models/settings/NotificationSettings.js";
import MarketplaceNotifications from "../../models/settings/MarketplaceNotifications.js";
import PrivacySettings from "../../models/settings/PrivacySettings.js";
import AuthSettings from "../../models/settings/AuthSettings.js";

export const findByUserId = (userId) =>
    ProfileSettings.findOne({
        where: { userId },
        include: [
            { model: NotificationSettings, as: "notifications", required: false },
            { model: MarketplaceNotifications, as: "marketplace", required: false },
            { model: PrivacySettings, as: "privacy", required: false },
            { model: AuthSettings, as: "auth", required: false },
        ],
    });

export const findByUserIdLean = (userId) =>
    ProfileSettings.findOne({ where: { userId } });

export const create = (userId, role) =>
    ProfileSettings.create({ userId, role });

export const update = (userId, role) =>
    ProfileSettings.update({ role }, { where: { userId }});

export const updateRole = (userId, role) =>
    ProfileSettings.update({ role }, { where: { userId } });


