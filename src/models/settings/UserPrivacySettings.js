import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';
import User from '../Auth/User.js';

class UserPrivacySettings extends Model {}

UserPrivacySettings.init(
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

        //Visibility
        profileVisibility: {
            type:         DataTypes.ENUM('public', 'private', 'agents_only'),
            defaultValue: 'public',
        },
        showEmail: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        showPhone: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        showOnlineStatus: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },
        allowMessaging: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
        },

        //Search & Indexing
        searchEngineIndexing: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Allow Google/Bing to index profile page',
        },
        showInSearchResults: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Appear in platform internal search',
        },

        // Data & Account
        dataDownloadRequestedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'GDPR data export request timestamp',
        },
        deleteAccountRequestedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'Soft delete request — 30 day grace period',
        },
        deleteAccountScheduledAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'Actual deletion date after grace period',
        },
    },
    {
        sequelize,
        modelName: 'UserPrivacySettings',
        tableName: 'user_privacy_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
            { fields: ['profileVisibility'] },
        ],
    }
);

UserPrivacySettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserPrivacySettings, { foreignKey: 'userId', as: 'privacySettings' });

export default UserPrivacySettings;