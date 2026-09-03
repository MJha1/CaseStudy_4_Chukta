import { Router } from 'express';
import { prisma } from '@chukta/db';
import { createVehicleSchema, fetchChallansRequestSchema } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { toVehicle } from '../mappers.js';
import { getProvider } from '../providers/registry.js';

export const vehiclesRouter = Router();

// List the device's vehicles.
vehiclesRouter.get('/', async (req, res) => {
  const rows = await prisma.vehicle.findMany({
    where: { deviceId: req.deviceId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(rows.map(toVehicle));
});

// Fetch challans for a vehicle from a challan-data provider (returns a preview;
// the client persists chosen challans via POST /challans).
vehiclesRouter.post(
  '/:id/fetch-challans',
  validateBody(fetchChallansRequestSchema),
  async (req, res) => {
    const vehicle = await prisma.vehicle.findFirst({
      where: { id: String(req.params.id), deviceId: req.deviceId },
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
    const challans = await provider.fetchByPlate(vehicle.plate);
    res.json({ provider: provider.info, challans });
  },
);

// Add a vehicle by registration number.
vehiclesRouter.post('/', validateBody(createVehicleSchema), async (req, res) => {
  const input = req.body;
  const row = await prisma.vehicle.create({
    data: {
      deviceId: req.deviceId,
      plate: input.plate,
      model: input.model,
      vehicleClass: input.vehicleClass,
      soldDate: input.soldDate,
      isSample: false,
    },
  });
  res.status(201).json(toVehicle(row));
});

// Delete a vehicle (cascades to its challans). Sample vehicles are protected.
vehiclesRouter.delete('/:id', async (req, res) => {
  const result = await prisma.vehicle.deleteMany({
    where: { id: String(req.params.id), deviceId: req.deviceId },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Vehicle not found' });
    return;
  }
  res.status(204).end();
});
