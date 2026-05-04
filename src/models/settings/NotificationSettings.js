import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';
import User from '../Auth/User.js';

class UserNotificationSettings extends Model {}

UserNotificationSettings.init(
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

        //Channel Masters
        emailNotifications: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Master email switch',
        },
        smsNotifications: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        pushNotifications: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },

        // Platform Events
        bookingAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Booking confirmed/cancelled/updated',
        },
        messageAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },
        reviewAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },
        priceDropAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },
        newListingAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },

        // Marketing
        marketingEmails: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
            comment:      'Promotional emails — GDPR opt-in',
        },
        weeklyDigest: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        productUpdates: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },

        // Security
        securityAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Cannot be disabled — always true enforced in service',
        },
        loginAlertNotif: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },
    },
    {
        sequelize,
        modelName: 'UserNotificationSettings',
        tableName: 'user_notification_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
        ],
    }
);

UserNotificationSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserNotificationSettings, { foreignKey: 'userId', as: 'notificationSettings' });

export default UserNotificationSettings;