import { DataTypes, Model } from 'sequelize';
import sequelize from "../../config/db.sequelize.js";
import User from "../Auth/User.js";
import ChatConversation from "./ChatConversation.js";

/**
 * ChatMessage — persistent message storage
 *
 * Socket.io-ով real-time delivery
 * DB-ում պահվում է persistent storage-ի համար
 *
 * messageType:
 * 'text'  → սովորական message
 * 'image' → միայն image, video խստիվ արգելված է
 * 'system'→ ավտոգեներացված (օր. "Listing sold")
 *
 * deliveryStatus:
 * sent → delivered → read
 */

class ChatMessage extends Model {}

ChatMessage.init(
    {
        id: {
            type:          DataTypes.BIGINT,
            primaryKey:    true,
            autoIncrement: true,
        },
        conversationId: {
            type:       DataTypes.INTEGER,
            allowNull:  false,
            references: { model: 'chat_conversations', key: 'id' },
            onDelete:   'CASCADE',
        },
        senderId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
        },
        messageType: {
            type:         DataTypes.ENUM('text', 'image', 'system'),
            defaultValue: 'text',
        },
        content: {
            type:      DataTypes.TEXT,
            allowNull: true,
            comment:   'Text content — NULL for image messages',
        },
        imageUrl: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — ONLY for messageType=image',
        },
        deliveryStatus: {
            type:         DataTypes.ENUM('sent', 'delivered', 'read'),
            defaultValue: 'sent',
        },
        readAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },
        isDeleted: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
    },
    {
        sequelize,
        modelName: 'ChatMessage',
        tableName:  'chat_messages',
        timestamps: true,
        updatedAt:  false,
        indexes: [
            { fields: ['conversationId', 'createdAt'] },
            { fields: ['senderId'] },
            { fields: ['deliveryStatus'] },
        ],
    }
);

ChatMessage.belongsTo(ChatConversation, { foreignKey: 'conversationId', as: 'conversation' });
ChatMessage.belongsTo(User,             { foreignKey: 'senderId',       as: 'sender' });
ChatConversation.hasMany(ChatMessage,   { foreignKey: 'conversationId', as: 'messages' });

export default ChatMessage;