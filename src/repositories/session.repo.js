import { Op } from 'sequelize';
import Session from '../models/Auth/Session.js';

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

export const claimByJti = async (jti) => {
    const t = await Session.sequelize.transaction();

    try {
        const session = await Session.findOne({
            where: { jti, isRevoked: false },
            lock: t.LOCK.UPDATE,
            transaction: t,
        });

        if (!session) {
            await t.rollback();
            return null;
        }

        await session.update(
            { isRevoked: true, revokedAt: new Date() },
            { transaction: t }
        );

        await t.commit();
        return session;
    } catch (err) {
        await t.rollback();
        throw err;
    }
};

export const deleteExpired = () =>
    Session.destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });