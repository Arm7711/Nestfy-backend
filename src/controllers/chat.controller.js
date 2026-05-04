import asyncHandler from "../utils/asyncHandler.js";
import * as chatSvc from "../services/chat.service.js";

export const startConversation  = asyncHandler(async (req, res) => {
    const { conversation, created } = await chatSvc.getOrCreateConversation(
        req.user.id,
        req.params.listingId
    );
    res.status(created ? 201 : 200).json({ success: true, conversation });
});

export const getConversations = asyncHandler(async (req, res) => {
    const data = await chatSvc.getUserConversations(req.user.id);
    res.json({ success: true, conversations: data });
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
        req.userId,
        req.body
    );

    const io = req.app.get('io');
    io.to(`conversation:${req.params.conversationId}`).emit('new_message', message);

    res.status(201).json({ success: true, message });
});


export const markAsUser = asyncHandler(async  (req, res) => {
    await chatSvc.markAsUser(req.user.id);

    res.json({ success: true })
})