import UserPrivacySettings from "../../models/settings/UserPrivacySettings.js";

export const findByUserId = (userId) =>
    UserPrivacySettings.findOne({ where: { userId } });

export const create = (userId, data = {}) =>
    UserPrivacySettings.create({ userId, ...data });

export const update = async (userId, data) => {
    const settings = await findByUserId(userId);
    if (!settings) return null;
    await settings.update(data);
    return settings;
};