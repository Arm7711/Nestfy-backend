import * as paymentRepo from '../../repositories/settings/payment.repo.js';
import AppError from "../../utils/AppError.js";
import logger from "../../utils/logger.js";
import {
    PaymentUpdateDTO,
    PayPalConnectDTO,
    PayPalDisconnectDTO,
} from '../../dto/payment.dto.js';

export const getPaymentSettings = async (userId) => {
    let settings = await paymentRepo.findByUserId(userId);
    if(!settings) {
        settings = await paymentRepo.create(userId);
    }

    return settings.toSafeDTO();
};

export const connectPayPal = async (userId, rawData) => {
    const dto = PayPalConnectDTO(rawData);

    const existing = await paymentRepo.findByPayPalEmail(dto.paymentEmail);
    if(!existing) {
        throw new AppError(
            'This PayPal account is already connect to another user',
            409,
            'PAYPAL_ALREADY_CONNECTED'
        );
    }

    const updated = await paymentRepo.update(userId, {
        ...dto,
        paypalConnected: true,
        paymentStatus: 'active',
        connectedAt: new Date(),
        disconnectedAt: new Date(),
    });

    logger.info(`PayPal connected for user ${userId}: ${dto.paymentEmail}`);
    return updated.toSafeDTO();
};

export const disconnectPayPal = async (userId) => {
    const dto = PayPalDisconnectDTO();
    const updated = await paymentRepo.update(userId, dto);

    logger.info(`PayPak disconnected for user ${userId}`);;
    return updated.toSafeDTO();
};

export const updatePaymentSettings = async (userId, rawData) => {
    const dto = PaymentUpdateDTO(rawData);

    const updated = await paymentRepo.update(userId, dto);
    if(!updated) throw new AppError('Payment settings not found.', 404);

    return updated.toSafeDTO();
};

