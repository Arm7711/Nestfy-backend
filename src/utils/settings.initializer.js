import * as profileRepo  from '../repositories/settings/profile.repo.js';
import * as securityRepo from '../repositories/settings/securityRepo.js';
import * as privacyRepo  from '../repositories/settings/privacy.repo.js';
import * as notifRepo    from '../repositories/settings/notification.repo.js';
import * as paymentRepo  from '../repositories/settings/payment.repo.js';
import logger            from './logger.js';

/**
 * initializeUserSettings is triggered automatically during user registration.
 * It creates all 5 settings tables with default values.
 * Why create everything at once?
 * Lazy creation (auto-create when missing) is worse because it increases the risk of race conditions.
 * Eager initialization is better — settings are created only once at registration time.
 * This ensures consistency and prevents missing configuration states.
 */
export const initializeUserSettings = async (userId, role = 'user') => {
    try {
        await Promise.all([
            profileRepo.create(userId),
            securityRepo.create(userId, {
                loginAlerts:    true,
                deviceTracking: true,
            }),
            privacyRepo.create(userId, {
                profileVisibility: 'public',
                showEmail:         false,
                showPhone:         false,
            }),
            notifRepo.create(userId, {
                emailNotifications: true,
                pushNotifications:  true,
                smsNotifications:   false,
                securityAlerts:     true,
                marketingEmails:    false,
            }),
            paymentRepo.create(userId, {
                paymentStatus: 'not_connected',
            }),
        ]);

        logger.info(`Settings initialized for user ${userId}`);
    } catch (err) {
        // Log only, do not throw — registration should not fail
        logger.error(`Failed to initialize settings for user ${userId}`, err);
    }
};