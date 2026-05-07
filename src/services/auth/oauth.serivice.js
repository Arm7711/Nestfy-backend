import { OAuth2Client } from "google-auth-library";
import AppError from "../../utils/AppError.js";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const verifyGoogleToken = async (credential) => {
    const ticket = await googleClient.verifyIdToken({
        idToken:  credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new AppError('Invalid Google token.', 401, 'INVALID_TOKEN');

    return {
        providerId: payload.sub,
        email:      payload.email,
        name:       payload.name,
    };
};

export const verifyFacebookToken = async (accessToken) => {
    const url = `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`;

    const res = await fetch(url);
    const data = await res.json();

    if (data.error) {
        throw new AppError('Invalid Facebook token.', 401, 'INVALID_TOKEN');
    }

    return {
        providerId: data.id,
        email:      data.email ?? null,
        name:       data.name  ?? null,
    };
};