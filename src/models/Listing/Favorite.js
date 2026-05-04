import {DataTypes, Model} from "sequelize";
import sequelize from "../../config/db.sequelize.js";
import User from "../Auth/User.js";
import Listings from "./Listings.js";


class Favorite extends Model {}
/**
 * Favorite — wishlist / save listing
 * Պարզ junction table — user-ը պահում է listing-ը
 * Toggle logic: findOrCreate → կամ destroy
 */

Favorite.init(
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
            onDelete: 'CASCADE',
        },

        listingId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: { model: 'listings', key: 'id' },
            onDelete: 'CASCADE',
        },
    },
    {
        sequelize,
        modelName: "Favorite",
        tableName: "favorites",
        timestamps: true,
        updatedAt: false,
        indexes: [
            {
                unique: true,
                fields: ['userId', 'listingId'],
                name: 'unique_user_favorite',
            },
            { fields: ['userId'] },
            { fields: ['listingId'] },
        ],
    }
);

Favorite.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Favorite.belongsTo(Listings, { foreignKey: 'listingId', as: 'listing' });
User.hasMany(Favorite, { foreignKey: 'userId', as: 'favorites' });
Listings.hasMany(Favorite, { foreignKey: 'listingId', as: 'favoriteBy' });

export default Favorite;