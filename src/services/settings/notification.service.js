import * as notifRepo from '../../repositories/settings/notification.repo.js';
import * as profileRepo from '../../repositories/settings/profileSettings.repo.js';
import AppError from '../../utils/AppError.js';


const AGENT_ONLY_FIELDS = [
    'inquiryReceived',
    'listingApproved',
    'listingRejected',
    'newReview',
    'planExpired',
];

const validateRoleAccess = async (role, data) => {
    if (role === 'user') {
        const forbidden = Object.keys(data).filter(
            k => AGENT_ONLY_FIELDS.includes(k)
        )
        if(forbidden.length){
            throw new AppError(
                `User role cannot update ${forbidden.join(', ')}`,
                403,
                'ROLE_RESTRICTION'
            );
        }
    }
};

const getPS = async (userId) => {
    const ps = await profileRepo.findByUserIdLean(userId);
    if(!ps) throw new AppError('Settings not found', 404, 'SETTINGS_NOT_FOUND');
    return ps;
};

export const getNotificationSettings = async (userId) => {
    const ps = await profileRepo.findByUserIdLean(userId);
    const notif = await notifRepo.findNotifByProfileId(ps.id);
    if (!notif) throw new AppError('Notification settings not found.', 404);
    return notif;
};

export const updateNotificationSettings = async (userId, data) => {
    const ps = await getPS(userId);

    const ALlOWED = ['emailNotifications', 'pushNotifications', 'smsNotifications'];
    const filtered = Object.fromEntries(
        Object.entries(data).filter(([k]) => ALlOWED.includes(k))
    );

    if(Object.keys(filtered).length === 0) {
        throw new AppError('No valid fields to update.', 400, 'NO_VALID_FIELDS');
    }

    await notifRepo.updateNotif(ps.id, filtered);
    await notifRepo.findNotifByProfileId(ps.id);
};


export const getMarketplaceNotifications = async (userId) => {
    const ps = await getPS(userId);

    const market = await notifRepo.findMarketByProfileId(ps.id)

    if(!market) throw new AppError('Marketplace notifications not found.', 404);
    return market;
};

export const updateMarketplaceNotifications = async (userId, role, data) => {
    await validateRoleAccess(role, data);

    const ALLOWED_USER = [
        'newPropertyAlerts',
        'priceDropAlerts',
        'messages',
        'offers',
        'savedSearchAlerts',
    ];

    const ps = await getPS(userId);

    const ALLOWED_AGENT = [...ALLOWED_USER, ...AGENT_ONLY_FIELDS];
    const allowed_keys = role === 'user' ? ALLOWED_USER : ALLOWED_AGENT;

    const filtered = Object.entries(data).filter(([k]) => allowed_keys.includes(k));

    if(Object.keys(filtered).length === 0) {
        throw new AppError('No valid fields to update.', 400, 'NO_VALID_FIELDS');
    }

    await notifRepo.updateNotif(ps.id, filtered);
    await notifRepo.findMarketByProfileId(ps.id);
};


export const shouldNotify = async (userId, event, channel = 'email') => {
    const ps = await getPS(userId);

    const [notif, market] = await Promise.all([
        notifRepo.findNotifByProfileId(ps.id),
        notifRepo.findMarketByProfileId(ps.id)
    ]);

    const channelMap = {
        email: notif?.emailNotifications,
        push:  notif?.pushNotifications,
        sms:   notif?.smsNotifications,
    }

    if(!channelMap[channel]) return false;

    return market?.[event] ?? false;
};


