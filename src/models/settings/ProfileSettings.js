import {DataTypes, Model} from 'sequelize';
import sequelize from "../../config/db.sequelize.js";

class ProfileSettings extends Model {}

ProfileSettings.init(
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

        role: {
            type:      DataTypes.ENUM('user', 'agent', 'agency'),
            allowNull: false,
        },
    },
    {
        sequelize,
        modelName: 'ProfileSettings',
        tableName: 'profile_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
        ]
    }
)

export default ProfileSettings;