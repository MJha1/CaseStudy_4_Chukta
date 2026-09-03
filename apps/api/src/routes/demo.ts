import { Router } from 'express';
import { loadDemoData } from '../demo.js';

export const demoRouter = Router();

// Load the opt-in demo dataset into the requesting device.
demoRouter.post('/load', async (req, res) => {
  const result = await loadDemoData(req.deviceId);
  res.status(201).json(result);
});
