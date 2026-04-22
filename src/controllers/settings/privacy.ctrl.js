import asyncHandler from "../../utils/asyncHandler.js";
import * as svc from '../../services/settings/privacy.service.js';

export const getPrivacySettings = asyncHandler(async (req, res) => {
    const data = await svc.getPrivacySettings(req.user.id);
    res.json({ success: true, data });
});

export const updatePrivacySettings = asyncHandler(async (req, res) => {
    const data = await svc.updatePrivacySettings(req.user.id, req.body);
    res.json({ success: true, message: "Privacy settings updated.", data });
});

export const requestDataDownload = asyncHandler(async (req, res) => {
    const data = await svc.requestDataDownload(req.user.id);
    res.json({ success: true, ...data });
});

export const requestAccountDeletion = asyncHandler(async (req, res) => {
    const data = await svc.requestAccountDeletion(req.user.id);
    res.json({ success: true, ...data });
});

export const cancelAccountDeletion = asyncHandler(async (req, res) => {
    const data = await svc.cancelAccountDeletion(req.user.id);
    res.json({ success: true, ...data });
});