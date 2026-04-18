import sequelize from '../config/db.sequelize.js';
import User from './User.js';
import Session from './Session.js';
import UserProfile from './UserProfiles.js';
import AuthCode from './AuthCode.js';
import OAuthAccount from './OAuthAccount.js';
import Agent from "./Agent.js";
import Agency from "./Agency.js";
import Listings from "./Listings.js";


import ProfileSettings from "./settings/ProfileSettings.js";
import NotificationSettings from "./settings/NotificationSettings.js";
import MarketplaceNotifications from "./settings/MarketplaceNotifications.js";
import PrivacySettings from "./settings/PrivacySettings.js";
import AuthSettings from "./settings/AuthSettings.js";

User.hasOne(ProfileSettings, {
    foreignKey: 'userId',
    as: 'settings',
    onDelete: 'CASCADE',
});

ProfileSettings.belongsTo(User, {
    foreignKey: 'userId',
    as: 'user',
})

ProfileSettings.hasOne(NotificationSettings, {
    foreignKey: 'profileSettingsId',
    as:         'notifications',
    onDelete:   'CASCADE',
});
NotificationSettings.belongsTo(ProfileSettings, {
    foreignKey: 'profileSettingsId',
    as:         'profileSettings',
});

ProfileSettings.hasOne(MarketplaceNotifications, {
    foreignKey: 'profileSettingsId',
    as:         'marketplace',
    onDelete:   'CASCADE',
});
MarketplaceNotifications.belongsTo(ProfileSettings, {
    foreignKey: 'profileSettingsId',
    as:         'profileSettings',
});

ProfileSettings.hasOne(PrivacySettings, {
    foreignKey: 'profileSettingsId',
    as:         'privacy',
    onDelete:   'CASCADE',
});
PrivacySettings.belongsTo(ProfileSettings, {
    foreignKey: 'profileSettingsId',
    as:         'profileSettings',
});

ProfileSettings.hasOne(AuthSettings, {
    foreignKey: 'profileSettingsId',
    as:         'auth',
    onDelete:   'CASCADE',
});
AuthSettings.belongsTo(ProfileSettings, {
    foreignKey: 'profileSettingsId',
    as:         'profileSettings',
});

User.hasMany(Session,      {
    foreignKey: 'userId',
    as: 'sessions',
    onDelete: 'CASCADE' });
User.hasMany(OAuthAccount, { foreignKey: 'userId', as: 'oauthAccounts', onDelete: 'CASCADE' });

Session.belongsTo(User,      { foreignKey: 'userId', as: 'user' });
OAuthAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export {
    sequelize,
    User,
    UserProfile,
    ProfileSettings,
    NotificationSettings,
    MarketplaceNotifications,
    PrivacySettings,
    AuthSettings,
    Session,
    AuthCode,
    OAuthAccount,
    Listings,
    Agent,
    Agency
};

export default sequelize;