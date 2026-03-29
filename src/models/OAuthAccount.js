import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';

class OAuthAccount extends Model {}

OAuthAccount.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        provider: {
            type: DataTypes.ENUM('google', 'apple'),
            allowNull: false,
        },
        providerId: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        providerEmail: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'OAuthAccount',
        tableName: 'oauth_accounts',
        timestamps: true,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['provider', 'providerId'] },
            { fields: ['userId'] },
        ],
    }
);

export default OAuthAccount;