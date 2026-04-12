import { OAuth2Client } from 'google-auth-library';
import { ApiError } from './ApiError.js';

let client = null;

export const verifyGoogleIdToken = async idToken => {
	if (!process.env.GOOGLE_CLIENT_ID) {
		throw new ApiError(500, 'Server configuration error: GOOGLE_CLIENT_ID missing.');
	}

	if (!client) {
		client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
	}

	try {
		const ticket = await client.verifyIdToken({
			idToken,
			audience: process.env.GOOGLE_CLIENT_ID,
		});

		const payload = ticket.getPayload();
		return payload; // Contains email, name, picture, sub (googleId)
	} catch (error) {
		console.error('[Google Auth] Token verification failed:', error.message);
		throw new ApiError(401, 'Invalid Google ID token');
	}
};
