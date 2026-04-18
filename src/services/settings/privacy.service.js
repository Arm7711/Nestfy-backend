import * as privacyRepo from '../../repositories/settings/privacy.repo.js';
import * as profileRepo from '../../repositories/settings/profileSettings.repo.js';
import AppError         from '../../utils/AppError.js';

const AGENT_ONLY_FIELDS = [
    'showListingStats',
    'showAgencyMembership'
];

const getPS = async (userId) => {
    const ps = await profileRepo.findByUserIdLean(userId);
    if (!ps) throw new AppError('Settings not found.', 404, 'SETTINGS_NOT_FOUND');
    return ps;
};


export const getPrivacySettings = async (userId) => {
    const ps = await getPS(userId);
    const settings = await privacyRepo.findByProfileId(userId);
    if (!settings) throw new AppError('Settings not found.', 404);
    return settings;
};

export const updatePrivacySettings = async (userId, role, data) => {
    if (role === 'user') {
        const forbidden = Object.keys(data).filter(k => AGENT_ONLY_FIELDS.includes(k));
        if (forbidden.length > 0) {
            throw new AppError(
                `User role cannot update: ${forbidden.join(', ')}`,
                403,
                'ROLE_RESTRICTION'
            );
        }
    }

    const ps = await getPS(userId);

    const ALLOWED_USER  = ['profileVisibility','showPhone','showEmail','allowMessaging','showOnlineStatus','showLastSeen'];
    const ALLOWED_AGENT = [...ALLOWED_USER, ...AGENT_ONLY_FIELDS];
    const allowedKeys   = role === 'user' ? ALLOWED_USER : ALLOWED_AGENT;

    const filtered = Object.fromEntries(
        Object.entries(data).filter(([k]) => allowedKeys.includes(k))
    );

    await privacyRepo.update(userId, filtered);
    await privacyRepo.findByProfileId(ps.id);
};

export const checkVisibility = async (userId, viewerRole) => {
    const ps = await getPS(userId);
    const privacy = await privacyRepo.findByProfileId(ps.id);

    if(!privacy) return true;

    if(privacy.profileVisibility === 'public') return true;
    if(privacy.profileVisibility === 'private') return false;
    if(privacy.profileVisibility === 'agents_only') {
        return ['agent', 'agency', 'admin', 'superadmin'].includes(viewerRole);
    }

    return false;
};