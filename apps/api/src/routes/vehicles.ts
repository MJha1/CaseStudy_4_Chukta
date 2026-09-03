import { Router } from 'express';
import { prisma } from '@chukta/db';
import { createVehicleSchema } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { SAMPLE_DEVICE_ID } from '../deviceId.js';
import { toVehicle } from '../mappers.js';

export const vehiclesRouter = Router();

// List the device's vehicles plus the shared sample vehicles.
vehiclesRouter.get('/', async (req, res) => {
  const rows = await prisma.vehicle.findMany({
    where: { deviceId: { in: [req.deviceId, SAMPLE_DEVICE_ID] } },
    orderBy: { createdAt: 'asc' },
  });
  res.json(rows.map(toVehicle));
});

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
