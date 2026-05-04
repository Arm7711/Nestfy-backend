import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../../config/db.sequelize.js';

class User extends Model {
    async comparePassword(candidate) {
        if (!this.password) return false;
        return bcrypt.compare(candidate, this.password);
    }

    /**
     * canPublishListings — KYC ստուգում
     * Միայն approved կարգավիճակ ունեցող user-ները կարող են listing ստեղծել
     * Այս method-ը կանչվում է listing service-ում
     * Controller-ում verify անելուց հետո
     */

    canPublishListings() {
        return this.kycStatus === 'approved' && this.isActive;
    }

    toJSON() {
        const values = { ...this.get() };
        delete values.password;
        return values;
    }
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Name is required.' },
                len: { args: [2, 100], msg: 'Name must be 2–100 characters.' },
            },
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: { isEmail: { msg: 'Invalid email address.' } },
            set(val) {
                this.setDataValue('email', val.toLowerCase().trim());
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },

        /**
         * role — ավելացվել է 'agency'
         * Ինչու՞ Agency-ն agent-ից տարբեր role է —
         * իրենց dashboard-ը, permissions-ը և listings-երը տարբեր են
         */
        role: {
            type: DataTypes.ENUM('user', 'agent', 'agency', 'admin', 'superadmin'),
            defaultValue: 'user',
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        emailVerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },

        /**
         * kycStatus — listing հրապարակելու նախապայման
         * Միայն 'approved' user-ները կարող են listing ստեղծել
         * AI API-ն ուղարկում է signal, իսկ վերջնական որոշումը admin-ն է տալիս
         *
         * none      → KYC submit դեռ չի արվել
         * pending   → Ուղարկված է, սպասում է review-ի
         * approved  → Verified է, կարող է հրապարակել
         * rejected  → Մերժված է, չի կարող հրապարակել
         * high_risk → AI risk score-ը բարձր է, սահմանափակված է
         */

        kycStatus: {
            type: DataTypes.ENUM('none', 'pending', 'approved', 'rejected', 'high_risk'),
            defaultValue: 'none',
        },
        kycVerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "When KYC was approved",
        },
        kycRiskScore: {
            type: DataTypes.FLOAT,
            allowNull: true,
            comment: "0.0-1.0 - AI-generated risk score. Higher = more risk."
        },
        kycRejectionReason: {
            type: DataTypes.FLOAT,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['email'] },
            { fields: ['isActive'] },
            { fields: ['kycStatus'] },
            { fields: ['role'] },
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },

            afterCreate: async (user) => {
                const { initializeUserSettings } = await import('../../utils/settings.initializer.js');

                await initializeUserSettings(user.id, user.role);
            },

            beforeUpdate: async (user) => {
                if (user.changed('password') && user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
        },
    }
);

export default User;