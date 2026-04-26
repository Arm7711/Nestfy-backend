import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.sequelize.js";
import User from "./User.js";
import Listing from "./Listings.js";



class Comments extends Model {}

/**
 * Comments — threaded comment system (մեկնաբանությունների ծառային համակարգ)
 *
 * Threading strategy:
 * parentId = NULL → հիմնական (top-level) comment
 * parentId = id   → պատասխան (reply)
 * MAX depth = 2   → service-ում enforced է
 * Ինչու՞ 2 մակարդակ — ավելի խորը nesting-ը mobile-ում դժվար է օգտագործել
 *
 * Moderation:
 * isVisible = false → թաքցված (admin-ի action)
 * isDeleted  = true → user-ի կողմից ջնջված
 * Content-ը պահվում է moderation audit-ի համար
 */


Comments.init(
    {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true,
        },

        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'listings',
                key: "id"
            },
            onDelete: "CASCADE",
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        },

        parentId: {
            type:       DataTypes.BIGINT,
            allowNull:  true,
            defaultValue: null,
            references: { model: 'comments', key: 'id' },
            onDelete:   'CASCADE',
            comment:    'NULL = top-level, NOT NULL = reply',
        },

        content: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: {
                len: { args: [1, 1000], msg: 'Comments must be be 1-1000 character' },
            },
        },

        //Moderation

        isVisible: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "Admin soft-hide"
        },

        isDeleted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "User deleted own comment - content hidden"
        },

        deletedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        //Engagement
        likeCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        replyCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: "Comments",
        tableName: "comments",
        timestamps: true,
        indexes: [
            { fields: ['listingId'] },
            { fields: ['userId'] },
            { fields: ['parentId'] },
            { fields: ['listingId', 'isVisible', 'createdAt'] },
        ],
    }
);

Comments.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
Comments.belongsTo(User,    { foreignKey: 'userId',    as: 'user' });
Comments.belongsTo(Comments, { foreignKey: 'parentId',  as: 'parent' });
Comments.hasMany(Comments,   { foreignKey: 'parentId',  as: 'replies' });

Listing.hasMany(Comments,   { foreignKey: 'listingId', as: 'comments' });
User.hasMany(Comments,      { foreignKey: 'userId',    as: 'comments' });

export default Comments;

