export const PrivacyUpdateDTO = (body)=> {
    const ALLOWED = [
        'profileVisibility',
        'showEmail',
        'showPhone',
        'showOnlineStatus',
        'allowMessaging',
        'searchEngineIndexing',
        'showSearchResults',
    ];

    const dto = {};
    for(const key of ALLOWED) {
        if (key !== undefined) dto[key] = dto[key];
    }
    return dto;
};

export const DataDownloadDTO =()=> ({
    dataDownloadRequestedAt: Date.now(),
});

export const DeleteAccountDTO =()=> {
    const now = new Date();
    const scheduled  = new Date(now);
    scheduled.setDate(scheduled.getDate() + 30); // 30-day grace period

    return {
        deleteAccountRequestedAt: Date.now(),
        deleteAccountScheduledAt: scheduled,
    }
}