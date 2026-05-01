import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import User from './User.js';

class Agent extends Model {}

Agent.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },

        userId: {
            type: DataTypes.UUID,
            allowNull: false,
            unique: true,
            references: { model: 'users', key: 'id' },
            onDelete: 'CASCADE',
        },

        licenseNumber: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },

        licenseFile: {
            type: DataTypes.STRING(500),
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


        plan: {
            type: DataTypes.ENUM('basic', 'pro', 'premium'),
            defaultValue: 'basic',
        },

        planExpiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
        },

        paypalSubscriptionId: {
            type: DataTypes.STRING,
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

        rating: {
            type: DataTypes.FLOAT,
            defaultValue: 0.0,
            validate: {
                min: 0,
                max: 5,
            },
        },

        reviewsCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
    },
    {
        sequelize,
        modelName: 'Agent',
        tableName: 'agents',
        timestamps: true,
    }
);

Agent.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(Agent, { foreignKey: 'userId', as: 'agent' });

export default Agent;