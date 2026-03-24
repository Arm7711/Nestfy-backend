import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import sequelize from '../config/db.sequelize.js';

class User extends Model {

    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    async comparePassword(candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
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
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                notEmpty: { msg: 'Անունը պարտադիր է' },
                len: { args: [2, 50], msg: 'Անունը պետք է լինի 2-50 նիշ' },
            },
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: { msg: 'Այս email-ը արդեն գրանցված է' },
            validate: {
                isEmail: { msg: 'Email-ը ճիշտ չէ' },
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: true,
            validate: {
                len: { args: [8, 100], msg: 'Գաղտնաբառը պետք է լինի min 8 նիշ' },
            },
        },
        role: {
            type: DataTypes.ENUM('user', 'agent', 'admin', 'superadmin'),
            defaultValue: 'user',
        },
        avatar: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
        },
        isActive: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },

        provider: {
            type: DataTypes.ENUM('email', 'google', 'apple'),
            defaultValue: 'email',
        },

        googleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
        appleId: {
            type: DataTypes.STRING,
            allowNull: true,
            unique: true,
        },
    },
    {
        sequelize,
        modelName: 'User',
        tableName: 'users',
        timestamps: true,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await User.hashPassword(user.password);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password') && user.password) {
                    user.password = await User.hashPassword(user.password);
                }
            },
        },
    }
);

export default User;