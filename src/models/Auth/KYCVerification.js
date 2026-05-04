import { DataTypes, Model } from "sequelize";
import sequelize from "../../config/db.sequelize.js";
import User from "./User.js";

/**
 * KYCVerification — ինքնության հաստատման table
 *
 * Ինչու՞ առանձին table է
 * User table-ում պահվում է միայն վերջնական status-ը (kycStatus)
 * Այստեղ պահվում են բոլոր KYC փորձերը — audit trail
 * Մի user-ը կարող է մեկից ավելի անգամ փորձել՝ reject-ից հետո
 *
 * Document types:
 * Միայն 3 document type է թույլատրված՝
 * passport, national_id, drivers_license
 * Այլ document types-ը system-ում BLOCK-ված են
 */

class KYCVerification extends Model {}

KYCVerification.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            references: { model: 'users', key: 'id' },
            onDelete: "CASCADE",
        },

        // Document Info

        /**
         * documentType — միայն 3 type է թույլատրվում
         * Validator-ը strict է դրված — այլ type ուղարկելու դեպքում վերադարձվում է 400
         */

        documentType: {
            type: DataTypes.ENUM('passport', 'national_id', 'drivers_license'),
            allowNull: false,
        },

        documentFrontUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: "Cloudinary URL - front side of document",
        },

        documentBackUrl: {
            type: DataTypes.STRING(500),
            allowNull: true,
            comment: "Back side - require for national_id, drivers_license",
        },
        selfieUrl: {
            type: DataTypes.STRING(200),
            allowNull: false,
            comment: "Selfie for face matching"
        },

        //AI verification Results

        aiProvider: {
            type: DataTypes.STRING(200),
            allowNull: true,
            comment: "e.g. jumio, Onfido, Persona",
        },
        aiVerificationId: {
            type: DataTypes.STRING(255),
            allowNull: true,
            comment: "External verification ID from AI provider."
        },

        aiRawResponse: {
            type: DataTypes.JSON,
            allowNull: true,
            comment: "Full AI API response - audit purpose",
        },

        faceMatchScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "0.0-1.0 - selfie vs document face match confidence",
        },
        documentAuthenticityScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "0.0-1.0 - document tempering detection",
        },
        riskScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "0.0-1.0 - overall risk. >0.7 = high risk",
        },

        //Decision

        /**
         * status — AI signal + մարդու որոշում
         * AI-ն միայն signal է ուղարկում — վերջնական որոշումը այստեղ է պահվում
         * Admin-ը կարող է override անել AI-ի որոշումը
         */

        status: {
            type: DataTypes.ENUM('pending', 'ai_processing', 'approved', 'rejected', 'high_risk'),
            defaultValue: 'pending',
        },

        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        reviewedBy: {
            type: DataTypes.UUID,
            allowNull: true,
            comment: "Admin userId who final decision",
        },
        reviewedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        //Attempt tracking

        attemptNumber: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
            comment: "How many times user has submitted KYC",
        },

        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "KYC approval - some providers require re-verification",
        },
    },
    {
        sequelize,
        modelName: "KYCVerification",
        tableName: "kyc_verifications",
        timestamps: true,
        indexes: [
            { fields: ['userId'] },
            { fields: ['status'] },
            { fields: ['aiVerificationId'] },
        ],
    }
);

KYCVerification.belongsTo(User,  { foreignKey: 'userId', as: 'user' });
User.hasMany(KYCVerification, { foreignKey: 'userId', as: 'kycVerifications' });

export default KYCVerification;