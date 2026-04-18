import asyncHandler from '../../utils/asyncHandler.js';
import * as svc     from '../../services/settings/privacy.service.js';

export const getPrivacy = asyncHandler(async (req, res) => {
    const data = await svc.getPrivacySettings(req.user.id);
    res.json({ success: true, data });
});

export const updatePrivacy = asyncHandler(async (req, res) => {
    const data = await svc.updatePrivacySettings(
        req.user.id,
        req.user.role,
        req.body
    );
    res.json({ success: true, data });
});

