import { DataTypes, Model } from 'sequelize';
import sequelize from '../../config/db.sequelize.js';
import User from '../Auth/User.js';

/**
 * UserPaymentSettings — PayPal only
 * Why only PayPal?
 * The platform currently supports only PayPal.
 * Future: Stripe can be added without breaking changes.
 * paypalEmail is stored encrypted — sensitive data.
 */

class UserPaymentSettings extends Model {
    /**
     * toSafeDTO — masked payment info
     * In the frontend, the full PayPal email is NOT exposed.
     * Only a masked version is returned — e.g. arjunaky@*****.com
     */
    toSafeDTO() {
        const masked = this.paypalEmail
            ? this.paypalEmail.replace(/(?<=.{3}).(?=[^@]*@)/g, '*')
            : null;

        return {
            id:                 this.id,
            paypalConnected:    this.paypalConnected,
            paypalEmail:        masked,
            defaultCurrency:    this.defaultCurrency,
            payoutEmail:        this.payoutEmail
                ? this.payoutEmail.replace(/(?<=.{3}).(?=[^@]*@)/g, '*')
                : null,
            autoPayoutEnabled:  this.autoPayoutEnabled,
            paymentStatus:      this.paymentStatus,
            connectedAt:        this.connectedAt,
        };
    }
}

UserPaymentSettings.init(
    {
        id: {
            type:          DataTypes.INTEGER,
            primaryKey:    true,
            autoIncrement: true,
        },
        userId: {
            type:       DataTypes.UUID,
            allowNull:  false,
            unique:     true,
            references: { model: 'users', key: 'id' },
            onDelete:   'CASCADE',
        },

        // PayPal Connection
        paypalConnected: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        paypalEmail: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            comment:   'PayPal account email — store encrypted',
        },
        paypalAccountId: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            comment:   'PayPal Merchant ID — from OAuth',
        },
        paypalAccessToken: {
            type:      DataTypes.TEXT,
            allowNull: true,
            comment:   'Encrypted OAuth access token',
        },
        paypalRefreshToken: {
            type:      DataTypes.TEXT,
            allowNull: true,
            comment:   'Encrypted OAuth refresh token',
        },
        connectedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },
        disconnectedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },

        //Currency & Payout
        defaultCurrency: {
            type:         DataTypes.ENUM('USD', 'EUR', 'AMD', 'RUB', 'GBP'),
            defaultValue: 'USD',
        },
        payoutEmail: {
            type:      DataTypes.STRING(255),
            allowNull: true,
            comment:   'Separate payout email — can differ from PayPal login',
        },
        autoPayoutEnabled: {
            type:         DataTypes.BOOLEAN,
            defaultValue: false,
        },
        payoutThreshold: {
            type:         DataTypes.DECIMAL(10, 2),
            defaultValue: 50.00,
            comment:      'Minimum balance before auto payout',
        },

        // Status
        paymentStatus: {
            type:         DataTypes.ENUM('active', 'pending', 'suspended', 'not_connected'),
            defaultValue: 'not_connected',
        },
        lastPaymentAt: {
            type:      DataTypes.DATE,
            allowNull: true,
        },
        totalEarnings: {
            type:         DataTypes.DECIMAL(12, 2),
            defaultValue: 0.00,
        },
    },
    {
        sequelize,
        modelName: 'UserPaymentSettings',
        tableName: 'user_payment_settings',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
            { fields: ['paypalConnected'] },
            { fields: ['paymentStatus'] },
        ],
    }
);

UserPaymentSettings.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserPaymentSettings, { foreignKey: 'userId', as: 'paymentSettings' });

export default UserPaymentSettings;