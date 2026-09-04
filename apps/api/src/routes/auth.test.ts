import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../auth/google.js', () => ({
  googleAuthConfigured: () => true,
  verifyGoogleIdToken: vi.fn(),
}));
vi.mock('../auth/session.js', () => ({
  sessionConfigured: () => true,
  signSession: (id: string) => `sess.${id}`,
  verifySession: (t: string) => (t.startsWith('sess.') ? t.slice(5) : null),
}));
vi.mock('@chukta/db', () => ({
  prisma: {
    user: { upsert: vi.fn(), findUnique: vi.fn() },
    vehicle: { updateMany: vi.fn(), deleteMany: vi.fn() },
    challan: { updateMany: vi.fn(), deleteMany: vi.fn() },
    dispute: { updateMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  },
}));

import { prisma } from '@chukta/db';
import { verifyGoogleIdToken } from '../auth/google.js';
import { createApp } from '../app.js';

const app = createApp();
const dbUser = {
  id: 'user-1',
  googleSub: 'g-123',
  email: 'a@example.com',
  name: 'Asha',
  picture: 'http://img',
};

beforeEach(() => vi.clearAllMocks());

describe('POST /api/auth/google', () => {
  it('verifies the token, upserts the user and returns a session', async () => {
    vi.mocked(verifyGoogleIdToken).mockResolvedValue({
      sub: 'g-123',
      email: 'a@example.com',
      name: 'Asha',
      picture: 'http://img',
    });
    vi.mocked(prisma.user.upsert).mockResolvedValue(dbUser as never);

    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'google-id-token-xyz', deviceId: 'dev-1' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBe('sess.user-1');
    expect(res.body.user).toMatchObject({ id: 'user-1', email: 'a@example.com', name: 'Asha' });
    // Real guest data was claimed into the account…
    expect(prisma.vehicle.updateMany).toHaveBeenCalledWith({
      where: { deviceId: 'dev-1', userId: null, isSample: false },
      data: { userId: 'user-1', deviceId: null },
    });
    // …while demo/sample rows were discarded, not migrated.
    expect(prisma.vehicle.deleteMany).toHaveBeenCalledWith({
      where: { deviceId: 'dev-1', userId: null, isSample: true },
    });
    expect(prisma.challan.deleteMany).toHaveBeenCalledWith({
      where: { deviceId: 'dev-1', userId: null, isSample: true },
    });
  });

  it('401s when Google verification fails', async () => {
    vi.mocked(verifyGoogleIdToken).mockRejectedValue(new Error('bad token'));
    const res = await request(app)
      .post('/api/auth/google')
      .send({ idToken: 'not-a-real-token' });
    expect(res.status).toBe(401);
  });

  it('400s on a missing idToken', async () => {
    const res = await request(app).post('/api/auth/google').send({});
    expect(res.status).toBe(400);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the user for a valid Bearer session', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(dbUser as never);
    const res = await request(app)
      .get('/api/auth/me')
      .set('authorization', 'Bearer sess.user-1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 'user-1', email: 'a@example.com' });
  });

  it('401s without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

describe('data routes accept a Bearer session (user scope)', () => {
  it('does not demand x-device-id when a valid session is present', async () => {
    // The user path uses ownerWhere({userId}); with no prisma mock for vehicle
    // findMany here it would 500, so we only assert it is NOT a 400 device error.
    const res = await request(app).get('/api/vehicles').set('authorization', 'Bearer sess.user-1');
    expect(res.status).not.toBe(400);
  });
});
