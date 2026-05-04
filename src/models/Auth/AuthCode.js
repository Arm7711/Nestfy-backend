import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';

class AuthCode extends Model {}

AuthCode.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            validate: { isEmail: true },
        },
        codeHash: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        isUsed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        attempts: {
            type: DataTypes.TINYINT.UNSIGNED,
            defaultValue: 0,
        },
        ipAddress: {
            type: DataTypes.STRING(45),
            allowNull: true,
        },
    },
    {
        sequelize,
        modelName: 'AuthCode',
        tableName: 'auth_codes',
        timestamps: true,
        updatedAt: false,
        indexes: [
            { fields: ['email'] },
            { fields: ['expiresAt'] },
        ],
    }
);

export default AuthCode;