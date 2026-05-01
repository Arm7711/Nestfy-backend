import UserProfileSettings from "../../models/settings/UserProfileSettings.js";
import User from "../../models/User.js";

/**
 * Repository layer — only DB queries
 * Business logic stays in the service layer
 *
 * Why?
 * For testing purposes — services can be tested with a mocked repository
 * without requiring a real database connection
 */

export const findByUserId = (userId) =>
    UserProfileSettings.findOne({ where: { userId } });

export const findByUsername = (username) =>
    UserProfileSettings.findOne({ where: { username } });

export const create = (userId, data = {}) =>
    UserProfileSettings.create({ userId, ...data });

/**
 * update — partial update, only provided fields are updated
 *
 * Why use findOne + save instead of direct update?
 * Direct update operations do NOT trigger model hooks (e.g. beforeUpdate).
 * Using findOne + save ensures that all hooks are properly executed.
 */

export const update = async (userId, data) => {
    const profile = await UserProfileSettings.findOne({ where: { userId } });
    if (!profile) return null;
    await profile.update(data);
    return profile;
};

export const updateAvatar = (userId, avatarUrl) =>
    User.update({ avatar: avatarUrl }, { where: { id: userId } });