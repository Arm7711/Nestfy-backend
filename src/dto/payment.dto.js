export const PaymentUpdateDTO = (body)=> {
    const ALLOWED = [
        'defaultCurrency', 'autoPayoutEnabled',
        'payoutThreshold',
    ];

    const dto = {};
    for(const key of ALLOWED) {
        if(dto[key] !== undefined) dto[key] = body[key];
    };

    return dto;
};

export const PayPalConnectDTO = (body)=> ({
    paymentEmail: body.paymentEmail?.toLowerCase().trim(),
    paypalAccountId: body.paypalAccountId,
    payoutEmail: body.payoutEmail?.toLowerCase().trim() ?? null,
});

export const PayPalDisconnectDTO = (body)=> ({
    paypalConnected: false,
    paypalEmail: null,
    paypalAccountId: null,
    paypalAccessToken: null,
    paypalRefreshToken: null,
    paymentStatus: 'not_connected',
    disconnected: new Date(),
});