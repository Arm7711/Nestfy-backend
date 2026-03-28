import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.sequelize.js';

class User extends Model {
    async comparePassword(candidate) {
        if (!this.password) return false;
        return bcrypt.compare(candidate, this.password);
    }

    toJSON() {
        const values = { ...this.get() };
        delete values.password;
        return values;
    }
}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Name is required.' },
                len: { args: [2, 100], msg: 'Name must be 2–100 characters.' },
            },
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true,
            validate: { isEmail: { msg: 'Invalid email address.' } },
            set(val) {
                this.setDataValue('email', val.toLowerCase().trim());
            },
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: true,
        },
        role: {
            type: DataTypes.ENUM('user', 'agent', 'admin', 'superadmin'),
            defaultValue: 'user',
        },
        avatar: {
            type: DataTypes.STRING(500),
            allowNull: true,
            defaultValue: null,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        emailVerifiedAt: {
            type: DataTypes.DATE,
            allowNull: true,
            defaultValue: null,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['email'] },
            { fields: ['isActive'] },
        ],
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password') && user.password) {
                    user.password = await bcrypt.hash(user.password, 12);
                }
            },
        },
    }
);

export default User;