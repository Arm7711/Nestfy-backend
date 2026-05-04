import { Op } from "sequelize";
import {
    ChatConversation, ChatMessage, Listings, User,
} from '../models/Common/index.js';
import AppError from "../utils/AppError.js";

export const getOrCreateConversation  = async (buyerId, listingId) => {
    const listing = await Listings.findOne({
        where: { id: listingId, status: "published" },
    });
    if (!listing) throw new AppError('Listing not found.', 404);

    const sellerId =
        listing.userId ??
        (listing.agentId ? (await listing.getAgent()).userId  : null) ??
        (listing.agencyId ? (await listing.getAgency()).userId : null);

    if(buyerId === sellerId) {
        throw new AppError('You cannot message yourself.', 404);
    }

    const [conversation, created] = await ChatConversation.findOrCreate({
        where: { listingId, buyerId },
        defaults: { listingId, buyerId, sellerId },
    });

    return { conversation, created };
};

export const sendMessage = async (conversationId, senderId, data) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) throw new AppError('Conversation not found.', 404);

    const isParticipant =
        conversation.buyerId === senderId ||
        conversation.sellerId === senderId;

    if(!isParticipant) {
        throw new AppError('Access denied.', 403, 'NOT_PARTICIPANT');
    }

    if(data.messageType === 'video') {
        throw new AppError('Video messages are not allowed.', 400, 'VIDEO_NOT_ALLOWED');
    }

    const message = await ChatMessage.create({
        conversationId,
        senderId,
        messageType: data.messageType ?? 'text',
        content: data.content ?? null,
        imageUrl: data.imageUrl ?? null,
    });


    const isBuyer = senderId === conversation.buyerId;
    const unreadFiled = isBuyer ? 'sellerUnreadCount' : 'buyerUnreadCount';

    await conversation.update({
        lastMessageAt: new Date(),
        lastMessagePreview: data.content?.slice(0, 100) ?? "image",
        [unreadFiled]: conversation[unreadFiled] + 1,
    });

    return message;
}

export const getMessages = async (conversationId, userId, query) =>{
    const conversation = await ChatConversation.findByPk(conversationId);

    if(!conversation) throw new AppError('Conversation not found.', 404);

    const isParticipant =
        conversation.buyerId === userId ||
        conversation.sellerId === userId;
    if (!isParticipant) throw new AppError('Access denied.', 403);

    const { before, limit = 30 } = query;

    const where = {
        conversationId,
        isDeleted: false,
    };

    if(before) {
        where.id = { [Op.lt]: parseInt(before) }
    }

    const messages  = await ChatMessage.findAll({
        limit: Math.min(parseInt(limit), 50),
        order: [['id', 'DESC']],
        include: [{
            model: User,
            as: 'sender',
            attributes: ['id', 'name', 'avatar'],
        }],
    });

    await markAsUser(conversationId, userId);

    await markAsRead(conversationId, userId);

    return messages.reverse()
}

export const markAsRead = async (conversationId, userId) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) return;

    const isBuyer = userId === conversation.buyerId;
    const unreadField = isBuyer ? 'buyerUnreadCount' : 'sellerUnreadCount';

    await conversation.update({ [unreadField]: 0 });

    await ChatMessage.update(
        { deliveryStatus: 'read', readAt: new Date() },
        {
            where: {
                conversationId,
                senderId:       { [Op.ne]: userId },
                deliveryStatus: { [Op.ne]: 'read' },
            },
        }
    );
};
export const markAsUser = async(conversationId, userId) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) return;

    const isBuyer = userId === conversation.buyerId;
    const unreadField = isBuyer ? 'buyerUnreadCount' : 'sellerUnreadCount';

    await conversation.update({ [unreadField]: 0 });

    await ChatMessage.update(
        { deliveryStatus: 'read', readAt: new Date() },
        {
            where: {
                conversationId,
                senderId: { [Op.ne]: userId  },
                deliveryStatus: { [Op.ne]: 'read' },
            },
        }
    );
};

export const getUserConversations = async(userId) => {
    return ChatConversation.findAll({
        where: {
            [Op.or]: [{ buyerId: userId }, { sellerId: userId }],
            isArchived: false,
        },
        order: [['lastMessageAt', 'DESC']],
        include: [{
            model: Listings,
            as: 'listing',
            attributes: ['id', 'title', 'slug'],
        }],
    });
};
