import asyncHandler from "../../utils/asyncHandler.js";
import * as svc from '../../services/settings/profile.service.js';

export const getProfile = asyncHandler(async (req, res) => {
    const data = await svc.getProfile(req.user.id);

    res.json({ success: true, data });
});

export const updateProfile = asyncHandler(async (req, res) => {
    const data = await svc.updateProfile(req.user.id, req.body);

    res.json({ success: true, message: "Profile updated.", data });
});

export const updateAvatar = asyncHandler(async (req, res) => {
    const avatarUrl = req.file?.path ?? req.body.avatarUrl;
    const data      = await svc.updateAvatar(req.user.id, avatarUrl);
    res.json({ success: true, message: 'Avatar updated.', data });
});