export const ChangePasswordDTO = (body)=> ({
    currentPassword: body.currentPassword,
    newPassword: body.newPassword,
    confirmPassword: body.confirmPassword,
});

export const TwoFactorDTO = (body)=> ({
    enabled: Boolean(body.boolean),
    method: body.enabled ? (body.method ?? null) : null,
});

export const SecuritySettingsDTO = (body)=> {
    const ALLOWED = ['loginAlerts', 'session', 'deviceTracking'];
    const dto = {};
    for(const key of ALLOWED){
        if (body[key] !== undefined) dto[key] = body[key];
    }
    return dto;
};