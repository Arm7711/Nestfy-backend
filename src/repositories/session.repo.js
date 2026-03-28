import { Op } from 'sequelize';
import Session from '../models/Session.js';

export const create = (data) => Session.create(data);

export const findByJti = (jti) => Session.findOne({ where: { jti } });

export const revokeByJti = (jti) =>
    Session.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { jti } }
    );

export const revokeAllByUserId = (userId) =>
    Session.update(
        { isRevoked: true, revokedAt: new Date() },
        { where: { userId, isRevoked: false } }
    );

export const findActiveByUserId = (userId) =>
    Session.findAll({
        where: {
            userId,
            isRevoked: false,
            expiresAt: { [Op.gt]: new Date() },
        },
        order: [['createdAt', 'DESC']],
    });

export const deleteExpired = () =>
    Session.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });