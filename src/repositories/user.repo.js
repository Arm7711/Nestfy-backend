import User from '../models/Auth/User.js';
import Agent from "../models/Agency/Agent.js";
import Agency from "../models/Agency/Agency.js";
import UserProfile from "../models/Auth/UserProfiles.js";


export const findByEmail = (email) =>
    User.findOne({ where: { email: email.toLowerCase().trim() } });

export const findById = (id) => User.findByPk(id);

export const existsByEmail = async (email) => !!(await findByEmail(email));

export const createUser = (data) => User.create(data);

export const updateUser = (id, data) =>
    User.update(data, { where: { id } });

export const findByWithProfile = (id) =>
    User.findByPk(id, {
        attributes: [
            'id', 'name', 'email', 'role',
            'avatar', 'isActive', 'emailVerifiedAt', 'createdAt',
        ],

        include: [
            {
                model: UserProfile,
                as: 'profile',
                required: false,
                attributes: [
                    'id', 'preferredFirstName', 'phone', 'bio',
                    'country', 'city', 'state',
                    'phoneVerifiedAt', 'govIdVerifiedAt',
                    'specializations', 'yearsOfExperience', 'languages',
                    'coverPhoto', 'introVideo', 'portfolioImages',
                    'workingHours', 'responseTime', 'preferredContact', 'isAvailable',
                    'facebook', 'instagram', 'telegram', 'linkedin', 'website',
                    'totalReviews', 'averageRating', 'profileViews', 'responseRate',
                ],
            },
            {
                model: Agent,
                as: 'agent',
                required: false,
                attributes: [
                    'id', 'status', 'isVerified', 'plan',
                    'planExpiresAt', 'licenseNumber',
                    'totalListings', 'totalViews',
                    'rating', 'reviewsCount',
                ],
            },
            {
                model: Agency,
                as: 'agency',
                required: false,
                attributes: [
                    'id', 'name', 'status', 'isVerified',
                    'totalListings', 'totalViews',
                ],
            },
        ],
    });