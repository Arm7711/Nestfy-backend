import PrivacySettings from "../../models/settings/PrivacySettings.js";


export const findByProfileId = (profileSettingsId) =>
    PrivacySettings.findOne({ where: { profileSettingsId } });

export const create = (profileSettingsId, defaults = {}) =>
    PrivacySettings.create({ profileSettingsId, ...defaults });

export const update = (profileSettingsId, data) =>
    PrivacySettings.update(data, { where: { profileSettingsId } });