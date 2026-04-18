import asyncHandler from "../../utils/asyncHandler.js";
import * as svc from '../../services/settings/notification.service.js';

export const getNotificationSettings = asyncHandler(async (req, res) => {
    const data = await svc.getNotificationSettings(req.user.id);
    res.json({ success: true, data });
});

export const updateNotificationSetting = asyncHandler(async (req, res) => {
    const data = await svc.updateNotificationSettings(req.user.id, req.body);
    res.json({
        success: true,
        data: data,
    });
});

export const getMarketplaceNotifications = asyncHandler(async (req, res) => {
    const data = await svc.getMarketplaceNotifications(req.user.id);
    res.json({ success: true, data: data });
});

export const updateMarketplaceNotifications = asyncHandler(async (req, res) => {
    const data = await svc.updateMarketplaceNotifications(
        req.user.id,
        req.user.role,
        req.body
    );

    res.json({ success: true, data});
});

