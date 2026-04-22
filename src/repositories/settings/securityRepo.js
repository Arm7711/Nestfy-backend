import UserSecuritySettings from "../../models/settings/UserSecuritySettings.js";

export const findByUserId = (userId) =>
    UserSecuritySettings.findOne({ where: { userId } });

export const create = (userId, data = {}) =>
    UserSecuritySettings.create({ userId, ...data });

export const update = async (userId, data = {}) => {
    const settings = await UserSecuritySettings.findOne({ where: {userId} });
    if(!settings) return null
    await settings.update(data);
    return settings;
};

export const updateLastPasswordChanged = (userId) =>
    UserSecuritySettings.update(
        { lastPasswordChangedAt: new Date() },
        { where: { userId } }
    );