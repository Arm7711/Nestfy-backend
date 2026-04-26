import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import User from './User.js';

class Agency extends Model {
    getListingLimit() {
        const LIMITS = { basic: 20, pro: 100, premium: Infinity };
        return LIMITS[this.plan] ?? 20;
    }
}

Agency.init(
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
        },
        userId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            unique:     true,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
            comment:    'Agency owner/director userId',
        },

        name: {
            type:      DataTypes.STRING(200),
            allowNull: false,
        },
        bio: {
            type:      DataTypes.TEXT,
            allowNull: true,
        },
        city: {
            type:      DataTypes.STRING(100),
            allowNull: true,
        },
        logo: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — agency logo',
        },

        licenseNumber: {
            type:      DataTypes.STRING,
            allowNull: true,
            unique:    true,
        },
        licenseFile: {
            type:      DataTypes.STRING(500),
            allowNull: true,
        },
        isVerified: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        status: {
            type:         DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
            defaultValue: 'pending',
        },
        rejectionReason: {
            type:      DataTypes.TEXT,
            allowNull: true,
        },

        // ── Subscription ──────────────────────────────────
        /**
         * Agency-ы el plan unim e — бaytс limits aveli mec en
         * Agency plan-ы BOLOR agents-i listing-nery e cover-um
         * или individual agent plans-ery el kan — business decision
         */
        plan: {
            type:         DataTypes.ENUM('basic', 'pro', 'premium'),
            defaultValue: 'basic',
        },
        planExpiresAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },
        paypalSubscriptionId: {
            type:      DataTypes.STRING,
            allowNull: true,
        },

        // ── Stats ─────────────────────────────────────────
        totalListings: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
        totalViews: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
        agentCount: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
            comment:      'Active agents count — auto-updated',
        },
    },
    {
        sequelize,
        modelName: 'Agency',
        tableName:  'agency',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
            { fields: ['status'] },
            { fields: ['plan'] },
        ],
    }
);

Agency.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Agency, { foreignKey: 'userId', as: 'agency' });

export default Agency;