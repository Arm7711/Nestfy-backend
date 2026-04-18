import * as authRepo    from '../../repositories/settings/auth.repo.js';
import * as profileRepo from '../../repositories/settings/profileSettings.repo.js';
import AppError         from '../../utils/AppError.js';

const getPS = async (userId) => {
    const ps = await profileRepo.findByUserIdLean(userId);
    if (!ps) throw new AppError('Settings not found.', 404, 'SETTINGS_NOT_FOUND');
    return ps;
};

export const getAuthSettings = async (userId) => {
    const ps = await getPS(userId);

    const auth = await authRepo.findByProfileId(ps.id);
    if (!auth) throw new AppError('Auth Settings not found.', 404);
    return auth;
};

export const updateAuthSettings = async (userId, data) => {
    const ps = await getPS(userId);

    if (data.twofactorEnabled === true && !data.twoFactorMethod) {
        const current = await authRepo.findByProfileId(ps.id);
        if (!current?.twoFactorMethod && !data.twoFactorMethod) {
            throw new AppError(
                'A 2FA method (email, sms, or totp) must be specified to enable two-factor authentication.',
                400,
                'TWO_FACTOR_METHOD_REQUIRED'
            );

        }
    }

    if(data.twofactorEnabled === false) {
        data.twoFactorMethod = null;
    }

    const ALLOWED = [
        'twoFactorEnabled', 'twoFactorMethod',
        'loginAlerts', 'deviceTracking',
        'sessionTimeout', 'trustedDevicesEnabled',
    ];

    const filtered = Object.fromEntries(
        Object.entries(data).filter(([key]) => ALLOWED.includes(key))
    );

    await authRepo.update(ps.id, filtered);
    return authRepo.findByProfileId(ps.id);
};



