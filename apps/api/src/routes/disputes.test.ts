import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// Mock the DB package so these tests need no live database.
vi.mock('@chukta/db', () => {
  const dispute = {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    deleteMany: vi.fn(),
  };
  return { prisma: { dispute } };
});

import { prisma } from '@chukta/db';
import { createApp } from '../app.js';

const app = createApp();
const DEVICE = 'dev-abc-123';

const dbRow = {
  id: 'd1',
  deviceId: DEVICE,
  plate: 'DL3CAB1234',
  challanNo: 'CH-99',
  offence: 'Overspeeding',
  amount: 2000,
  date: '2026-07-15',
  city: 'Delhi',
  location: null,
  ground: 'wrongvehicle',
  note: null,
  saleDate: null,
  receipt: null,
  name: 'Asha',
  mobile: '9876543210',
  hasScreenshot: false,
  letter: 'Dear sir...',
  filed: false,
  createdAt: new Date('2026-09-03T10:00:00Z'),
};

const validBody = {
  plate: 'DL3CAB1234',
  challanNo: 'CH-99',
  offence: 'Overspeeding',
  amount: 2000,
  date: '2026-07-15',
  city: 'Delhi',
  ground: 'wrongvehicle',
  name: 'Asha',
  mobile: '9876543210',
  letter: 'Dear sir...',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('device id guard', () => {
  it('rejects requests without x-device-id', async () => {
    const res = await request(app).get('/disputes');
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/device-id/i);
  });

  it('rejects the reserved SAMPLE device id', async () => {
    const res = await request(app).get('/disputes').set('x-device-id', 'SAMPLE');
    expect(res.status).toBe(400);
  });
});

describe('GET /disputes', () => {
  it('returns the device disputes mapped to the shared shape', async () => {
    vi.mocked(prisma.dispute.findMany).mockResolvedValue([dbRow] as never);
    const res = await request(app).get('/disputes').set('x-device-id', DEVICE);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({ id: 'd1', plate: 'DL3CAB1234', filed: false });
    expect(res.body[0].createdAt).toBe(new Date('2026-09-03T10:00:00Z').getTime());
    expect(vi.mocked(prisma.dispute.findMany).mock.calls[0][0]).toMatchObject({
      where: { deviceId: DEVICE },
    });
  });
});

describe('POST /disputes', () => {
  it('creates a dispute and returns 201', async () => {
    vi.mocked(prisma.dispute.create).mockResolvedValue(dbRow as never);
    const res = await request(app)
      .post('/disputes')
      .set('x-device-id', DEVICE)
      .send(validBody);
    expect(res.status).toBe(201);
    expect(res.body.id).toBe('d1');
    expect(vi.mocked(prisma.dispute.create).mock.calls[0][0]).toMatchObject({
      data: { deviceId: DEVICE, filed: false, ground: 'wrongvehicle' },
    });
  });

  it('rejects an invalid ground with 400', async () => {
    const res = await request(app)
      .post('/disputes')
      .set('x-device-id', DEVICE)
      .send({ ...validBody, ground: 'bogus' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/validation/i);
    expect(prisma.dispute.create).not.toHaveBeenCalled();
  });

  it('rejects a missing letter with 400', async () => {
    const { letter, ...noLetter } = validBody;
    void letter;
    const res = await request(app)
      .post('/disputes')
      .set('x-device-id', DEVICE)
      .send(noLetter);
    expect(res.status).toBe(400);
  });
});

describe('PATCH /disputes/:id', () => {
  it('marks a dispute filed', async () => {
    vi.mocked(prisma.dispute.findFirst).mockResolvedValue(dbRow as never);
    vi.mocked(prisma.dispute.update).mockResolvedValue({ ...dbRow, filed: true } as never);
    const res = await request(app)
      .patch('/disputes/d1')
      .set('x-device-id', DEVICE)
      .send({ filed: true });
    expect(res.status).toBe(200);
    expect(res.body.filed).toBe(true);
  });

  it('404s for a dispute owned by another device', async () => {
    vi.mocked(prisma.dispute.findFirst).mockResolvedValue(null as never);
    const res = await request(app)
      .patch('/disputes/d1')
      .set('x-device-id', DEVICE)
      .send({ filed: true });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /disputes/:id', () => {
  it('deletes an owned dispute', async () => {
    vi.mocked(prisma.dispute.deleteMany).mockResolvedValue({ count: 1 } as never);
    const res = await request(app).delete('/disputes/d1').set('x-device-id', DEVICE);
    expect(res.status).toBe(204);
  });

  it('404s when nothing was deleted', async () => {
    vi.mocked(prisma.dispute.deleteMany).mockResolvedValue({ count: 0 } as never);
    const res = await request(app).delete('/disputes/d1').set('x-device-id', DEVICE);
    expect(res.status).toBe(404);
  });
});
