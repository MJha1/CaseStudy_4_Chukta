import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('@chukta/db', () => ({
  prisma: {
    vehicle: { findFirst: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    challan: { createMany: vi.fn(), deleteMany: vi.fn() },
  },
}));

import { prisma } from '@chukta/db';
import { createApp } from '../app.js';

const app = createApp();
const DEVICE = 'dev-prov';

beforeEach(() => vi.clearAllMocks());

describe('GET /api/providers', () => {
  it('lists the simulated demo vendors (no device id required)', async () => {
    const res = await request(app).get('/api/providers');
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id);
    expect(ids).toEqual(expect.arrayContaining(['challanbridge', 'rtoconnect', 'setuverify']));
    expect(res.body.every((p: { simulated: boolean }) => p.simulated === true)).toBe(true);
  });
});

describe('POST /api/vehicles/:id/fetch-challans', () => {
  it('runs the chosen provider and returns a preview', async () => {
    vi.mocked(prisma.vehicle.findFirst).mockResolvedValue({
      id: 'v1',
      deviceId: DEVICE,
      plate: 'DL3CAB1234',
    } as never);

    const res = await request(app)
      .post('/api/vehicles/v1/fetch-challans')
      .set('x-device-id', DEVICE)
      .send({ providerId: 'challanbridge' });

    expect(res.status).toBe(200);
    expect(res.body.provider.id).toBe('challanbridge');
    expect(Array.isArray(res.body.challans)).toBe(true);
    expect(res.body.challans.length).toBeGreaterThan(0);
    expect(res.body.challans[0]).toHaveProperty('offence');
    expect(res.body.challans[0]).toHaveProperty('date');
  });

  it('rejects an unknown provider', async () => {
    vi.mocked(prisma.vehicle.findFirst).mockResolvedValue({
      id: 'v1',
      deviceId: DEVICE,
      plate: 'DL3CAB1234',
    } as never);
    const res = await request(app)
      .post('/api/vehicles/v1/fetch-challans')
      .set('x-device-id', DEVICE)
      .send({ providerId: 'nope' });
    expect(res.status).toBe(400);
  });

  it('404s for a vehicle the device does not own', async () => {
    vi.mocked(prisma.vehicle.findFirst).mockResolvedValue(null as never);
    const res = await request(app)
      .post('/api/vehicles/v1/fetch-challans')
      .set('x-device-id', DEVICE)
      .send({ providerId: 'challanbridge' });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/demo/load', () => {
  it('loads the demo dataset into the device', async () => {
    vi.mocked(prisma.vehicle.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.challan.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(prisma.vehicle.create).mockResolvedValue({ id: 'v' } as never);
    vi.mocked(prisma.challan.createMany).mockResolvedValue({ count: 0 } as never);

    const res = await request(app).post('/api/demo/load').set('x-device-id', DEVICE);
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ vehicles: 3, challans: 5 });
    expect(prisma.vehicle.create).toHaveBeenCalledTimes(3);
  });

  it('requires a device id', async () => {
    const res = await request(app).post('/api/demo/load');
    expect(res.status).toBe(400);
  });
});
