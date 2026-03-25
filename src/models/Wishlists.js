import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';

class Wishlists extends Model {}

Wishlists.init({
    id: {
        type: DataTypes.BIGINT,
        primaryKey: true,
        autoIncrement: true,
    },

    userId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'User',
            key: 'userId',
        }
    },
    listingId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
            model: 'Listing',
            key: 'listingId',
        }
    }
}, {
    sequelize,
    modelName: 'Wishlists',
    tableName: 'wishlists',
    timestamps: true,
})
