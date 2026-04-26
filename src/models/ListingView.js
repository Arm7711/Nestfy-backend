import {DataTypes, Model, Op} from "sequelize";
import Listing from "./Listings.js";
import sequelize from "../config/db.sequelize.js";
import User from "./User.js";


/**
 * ListingView — view tracking (դիտումների հաշվառում)
 *
 * Deduplication strategy:
 * Logged-in user → userId + listingId՝ օրական unique
 * Guest          → ipAddress + listingId՝ օրական unique
 *
 * Ինչու՞ օրական, ոչ թե session
 * Session-ի վրա հիմնվելը հեշտ է manipulate անել —
 * կարելի է session-ը reset անել և նորից view անել
 * Օրական հաշվարկը ավելի honest engagement metric է
 *
 * Bot protection:
 * userAgent-ի ստուգում + rate limit middleware-ում
 * Կասկածելի pattern-ները detect են լինում service մակարդակում
 */

class ListingView extends Model {}

ListingView.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },

        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'listings', key: 'id' },
            onDelete: 'CASCADE',
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: true, // NULL guest e
            references: { model: 'users', key: 'id' },
            onDelete: 'SET NULL',
        },

        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: false,
            comment: "IPa4 or IPv6 - for guest deduplication",
        },

        userAgent: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        viewedDate: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            comment: "Date-only for per-day depublication",
        },

        isBot: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "Detected as bot - excluded from count",
        },
    },
    {
        sequelize,
        modelName: "ListingView",
        tableName: "listing_view",
        timestamps: true,
        updatedAt:  false,

        indexes: [
            { fields: ['listingId'] },
            { fields: ['userId'] },

            {
                unique: true,
                fields: ['listingId', 'userId', 'viewedDate'],
                where: {
                    userId: {
                        [Op.ne]: null
                    }
                },
                name: 'unique_user_view_per_day',
            },

            {
                unique: true,
                fields: ['listingId', 'ipAddress', 'viewedDate'],
                where:  { userId: null },
                name:   'unique_guest_view_per_day',
            },
        ],
    }
);

Listing.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
ListingView.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Listing.hasMany(ListingView, { foreignKey: 'listingId', as: 'views' });

export default ListingView;