import asyncHandler          from "../utils/asyncHandler.js";
import * as listingSvc       from '../services/listings/listing.service.js';
import * as listingImageSvc  from '../services/listings/listingImage.service.js';
import * as listingViewSvc   from '../services/listings/listingView.service.js';

// ─── Public ───────────────────────────────────────────────────────────────────

export const getListings = asyncHandler(async (req, res) => {
    // BUG FIXED: was passing req.params.id (undefined) instead of req.query
    const data = await listingSvc.getListings(req.query);
    res.json({ success: true, ...data });
});

export const getListingById = asyncHandler(async (req, res) => {
    const listing = await listingSvc.getListingById(req.params.id);

    listingViewSvc.trackView({
        listingId: listing.id,
        userId:    req.user?.id ?? null,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
    }).catch(() => {});

    res.json({ success: true, listing });
});

// Owner actions

export const createListing = asyncHandler(async (req, res) => {
    const listing = await listingSvc.createListing(req.user.id, req.body);
    res.status(201).json({ success: true, listing });
});

export const updateListing = asyncHandler(async (req, res) => {
    const listing = await listingSvc.updateListing(
        req.params.id,
        req.user.id,
        req.body
    );
    res.json({ success: true, listing });
});

export const submitForReview = asyncHandler(async (req, res) => {
    const listing = await listingSvc.submitForPreview(req.params.id, req.user.id);
    res.json({ success: true, listing });
});

export const archiveListing = asyncHandler(async (req, res) => {
    const listing = await listingSvc.archiveListing(req.params.id, req.user.id);
    res.json({ success: true, listing });
});

export const deleteListing = asyncHandler(async (req, res) => {
    await listingSvc.deleteListing(req.params.id, req.user.id);
    res.json({ success: true, message: 'Listing deleted.' });
});

//  Admin

export const approveListing = asyncHandler(async (req, res) => {
    const listing = await listingSvc.approveListing(req.params.id, req.user.id);
    res.json({ success: true, listing });
});

export const rejectListing = asyncHandler(async (req, res) => {
    const listing = await listingSvc.rejectListing(
        req.params.id,
        req.user.id,
        req.body.reason
    );
    res.json({ success: true, listing });
});

//  Images

export const uploadImages = asyncHandler(async (req, res) => {
    const images = await listingImageSvc.uploadListingImages(
        req.params.id,
        req.files,
        req.user.id
    );
    res.status(201).json({ success: true, images });
});

export const deleteImage = asyncHandler(async (req, res) => {
    await listingImageSvc.deleteImage(req.params.imageId, req.params.id);
    res.json({ success: true, message: 'Image deleted.' });
});

export const reorderImages = asyncHandler(async (req, res) => {
    await listingImageSvc.reorderImages(req.params.id, req.body.orderedIds);
    res.json({ success: true, message: 'Images reordered.' });
});

export const setPrimaryImage = asyncHandler(async (req, res) => {
    await listingImageSvc.setPrimaryImage(req.params.imageId, req.params.id);
    res.json({ success: true, message: 'Primary image updated.' });
});