import asyncHandler from "../../utils/asyncHandler.js";
import * as svc from '../../services/settings/notification.service.js';

export const getNotificationSettings    = asyncHandler(async (req, res) => {
    const data = await svc.getNotificationSettings(req.user.id);
    res.json({ success: true, data });
});

export const updateNotificationSettings = asyncHandler(async (req, res) => {
    const data = await svc.updateNotificationSettings(req.user.id, req.body);
    res.json({ success: true, message: 'Notification settings updated.', data });
});