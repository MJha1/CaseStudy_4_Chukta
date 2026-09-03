import { Router } from 'express';
import { prisma } from '@chukta/db';
import { createDisputeSchema, updateDisputeSchema } from '@chukta/shared';
import { validateBody } from '../validate.js';
import { ownerWhere, ownerData } from '../actor.js';
import { toDispute } from '../mappers.js';

export const disputesRouter = Router();

// List the actor's disputes (user-created only — never sample data).
disputesRouter.get('/', async (req, res) => {
  const rows = await prisma.dispute.findMany({
    where: ownerWhere(req.actor),
    orderBy: { createdAt: 'desc' },
  });
  res.json(rows.map(toDispute));
});

// Create a dispute (the F1 drafter "Save & track" action).
disputesRouter.post('/', validateBody(createDisputeSchema), async (req, res) => {
  const input = req.body;
  const row = await prisma.dispute.create({
    data: {
      ...ownerData(req.actor),
      plate: input.plate,
      challanNo: input.challanNo,
      offence: input.offence,
      amount: Math.round(input.amount),
      date: input.date,
      city: input.city,
      location: input.location,
      ground: input.ground,
      note: input.note,
      saleDate: input.saleDate,
      receipt: input.receipt,
      name: input.name,
      mobile: input.mobile,
      hasScreenshot: input.hasScreenshot ?? false,
      letter: input.letter,
      filed: false,
    },
  });
  res.status(201).json(toDispute(row));
});

// Toggle "filed" (or other partial updates).
disputesRouter.patch('/:id', validateBody(updateDisputeSchema), async (req, res) => {
  const existing = await prisma.dispute.findFirst({
    where: { id: String(req.params.id), ...ownerWhere(req.actor) },
  });
  if (!existing) {
    res.status(404).json({ error: 'Dispute not found' });
    return;
  }
  const row = await prisma.dispute.update({
    where: { id: existing.id },
    data: { filed: req.body.filed ?? existing.filed },
  });
  res.json(toDispute(row));
});

// Delete a dispute.
disputesRouter.delete('/:id', async (req, res) => {
  const result = await prisma.dispute.deleteMany({
    where: { id: String(req.params.id), ...ownerWhere(req.actor) },
  });
  if (result.count === 0) {
    res.status(404).json({ error: 'Dispute not found' });
    return;
  }
  res.status(204).end();
});
