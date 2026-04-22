import asyncHandler from "../../utils/asyncHandler.js";
import * as svc     from '../../services/settings/security.service.js';

export const getSecuritySettings = asyncHandler(async (req, res) => {
    const data = await svc.getSecuritySettings(req.user.id);
    res.json({ success: true, data });
});

export const updateSecuritySettings = asyncHandler(async (req, res) => {
    const data = await svc.updateSecuritySettings(req.user.id, req.body);

    res.json({ success: true, message: "Security settings updated.", data });
});

export const changePassword = asyncHandler(async (req, res) => {
    const jti = req.session?.id;

    const data = await svc.changePassword(req.user.id, req.body, jti);
    res.json({ success: true, ...data });
});

export const toggleTwoFactor = asyncHandler(async (req, res) => {
    const data = await svc.toggleTwoFactor(req.user.id, req.body);
    res.json({ success: true, message: '2FA settings updated.', data });
});

export const getActiveSessions = asyncHandler(async (req, res) => {
    const jti = req.session?.id;
    const data = await svc.getActiveSessions(req.user.id, jti);
    res.json({ success: true, data });
});

export const revokeSession = asyncHandler(async (req, res) => {
    const jti = req.session?.id;
    const data = await svc.revokeSession(req.user.id, req.params.sessionId);
    res.json({ success: true, ...data });
});

export const logoutAllDevices = asyncHandler(async (req, res) => {
    const data = await svc.logoutAllDevices(req.user.id);
    res.json({ success: true, ...data });
});
