import AuthSettings from "../../models/settings/AuthSettings.js";

export const findByProfileId = (profileSettingsId) =>
    AuthSettings.findOne({
        where: {
            profileSettingsId
        }
    });

export const create = (profileSettingsId, defaults = {}) =>
    AuthSettings.create({ profileSettingsId, ...defaults });

export const update = (profileSettingsId, data) =>
    AuthSettings.update(data, { where: { profileSettingsId } });