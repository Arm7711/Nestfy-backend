import asyncHandler from "../utils/asyncHandler.js";
import * as wishlistSvc from '../services/listings/Wishlist.service.js';

export const toggleFavorite = asyncHandler(async (req, res) => {
    const result = await wishlistSvc.toggleFavorite(
        req.user.id,
        parseInt(req.params.listingId),
    );
    res.json({ success: true, ...result });
});

export const getListing = asyncHandler(async (req, res) => {
    const result = await wishlistSvc.getWishlist(req.user.id, req.query);
    res.json({ success: true });
});

export const getWishlistIds = asyncHandler(async (req, res) => {
    const ids = await wishlistSvc.getWishlistIds(req.user.id);
    res.json({ success: true, ids });
});


export const checkFavorite = asyncHandler(async (req, res) => {
    const isSaved = await wishlistSvc.isInWishlist(
        req.user.id,
        parseInt(req.params.listingId)
    );
    res.json({ success: true, isSaved });
});
export const clearWishlist = asyncHandler(async (req, res) => {
    const result = await wishlistSvc.clearWishlist(req.user.id);
    res.json({ success: true, message: 'Wishlist cleared.', ...result });
});
