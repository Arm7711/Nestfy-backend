import { DataTypes, Model } from "sequelize";
import sequelize  from "../../config/db.sequelize.js";


class MarketplaceNotifications extends Model {}

MarketplaceNotifications.init(
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
            references: {
                model: "profile_settings",
                key: "id",
            },
            onDelete: "CASCADE",
        },

        newPropertyAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Alerts for new listings matching the users saved searches',
        },
        priceDropAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Notifications when a property in the users wishlist has a price reduction',
        },
        messages: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Notifications for new messages received in the inbox',
        },
        offers: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Notifications for new offers placed on a property',
        },
        savedSearchAlerts: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Alerts for new listings that match specific saved search filters',
        },

        inquiryReceived: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'AGENT/AGENCY ONLY — Notification for new inquiries received on a listing',
        },

        listingApproved: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'AGENT / AGENCY - Admin the listing approved.',
        },

        listingRejected: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'AGENT / AGENCY - Admin the listing rejected.',
        },

        newReview: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'AGENT / AGENCY - New Review in profile.',
        },

        planExpiring: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
            comment: 'The package expires in 7 days.',
        },
    },
    {
        sequelize,
        modelName: "MarketplaceNotifications",
        tableName: "marketplace_notifications",  timestamps: true,
        indexes: [
            { unique: true, fields: ['profileSettingsId'] },
        ],
    }
);

export default MarketplaceNotifications