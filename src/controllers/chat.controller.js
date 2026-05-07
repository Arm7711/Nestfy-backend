import asyncHandler from '../utils/asyncHandler.js';
import * as chatSvc from '../services/chat/chat.service.js';

export const startConversation = asyncHandler(async (req, res) => {
    const { conversation, created } = await chatSvc.getOrCreateConversation(
        req.user.id,
        req.params.listingId
    );
    res.status(created ? 201 : 200).json({ success: true, conversation });
});

export const getConversations = asyncHandler(async (req, res) => {
    const data = await chatSvc.getUserConversations(req.user.id, req.query);
    res.json({ success: true, ...data });
});

export const getMessages = asyncHandler(async (req, res) => {
    const data = await chatSvc.getMessages(
        req.params.conversationId,
        req.user.id,
        req.query
    );
    res.json({ success: true, messages: data });
});

export const sendMessage = asyncHandler(async (req, res) => {
    const message = await chatSvc.sendMessage(
        req.params.conversationId,
        req.user.id,
        req.body
    );

    const io = req.app.get('io');
    if (io) {
        io.to(`conversation:${req.params.conversationId}`).emit('new_message', message);
    }

    res.status(201).json({ success: true, message });
});

export const markAsRead = asyncHandler(async (req, res) => {
    await chatSvc.markAsRead(req.params.conversationId, req.user.id);
    res.json({ success: true });
});

export const archiveConversation = asyncHandler(async (req, res) => {
    const data = await chatSvc.archiveConversation(
        req.params.conversationId,
        req.user.id
    );
    res.json({ success: true, ...data });
});