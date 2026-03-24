import Agent from "../models/Agent.js";
import User from "../models/User.js";
import {registerAgentSchema} from "../validator/agent.validator.js";
import {agent} from "supertest";


export const registerAgent = async (req, res) => {
    try {
        const {error} = registerAgentSchema.validate(req.body, {
            abortEarly: false,
            allowUnknown: true
        });

        if (error) {
            return res.status(400).json({
                success: false,
                message: error.details.map(d => d.message)
            })
        }

        const existing = await Agent.findOne({
            where: {
                userId: req.user.id
            }
        });

        if (existing) {
            return res.status(409).json({
                success: false,
                message: existing.status === 'pending'
                    ? 'Your request has already been sent — awaiting admin approval.'
                    : existing.status === 'approved'
                        ? 'You already agent'
                        : 'Your application has been rejected — please contact support.'
            });
        }

        const agent = await Agent.create({
            userId: req.user.id,
            phone: req.body.phone,
            bio: req.body.bio,
            city: req.body.city,
            experience: req.body.experience || 0,
            licenseNumber: req.body.licenseNumber,
            facebook: req.body.facebook,
            instagram: req.body.instagram,
            telegram: req.body.telegram,
            website: req.body.website,
            status: 'pending',
        })

        res.status(201).json({
            success: true,
            message: 'Your application has been sent. The administrator will contact you within 1-2 days.',
            agent,
        });
    } catch (err) {
        res.status(500).json({success: false, message: 'Server error', error: err.message});
    }
}

export const getMyAgentProfile = async (req, res) => {
    try {
        const agent = await Agent.findOne({
            where: {userId: req.user.id},
            include: [{model: User, as: 'user', attributes: ['name', 'email', 'avatar']}],
        });

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent Profile Not found'
            });
        }

        res.json({
            success: true,
            agent
        })
    } catch (err) {
        res.status(500).json({success: false, message: 'Server error', error: err.message});
    }
}

export const getAgentById = async (req, res) => {
    try {
        const agent = await Agent.findOne({
            where: {
                id: req.params.id,
                status: 'approved'
            },
            include: [{
                model: User,
                as: 'user',
                attributes: ['name', 'avatar']
            }]
        })

        if (!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent Profile Not found'
            });
        }

        res.json({
            success: true,
            agent
        })
    } catch (err) {
        res.status(500).json({success: false, message: 'Server error', error: err.message});
    }
}

export const approveAgent = async (req, res) => {
    try {
        const agent = await Agent.findByPk(req.params.id);

        if(!agent) {
            return res.status(404).json({
                success: false,
                message: 'Agent Not found'
            })
        }

        if(agent.status === 'approved') {
            return res.status(200).json({
                success: true,
                message: 'Agent already approved'
            })
        }

        await agent.update({
            status: 'approved',
            isVerified: true,
        })

        res.json({
            success: true,
            message: "The agent has been confirmed, the user role has been changed to agent."
        })
    }catch (err) {
        res.status(500).json({success: false, message: 'Server error', error: err.message});
    }
}

export const rejectAgent = async (req, res) => {
    try {
        const { reason } = req.body;

        if(!reason) {
            return res.status(400).json({
                success: false,
                message: 'Rejection comment is required.'
            })
        }

        await agent.update({
            status: 'rejected',
            rejectionReason: reason
        })


        res.json({
            success: true,
            message: 'Agent request rejected',
        });
    }catch (err) {
        res.status(500).json({success: false, message: 'Server error', error: err.message});
    }
}