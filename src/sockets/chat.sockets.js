import jwt from "jsonwebtoken";
import * as chatSvc from '../services/chat.service.js';
import logger from "../utils/logger.js";

export const registerChatSocket = (io) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth?.token
                ?? socket.handshake?.headers?.authorization?.split('')[1];

            if (!token) {
                return next(new Error('Authentication required.'));
            }

            const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
            socket.userId = decoded.sub ?? decoded.id;

            next();
        } catch (err) {
            next(new Error('Invalid token'))
        }
    });


    io.on('connection', socket => {
        logger.info(`Socket connected: ${socket.id} | user: ${socket.userId}}`);

        socket.on('join_conversation', async ({conversationId}) => {
            try {
                const {ChatConversation} = await import('../models/Common/index.js');
                const conv = await ChatConversation.findByPk(conversationId);

                if(!conv) {
                    return socket.emit('error', { message: 'Conversation not found.' });
                }

                const isParticipant =
                    conv.buyerId === socket.userId ||
                    conv.sellerId === socket.userId

                if(!isParticipant) {
                    return socket.emit('error', { message: 'Access denied' });
                }

                socket.join(`conversation:${conversationId}`);
                socket.emit('joined', { conversationId });

                logger.info(`User ${socket.userId} joined conversation:${conversationId}`);
            } catch (err) {
                socket.emit('error', {message: 'Failed to join conversation.'})
            }
        });

        socket.on('leave_conversation', ({ conversationId }) => {
            socket.leave(`conversation:${conversationId}`);
        });


        socket.on('send_message', async ({ conversationId, content, messageType = 'text', imageUrl }) => {
            try {
                const message = await chatSvc.sendMessage(
                    conversationId,
                    socket.userId,
                    { content, messageType, imageUrl }
                );

                io.on(`conversation:${conversationId}`)
                    .emit('new_message', {
                        id: message.id,
                        conversationId: message.senderId,
                        messageType: messageType,
                        content: message.content,
                        imageUrl: message.imageUrl,
                        deliveryStatus: message.deliveryStatus,
                        createdAt: message.createdAt,
                    });

                socket.emit('message_sent', { tempId: null, messageId: message.id });

                logger.info(`Message sent in conversation:${conversationId} by ${socket.userId}`);
            }catch(err) {
                socket.emit('error', { message: err.message });
            }
        });

        socket.on('typing_start', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`)
                .emit('user_typing', { userId: socket.userId, isTyping: true });
        })

        socket.on('typing_stop', ({ conversationId }) => {
            socket.to(`conversation:${conversationId}`)
                .emit('user_typing', { userId: socket.userId, isTyping: false });
        });


        //mark read - messages read - as -read

        socket.on('mark_read', async ({ conversationId }) => {
            try {
                await chatSvc.markAsRead(conversationId, socket.userId);

                socket.to(`conversation:${conversationId}`)
                    .emit('messages_read', {
                        conversationId,
                        readBy: socket.userId,
                        readAt: new Date(),
                    });
            } catch (err) {
                logger.error(`mark_read error: ${err.message}`);
            }
        });

        // disconnect

        socket.on('disconnect', (reason) => {
            logger.info(`Socket disconnected: ${socket.id} | reason: ${reason}`);
        });
    })
}