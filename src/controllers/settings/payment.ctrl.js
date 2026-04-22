import asyncHandler from '../../utils/asyncHandler.js';
import * as svc     from '../../services/settings/payment.service.js';

export const getPaymentSettings    = asyncHandler(async (req, res) => {
    const data = await svc.getPaymentSettings(req.user.id);
    res.json({ success: true, data });
});

export const connectPayPal         = asyncHandler(async (req, res) => {
    const data = await svc.connectPayPal(req.user.id, req.body);
    res.json({ success: true, message: 'PayPal connected successfully.', data });
});

export const disconnectPayPal      = asyncHandler(async (req, res) => {
    const data = await svc.disconnectPayPal(req.user.id);
    res.json({ success: true, message: 'PayPal disconnected.', data });
});

export const updatePaymentSettings = asyncHandler(async (req, res) => {
    const data = await svc.updatePaymentSettings(req.user.id, req.body);
    res.json({ success: true, message: 'Payment settings updated.', data });
});