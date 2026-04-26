import { DataTypes, Model, Op } from 'sequelize';
import sequelize from "../config/db.sequelize.js";
import User from './User.js';


/**
 * UserProfile — personal information table
 *
 * Why separate from User?
 * The User table is used for authentication (email, password, role).
 * The Profile table is used for display/personal data.
 * Authentication queries do NOT include profile fields, improving performance.
 *
 * Merge logic:
 * Model 1 — agent/professional fields, social links, stats, media
 * Model 2 — basic personal info, DTOs, language, timezone
 *
 * Conflict:
 * displayName (Model 1) vs fullName (Model 2) → both are kept
 * displayName = public-facing name (can differ from User.name)
 * fullName    = real/legal name (e.g. passport-based)
 */
class UserProfile extends Model {

    /**
     * toPublicDTO — safe format for public profile
     *
     * Privacy settings are checked separately before mapping data.
     * Only safe and non-sensitive fields are returned.
     */
    toPublicDTO() {
        return {
            id:                this.id,
            preferredFirstName:       this.preferredFirstName,
            username:          this.username,
            bio:               this.bio,
            avatar:            this.avatar,
            coverPhoto:        this.coverPhoto,
            country:           this.country,
            city:              this.city,
            language:          this.language,
            specializations:   this.specializations,
            yearsOfExperience: this.yearsOfExperience,
            languages:         this.languages,
            isAvailable:       this.isAvailable,
            responseTime:      this.responseTime,
            social: {
                facebook:  this.facebook,
                instagram: this.instagram,
                telegram:  this.telegram,
                linkedin:  this.linkedin,
                website:   this.website,
            },
            stats: {
                totalReviews:  this.totalReviews,
                averageRating: this.averageRating,
                profileViews:  this.profileViews,
                responseRate:  this.responseRate,
            },
            createdAt: this.createdAt,
        };
    }

    /**
     * toPrivateDTO — full format for profile owner only
     *
     * Includes sensitive fields that are not exposed publicly:
     * - phone
     * - timezone
     * - verified status
     * - portfolio
     */
    toPrivateDTO() {
        return {
            ...this.toPublicDTO(),
            fullName:    this.fullName,
            phone:       this.phone,
            gender:      this.gender,
            dateOfBirth: this.dateOfBirth,
            state:       this.state,
            timezone:    this.timezone,
            verified: {
                phone: !!this.phoneVerifiedAt,
                govId: !!this.govIdVerifiedAt,
            },
            professional: {
                certifications: this.certifications,
                workingHours:   this.workingHours,
                preferredContact: this.preferredContact,
            },
            media: {
                introVideo:      this.introVideo,
                portfolioImages: this.portfolioImages,
            },
            updatedAt: this.updatedAt,
        };
    }
}

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

        //  1. Basic Personal Inf
        preferredFirstName: {
            type:      DataTypes.STRING(100),
            allowNull: true,
            comment:   'Public display name — may differ from fullName',
        },

        fullName: {
            type:      DataTypes.STRING(100),
            allowNull: true,
            validate: {
                len: { args: [2, 100], msg: 'Full name must be 2–100 characters.' },
            },
            comment: 'Legal full name — private, for verification only',
        },
        username: {
            type:      DataTypes.STRING(50),
            allowNull: true,
            unique:    true,
            validate: {
                is:  {
                    args: /^[a-zA-Z0-9_]+$/,
                    msg: 'Username can only contain letters, numbers, underscores.',
                },
                len: { args: [3, 50], msg: 'Username must be 3–50 characters.' },
            },
            comment: 'Unique handle — @username',
        },
        phone: {
            type:      DataTypes.STRING(25),
            allowNull: true,
            validate: {
                is: {
                    args: /^\+?[\d\s\-()]{7,20}$/,
                    msg: 'Invalid phone format.',
                },
            },
        },
        bio: {
            type:      DataTypes.TEXT,
            allowNull: true,
            validate: {
                len: { args: [0, 500], msg: 'Bio max 500 characters.' },
            },
            comment: '1–2 lines self-introduction',
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

        // 2. Avatar & Cover
        avatar: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — profile photo',
        },
        coverPhoto: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — cover/banner image',
        },

        //  3. Location
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

        // 4. Locale
        language: {
            type:         DataTypes.STRING(10),
            defaultValue: 'en',
            comment:      'ISO 639-1 language code e.g. hy, en, ru',
        },
        timezone: {
            type:         DataTypes.STRING(60),
            defaultValue: 'Asia/Yerevan',
            comment:      'IANA timezone string',
        },

        // 5. Verified Badges
        phoneVerifiedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'NULL = not verified',
        },
        govIdVerifiedAt: {
            type:      DataTypes.DATE,
            allowNull: true,
            comment:   'Government ID verification timestamp',
        },
        govIdFile: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary URL — passport or ID card scan',
        },

        // 6. Professional Info
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
            comment:      '["Armenian","English","Russian"] — spoken languages',
        },

        //  7. Media / Portfolio
        introVideo: {
            type:      DataTypes.STRING(500),
            allowNull: true,
            comment:   'Cloudinary or YouTube URL',
        },
        portfolioImages: {
            type:         DataTypes.JSON,
            allowNull:    true,
            defaultValue: [],
            comment:      '["url1","url2",...] — max 10 Cloudinary URLs',
        },

        // 8. Availability & Communication
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
            comment:      'Agent is currently accepting requests — ON/OFF toggle',
        },

        // 9. Social Links
        facebook:  { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        instagram: { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        telegram:  { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        linkedin:  { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },
        website:   { type: DataTypes.STRING(300), allowNull: true, defaultValue: null },

        // 10. Stats (computed, auto-updated)
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
            comment:      'How many times the profile was viewed',
        },
        responseRate: {
            type:         DataTypes.FLOAT,
            allowNull:    true,
            defaultValue: null,
            comment:      '0–100% — % of inquiries responded to',
        },
    },
    {
        sequelize,
        modelName: 'UserProfile',
        tableName: 'user_profiles',
        timestamps: true,
        indexes: [
            { unique: true,  fields: ['userId'] },
            {
                unique: true,
                fields: ['username'],
                where:  { username: { [Op.ne]: null } }, // NULL-nery unique chi count-um
            },
            { fields: ['city'] },
            { fields: ['country'] },
            { fields: ['isAvailable'] },
            { fields: ['averageRating'] },
        ],
    }
);

UserProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasOne(UserProfile, { foreignKey: 'userId', as: 'profile' });

export default UserProfile;