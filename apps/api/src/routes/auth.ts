import { Router } from 'express';
import { prisma } from '@chukta/db';
import { googleAuthRequestSchema, type User } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { verifyGoogleIdToken, googleAuthConfigured } from '../auth/google.js';
import { signSession, sessionConfigured, verifySession } from '../auth/session.js';

export const authRouter = Router();

function toUser(u: {
  id: string;
  email: string;
  name: string | null;
  picture: string | null;
}): User {
  return { id: u.id, email: u.email, name: u.name ?? undefined, picture: u.picture ?? undefined };
}

// Sign in with a Google ID token → upsert user, claim guest data, issue session.
authRouter.post('/google', validateBody(googleAuthRequestSchema), async (req, res) => {
  if (!googleAuthConfigured() || !sessionConfigured()) {
    res.status(503).json({ error: 'Sign-in is not configured on the server' });
    return;
  }

  let profile;
  try {
    profile = await verifyGoogleIdToken(req.body.idToken);
  } catch {
    res.status(401).json({ error: 'Google verification failed' });
    return;
  }

  const user = await prisma.user.upsert({
    where: { googleSub: profile.sub },
    create: {
      googleSub: profile.sub,
      email: profile.email,
      name: profile.name,
      picture: profile.picture,
    },
    update: { email: profile.email, name: profile.name, picture: profile.picture },
  });

  // Claim the guest device's rows into this account (so nothing is lost on sign-in).
  const deviceId = req.body.deviceId?.trim();
  if (deviceId) {
    const where = { deviceId, userId: null };
    const data = { userId: user.id, deviceId: null };
    await prisma.$transaction([
      prisma.vehicle.updateMany({ where, data }),
      prisma.challan.updateMany({ where, data }),
      prisma.dispute.updateMany({ where, data }),
    ]);
  }

  res.json({ token: signSession(user.id), user: toUser(user) });
});

// Current user from the Bearer session (or 401).
authRouter.get('/me', async (req, res) => {
  const auth = req.header('authorization');
  const userId = auth?.startsWith('Bearer ') ? verifySession(auth.slice(7).trim()) : null;
  if (!userId) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }
  res.json(toUser(user));
});
