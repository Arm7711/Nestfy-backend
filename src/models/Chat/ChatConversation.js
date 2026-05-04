import {DataTypes, Model} from "sequelize";
import sequelize from "../../config/db.sequelize.js";
import Listing from "../Listing/Listings.js";
import User from "../Auth/User.js";

/**
 * ChatConversation — գնորդ ↔ agent/agency chat
 *
 * Ինչու՞ կապված է listing-ի հետ
 * Ամեն chat-ը կոնկրետ listing-ի մասին է —
 * context-ը պահպանվում է, agent-ը գիտի որ listing-ի մասին է խոսքը
 *
 * participants: buyerId + sellerId (agent կամ agency owner)
 * Denormalized է — արագ lookup-ի համար, առանց JOIN-երի
 */

class ChatConversation extends Model {}

ChatConversation.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'listings', key: 'id' },
            onDelete: 'CASCADE',
        },

        buyerId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
            comment:    'The user who initiated the conversation',
        },
        sellerId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
            comment:    'Agent or Agency owner userId',
        },
        lastMessageAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "For sorting conversation by recency",
        },

        lastUnreadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        sellerUnreadCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        isArchived: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'ChatConversation',
        tableName:  'chat_conversations',
        timestamps: true,
        indexes: [
            {
                unique: true,
                fields: ['listingId', 'buyerId'],
                name:   'unique_conversation',
            },
            { fields: ['buyerId',  'lastMessageAt'] },
            { fields: ['sellerId', 'lastMessageAt'] },
        ],
    }
);


ChatConversation.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
ChatConversation.belongsTo(User, { foreignKey: 'buyerId',  as: 'buyer' });
ChatConversation.belongsTo(User, { foreignKey: 'sellerId', as: 'seller' });
Listing.hasMany(ChatConversation, { foreignKey: 'listingId', as: 'conversations' });

export default ChatConversation;