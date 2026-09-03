import { OAuth2Client } from 'google-auth-library';

/**
 * Verify a Google ID token. Requires GOOGLE_CLIENT_ID — the audience the token
 * must have been issued for. Returns the stable Google subject id + profile.
 */
const clientId = process.env.GOOGLE_CLIENT_ID;
const client = new OAuth2Client(clientId);

export function googleAuthConfigured(): boolean {
  return Boolean(clientId);
}

export interface GoogleProfile {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  if (!clientId) throw new Error('Google auth is not configured');
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (!payload?.sub || !payload.email) {
    throw new Error('Invalid Google token');
  }
  return {
    sub: payload.sub,
    email: payload.email,
    name: payload.name,
    picture: payload.picture,
  };
}
