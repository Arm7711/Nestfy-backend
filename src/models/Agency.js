import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import User from './User.js';

class Agency extends Model {}

Agency.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            unique: true,
            references: {
                model: 'users',
                key: 'id',
            },
            onDelete: 'CASCADE',
        },

        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },

        bio: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        city: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        licenseNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },

        licenseFile: {
            type: DataTypes.STRING,
            allowNull: true,
        },

        isVerified: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },

        status: {
            type: DataTypes.ENUM('pending', 'approved', 'rejected', 'suspended'),
            defaultValue: 'pending',
        },

        rejectionReason: {
            type: DataTypes.TEXT,
            allowNull: true,
        },

        totalListings: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },

        totalViews: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'Agency',
        tableName: 'agencies',
        timestamps: true,
    }
);

Agency.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Agency, { foreignKey: 'userId', as: 'agency' });

export default Agency;