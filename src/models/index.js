import sequelize from '../config/db.sequelize.js';
import User from './User.js';
import Session from './Session.js';
import AuthCode from './AuthCode.js';
import OAuthAccount from './OAuthAccount.js';
import Agent from "./Agent.js";
import Agency from "./Agency.js";
import Listings from "./Listings.js";

import UserSecuritySettings from "./settings/UserSecuritySettings.js";
import NotificationSettings from "./settings/NotificationSettings.js";
import UserPrivacySettings from "./settings/UserPrivacySettings.js";
import UserPaymentSettings from "./settings/UserPaymentSettings.js";
import UserNotificationSettings from "./settings/NotificationSettings.js";

import KYCVerification from "./KYCVerification.js";
import Comments from "./Comments.js";
import ListingView from "./ListingView.js";
import ListingImage from "./ListingImage.js";



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

};

export default sequelize;