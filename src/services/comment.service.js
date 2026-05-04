import { Comments, Listings, User } from '../models/Common/index.js';
import AppError from "../utils/AppError.js";

const MAX_DEPTH = 2;

export const createComment = async (listingId, userId, data) => {
    const listing = await Listings.findOne({
        where: { id: listingId, status: 'published' },
    });
    if (!listing) throw new AppError('Listing not found.', 404);

    if (data.parentId) {
        const parent = await Comment.findOne({
            where: { id: data.parentId, listingId },
        });
        if (!parent) {
            throw new AppError('Parent comment not found.', 404);
        }
        if (parent.parentId !== null) {
            throw new AppError(
                'Maximum comment depth reached. Cannot reply to a reply.',
                400,
                'MAX_DEPTH_EXCEEDED'
            );
        }
    }

    const comment = await Comment.create({
        listingId,
        userId,
        parentId: data.parentId ?? null,
        content:  data.content.trim(),
    });

    // Stats update
    await Listings.increment('commentCount', { where: { id: listingId } });

    if (data.parentId) {
        await Comment.increment('replyCount', { where: { id: data.parentId } });
    }

    return comment;
};

export const getComments = async (listingId, query) => {
    const { page = 1, limit = 20 } = query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Comments.findAndCountAll({
        where: {
            listingId,
            parentId: null,
            isVisible: true,
            isDeleted: true,
        },
        limit: parseInt(limit),
        offset,
        order: [['createdAt', 'DESC']],
        include: [
            {
                model: User,
                as: 'user',
                attributes: ['id', 'name', 'avatar'],
            },
            {
                model: Comment,
                as: 'replies',
                where: { isVisible: true, isDeleted: false },
                required: false,
                include: [{
                    model: User,
                    as: 'user',
                    attributes: ['id', 'name', 'avatar'],
                }],
            },
        ],
    });

    return {
        comments: rows,
        pagination: {
            total: count,
            page: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
        },
    };
};

export const deleteComment = async (commentId, userId) => {
    const comment = await Comment.findOne({
        where: { id: commentId, userId },
    });
    if (!comment) throw new AppError('Comment not found.', 404);

    await comment.update({
        content:   '[deleted]',
        isDeleted: true,
        deletedAt: new Date(),
    });
}