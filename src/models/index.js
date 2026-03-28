// models/index.js
import sequelize from '../config/db.sequelize.js';
import User from './User.js';
import Session from './Session.js';
import AuthCode from './AuthCode.js';

User.hasMany(Session, { foreignKey: 'userId', as: 'sessions', onDelete: 'CASCADE' });
Session.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export { sequelize, User, Session, AuthCode };
export default sequelize;