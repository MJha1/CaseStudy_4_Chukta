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

  // Claim the guest device's REAL rows into this account (so nothing the user
  // created is lost on sign-in). Demo/sample rows are an exploration aid — they
  // are discarded rather than moved into a real account, so a signed-in user
  // never sees dummy data as their own.
  const deviceId = req.body.deviceId?.trim();
  if (deviceId) {
    const guest = { deviceId, userId: null };
    const claim = { userId: user.id, deviceId: null };
    await prisma.$transaction([
      // Drop demo rows first (challans before vehicles for the foreign key).
      prisma.challan.deleteMany({ where: { ...guest, isSample: true } }),
      prisma.vehicle.deleteMany({ where: { ...guest, isSample: true } }),
      // Claim the guest's real rows only.
      prisma.vehicle.updateMany({ where: { ...guest, isSample: false }, data: claim }),
      prisma.challan.updateMany({ where: { ...guest, isSample: false }, data: claim }),
      prisma.dispute.updateMany({ where: guest, data: claim }),
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
