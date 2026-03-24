import slugify from "slugify";
import {Op} from "sequelize";
import {clearListingsCache, getCache, setCache} from "../cervices/cache.service.js";
import Listings from "../models/Listings.js";
import Agent from "../models/Agent.js";
import User from "../models/User.js";
import ListingImage from "../models/ListingImage.js";
import Listing from "../models/Listings.js";
import {createListingSchema} from "../validator/listing.validator.js";


export const getListings = async (req, res) => {
    try {
        const {
            city,
            type,
            category,
            minPrice,
            maxPrice,
            rooms,
            page = 1,
            limit = 12,
            sort = 'createdAt',
            order = 'DESC',
        } = req.query;

        const cacheKey = `listings:${JSON.stringify(req.query)}`;

        const cached = await getCache(cacheKey);
        if (cached) {
            return res.json({success: true, fromCache: true, ...cached});
        }

        const where = {
            status: 'active',
        }

        if (city) where.city = {[Op.like]: `%{city}%`};
        if (type) where.type = type;
        if (category) where.category = category;
        if (rooms) where.rooms = parseInt(rooms);

        if (minPrice || maxPrice) {
            where.price = {};

            if (minPrice) where.price[Op.gte] = parseInt(minPrice);
            if (maxPrice) where.price[Op.lte] = parseInt(maxPrice);
        }

        const offset = (parseInt(page) - 1) * parseInt(limit);

        const {count, rows: listings} = await Listings.findAndCountAll({
            where,
            limit: parseInt(limit),
            offset,
            order: [[sort, order]],
            include: [
                {
                    model: Agent,
                    as: 'agent',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['name', 'avatar'],
                        },
                    ],
                },
                {
                    model: ListingImage,
                    as: 'images',
                    where: {isPrimary: true},
                    required: false,
                    limit: 1,
                },
            ],
        })

        const result = {
            listings,
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / parseInt(limit))
            }
        }

        await setCache(cacheKey, result, 600);

        res.json({
            success: true,
            fromCache: false,
            ...result,
        })
    } catch (error) {
        res.status(500).json({success: false, message: 'Սերվերի սխալ', error: error.message});
    }
};

export const getListingById = async (req, res) => {
    try {
        const cacheKey = `listings:single:${req.params.id}`;

        const cached = await getCache(cacheKey);
        if (cached) {
            return res.json({success: true, fromCache: true, listings: cached});

        }

        const listing = await Listing.findOne({
            where: {
                id: req.params.id,
                status: 'active',
            },
            include: [
                {
                    model: Agent,
                    as: 'agent',
                    include: [
                        {
                            model: User,
                            as: 'user',
                            attributes: ['name', 'avatar', 'email'],
                        },
                    ],
                },
                {
                    model: ListingImage,
                    as: 'images',
                    order: ['orderIndex', 'ASC'],
                },
            ],
        });

        if (!listing) {
            return res.json({
                success: false,
                message: "Listing not found",
            });
        }

        await listing.increment('views');

        await setCache(cacheKey, listing, 900);

        res.json({
            success: true,
            fromCache: true,
            listing,
        })
    } catch (error) {
        res.status(500).json({success: false, message: 'Սերվերի սխալ', error: error.message});
    }
};

export const createListing = async (req, res) => {
    try {
        const {error} = createListingSchema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true,
        })

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map(d => d.message)
            })
        }

        const agent = await ListingImage.findOne({
            where: {
                userId: req.user.id,
            }
        })
        if (!agent) {
            return res.status(400).json({
                success: false,
                message: "You are not registered as an agent",
            })
        }

        if (agent.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: "Your agent account are not approved yet",
            })
        }

        const PLAN_LIMITS = {basic: 5, pro: 20, premium: Infinity};
        if (agent.totalListings >= PLAN_LIMITS[agent.plan]) {
            return res.status(403).json({
                success: false,
                message: `Your ${agent.plan} plan allows ${PLAN_LIMITS[agent.plan]} listing`
            });
        }

        const baseSlug = slugify(req.body.title, {
            lower: true,
            strict: true,
        })

        const uniqueSlug = `${baseSlug}-${Date.now()}`

        const listing = await Listing.create({
            ...req.body,
            agentId: agent.id,
            slug: uniqueSlug,
            status: 'pending',
        })

        await agent.increment('totalListings');

        await clearListingsCache();

        res.status(201).json({
            success: true,
            message: "Listing created - awaiting admin approval"
        })
    } catch (error) {
        res.status(500).json({success: false, message: 'Server Error', error: error.message});
    }
}

//Admin — approve / reject / feature
export const updateListingStatus = async (req, res) => {
    try {
        const { status, rejectionReason } = req.body;

        const validStatuses = ['active', 'rejected', 'deleted'];

        if(!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "invalid status",
            })
        }

        const listing = await Listing.findByPk(req.params.id)
        if (!listing) {
            return res.status(404).json({
                success: false,
                message: "listing not found",
            })
        }

        await listing.update({
            status,
            rejectionReason: status === "rejected" ? rejectionReason : null,
        })

        await clearListingsCache();

        res.json({
            success: true,
            message: `Listing is ${status === 'active' ? 'approved' : 'rejected'}`,
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Server Error",
            error: error.message,
        })
    }
}