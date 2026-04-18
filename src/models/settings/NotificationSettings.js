import {DataTypes, Model} from 'sequelize';
import sequelize from "../../config/db.sequelize.js";


class NotificationSettings extends Model {}

NotificationSettings.init(
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
        },

        profileSettingsId: {
            type:       DataTypes.INTEGER,
            allowNull:  false,
            unique:     true,
            references: { model: 'profile_settings', key: 'id' },
            onDelete:   'CASCADE',
        },

        emailNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'Master switch; if false, all email notifications are blocked for this user.'

        },

        pushNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: "Browser/mobile push notifications"
        },

        smsNotifications: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "SMS — default false, premium feature"
        }
    },
    {
        sequelize,
        modelName: 'NotificationSettings',
        tableName: 'notification_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['profileSettingsId'] },
        ],
    }
)

export default NotificationSettings;