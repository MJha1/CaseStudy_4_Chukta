import { Router } from 'express';
import { prisma } from '@chukta/db';
import { createVehicleSchema, fetchChallansRequestSchema } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { ownerWhere, ownerData } from '../actor.js';
import { toVehicle } from '../mappers.js';
import { getProvider } from '../providers/registry.js';

export const vehiclesRouter = Router();

// List the actor's vehicles.
vehiclesRouter.get('/', async (req, res) => {
  const rows = await prisma.vehicle.findMany({
    where: ownerWhere(req.actor),
    orderBy: { createdAt: 'asc' },
  });
  res.json(rows.map(toVehicle));
});

// Add a vehicle by registration number.
vehiclesRouter.post('/', validateBody(createVehicleSchema), async (req, res) => {
  const input = req.body;
  const row = await prisma.vehicle.create({
    data: {
      ...ownerData(req.actor),
      plate: input.plate,
      model: input.model,
      vehicleClass: input.vehicleClass,
      soldDate: input.soldDate,
      isSample: false,
    },
  });
  res.status(201).json(toVehicle(row));
});

// Fetch challans for a vehicle from a challan-data provider (returns a preview;
// the client persists chosen challans via POST /challans).
vehiclesRouter.post(
  '/:id/fetch-challans',
  validateBody(fetchChallansRequestSchema),
  async (req, res) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: String(req.params.id), ...ownerWhere(req.actor) },
    });
    if (!vehicle) {
      res.status(404).json({ error: 'Vehicle not found' });
      return;
    }
    const provider = getProvider(req.body.providerId);
    if (!provider) {
      res.status(400).json({ error: 'Unknown provider' });
      return;
    }
    // Live providers (e.g. InstantPay) require the customer's explicit consent.
    if (!provider.info.simulated && req.body.consent !== true) {
      res.status(400).json({ error: 'Consent is required for a live lookup' });
      return;
    }
    const challans = await provider.fetchByPlate(vehicle.plate, {
      ip: req.ip,
      consent: req.body.consent === true,
    });
    res.json({ provider: provider.info, challans });
  },
);

// Delete a vehicle (cascades to its challans).
vehiclesRouter.delete('/:id', async (req, res) => {
  const result = await prisma.vehicle.deleteMany({
    where: { id: String(req.params.id), ...ownerWhere(req.actor) },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  res.status(204).end();
});
