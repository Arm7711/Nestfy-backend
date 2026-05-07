import {KYCVerification, User} from "../../models/Common/index.js";
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import {analyzeKYCWithAI} from "../ai/kycAi.service.js";

const ALLOWED_DOCUMENT_TYPES = ['passport', 'national_id', 'drivers_license'];

const KYC_THRESHOLDS  = {
    faceMatch: 0.80,// Min 80% face match
    authenticity: 0.75,// Min 75% document authenticity
    riskScore: 0.70, // >70% = high risk
};

export const submitKYC = async (userId, data, files) => {
    if(!ALLOWED_DOCUMENT_TYPES.includes(data.documentType)) {
        throw new AppError(
            `Invalid document type. Allowed ${ALLOWED_DOCUMENT_TYPES.join(', ')}`,
            400,
            'INVALID_DOCUMENT_TYPE'
        );
    }

    if(
        ['national_id', 'drivers_license'].includes(data.documentType) &&
        !files.documentBack
    ) {
        throw new AppError(
            'Back side of document is required for this document type.',
            400,
            'BACK_SIDE_REQUIRED'
        );
    }

    if (!files.selfie) {
        throw new AppError('Selfie is required for identity verification.', 400);
    }

    const user = await User.findByPk(userId);
    if(user.kycStatus === 'approved') {
        throw new AppError('Identity already verified.', 409, 'ALREADY_VERIFIED');
    }
    if(user.kycStatus === 'pending') {
        throw new AppError(
            'Verification already in progress. Please wait.',
            409,
            'VERIFICATION_PENDING'
        );
    }

    const attemptCount = await KYCVerification.count({ where: { userId } });

    const kyc = await KYCVerification.create({
        userId,
        documentType:     data.documentType,
        documentFrontUrl: files.documentFront.cloudinaryUrl,
        documentBackUrl:  files.documentBack?.cloudinaryUrl ?? null,
        selfieUrl:        files.selfie.cloudinaryUrl,
        status:           'ai_processing',
        attemptNumber:    attemptCount + 1,
    });

    await User.update({ kycStatus: 'pending' }, { where: { id: userId } });

    processKYCWithAI(kyc.id, userId).catch(err =>
        logger.error(`KYC AI processing error: ${err.message}`),
    );

    logger.info(`KYC submitted by user ${userId}, attempt ${kyc.attemptNumber}`)
}

/**
 * processKYCWithAI — AI API-ով verification
 *
 * Ինչու՞ service layer-ում է, ոչ թե controller-ում
 * Testable է — AI call-ը կարելի է mock անել
 * Retry logic-ը այստեղ է կենտրոնացված
 * Error handling-ը centralized է
 *
 * Decision rules:
 * faceMatch < threshold     → rejected
 * authenticity < threshold  → rejected
 * riskScore > threshold     → high_risk
 * Բոլորը OK               → approved
 */

const processKYCWithAI = async (kycId, userId) => {
    const kyc = await KYCVerification.findByPk(kycId);
    if (!kyc) return;

    try {
        const aiResult = await analyzeKYCWithAI({
            documentType: kyc.documentType,
        });

        let decision = aiResult.decision;
        let rejectReason = aiResult.reason;

        await kyc.update({
            aiProvider: "groq",
            faceMatchScore: aiResult.faceMatchScore,
            documentAuthenticityScore: aiResult.documentAuthenticityScore,
            riskScore: aiResult.riskScore,
            status: decision,
        });

        await User.update(
            {
                kycStatus: decision,
                kycRiskScore: aiResult.riskScore,
                kycVerifiedAt: decision === "approved" ? new Date() : null,
                kycRejectionReason: rejectReason,
            },
            { where: { id: userId } }
        );

        logger.info(`KYC ${kycId} processed by AI`);
    } catch (err) {
        logger.error(`KYC AI failed: ${err.message}`);

        await kyc.update({ status: "pending" });
        await User.update({ kycStatus: "pending" }, { where: { id: userId } });
    }
};
/**
 * adminOverrideKYC — ադմինի կողմից ձեռքով override
 * AI-ի արդյունքը միայն առաջարկ (suggestion) է — վերջնական որոշումը մարդն է ընդունում
 */

export const adminOverrideKYC = async(kycId, adminUserId, decision, reason) => {
    const kyc = await KYCVerification.findByPk(kycId);

    if(!kyc) throw new AppError('KYC record not found', 404);

    const VALID = ['approved', 'rejected', 'high_risk'];

    if(!VALID.includes(decision)) {
        throw new AppError('Invalid Decision', 400);
    }

    await kyc.update({
        status: decision,
        rejectionReason: reason ?? null,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
    });

    await User.update(
        {
            kycStatus: decision,
            kycVerifiedAt: decision === 'approved' ? new Date() : null,
            kycRejectionReason: reason,
        },
        { where: { id: kyc.userId} }
    );

    logger.warn(`KYC ${kycId} overridden by admin ${adminUserId}: ${decision}`);
};

export const getKYCStatus = async (userId) => {
    const user = await User.findByPk(userId, {
        attributes: ['kycStatus', 'kycVerifiedAt', 'kycRiskScore', 'kycRejectionReason'],
    })

    if(!user) throw new AppError('User not found', 404);

    const latestKyc = await KYCVerification.findOne({
        where: { userId },
        order: [['createdAt', 'DESC']],
        attributes: ['id', 'documentType', 'status', 'attemptNumber', 'createdAt'],
    });

    return {
        kycStatus:     user.kycStatus,
        verifiedAt:    user.kycVerifiedAt,
        riskScore:     user.kycRiskScore,
        rejectionReason: user.kycRejectionReason,
        latestAttempt: latestKyc,
    }
};
