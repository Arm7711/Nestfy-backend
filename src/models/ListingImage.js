import {DataTypes, Model} from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import Agent from "./Agent.js";
import Listing from "./Listings.js";

class ListingImage extends Model {
}

ListingImage.init({
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    listingId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {model: 'listings', key: 'id'},
        onDelete: 'CASCADE'
    },
    imageUrl: {type: DataTypes.STRING, allowNull: false},
    publicId: {type: DataTypes.STRING, allowNull: true},
    isPrimary: {type: DataTypes.BOOLEAN, defaultValue: false},
    orderIndex: {type: DataTypes.INTEGER, defaultValue: 0},
}, {
    sequelize, modelName: 'ListingImage', tableName: 'listing_images', timestamps: false,
});

ListingImage.belongsTo(Listing, { foreignKey: 'agentId', as: 'agent' });
Listing.hasMany(ListingImage, { foreignKey: 'agentId', as: 'listings' });

export default ListingImage;