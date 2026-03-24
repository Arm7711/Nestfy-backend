import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';

class Listing extends Model {}

Listing.init({
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    agentId: { type: DataTypes.INTEGER, allowNull: false, references: { model: 'agents', key: 'id' }, onDelete: 'CASCADE' },
    title: { type: DataTypes.STRING, allowNull: false, validate: { len: [5, 200] } },
    slug: { type: DataTypes.STRING, allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    type: { type: DataTypes.ENUM('sale', 'rent'), allowNull: false },
    category: { type: DataTypes.ENUM('apartment', 'house', 'commercial', 'land', 'office'), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0 } },
    currency: { type: DataTypes.ENUM('USD', 'AMD'), defaultValue: 'USD' },
    city: { type: DataTypes.STRING, allowNull: false },
    district: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, allowNull: true },
    lat: { type: DataTypes.DECIMAL(10, 8), allowNull: true },
    lng: { type: DataTypes.DECIMAL(11, 8), allowNull: true },
    rooms: { type: DataTypes.INTEGER, allowNull: true },
    floor: { type: DataTypes.INTEGER, allowNull: true },
    totalFloors: { type: DataTypes.INTEGER, allowNull: true },
    area: { type: DataTypes.DECIMAL(8, 2), allowNull: true },
    buildYear: { type: DataTypes.INTEGER, allowNull: true },
    amenities: { type: DataTypes.JSON, allowNull: true, defaultValue: [] },
    status: { type: DataTypes.ENUM('pending', 'active', 'rejected', 'sold', 'rented', 'deleted'), defaultValue: 'pending' },
    isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
    featuredUntil: { type: DataTypes.DATE, allowNull: true },
    views: { type: DataTypes.INTEGER, defaultValue: 0 },
    rejectionReason: { type: DataTypes.TEXT, allowNull: true },
}, {
    sequelize, modelName: 'Listing', tableName: 'listings', timestamps: true,
});

export default Listing;