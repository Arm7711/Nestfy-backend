import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import User from './User.js';

class Agent extends Model {
    /**
     * getListingLimit — պլանից ստացվող limit
     * DB-ում չի պահվում — service-ում հաշվարկվում է
     * Ինչու՞ Եթե plan-ը փոխվի, limit-ն էլ ավտոմատ կփոխվի
     */

    getListingLimit() {
        const LIMITS = {
            basic: 5,
            pro: 20,
            premium: Infinity,
        };
        return LIMITS[this.plan] ?? 5
    }

    /**
     * canCreateListing — կարո՞ղ է listing ստեղծել
     * Ստուգվում է plan limit-ը և KYC-ը
     * Այս method-ը կանչվում է service-ում
     */

    canCreateListing(currentListingCount, userKycStatus) {
        if(userKycStatus !== 'approved') return false;
        if(this.status === 'approved') return false;

        return currentListingCount < this.getListingLimit();
    }
}

Agent.init(
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
        },

        /**
         * agencyId — agent-ի agency-ին պատկանելը
         * NULL = անկախ agent
         * NOT NULL = agency-ի անդամ
         * Ինչու՞ nullable է — բոլոր agent-ները agency-ում չեն աշխատում
         */

        agencyId: {
            type:       DataTypes.INTEGER,
            allowNull:  true,
            defaultValue: null,
            references: { model: 'agency', key: 'id' },
            onDelete:   'SET NULL',
            comment:    'NULL = independent agent, NOT NULL = agency member',
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

        //Subscription Plan

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

        //Stats
        totalListings: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
        totalViews: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
        rating: {
            type:         DataTypes.FLOAT,
            defaultValue: 0.0,
            validate:     { min: 0, max: 5 },
        },
        reviewsCount: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'Agent',
        tableName:  'agents',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
            { fields: ['agencyId'] },
            { fields: ['status'] },
            { fields: ['plan'] },
        ],
    }
);

Agent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Agent, { foreignKey: 'userId', as: 'agent' });

export default Agent;