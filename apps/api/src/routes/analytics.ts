import { Router } from 'express';
import { analyticsEventSchema } from '@chukta/shared';
import { validateBody } from '../validate.js';

export const analyticsRouter = Router();

/**
 * Analytics passthrough. In the MVP the web app fires events client-side; this
 * endpoint gives a server-side sink (console; wire Mixpanel here later). It
 * receives no PII — only the event name and small typed props.
 */
analyticsRouter.post('/', validateBody(analyticsEventSchema), (req, res) => {
  const { name, props } = req.body;
  console.log(`[analytics] ${name}`, props ?? {});
  res.status(204).end();
});
