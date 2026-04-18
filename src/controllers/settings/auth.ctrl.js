import asyncHandler from '../../utils/asyncHandler.js';
import * as svc     from '../../services/settings/auth.service.js';

export const getAuthSettings = asyncHandler(async (req, res) => {
    const data = await svc.getAuthSettings(req.userId);
    res.json({ success: true, data });
});

export const updateAuthSettings = asyncHandler(async (req, res) => {
    const data = await svc.updateAuthSettings(
        req.user.id,
        req.body
    )
})