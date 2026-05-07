import { Comments, Listings, User } from '../../models/Common/index.js';
import AppError from "../../utils/AppError.js";


//  Create

export const createComment = async (listingId, userId, data) => {
    const listing = await Listings.findOne({
        where: { id: listingId, status: 'published' },
    });
    if (!listing) throw new AppError('Listing not found.', 404);

    if (data.parentId) {
        const parent = await Comments.findOne({
            where: { id: data.parentId, listingId },
        });
        if (!parent) throw new AppError('Parent comment not found.', 404);

        // Max depth = 1 level of replies (parent must be top-level)
        if (parent.parentId !== null) {
            throw new AppError(
                'Maximum comment depth reached. Cannot reply to a reply.',
                400,
                'MAX_DEPTH_EXCEEDED'
            );
        }
    }

    const comment = await Comments.create({
        listingId,
        userId,
        parentId: data.parentId ?? null,
        content:  data.content.trim(),
    });

    await Listings.increment('commentCount', { where: { id: listingId } });

    if (data.parentId) {
        await Comments.increment('replyCount', { where: { id: data.parentId } });
    }

    return comment;
};

//Gett

export const getComments = async (listingId, query) => {
    const page   = Math.max(1, parseInt(query.page)  || 1);
    const limit  = Math.min(50, parseInt(query.limit) || 20);
    const offset = (page - 1) * limit;

    const { count, rows } = await Comments.findAndCountAll({
        where: {
            listingId,
            parentId:  null,
            isVisible: true,
            isDeleted: false,
        },
        limit,
        offset,
        order:   [['createdAt', 'DESC']],
        include: [
            {
                model:      User,
                as:         'user',
                attributes: ['id', 'name', 'avatar'],
            },
            {
                model:    Comments,
                as:       'replies',
                where:    { isVisible: true, isDeleted: false },
                required: false,
                include:  [{
                    model:      User,
                    as:         'user',
                    attributes: ['id', 'name', 'avatar'],
                }],
            },
        ],
    });

    return {
        comments: rows,
        pagination: {
            total:      count,
            page,
            limit,
            totalPages: Math.ceil(count / limit),
            hasMore:    page * limit < count,
        },
    };
};

//  Delete

export const deleteComment = async (commentId, userId) => {
    const comment = await Comments.findOne({
        where: { id: commentId, userId },
    });
    if (!comment) throw new AppError('Comment not found or access denied.', 404);

    await comment.update({
        content:   '[deleted]',
        isDeleted: true,
        deletedAt: new Date(),
    });

    await Listings.decrement('commentCount', {
        where: { id: comment.listingId, commentCount: { $gt: 0 } },
    });
};