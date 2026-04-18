import * as profileRepo from '../../repositories/settings/profileSettings.repo.js';
import * as notifRepo   from '../../repositories/settings/notification.repo.js';
import * as privacyRepo from '../../repositories/settings/privacy.repo.js';
import * as authRepo    from '../../repositories/settings/auth.repo.js';
import AppError         from '../../utils/AppError.js';

const MARKETPLACE_DEFAULT = {
    user: {
        newPropertyAlerts: true,
        priceDropAlerts: true,
        messages: true,
        offers: true,
        savedSearchAlerts: true,

        inquiryReceived: null,
        listingApproved: null,
        listingRejected: null,
        newReview: null,
        planExpired: null,
    },

    agent: {
        newPropertyAlerts: true,
        priceDropAlerts: true,
        messages: true,
        offers: true,
        savedSearchAlerts: true,

        inquiryReceived: null,
        listingApproved: null,
        listingRejected: null,
        newReview: null,
        planExpired: null,
    },

    agency: {
        newPropertyAlerts: false,
        priceDropAlerts:   true,
        messages:          true,
        offers:            true,
        savedSearchAlerts: false,
        inquiryReceived:   true,
        listingApproved:   true,
        listingRejected:   true,
        newReview:         true,
        planExpiring:      true,
    },
}

export const initializeSettings = async (userId, role = 'user') => {
    const profileSettings = await profileRepo.create(userId, role);
    const psId = profileSettings.id;

    await notifRepo.createNotif(psId, {
        emailNotifications: true,
        pushNotifications: true,
        smsNotifications: false,
    });

    const marketDefaults = MARKETPLACE_DEFAULT[role] ?? MARKETPLACE_DEFAULT.user;
    await notifRepo.createMarket(psId, marketDefaults);

    await privacyRepo.create(psId, {
        profileVisibility: 'public',
        showPhone: false,
        showEmail: false,
        allowMessaging: true,
        showOnlineStatus: true,
    });

    await authRepo.create(psId, {
        twofactorEnabled: false,
        twoFactorMethod: true,
        deviceTracking: true,
        sessionTimeout: '7d',
    });

    return profileSettings;
};

export const getFullSettings = async (userId) => {
    const settings = await profileRepo.findByUserId(userId);

    if(!settings) {
        throw new AppError('Settings not found.', 404, 'SETTINGS_NOT_FOUND');
    }

    return settings;
};

export const upgradeRole = async (userId, newRole) => {
    await profileRepo.updateRole(userId, newRole);

    const ps = await profileRepo.findByUserId(userId);

    if(!ps) return;

    const marketDefault = MARKETPLACE_DEFAULT[newRole];

    if(marketDefault) {
        await notifRepo.updateMarket(ps.id, marketDefault);
    }
};

