import sequelize from '../../config/db.sequelize.js';
import User from '../Auth/User.js';
import Session from '../Auth/Session.js';
import AuthCode from '../Auth/AuthCode.js';
import OAuthAccount from '../Auth/OAuthAccount.js';
import Agent from "../Agency/Agent.js";
import Agency from "../Agency/Agency.js";
import Listings from "../Listing/Listings.js";

import UserSecuritySettings from "../settings/UserSecuritySettings.js";
import NotificationSettings from "../settings/NotificationSettings.js";
import UserPrivacySettings from "../settings/UserPrivacySettings.js";
import UserPaymentSettings from "../settings/UserPaymentSettings.js";
import UserNotificationSettings from "../settings/NotificationSettings.js";

import KYCVerification from "../Auth/KYCVerification.js";
import Comments from "./Comments.js";
import ListingView from "../Listing/ListingView.js";
import ListingImage from "../Listing/ListingImage.js";
import Favorite from "../Listing/Favorite.js";
import ChatConversation from "../Chat/ChatConversation.js";
import ChatMessage from "../Chat/ChatMessage.js";

Agent.belongsTo(Agency, { foreignKey: 'agencyId', as: 'agency' });
Agency.hasMany(Agent,   { foreignKey: 'agencyId', as: 'agents' });

export {
    sequelize,
    User,
    Agent,
    Agency,
    Session,
    AuthCode,
    OAuthAccount,
    KYCVerification,

    //Settings
    UserSecuritySettings,
    NotificationSettings,
    UserPrivacySettings,
    UserPaymentSettings,
    UserNotificationSettings,

    Comments,
    Listings,
    ListingView,
    ListingImage,

    ChatConversation,
    ChatMessage,

    Favorite
};



export default sequelize;