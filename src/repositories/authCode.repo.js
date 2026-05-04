import { Op } from 'sequelize';
import AuthCode from '../models/Auth/AuthCode.js';
import sequelize from '../config/db.sequelize.js';

export const create = (data) => AuthCode.create(data);

export const findLatestActive = (email) =>
    AuthCode.findOne({
        where: {
            email: email.toLowerCase().trim(),
            isUsed: false,
            expiresAt: { [Op.gt]: new Date() },
        },
        order: [['createdAt', 'DESC']],
    });

export const findById = (id) => AuthCode.findByPk(id);

export const invalidatePreviousCodes = (email) =>
    AuthCode.update(
        { isUsed: true },
        { where: { email: email.toLowerCase().trim(), isUsed: false } }
    );

export const atomicIncrementAttempts = (id, maxAttempts) =>
    AuthCode.update(
        { attempts: sequelize.literal('attempts + 1') },
        {
            where: {
                id,
                isUsed: false,
                attempts: { [Op.lt]: maxAttempts },
                expiresAt: { [Op.gt]: new Date() },
            },
        }
    );

export const markAsUsed = (id) =>
    AuthCode.update({ isUsed: true }, { where: { id, isUsed: false } });