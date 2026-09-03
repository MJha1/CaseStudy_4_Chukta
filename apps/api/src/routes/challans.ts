import { Router } from 'express';
import { prisma } from '@chukta/db';
import { createChallanSchema } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { SAMPLE_DEVICE_ID } from '../deviceId.js';
import { toChallan } from '../mappers.js';

export const challansRouter = Router();

// List the device's challans plus sample challans, optionally by vehicle.
challansRouter.get('/', async (req, res) => {
  const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId : undefined;
  const rows = await prisma.challan.findMany({
    where: {
      deviceId: { in: [req.deviceId, SAMPLE_DEVICE_ID] },
      ...(vehicleId ? { vehicleId } : {}),
    },
    orderBy: { date: 'desc' },
  });
  res.json(rows.map(toChallan));
});

// Add a challan to a vehicle (must be one the device owns).
challansRouter.post('/', validateBody(createChallanSchema), async (req, res) => {
  const input = req.body;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, deviceId: req.deviceId },
  });
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  const row = await prisma.challan.create({
    data: {
      deviceId: req.deviceId,
      vehicleId: input.vehicleId,
      offence: input.offence,
      section: input.section,
      amount: Math.round(input.amount),
      date: input.date,
      location: input.location,
      city: input.city,
      evidenceNote: input.evidenceNote,
      isSample: false,
    },
  });
  res.status(201).json(toChallan(row));
});

// Delete a challan.
challansRouter.delete('/:id', async (req, res) => {
  const result = await prisma.challan.deleteMany({
    where: { id: String(req.params.id), deviceId: req.deviceId },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Challan not found' });
    return;
  }
  res.status(204).end();
});
