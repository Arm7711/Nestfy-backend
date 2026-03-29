import { OAuth2Client } from "google-auth-library";
import appleSignIn from 'apple-signin-auth';
import AppError from "../utils/AppError.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async(idToken) => {
    let ticket;

    try {
        ticket = googleClient.verifyIdToken({
            idToken,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
    }catch {
        throw new AppError('Invalid Google token.', 401, 'INVALID_GOOGLE_TOKEN')
    }

    const payload = ticket.getPayload();

    if(!payload.email_verified) {
        throw new AppError('Google email is nor verified.', 401, "GOOGLE_EMAIL_UNVERIFIED");
    }

    return {
        providerId: payload.sub,
        email: payload.email,
        name: payload.name ?? payload.email.split('@')[0],
    };
};

export const verifyAppleToken = async(identityToken, userPayload = null) => {
    let applePayload;

    try {
        applePayload = await appleSignIn.verifyIdToken(identityToken, {
            audience: process.env.APPLE_CLIENT_ID,
            ignoreExpiration: false
        });
    }catch {
        throw new AppError('Invalid Apple token.', 401, 'INVALID_APPLE_TOKEN');
    }

    const email = applePayload.email ?? userPayload.email ?? null;

    const name = userPayload?.payload?.fullName
        ? `${userPayload.fullName.givenName ?? ''} ${userPayload.fullName.familyName ?? ''}`.trim()
        : email?.split('@')[0] ?? 'Apple User';

    return {
        providerId: applePayload.sub,
        email,
        name,
    }
}