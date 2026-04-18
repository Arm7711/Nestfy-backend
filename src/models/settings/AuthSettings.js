import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';

class AuthSettings extends Model {}

AuthSettings.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        profileSettingsId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: { model: 'profile_settings', key: 'id' },
            onDelete:   'CASCADE',
        },

        twofactorEnabled: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        twoFactorMethod: {
            type: DataTypes.ENUM('email', 'sms', 'totp'),
            allowNull: true,
            defaultValue: null,
            comment: "NULL if 2FA is disabled",
        },

        loginAlerts: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "sent email alert from new session."
        },

        deviceTracking: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Maintains and displays a history of active user sessions and devices',
        },

        sessionTimeout: {
            type:         DataTypes.ENUM('1h', '24h', '7d', '30d', 'never'),
            defaultValue: '7d',
            comment:      'Automatic logout duration for inactive sessions',
        },

        trustedDevicesEnabled: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
            comment:      'Skip 2FA verification for recognized/trusted devices',
        },
    },
    {
        sequelize,
        modelName: 'AuthSettings',
        tableName: 'auth_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['profileSettingsId'] },
        ],
    }
)

export default AuthSettings;