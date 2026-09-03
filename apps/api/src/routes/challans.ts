import { Router } from 'express';
import { prisma } from '@chukta/db';
import { createChallanSchema, flagChallans } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { ownerWhere, ownerData } from '../actor.js';
import { toChallan, toVehicle } from '../mappers.js';

export const challansRouter = Router();

// List the actor's challans, optionally by vehicle.
// Flags are computed live from the F4 heuristics engine, not read from storage.
challansRouter.get('/', async (req, res) => {
  const vehicleId = typeof req.query.vehicleId === 'string' ? req.query.vehicleId : undefined;
  const owner = ownerWhere(req.actor);
  const [vehicleRows, challanRows] = await Promise.all([
    prisma.vehicle.findMany({ where: owner }),
    prisma.challan.findMany({
      where: { ...owner, ...(vehicleId ? { vehicleId } : {}) },
      orderBy: { date: 'desc' },
    }),
  ]);
  const flagged = flagChallans(vehicleRows.map(toVehicle), challanRows.map(toChallan));
  res.json(flagged);
});

// Add a challan to a vehicle (must be one the actor owns).
challansRouter.post('/', validateBody(createChallanSchema), async (req, res) => {
  const input = req.body;
  const vehicle = await prisma.vehicle.findFirst({
    where: { id: input.vehicleId, ...ownerWhere(req.actor) },
  });
  if (!vehicle) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  const row = await prisma.challan.create({
    data: {
      ...ownerData(req.actor),
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
    where: { id: String(req.params.id), ...ownerWhere(req.actor) },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Challan not found' });
    return;
  }
  res.status(204).end();
});
