import asyncHandler from '../utils/asyncHandler.js';
import * as kycSvc  from '../services/kyc.service.js';

export const submitKYC = asyncHandler(async (req, res) => {
    const files = {
        documentFront: req.files?.documentFront?.[0]
            ? {
                cloudinaryUrl: req.files.documentFront[0].cloudinaryUrl,
                buffer:        req.files.documentFront[0].buffer,
                mimetype:      req.files.documentFront[0].mimetype,
            }
            : null,
        documentBack:  req.files?.documentBack?.[0]
            ? {
                cloudinaryUrl: req.files.documentBack[0].cloudinaryUrl,
                buffer:        req.files.documentBack[0].buffer,
            }
            : null,
        selfie: req.files?.selfie?.[0]
            ? {
                cloudinaryUrl: req.files.selfie[0].cloudinaryUrl,
                buffer:        req.files.selfie[0].buffer,
            }
            : null,
    };

    const kyc = await kycSvc.submitKYC(req.user.id, req.body, files);
    res.status(201).json({
        success: true,
        message: 'KYC submitted. Verification in progress.',
        kyc,
    });
});

export const getKYCStatus = asyncHandler(async (req, res) => {
    const data = await kycSvc.getKYCStatus(req.user.id);
    res.json({ success: true, data });
});

//Admin

export const adminOverrideKYC = asyncHandler(async (req, res) => {
    await kycSvc.adminOverrideKYC(
        req.params.kycId,
        req.user.id,
        req.body.decision,
        req.body.reason
    );
    res.json({ success: true, message: 'KYC decision updated.' });
});
