export const NotificationUpdateDTO =(body)=> {
    const ALLOWED = [
        'emailNotifications',
        'smsNotifications',
        'pushNotifications',
        'bookingAlerts',
        'messageAlerts',
        'reviewAlerts',
        'priceDropAlerts',
        'newListingAlerts',
        'marketingEmails',
        'weeklyDigest',
        'productUpdates',
        'loginAlertNotif'
    ];

    const dto = {};
    for (const key of ALLOWED) {
        if(body[key] !== undefined) dto[key] = body[key];
    }

    /**
     * securityAlerts can only be true
     * Why?
     * Security alerts are critical system-level notifications and must always remain enabled.
     * The user is not allowed to disable them for safety and account protection reasons.
     */
    if('securityAlerts' in dto) {
        delete dto.securityAlerts;
    }

    return dto;
};

