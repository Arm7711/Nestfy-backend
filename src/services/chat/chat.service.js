import { Op } from 'sequelize';
import {
    ChatConversation, ChatMessage, Listings, User,
} from '../../models/Common/index.js';
import AppError from '../../utils/AppError.js';

//  Conversation

export const getOrCreateConversation = async (buyerId, listingId) => {
    const listing = await Listings.findOne({
        where: { id: listingId, status: 'published' },
    });
    if (!listing) throw new AppError('Listing not found.', 404);


    let sellerId = listing.userId;

    if (!sellerId && listing.agentId) {
        const agent = await listing.getAgent();
        sellerId = agent?.userId ?? null;
    }
    if (!sellerId && listing.agencyId) {
        const agency = await listing.getAgency();
        sellerId = agency?.userId ?? null;
    }

    if (!sellerId) throw new AppError('Seller not found for this listing.', 404);

    if (buyerId === sellerId) {
        throw new AppError('You cannot message yourself.', 400, 'SELF_MESSAGE');
    }

    const [conversation, created] = await ChatConversation.findOrCreate({
        where:    { listingId, buyerId },
        defaults: { listingId, buyerId, sellerId },
    });

    return { conversation, created };
};

//  Messages

export const sendMessage = async (conversationId, senderId, data) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) throw new AppError('Conversation not found.', 404);

    const isParticipant =
        conversation.buyerId  === senderId ||
        conversation.sellerId === senderId;

    if (!isParticipant) throw new AppError('Access denied.', 403, 'NOT_PARTICIPANT');

    if (data.messageType === 'video') {
        throw new AppError('Video messages are not allowed.', 400, 'VIDEO_NOT_ALLOWED');
    }

    const message = await ChatMessage.create({
        conversationId,
        senderId,
        messageType: data.messageType ?? 'text',
        content:     data.content     ?? null,
        imageUrl:    data.imageUrl    ?? null,
    });

    const isBuyer    = senderId === conversation.buyerId;
    const unreadField = isBuyer ? 'sellerUnreadCount' : 'buyerUnreadCount';

    await conversation.update({
        lastMessageAt:      new Date(),
        lastMessagePreview: data.content?.slice(0, 100) ?? '[image]',
        [unreadField]:      conversation[unreadField] + 1,
    });

    return message;
};

export const getMessages = async (conversationId, userId, query) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) throw new AppError('Conversation not found.', 404);

    const isParticipant =
        conversation.buyerId  === userId ||
        conversation.sellerId === userId;
    if (!isParticipant) throw new AppError('Access denied.', 403, 'NOT_PARTICIPANT');

    const { before, limit = 30 } = query;

    const where = { conversationId, isDeleted: false };
    if (before) where.id = { [Op.lt]: parseInt(before) };

    const messages = await ChatMessage.findAll({
        where,
        limit: Math.min(parseInt(limit), 50),
        order: [['id', 'DESC']],
        include: [{
            model:      User,
            as:         'sender',
            attributes: ['id', 'name', 'avatar'],
        }],
    });


    await markAsRead(conversationId, userId);

    return messages.reverse();
};

// Read status

export const markAsRead = async (conversationId, userId) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) return;

    const isBuyer     = userId === conversation.buyerId;
    const unreadField  = isBuyer ? 'buyerUnreadCount' : 'sellerUnreadCount';

    await conversation.update({ [unreadField]: 0 });

    await ChatMessage.update(
        { deliveryStatus: 'read', readAt: new Date() },
        {
            where: {
                conversationId,                        // BUG FIXED: was missing
                senderId:       { [Op.ne]: userId },   // Only mark messages from the other side
                deliveryStatus: { [Op.ne]: 'read' },
            },
        }
    );
};

//  Conversations list

export const getUserConversations = async (userId, query = {}) => {
    const page   = Math.max(1, parseInt(query.page)  || 1);
    const limit  = Math.min(50, parseInt(query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await ChatConversation.findAndCountAll({
        where: {
            [Op.or]:    [{ buyerId: userId }, { sellerId: userId }],
            isArchived: false,
        },
        order:  [['lastMessageAt', 'DESC']],
        limit,
        offset,
        include: [
            {
                model:      Listings,
                as:         'listing',
                attributes: ['id', 'title', 'slug'],
            },
            {
                model:      User,
                as:         'buyer',
                attributes: ['id', 'name', 'avatar'],
            },
            {
                model:      User,
                as:         'seller',
                attributes: ['id', 'name', 'avatar'],
            },
        ],
    });

    return {
        conversations: rows,
        pagination: {
            total:      count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
        },
    };
};

export const archiveConversation = async (conversationId, userId) => {
    const conversation = await ChatConversation.findByPk(conversationId);
    if (!conversation) throw new AppError('Conversation not found.', 404);

    const isParticipant =
        conversation.buyerId  === userId ||
        conversation.sellerId === userId;
    if (!isParticipant) throw new AppError('Access denied.', 403, 'NOT_PARTICIPANT');

    await conversation.update({ isArchived: true });
    return { message: 'Conversation archived.' };
};