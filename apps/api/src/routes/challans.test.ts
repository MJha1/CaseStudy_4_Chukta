import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('@chukta/db', () => ({
  prisma: {
    vehicle: { findMany: vi.fn() },
    challan: { findMany: vi.fn() },
  },
}));

import { prisma } from '@chukta/db';
import { createApp } from '../app.js';

const app = createApp();
const DEVICE = 'dev-xyz';

const vehicleRow = {
  id: 'v1',
  deviceId: 'SAMPLE',
  plate: 'DL3CAB1234',
  model: 'Swift',
  vehicleClass: 'LMV',
  soldDate: null,
  isSample: true,
};

const challanRow = {
  id: 'c1',
  deviceId: 'SAMPLE',
  vehicleId: 'v1',
  offence: 'Goods vehicle overloading',
  section: null,
  amount: 20000,
  date: '2026-08-01',
  location: 'NH-48',
  city: 'Gurugram',
  evidenceNote: null,
  isPaid: false,
  flag: null,
  isSample: true,
  createdAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

describe('GET /challans', () => {
  it('computes the classMismatch flag live from the heuristics engine', async () => {
    vi.mocked(prisma.vehicle.findMany).mockResolvedValue([vehicleRow] as never);
    vi.mocked(prisma.challan.findMany).mockResolvedValue([challanRow] as never);

    const res = await request(app).get('/api/challans').set('x-device-id', DEVICE);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    // "Goods ... overloading" on an LMV -> classMismatch, even though stored flag was null.
    expect(res.body[0].flag).toBe('classMismatch');
  });

  it('requires a device id', async () => {
    const res = await request(app).get('/api/challans');
    expect(res.status).toBe(400);
  });
});
