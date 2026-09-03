import jwt from 'jsonwebtoken';

/**
 * Our own session token, issued after a successful Google sign-in and sent as a
 * Bearer token on subsequent requests. Signed with SESSION_JWT_SECRET.
 */
const secret = process.env.SESSION_JWT_SECRET;
const TTL = '30d';

export function sessionConfigured(): boolean {
  return Boolean(secret);
}

export function signSession(userId: string): string {
  if (!secret) throw new Error('SESSION_JWT_SECRET is not set');
  return jwt.sign({ sub: userId }, secret, { expiresIn: TTL });
}

/** Verify a session token; returns the userId or null if invalid/expired. */
export function verifySession(token: string): string | null {
  if (!secret) return null;
  try {
    const decoded = jwt.verify(token, secret) as { sub?: string };
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}
