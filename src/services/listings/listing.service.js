import slugify from "slugify";
import { Op } from "sequelize";
import {
    Listings, ListingImage,
    Agent, Agency, User,
} from '../../models/Common/index.js';
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";

// Constants

const PLAN_LIMITS = {
    user:   { basic: 3,  premium: Infinity },
    agent:  { basic: 5,  pro: 20, premium: Infinity },
    agency: { basic: 20, pro: 100, premium: Infinity },
};

//  Helpers

/**
 * validateOwnership — KYC + account status check, resolve owner entity
 */
const validateOwnership = async (user) => {
    if (user.kycStatus !== 'approved') {
        throw new AppError(
            'Identity verification (KYC) required before publishing listings.',
            403,
            'KYC_NOT_APPROVED'
        );
    }

    if (!user.isActive) {
        throw new AppError('Account is suspended.', 403, 'ACCOUNT_SUSPENDED');
    }

    let ownerEntity = user;
    let plan        = user.plan ?? 'basic';
    let ownerType   = 'user';

    if (user.role === 'agent') {
        const agent = await Agent.findOne({ where: { userId: user.id } });
        if (!agent) throw new AppError('Agent profile not found.', 404, 'AGENT_NOT_FOUND');
        if (agent.status !== 'approved') {
            throw new AppError('Agent account not yet approved.', 403, 'AGENT_NOT_APPROVED');
        }
        ownerEntity = agent;
        plan        = agent.plan ?? 'basic';
        ownerType   = 'agent';
    } else if (user.role === 'agency') {
        const agency = await Agency.findOne({ where: { userId: user.id } });
        if (!agency) throw new AppError('Agency profile not found.', 404, 'AGENCY_NOT_FOUND');
        if (agency.status !== 'approved') {
            throw new AppError('Agency account not yet approved.', 403, 'AGENCY_NOT_APPROVED');
        }
        ownerEntity = agency;
        plan        = agency.plan ?? 'basic';
        ownerType   = 'agency';
    }

    return { ownerEntity, plan, ownerType };
};

const checkPlanLimit = async (ownerType, ownerEntity, userId, plan) => {
    const where = {
        status: { [Op.in]: ['draft', 'pending', 'approved', 'published'] },
    };

    if      (ownerType === 'agent')  where.agentId  = ownerEntity.id;
    else if (ownerType === 'agency') where.agencyId = ownerEntity.id;
    else                             where.userId   = userId;

    const currentCount = await Listings.count({ where });
    const limit        = PLAN_LIMITS[ownerType]?.[plan] ?? 3;

    if (currentCount >= limit) {
        throw new AppError(
            `Listing limit reached for ${plan} plan (${limit} listings). Please upgrade.`,
            403,
            'PLAN_LIMIT_REACHED'
        );
    }

    return currentCount;
};


//generateSlug — unique slug from titl

const generateSlug = async (title) => {
    const base = slugify(title, { lower: true, strict: true });
    const slug = `${base}-${Date.now()}`;

    const exists = await Listings.findOne({ where: { slug } });
    if (exists) return `${slug}-${Math.random().toString(36).slice(2, 6)}`;

    return slug;
};

//  CRUD

export const createListing = async (userId, data) => {
    const user = await User.findByPk(userId);
    if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

    const { ownerEntity, plan, ownerType } = await validateOwnership(user);

    await checkPlanLimit(ownerType, ownerEntity, userId, plan);

    const slug = await generateSlug(data.title);

    const listingData = {
        title:           data.title,
        slug,
        description:     data.description,
        price:           data.price,
        currency:        data.currency ?? 'USD',
        propertyType:    data.propertyType,
        listingType:     data.listingType,
        country:         data.country,
        city:            data.city,
        district:        data.district ?? null,
        address:         data.address  ?? null,
        lat:             data.lat      ?? null,
        lng:             data.lng      ?? null,
        rooms:           data.rooms    ?? null,
        bedrooms:        data.bedrooms ?? null,
        bathrooms:       data.bathrooms ?? null,
        floor:           data.floor    ?? null,
        totalFloors:     data.totalFloors ?? null,
        area:            data.area     ?? null,
        buildYear:       data.buildYear ?? null,
        amenities:       data.amenities ?? [],
        status:          'draft',
        isOwnerVerified: user.kycStatus === 'approved',
        ownerRiskScore:  user.kycRiskScore ?? null,
    };

    if      (ownerType === 'agency') listingData.agencyId = ownerEntity.id;
    else if (ownerType === 'agent')  listingData.agentId  = ownerEntity.id;
    else                             listingData.userId   = userId;

    const listing = await Listings.create(listingData);

    if (ownerType !== 'user') {
        await ownerEntity.increment('totalListings');
    }

    logger.info(`Listing created: ${listing.id} by ${ownerType} ${userId}`);
    return listing;
};

export const submitForPreview = async (listingId, userId) => {
    const listing = await Listings.findByPk(listingId);
    if (!listing) throw new AppError('Listing not found.', 404, 'LISTING_NOT_FOUND');


    await findListingByOwner(listingId, userId);

    if (listing.status !== 'draft') {
        throw new AppError(
            'Only draft listings can be submitted for review.',
            400,
            'INVALID_STATUS'
        );
    }

    const imageCount = await ListingImage.count({ where: { listingId } });
    if (imageCount === 0) {
        throw new AppError(
            'At least one image is required before submitting.',
            400,
            'IMAGES_REQUIRED'
        );
    }

    await listing.update({ status: 'pending' });
    logger.info(`Listing ${listingId} submitted for review by user ${userId}`);
    return listing;
};

export const approveListing = async (listingId, adminUserId) => {
    const listing = await Listings.findByPk(listingId, {
        include: [
            { model: User,   as: 'user'   },
            { model: Agent,  as: 'agent'  },
            { model: Agency, as: 'agency' },
        ],
    });

    if (!listing) throw new AppError('Listing not found.', 404);

    if (listing.status !== 'pending') {
        throw new AppError('Only pending listings can be approved.', 400, 'INVALID_STATUS');
    }

    await listing.update({
        status:      'published',
        publishedAt: new Date(),
    });

    logger.info(`Listing ${listingId} approved by admin ${adminUserId}`);
    return listing;
};

export const rejectListing = async (listingId, adminUserId, reason) => {
    const listing = await Listings.findByPk(listingId);
    if (!listing) throw new AppError('Listing not found.', 404);

    if (listing.status !== 'pending') {
        throw new AppError('Only pending listings can be rejected.', 400, 'INVALID_STATUS');
    }

    await listing.update({
        status:          'rejected',
        rejectionReason: reason,
    });

    logger.info(`Listing ${listingId} rejected by admin ${adminUserId}: ${reason}`);
    return listing;
};

export const updateListing = async (listingId, userId, data) => {
    const listing = await findListingByOwner(listingId, userId);

    const EDITABLE_STATUSES  = ['draft', 'rejected'];
    const requiresReReview   = listing.status === 'published';

    if (!EDITABLE_STATUSES.includes(listing.status) && !requiresReReview) {
        throw new AppError(
            'This listing cannot be edited in its current status.',
            400,
            'INVALID_STATUS'
        );
    }

    const ALLOWED = [
        'title', 'description', 'price', 'currency',
        'country', 'city', 'district', 'address', 'lat', 'lng',
        'rooms', 'bedrooms', 'bathrooms', 'floor', 'totalFloors',
        'area', 'buildYear', 'amenities',
    ];

    const updateData = Object.fromEntries(
        Object.entries(data).filter(([k]) => ALLOWED.includes(k))
    );

    if (requiresReReview) {
        updateData.status = 'pending';
    }

    if (data.title && data.title !== listing.title) {
        updateData.slug = await generateSlug(data.title);
    }

    await listing.update(updateData);
    return listing;
};

export const archiveListing = async (listingId, userId) => {
    const listing = await findListingByOwner(listingId, userId);

    if (listing.status !== 'published') {
        throw new AppError('Only published listings can be archived.', 400, 'INVALID_STATUS');
    }

    await listing.update({ status: 'archived' });
    logger.info(`Listing ${listingId} archived by user ${userId}`);
    return listing;
};

export const deleteListing = async (listingId, userId) => {
    const listing = await findListingByOwner(listingId, userId);

    await listing.update({ status: 'deleted' });
    logger.info(`Listing ${listingId} soft-deleted by user ${userId}`);
};

export const getListings = async (query) => {
    const {
        search, city, country, propertyType, listingType,
        rooms, minPrice, maxPrice, minArea, maxArea,
        amenities, isFeatured, page = 1, limit = 20,
        sortBy = 'rankScore', sortDir = 'DESC',
    } = query;

    const where = { status: 'published' };

    if (search) {
        where[Op.or] = [
            { title:        { [Op.like]: `%${search}%` } },
            { description:  { [Op.like]: `%${search}%` } },
            { city:         { [Op.like]: `%${search}%` } },
            { country:      { [Op.like]: `%${search}%` } },
            { propertyType: { [Op.like]: `%${search}%` } },
        ];
    }

    if (city)         where.city         = { [Op.like]: `%${city}%` };
    if (country)      where.country      = country;
    if (propertyType) where.propertyType = propertyType;
    if (listingType)  where.listingType  = listingType;
    if (isFeatured)   where.isFeatured   = true;
    if (rooms)        where.rooms        = parseInt(rooms);

    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price[Op.gte] = parseFloat(minPrice);
        if (maxPrice) where.price[Op.lte] = parseFloat(maxPrice);
    }

    if (minArea || maxArea) {
        where.area = {};
        if (minArea) where.area[Op.gte] = parseFloat(minArea);
        if (maxArea) where.area[Op.lte] = parseFloat(maxArea);
    }

    if (amenities?.length) {
        where.amenities = { [Op.contains]: amenities };
    }

    const VALID_SORT = ['rankScore', 'price', 'publishedAt', 'viewCount', 'favoriteCount'];
    const orderField = VALID_SORT.includes(sortBy) ? sortBy : 'rankScore';
    const orderDir   = ['ASC', 'DESC'].includes(sortDir?.toUpperCase())
        ? sortDir.toUpperCase() : 'DESC';

    const pageNum   = Math.max(1, parseInt(page));
    const pageLimit = Math.min(50, parseInt(limit));
    const offset    = (pageNum - 1) * pageLimit;

    const { count, rows } = await Listings.findAndCountAll({
        where,
        limit:  pageLimit,
        offset,
        order:  [[orderField, orderDir]],
        include: [
            {
                model:    ListingImage,
                as:       'images',
                where:    { isPrimary: true },
                required: false,
                limit:    1,
                attributes: ['thumbnailUrl', 'mediumUrl'],
            },
            {
                model:      User,
                as:         'user',
                attributes: ['id', 'name', 'avatar'],
                required:   false,
            },
            {
                model:      Agent,
                as:         'agent',
                attributes: ['id', 'isVerified', 'rating'],
                required:   false,
            },
        ],
    });

    return {
        listings: rows,
        pagination: {
            total:      count,
            page:       pageNum,
            limit:      pageLimit,
            totalPages: Math.ceil(count / pageLimit),
            hasMore:    pageNum * pageLimit < count,
        },
    };
};

export const getListingById = async (listingId) => {
    const listing = await Listings.findOne({
        where: { id: listingId, status: 'published' },
        include: [
            {
                model: ListingImage,
                as:    'images',
                order: [['orderIndex', 'ASC']],
            },
            {
                model:      User,
                as:         'user',
                attributes: ['id', 'name', 'avatar', 'kycStatus'],
            },
            {
                model:      Agent,
                as:         'agent',
                attributes: ['id', 'isVerified', 'reviewsCount', 'plan'],
                required:   false,
            },
            {
                model:      Agency,
                as:         'agency',
                attributes: ['id', 'name', 'isVerified', 'totalListings'],
                required:   false,
            },
        ],
    });

    if (!listing) throw new AppError('Listing not found.', 404, 'LISTING_NOT_FOUND');
    return listing;
};

// Internal helper

const findListingByOwner = async (listingId, userId) => {
    const user  = await User.findByPk(userId);
    if (!user)  throw new AppError('User not found.', 404);

    const where = { id: listingId };

    if (user.role === 'agent') {
        const agent = await Agent.findOne({ where: { userId } });
        if (!agent) throw new AppError('Agent profile not found.', 404);
        where.agentId = agent.id;
    } else if (user.role === 'agency') {
        const agency = await Agency.findOne({ where: { userId } });
        if (!agency) throw new AppError('Agency profile not found.', 404);
        where.agencyId = agency.id;
    } else {
        where.userId = userId;
    }

    const listing = await Listings.findOne({ where });
    if (!listing) throw new AppError('Listing not found or access denied.', 404, 'LISTING_NOT_FOUND');

    return listing;
};