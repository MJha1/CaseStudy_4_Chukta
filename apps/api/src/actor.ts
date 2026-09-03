import type { Request, Response, NextFunction } from 'express';
import { verifySession } from './auth/session.js';

/** The reserved device id under which nothing may be written (legacy guard). */
export const SAMPLE_DEVICE_ID = 'SAMPLE';

/** Who owns a request: a signed-in user, or an anonymous guest device. */
export type Actor = { type: 'user'; userId: string } | { type: 'guest'; deviceId: string };

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      actor: Actor;
    }
  }
}

/**
 * Populate req.actor. A valid Bearer session token means a signed-in user;
 * otherwise a non-empty x-device-id header means a guest. An invalid Bearer
 * token is rejected (so the client re-authenticates) rather than silently
 * downgraded to guest.
 */
export function identify(req: Request, res: Response, next: NextFunction): void {
  const auth = req.header('authorization');
  if (auth?.startsWith('Bearer ')) {
    const userId = verifySession(auth.slice(7).trim());
    if (!userId) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }
    req.actor = { type: 'user', userId };
    next();
    return;
  }

  const deviceId = req.header('x-device-id')?.trim() ?? '';
  if (!deviceId) {
    res.status(400).json({ error: 'Missing x-device-id header' });
    return;
  }
  if (deviceId === SAMPLE_DEVICE_ID) {
    res.status(400).json({ error: 'Reserved device id' });
    return;
  }
  req.actor = { type: 'guest', deviceId };
  next();
}

/** Prisma `where` filter selecting rows owned by the actor. */
export function ownerWhere(actor: Actor): { userId: string } | { deviceId: string; userId: null } {
  return actor.type === 'user'
    ? { userId: actor.userId }
    : { deviceId: actor.deviceId, userId: null };
}

/** Prisma `data` fields stamping ownership on a newly-created row. */
export function ownerData(actor: Actor): { userId: string } | { deviceId: string } {
  return actor.type === 'user' ? { userId: actor.userId } : { deviceId: actor.deviceId };
}
