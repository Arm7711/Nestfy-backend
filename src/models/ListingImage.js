import {DataTypes, Model} from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import Listing from "./Listings.js";

/**
 * ListingImage — listing-ի նկարները
 *
 * VIDEO չկա — service validator-ը այ նստուգում է
 * mimetype-ը ստուգում է, և video/* լինելու դեպքում վերադարձնում է 400
 *
 * Image optimization pipeline:
 * Upload → Sharp resize → ստեղծվում են 3 չափեր → Cloudinary
 * thumbnail: 400x300   (card-ների համար)
 * medium:    800x600   (gallery preview)
 * full:      1920x1440 (fullscreen lightbox)
 */

class ListingImage extends Model {
    /**
     * getResponsiveUrls — 3 չափի URL-ները
     * Օգտագործվում է frontend-ի srcset-ի համար
     */

    getResponsiveUrls() {
        return {
            thumbnail: this.thumbnailUrl,
            medium: this.mediumUrl,
            full: this.fullUrl,
        };
    }
}

ListingImage.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'listings', key: 'id' },
        },

        //Cloudinary URLs — 3 responsive sizes
        /**
         * Ինչու՞ 3 առանձին field, ոչ թե մեկ URL + transform
         * CDN edge-ում նախապես ստեղծված են — ավելի արագ delivery-ի համար
         * Cloudinary real-time transform-ը ավելի դանդաղ է աշխատում
         */

        thumbnailUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: "400*300 = listing card thumbnail",
        },

        mediumUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: "800*600 - gallery preview",
        },

        fullUrl: {
            type: DataTypes.STRING(500),
            allowNull: false,
            comment: "1920*1440 - fullscreen lightbox"
        },

        //Cloudinary metadata

        cloudinaryPublicId: {
            type: DataTypes.STRING(300),
            allowNull: false,
            comment: "For deletion from Cloudinary",
        },

        originalFilename: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },

        fileSize: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Original file size in bytes",
        },

        mimeType: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: "Most be images/* - video/* is required",
        },

        width: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Original image width",
        },

        height: {
            type: DataTypes.INTEGER,
            allowNull: true,
            comment: "Original image height",
        },

        //Display

        isPrimary: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            comment: "Primary image - shown on listing card",
        },

        orderIndex: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
            comment: "display order - drag & drop reorder"
        },

        altText: {
            type: DataTypes.STRING(100),
            allowNull: true,
            comment: 'SEO + accessibility alt text'
        }
    },
    {
        sequelize,
        modelName: 'ListingImage',
        tableName: 'listing_image',
        timestamps: true,
        indexes: [
            { fields: ['listingId'] },
            { fields: ['listingId', 'isPrimary'] },
            { fields: ['listingId', 'orderIndex'] },
        ]
});

ListingImage.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });
Listing.hasMany(ListingImage, { foreignKey: 'listingId', as: 'images' });


export default ListingImage;