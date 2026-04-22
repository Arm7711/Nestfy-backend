import UserNotificationSettings from "../../models/settings/NotificationSettings.js";

export const findByUserId = (userId) =>
    UserNotificationSettings.findOne({ where: { userId } });

export const create = (userId, data = {}) =>
    UserNotificationSettings.create({ userId, ...data });

export const update = async (userId, data) => {
    const settings = await findByUserId(userId);
    if(!settings) return null;
    await settings.update(data);
    return settings;
};