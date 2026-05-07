import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/db.sequelize.js";
import User    from "../Auth/User.js";
import Listing from "../Listing/Listings.js";

/**
 * Comments — threaded 2-level comment system
 *
 * BUG FIXED: `isVisible` defaultValue was `false` — new comments would be
 * invisible by default, requiring admin action to show them. Should default to `true`.
 * If moderation is required, set to false explicitly on creation.
 */

class Comments extends Model {}

Comments.init(
    {
        id: {
            type:          DataTypes.BIGINT,
            primaryKey:    true,
            autoIncrement: true,
        },
        listingId: {
            type:       DataTypes.INTEGER,
            allowNull:  false,
            references: { model: 'listings', key: 'id' },
            onDelete:   'CASCADE',
        },
        userId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
        },
        parentId: {
            type:         DataTypes.BIGINT,
            allowNull:    true,
            defaultValue: null,
            references:   { model: 'comments', key: 'id' },
            onDelete:     'CASCADE',
            comment:      'NULL = top-level, NOT NULL = reply (max depth 1)',
        },
        content: {
            type:     DataTypes.TEXT,
            allowNull: false,
            validate:  {
                len: { args: [1, 1000], msg: 'Comment must be 1–1000 characters.' },
            },
        },

        // Moderation
        isVisible: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Admin soft-hide (set false to suppress without deleting)',
        },
        isDeleted: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
            comment:      'User deleted own comment — content replaced with [deleted]',
        },
        deletedAt: {
            type:     DataTypes.DATE,
            allowNull: true,
        },

        //
        likeCount: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
        replyCount: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'Comments',
        tableName:  'comments',
        timestamps: true,
        indexes: [
            { fields: ['listingId'] },
            { fields: ['userId'] },
            { fields: ['parentId'] },
            { fields: ['listingId', 'isVisible', 'createdAt'] },
        ],
    }
);

Comments.belongsTo(Listing,  { foreignKey: 'listingId', as: 'listing' });
Comments.belongsTo(User,     { foreignKey: 'userId',    as: 'user' });
Comments.belongsTo(Comments, { foreignKey: 'parentId',  as: 'parent' });
Comments.hasMany(Comments,   { foreignKey: 'parentId',  as: 'replies' });

Listing.hasMany(Comments, { foreignKey: 'listingId', as: 'comments' });
User.hasMany(Comments,    { foreignKey: 'userId',    as: 'comments' });

export default Comments;