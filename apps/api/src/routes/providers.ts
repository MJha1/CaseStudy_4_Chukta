import { Router } from 'express';
import { listProviderInfo } from '../providers/registry.js';

export const providersRouter = Router();

// List the challan-data providers the app can fetch from.
providersRouter.get('/', (_req, res) => {
  res.json(listProviderInfo());
});
