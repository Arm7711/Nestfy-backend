import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db.sequelize.js";
import User from "./User.js";
import Agent from "./Agent.js";
import Agency from "./Agency.js";

/**
 * Listing — platform-ի core entity
 *
 * Ownership hierarchy:
 * Listing-ը կարող է պատկանել միայն մեկին՝
 * կամ user-ին, կամ agent-ին, կամ agency-ին
 * Մեկից ավելի owner չի թույլատրվում — constraint-ով վերահսկվում է
 *
 * Publishing rules:
 * 1. Owner-ի KYC-ը պետք է լինի approved
 * 2. Agent/Agency-ի status-ը պետք է լինի approved
 * 3. Plan limit-ը պետք է ստուգվի
 * 4. Status՝ 'pending' → admin approve → 'published'
 *
 * Media rules:
 * VIDEO խստիվ արգելված է
 * Միայն images — պահվում են ListingImage table-ում
 */

class Listing extends Model {
    /**
     * getOwnerType — ով է owner-ը (սեփականատերը)
     * Օգտագործվում է listing service-ում
     */

    getOwnerType() {
        if(this.agencyId) return 'agency';
        if(this.agentId) return 'agent';
        return 'user'
    }

    /**
     * isPublishable — կարո՞ղ է publish լինել
     * Միայն status = 'approved' դեպքում է վերադարձնում true
     */

    isPublishable() {
        return this.status === "approved";
    }
}


Listing.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        // ── Ownership — միայն մեկին պետք է պատկանի ──────
        /**
         * userId, agentId, agencyId — բացառիկ ownership
         * Ստուգումը service layer-ում է enforce արվում
         * Մեկից ավելը պետք է լինի NULL
         */

        userId: {
            type: DataTypes.UUID,
            allowNull: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
            comment: "Direct user owner (not agent/agency)",
        },
        agentId: {
            type:       DataTypes.INTEGER,
            allowNull:  true,
            references: { model: 'agents', key: 'id' },
            onDelete:   'SET NULL',
            comment:    'Agent owner',
        },
        agencyId: {
            type:       DataTypes.INTEGER,
            allowNull:  true,
            references: { model: 'agency', key: 'id' },
            onDelete:   'SET NULL',
            comment:    'Agency owner',
        },
        //Core Info
        title: {
            type: DataTypes.STRING(200),
            allowNull: false,
            unique: true,
            comment: "URL-friendly unique identifier",
        },

        slug: {
            type:      DataTypes.STRING(250),
            allowNull: false,
            unique:    true,
            comment:   'URL-friendly unique identifier',
        },

        description: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        price: {
            type: DataTypes.DECIMAL(14, 2),
            allowNull: false,
            validate: { min: 0 },
        },

        currency: {
            type: DataTypes.ENUM('USD', 'AMD', 'EUR', 'RUB'),
            defaultValue: 'USD',
        },

        //Property Type

        propertyType: {
            type: DataTypes.ENUM(
                'apartment', 'house', 'villa', 'commercial', 'land', 'office', 'garage'
            ),
            allowNull: false,
        },

        listingType: {
            type: DataTypes.ENUM('sale', 'rent', 'daily_rent'),
            allowNull: false,
        },

        //Location

        country: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        city: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },

        district: {
            type: DataTypes.STRING(100),
            allowNull: true,
        },

        address: {
            type: DataTypes.STRING(300),
            allowNull: true,
        },

        lat: {
            type: DataTypes.DECIMAL(10, 8),
            allowNull: true,
        },

        lng: {
            type: DataTypes.DECIMAL(11, 8),
            allowNull: true,
        },

        //Property Details

        rooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        bedrooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        bathrooms: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        floor: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        totalFloors: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        area: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true,
            comment: "Square maters",
        },

        buildYear: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },

        amenities: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: [],
            comment:      '["balcony","parking","elevator","pool"]',
        },

        //Status & Publishing

        /**
         * status flow:
         * draft → pending → approved → published
         *                → rejected
         * published → archived
         *
         * Ինչու՞ 'pending'
         * Admin-ը պետք է approve անի մինչև publish
         * Trust-based marketplace-ում auto-publish չի լինում
         */

        status: {
            type:         DataTypes.ENUM(
                'draft',      //  Ստեղծված է, բայց submit չի արվել
                'pending',          //   Submit է արված, սպասում է admin-ի approve-ին
                'approved',         //   Admin-ը approve է արել, պատրաստ է publish-ի
                'published',        //   Live է, բոլորը կարող են տեսնել
                'rejected',         //    Admin-ը մերժել է
                'archived',         //   Owner-ы archive-el
                'deleted'           //    Soft delete (համակարգից թաքցված է)
            ),
            defaultValue: 'draft',
        },

        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        publishedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            comment: "Listing auto-archive data",
        },

        //Trust Signals

        /**
         * isOwnerVerified — սեփականատիրոջ KYC-ը approved է՞
         * Denormalized է՝ արագ read-ի համար
         * Թարմացվում է KYC approve լինելու պահին
         */

        isOwnerVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "Snapshot of owner KYC status at publish time",
        },

        ownerRiskScore: {
            type:      DataTypes.FLOAT,
            allowNull: true,
            comment:   'Snapshot of KYC risk score at publish time',
        },

        //Engagement Stats

        viewCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        favoriteCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        commentCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        //Ranking

        /**
         * featuredUntil — վճարովի boost-ի ավարտի ժամկետ
         * isFeatured — ցույց է տալիս՝ listing-ը search-ում TOP-ում է, թե ոչ
         */

        isFeatured: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        featuredUntil: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        rankScore: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
            comment: "Computed score - views + favorites + recency + featured"
        },
    },
    {
        sequelize,
        modelName: "Listing",
        tableName: "listings",
        timestamps: false,
        indexes: [
            { fields: ['userId'] },
            { fields: ['agentId'] },
            { fields: ['agencyId'] },
            { unique: true, fields: ['slug'] },
            { fields: ['status'] },
            { fields: ['city'] },
            { fields: ['propertyType'] },
            { fields: ['listingType'] },
            { fields: ['price'] },
            { fields: ['isFeatured'] },
            { fields: ['rankScore'] },
            { fields: ['publishedAt'] },

            //Composite for search query

            { fields: ['status', 'city', 'propertyType'] },
            { fields: ['status', 'listingType', 'price'] },
        ],
    }
);

Listing.belongsTo(User,   { foreignKey: 'userId',   as: 'user' });
Listing.belongsTo(Agent,  { foreignKey: 'agentId',  as: 'agent' });
Listing.belongsTo(Agency, { foreignKey: 'agencyId', as: 'agency' });

User.hasMany(Listing,   { foreignKey: 'userId',   as: 'listings' });
Agent.hasMany(Listing,  { foreignKey: 'agentId',  as: 'listings' });
Agency.hasMany(Listing, { foreignKey: 'agencyId', as: 'listings' });

export default Listing;