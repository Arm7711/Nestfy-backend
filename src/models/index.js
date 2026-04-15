import sequelize from '../config/db.sequelize.js';
import User from './User.js';
import Session from './Session.js';
import UserProfile from './UserProfiles.js';
import AuthCode from './AuthCode.js';
import OAuthAccount from './OAuthAccount.js';
import Agent from "./Agent.js";
import Agency from "./Agency.js";
import Listings from "./Listings.js";


User.hasMany(Session,      { foreignKey: 'userId', as: 'sessions',      onDelete: 'CASCADE' });
User.hasMany(OAuthAccount, { foreignKey: 'userId', as: 'oauthAccounts', onDelete: 'CASCADE' });

Session.belongsTo(User,      { foreignKey: 'userId', as: 'user' });
OAuthAccount.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, UserProfile, Session, AuthCode, OAuthAccount, Listings, Agent, Agency };

export default sequelize;