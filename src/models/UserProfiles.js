import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db.sequelize.js';
import User from './User.js';

class UserProfile extends Model {}

UserProfile.init(
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


        displayName: {
            type:      DataTypes.STRING(100),
            allowNull: true,
            comment:   'Display name — may be different from User.name',
        },
        phone: {
            type:      DataTypes.STRING(20),
            allowNull: true,
        },
        bio: {
            type:      DataTypes.TEXT,
            allowNull: true,
            comment:   '1–2 lines of self-introduction',
        },
        gender: {
            type:         DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
            allowNull:    true,
            defaultValue: null,
        },
        dateOfBirth: {
            type:      DataTypes.DATEONLY,
            allowNull: true,
        },


        country: {
            type:      DataTypes.STRING(100),
            allowNull: true,
        },
        city: {
            type:      DataTypes.STRING(100),
            allowNull: true,
        },
        state: {
            type:      DataTypes.STRING(100),
            allowNull: true,
        },
        lat: {
            type:      DataTypes.DECIMAL(10, 8),
            allowNull: true,
        },
        lng: {
            type:      DataTypes.DECIMAL(11, 8),
            allowNull: true,
        },


        phoneVerifiedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'NULL = not verified',
        },
        govIdVerifiedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'Government ID verification',
        },
        govIdFile: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — passport or ID card',
        },


        specializations: {
            type:         DataTypes.JSON,
            allowNull:    true,
            defaultValue: [],
            comment:      '["apartment","villa","office","land"]',
        },
        yearsOfExperience: {
            type:         DataTypes.INTEGER,
            allowNull:    true,
            defaultValue: 0,
        },
        certifications: {
            type:         DataTypes.JSON,
            allowNull:    true,
            defaultValue: [],
            comment:      '[{name:"...", file:"cloudinary_url", year:2022}]',
        },
        languages: {
            type:         DataTypes.JSON,
            allowNull:    true,
            defaultValue: [],
            comment:      '["Armenian","English","Russian"]',
        },


        coverPhoto: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — cover/banner image',
        },
        introVideo: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary or YouTube URL',
        },
        portfolioImages: {
            type:         DataTypes.JSON,
            allowNull:    true,
            defaultValue: [],
            comment:      '["url1","url2",...] — max 10',
        },


        workingHours: {
            type:      DataTypes.JSON,
            allowNull: true,
            comment:   '{mon:"09:00-18:00", tue:"09:00-18:00", ...}',
        },
        responseTime: {
            type:         DataTypes.ENUM('within_hour', 'within_day', 'within_week'),
            allowNull:    true,
            defaultValue: null,
        },
        preferredContact: {
            type:         DataTypes.ENUM('email', 'phone', 'app_message'),
            allowNull:    true,
            defaultValue: 'app_message',
        },
        isAvailable: {
            type:         DataTypes.BOOLEAN,
            defaultValue: true,
            comment:      'Indicates if the agent is currently accepting requests (ON/OFF toggle)',
        },


        facebook:  { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        instagram: { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        telegram:  { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        linkedin:  { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        website:   { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },


        totalReviews: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
        },
        averageRating: {
            type:         DataTypes.FLOAT,
            defaultValue: 0.0,
            validate:     { min: 0, max: 5 },
        },
        profileViews: {
            type:         DataTypes.INTEGER,
            defaultValue: 0,
            comment:      'How many times did they open the profile',
        },
        responseRate: {
            type:         DataTypes.FLOAT,
            allowNull:    true,
            defaultValue: null,
            comment:      '0-100% — Percentage of inquiries the agent has responded to',
        },
    },
    {
        sequelize,
        modelName: 'UserProfile',
        tableName: 'user_profiles',
        timestamps: true,
        indexes: [
            { unique: true, fields: ['userId'] },
            { fields: ['city'] },
            { fields: ['country'] },
            { fields: ['isAvailable'] },
        ],
    }
);

UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });

export default UserProfile;