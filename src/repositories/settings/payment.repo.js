import UserPaymentSettings from "../../models/settings/UserPaymentSettings.js";

export const findByUserId = (userId) =>
    UserPaymentSettings.findOne({ where: { userId } });

export const create = (userId, data = {}) =>
    UserPaymentSettings.create({
        userId,
        ...data
    });

export const update = async (userId, data) => {
    const settings = await findByUserId(userId);
    if (!settings) return null;
    await settings.update(data);
    return settings;
};

export const findByPayPalEmail = (paypalEmail) =>
    UserPaymentSettings.findOne({ where: { paypalEmail } });