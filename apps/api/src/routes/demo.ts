import { Router } from 'express';
import { loadDemoData } from '../demo.js';

export const demoRouter = Router();

// Load the opt-in demo dataset into the requesting device.
demoRouter.post('/load', async (req, res) => {
  const result = await loadDemoData(req.actor);
  res.status(201).json(result);
});
