import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';
import User from '../Auth/User.js';

/**
 * UserSecuritySettings — security preferences
 * Why are passwords not stored here?
 * Passwords are stored in the User table (authentication system).
 * This table contains only security preferences such as:
 * - Two-factor authentication (2FA)
 * - Security alerts
 * - Session behavior settings
 */

class UserSecuritySettings extends Model {}

UserSecuritySettings.init(
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
        },
        userId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            unique:     true,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
        },

        // Two Factor Auth
        twoFactorEnabled: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        twoFactorMethod: {
            type:         DataTypes.ENUM('email', 'sms', 'totp'),
            allowNull:    true,
            defaultValue: null,
            comment:      'NULL when 2FA disabled',
        },
        twoFactorSecret: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            comment:   'TOTP secret — encrypted in DB',
        },

        // Login Alerts
        loginAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Email alert on new device login',
        },
        loginAlertsEmail: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            comment:   'Alternative email for alerts, NULL = use account email',
        },

        // Session
        sessionTimeout: {
            type:         DataTypes.ENUM('1h', '24h', '7d', '30d', 'never'),
            defaultValue: '7d',
        },
        deviceTracking: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },

        // Timestamps for security audit
        lastPasswordChangedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },
        last2FAEnabledAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'UserSecuritySettings',
        tableName: 'user_security_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
        ],
    }
);

UserSecuritySettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserSecuritySettings, { foreignKey: 'userId', as: 'securitySettings' });

export default UserSecuritySettings;