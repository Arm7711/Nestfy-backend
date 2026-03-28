import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';

class Session extends Model {}

Session.init(
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
        jti: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
        },
        refreshTokenHash: {
            type: DataTypes.CHAR(64),
            allowNull: false,
        },
        userAgent: {
            type: DataTypes.STRING(500),
            allowNull: true,
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isRevoked: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        revokedAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'Session',
        tableName: 'sessions',
        timestamps: true,
        updatedAt: false,
        indexes: [
            { unique: true, fields: ['jti'] },
            { fields: ['userId'] },
            { fields: ['isRevoked'] },
            { fields: ['expiresAt'] },
        ],
    }
);

export default Session;