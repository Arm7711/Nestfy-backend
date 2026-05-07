import asyncHandler  from '../utils/asyncHandler.js';
import * as commentSvc from '../services/comment/comment.service.js';


export const createComment = asyncHandler(async (req, res) => {
    const comment = await commentSvc.createComment(
        req.params.listingId,
        req.user.id,
        req.body
    );
    res.status(201).json({ success: true, comment });
});

export const getComments = asyncHandler(async (req, res) => {
    const data = await commentSvc.getComments(
        req.params.listingId,
        req.query
    );
    res.json({ success: true, ...data });
});

export const deleteComment = asyncHandler(async (req, res) => {
    await commentSvc.deleteComment(req.params.id, req.user.id);
    res.json({ success: true, message: 'Comment deleted.' });
});