import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';

class PrivacySettings extends Model {}

PrivacySettings.init(
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

        profileVisibility: {
            type:         DataTypes.ENUM('public', 'private', 'agents_only'),
            defaultValue: 'public',
            comment:      'Who can view the public profile',
        },
        showPhone: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
            comment:      'Show phone number on profile',
        },
        showEmail: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
            comment:      'Show email address on profile',
        },
        allowMessaging: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Allow receiving direct messages from users',
        },
        showOnlineStatus: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },
        showLastSeen: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },

        /**
         * AGENT/AGENCY ONLY — Privacy for listings.
         * Remains NULL for standard User roles.
         */
        showListingStats: {
            type:         DataTypes.BOOLEAN,
            allowNull:    true,
            defaultValue: true,
            comment:      'AGENT/AGENCY ONLY — Show views and inquiry counts',
        },
        showAgencyMembership: {
            type:         DataTypes.BOOLEAN,
            allowNull:    true,
            defaultValue: true,
            comment:      'AGENT ONLY — Show which agency this agent works for',
        },
    },
    {
        sequelize,
        modelName: 'PrivacySettings',
        tableName: 'privacy_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['profileSettingsId'] },
        ],
    }
);

export default PrivacySettings;
